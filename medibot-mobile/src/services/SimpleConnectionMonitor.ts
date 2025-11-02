/**
 * SIMPLE CONNECTION MONITOR
 * Basic network connectivity monitoring
 * Uses fetch-based detection instead of platform APIs
 */

import { useState, useEffect } from 'react';
import { createLogger } from './Logger';

const logger = createLogger('ConnectionMonitor');

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface ConnectionStatus {
  isConnected: boolean;
  quality: ConnectionQuality;
  lastChecked: Date;
}

interface ConnectionListener {
  id: string;
  callback: (status: ConnectionStatus) => void;
}

class SimpleConnectionMonitor {
  private static instance: SimpleConnectionMonitor;
  private currentStatus: ConnectionStatus = {
    isConnected: true,
    quality: 'good',
    lastChecked: new Date(),
  };
  private listeners: ConnectionListener[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): SimpleConnectionMonitor {
    if (!SimpleConnectionMonitor.instance) {
      SimpleConnectionMonitor.instance = new SimpleConnectionMonitor();
    }
    return SimpleConnectionMonitor.instance;
  }

  /**
   * Initialize connection monitoring
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info('Initializing Simple Connection Monitor');

    // Initial check
    await this.checkConnection();

    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, 30000);

    this.initialized = true;
    logger.info('Simple Connection Monitor initialized');
  }

  /**
   * Check connection by attempting a lightweight fetch
   */
  private async checkConnection(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const startTime = Date.now();
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const duration = Date.now() - startTime;
      const isOk = response && response.ok === true;
      const quality = this.estimateQuality(duration, isOk);

      const newStatus: ConnectionStatus = {
        isConnected: isOk,
        quality,
        lastChecked: new Date(),
      };

      this.updateStatus(newStatus);
    } catch (error) {
      // Connection failed
      const newStatus: ConnectionStatus = {
        isConnected: false,
        quality: 'offline',
        lastChecked: new Date(),
      };

      this.updateStatus(newStatus);
    }
  }

  /**
   * Estimate connection quality based on response time
   */
  private estimateQuality(duration: number, success: boolean): ConnectionQuality {
    if (!success) return 'offline';
    if (duration < 200) return 'excellent';
    if (duration < 500) return 'good';
    return 'poor';
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(newStatus: ConnectionStatus): void {
    const changed = 
      this.currentStatus.isConnected !== newStatus.isConnected ||
      this.currentStatus.quality !== newStatus.quality;

    this.currentStatus = newStatus;

    if (changed) {
      this.logStatusChange(newStatus);
      this.notifyListeners(newStatus);
    }
  }

  /**
   * Log status changes
   */
  private logStatusChange(status: ConnectionStatus): void {
    logger.info('Connection status changed', {
      isConnected: status.isConnected,
      quality: status.quality,
      status: status.isConnected ? 'ONLINE' : 'OFFLINE'
    });
  }

  /**
   * Get current status
   */
  getStatus(): ConnectionStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.currentStatus.isConnected;
  }

  /**
   * Get connection quality
   */
  getConnectionQuality(): ConnectionQuality {
    return this.currentStatus.quality;
  }

  /**
   * Check if connection is good
   */
  isGoodConnection(): boolean {
    const quality = this.getConnectionQuality();
    return quality === 'excellent' || quality === 'good';
  }

  /**
   * Add listener
   */
  addListener(id: string, callback: (status: ConnectionStatus) => void): void {
    this.removeListener(id);
    this.listeners.push({ id, callback });
    callback(this.currentStatus);
    logger.debug('Added connection listener', { listenerId: id });
  }

  /**
   * Remove listener
   */
  removeListener(id: string): void {
    const initialLength = this.listeners.length;
    this.listeners = this.listeners.filter(l => l.id !== id);
    if (this.listeners.length < initialLength) {
      logger.debug('Removed connection listener', { listenerId: id });
    }
  }

  /**
   * Notify listeners
   */
  private notifyListeners(status: ConnectionStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener.callback(status);
      } catch (error) {
        logger.error(`Error in connection listener ${listener.id}`, error);
      }
    });
  }

  /**
   * Manual refresh
   */
  async refresh(): Promise<ConnectionStatus> {
    await this.checkConnection();
    return this.getStatus();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners = [];
    this.initialized = false;
    logger.info('Connection Monitor cleaned up');
  }
}

/**
 * React Hook for connection status
 */
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: true,
    quality: 'good',
    lastChecked: new Date(),
  });

  useEffect(() => {
    const monitor = SimpleConnectionMonitor.getInstance();
    
    monitor.initialize().then(() => {
      setStatus(monitor.getStatus());
    });

    const listenerId = `hook_${Date.now()}`;
    monitor.addListener(listenerId, setStatus);

    return () => {
      monitor.removeListener(listenerId);
    };
  }, []);

  return status;
}

/**
 * React Hook for online status
 */
export function useIsOnline(): boolean {
  const status = useConnectionStatus();
  return status.isConnected;
}

export default SimpleConnectionMonitor;
