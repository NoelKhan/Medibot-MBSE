/**
 * Mobile Storage
 * ==============
 * Storage API for React Native mobile apps
 * Uses AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../services/Logger';

const logger = createLogger('Storage');

/**
 * Mobile Storage API
 * Direct wrapper around AsyncStorage
 */
class MobileStorage {
  private storage: typeof AsyncStorage;

  constructor() {
    this.storage = AsyncStorage;
  }

  /**
   * Get item from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await this.storage.getItem(key);
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
      await this.storage.setItem(key, value);
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
      await this.storage.removeItem(key);
    } catch (error) {
      logger.error('[Storage] removeItem error', error as Error);
    }
  }

  /**
   * Get multiple items
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      const result = await this.storage.multiGet(keys);
      return Array.from(result) as [string, string | null][];
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
      await this.storage.multiSet(keyValuePairs);
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
      await this.storage.multiRemove(keys);
    } catch (error) {
      logger.error('[Storage] multiRemove error', error as Error);
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const result = await this.storage.getAllKeys();
      return Array.from(result);
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
      await this.storage.clear();
    } catch (error) {
      logger.error('[Storage] clear error', error as Error);
    }
  }

  /**
   * Merge item (for objects)
   */
  async mergeItem(key: string, value: string): Promise<void> {
    try {
      await this.storage.mergeItem(key, value);
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
      const keys = await this.storage.getAllKeys();
      return keys.length;
    } catch (error) {
      logger.error('Failed to get storage size', error as Error);
      return 0;
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return true; // AsyncStorage is always available on mobile
  }
}

// Export singleton instance
export const Storage = new MobileStorage();

// Export class for testing
export { MobileStorage };

export default Storage;
