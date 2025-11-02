/**
 * Offline Queue Service
 * =====================
 * Queue failed requests and retry when connection is restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SimpleConnectionMonitor from './SimpleConnectionMonitor';
import { createLogger } from './Logger';

const logger = createLogger('OfflineQueueService');

interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface QueueStats {
  totalQueued: number;
  pendingRequests: number;
  failedRequests: number;
  successfulRequests: number;
  isSyncing: boolean;
}

const STORAGE_KEY = '@medibot_offline_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Offline Queue Service
 */
class OfflineQueueService {
  private static instance: OfflineQueueService;
  private queue: QueuedRequest[] = [];
  private isSyncing: boolean = false;
  private connectionMonitor: SimpleConnectionMonitor;
  private listeners: Map<string, (stats: QueueStats) => void> = new Map();
  private stats = {
    totalQueued: 0,
    failedRequests: 0,
    successfulRequests: 0,
  };

  private constructor() {
    this.connectionMonitor = SimpleConnectionMonitor.getInstance();
    this.loadQueue();
    this.setupConnectionListener();
  }

  static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  /**
   * Setup connection state listener
   */
  private setupConnectionListener(): void {
    this.connectionMonitor.addListener('offline-queue', (status: any) => {
      if (status.isConnected && this.queue.length > 0) {
        logger.info('Connection restored, syncing offline queue...', { queueLength: this.queue.length });
        this.syncQueue();
      }
    });
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info('Loaded offline queue', { queueLength: this.queue.length });
      }
    } catch (error) {
      logger.error('Error loading offline queue', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Error saving offline queue', error);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add request to queue
   */
  async enqueue(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data?: any,
    headers?: Record<string, string>,
    maxRetries: number = MAX_RETRIES
  ): Promise<string> {
    const request: QueuedRequest = {
      id: this.generateId(),
      url,
      method,
      data,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    this.queue.push(request);
    this.stats.totalQueued++;
    await this.saveQueue();
    this.notifyListeners();

    logger.info('Request queued', { method, url, requestId: request.id });

    // Try to sync immediately if online
    if (this.connectionMonitor.isConnected()) {
      this.syncQueue();
    }

    return request.id;
  }

  /**
   * Remove request from queue
   */
  private async dequeue(id: string): Promise<void> {
    this.queue = this.queue.filter(req => req.id !== id);
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Execute a queued request
   */
  private async executeRequest(request: QueuedRequest): Promise<boolean> {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.data ? JSON.stringify(request.data) : undefined,
      });

      if (response.ok) {
        logger.info('Successfully synced request', { method: request.method, url: request.url });
        this.stats.successfulRequests++;
        return true;
      } else {
        logger.warn('Request failed', { method: request.method, url: request.url, status: response.status });
        return false;
      }
    } catch (error) {
      logger.error('Request failed', { method: request.method, url: request.url, error });
      return false;
    }
  }

  /**
   * Sync all queued requests
   */
  async syncQueue(): Promise<void> {
    if (this.isSyncing) {
      logger.info('Sync already in progress');
      return;
    }

    if (!this.connectionMonitor.isConnected()) {
      logger.info('No connection, cannot sync queue');
      return;
    }

    if (this.queue.length === 0) {
      logger.info('Queue is empty');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    logger.info('Syncing queued requests', { queueLength: this.queue.length });

    const requestsToProcess = [...this.queue];

    for (const request of requestsToProcess) {
      const success = await this.executeRequest(request);

      if (success) {
        await this.dequeue(request.id);
      } else {
        request.retryCount++;

        if (request.retryCount >= request.maxRetries) {
          logger.error('Max retries reached, removing from queue', { url: request.url, retryCount: request.retryCount });
          this.stats.failedRequests++;
          await this.dequeue(request.id);
        } else {
          logger.info('Will retry request', { url: request.url, retryCount: request.retryCount, maxRetries: request.maxRetries });
          await this.saveQueue();
        }

        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    this.isSyncing = false;
    this.notifyListeners();

    logger.info('Queue sync complete');
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return {
      totalQueued: this.stats.totalQueued,
      pendingRequests: this.queue.length,
      failedRequests: this.stats.failedRequests,
      successfulRequests: this.stats.successfulRequests,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Get all queued requests
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Clear queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
    logger.info('Queue cleared');
  }

  /**
   * Remove specific request
   */
  async removeRequest(id: string): Promise<void> {
    await this.dequeue(id);
    logger.info('Removed request from queue', { requestId: id });
  }

  /**
   * Add listener for queue changes
   */
  addListener(id: string, callback: (stats: QueueStats) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * Remove listener
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(callback => callback(stats));
  }

  /**
   * Print queue statistics
   */
  printStats(): void {
    const stats = this.getStats();
    logger.info('Offline Queue Statistics', {
      totalQueued: stats.totalQueued,
      pending: stats.pendingRequests,
      successful: stats.successfulRequests,
      failed: stats.failedRequests,
      isSyncing: stats.isSyncing
    });
  }
}

export default OfflineQueueService;
export { OfflineQueueService };
export type { QueuedRequest, QueueStats };
