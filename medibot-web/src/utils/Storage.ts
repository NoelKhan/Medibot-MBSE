/**
 * Web Storage
 * ===========
 * Storage API for web apps
 * Uses localStorage with async wrapper for API compatibility
 */

import { createLogger } from '../services/Logger';

const logger = createLogger('Storage');

/**
 * Web Storage API
 * Wraps localStorage with async interface for compatibility with mobile version
 */
class WebStorage {
  constructor() {
    // Verify localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      logger.warn('[Storage] localStorage not available');
    }
  }

  /**
   * Get item from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger.error('[Storage] getItem error', error as Error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      logger.error('[Storage] setItem error', error as Error);
      throw error;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('[Storage] removeItem error', error as Error);
    }
  }

  /**
   * Get multiple items
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      return keys.map(key => [key, localStorage.getItem(key)]);
    } catch (error) {
      logger.error('[Storage] multiGet error', error as Error);
      return keys.map(key => [key, null]);
    }
  }

  /**
   * Set multiple items
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      logger.error('[Storage] multiSet error', error as Error);
      throw error;
    }
  }

  /**
   * Remove multiple items
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      logger.error('[Storage] multiRemove error', error as Error);
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      logger.error('[Storage] getAllKeys error', error as Error);
      return [];
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      logger.error('[Storage] clear error', error as Error);
    }
  }

  /**
   * Merge item (for objects)
   */
  async mergeItem(key: string, value: string): Promise<void> {
    try {
      const existing = localStorage.getItem(key);
      if (existing) {
        const existingObj = JSON.parse(existing);
        const newObj = JSON.parse(value);
        const merged = { ...existingObj, ...newObj };
        localStorage.setItem(key, JSON.stringify(merged));
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      logger.error('[Storage] mergeItem error', error as Error);
      throw error;
    }
  }

  /**
   * Get object from storage (with JSON parsing)
   */
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await this.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('[Storage] getObject error', error as Error);
      return null;
    }
  }

  /**
   * Set object in storage (with JSON stringification)
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      await this.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error('[Storage] setObject error', error as Error);
      throw error;
    }
  }

  /**
   * Get storage size (approximate based on keys)
   */
  async getStorageSize(): Promise<number> {
    try {
      return Object.keys(localStorage).length;
    } catch (error) {
      logger.error('Failed to get storage size', error as Error);
      return 0;
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const Storage = new WebStorage();

// Export class for testing
export { WebStorage };

export default Storage;
