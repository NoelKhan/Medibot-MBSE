/**
 * Backend Status Tracker
 * ======================
 * Singleton to track backend status without React context
 * Used by ApiClient and services to update connection status
 */

import { createLogger } from './Logger';

const logger = createLogger('BackendStatusTracker');

export type ConnectionStatus = 'online' | 'offline' | 'mock';

class BackendStatusTracker {
  private static instance: BackendStatusTracker;
  private status: ConnectionStatus = 'online';
  private lastSyncTime: Date | null = null;
  private listeners: Array<(status: ConnectionStatus, lastSync: Date | null) => void> = [];

  private constructor() {}

  public static getInstance(): BackendStatusTracker {
    if (!BackendStatusTracker.instance) {
      BackendStatusTracker.instance = new BackendStatusTracker();
    }
    return BackendStatusTracker.instance;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  public setStatus(newStatus: ConnectionStatus): void {
    if (newStatus !== this.status) {
      logger.info('Status changed', { from: this.status, to: newStatus });
      this.status = newStatus;
      
      // Update last sync when going online
      if (newStatus === 'online' && this.status !== 'online') {
        this.lastSyncTime = new Date();
      }
      
      this.notifyListeners();
    }
  }

  public updateLastSync(): void {
    this.lastSyncTime = new Date();
    logger.info('Last sync updated', { time: this.lastSyncTime.toISOString() });
    this.notifyListeners();
  }

  public subscribe(listener: (status: ConnectionStatus, lastSync: Date | null) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status, this.lastSyncTime);
      } catch (error) {
        logger.error('Error notifying listener', error);
      }
    });
  }
}

export default BackendStatusTracker;
