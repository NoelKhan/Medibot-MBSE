/**
 * Consolidated Storage Service
 * =============================
 * 
 * This service provides a unified interface for data storage and caching:
 * - AsyncStorage for non-sensitive data
 * - SecureStore for sensitive data (tokens, credentials)
 * - In-memory cache for performance
 * - Encryption for sensitive data
 * 
 * Replaces:
 * - Old StorageService.ts
 * - Direct AsyncStorage calls throughout the app
 * - Direct SecureStore calls
 * 
 * Benefits:
 * - Single source of truth for storage logic
 * - Consistent error handling
 * - Easy to mock for testing
 * - Automatic encryption for sensitive data
 * - Cache management
 * 
 * Architecture:
 * Component → StorageService → AsyncStorage/SecureStore
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createLogger } from '../core/Logger';

const logger = createLogger('StorageService');

// Storage prefixes
const STORAGE_PREFIX = '@medibot_';
const SECURE_PREFIX = 'medibot_secure_';

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes default

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class StorageService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  // =========================================================================
  // ASYNC STORAGE (Non-sensitive data)
  // =========================================================================

  /**
   * Store data in AsyncStorage
   */
  public async set<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = STORAGE_PREFIX + key;
      const serialized = JSON.stringify(value);
      
      await AsyncStorage.setItem(fullKey, serialized);
      
      // Update cache
      this.setCache(key, value);
      
      logger.debug('Data stored', { key, size: serialized.length });
    } catch (error) {
      logger.error('Failed to store data', { key, error });
      throw error;
    }
  }

  /**
   * Get data from AsyncStorage
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      // Check cache first
      const cached = this.getCache<T>(key);
      if (cached !== null) {
        logger.debug('Cache hit', { key });
        return cached;
      }

      const fullKey = STORAGE_PREFIX + key;
      const serialized = await AsyncStorage.getItem(fullKey);
      
      if (serialized === null) {
        logger.debug('No data found', { key });
        return null;
      }

      const value = JSON.parse(serialized) as T;
      
      // Update cache
      this.setCache(key, value);
      
      logger.debug('Data retrieved', { key });
      return value;
    } catch (error) {
      logger.error('Failed to get data', { key, error });
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  public async remove(key: string): Promise<void> {
    try {
      const fullKey = STORAGE_PREFIX + key;
      await AsyncStorage.removeItem(fullKey);
      
      // Remove from cache
      this.memoryCache.delete(key);
      
      logger.debug('Data removed', { key });
    } catch (error) {
      logger.error('Failed to remove data', { key, error });
      throw error;
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  public async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
      
      await AsyncStorage.multiRemove(appKeys);
      
      // Clear cache
      this.memoryCache.clear();
      
      logger.info('Storage cleared', { count: appKeys.length });
    } catch (error) {
      logger.error('Failed to clear storage', error);
      throw error;
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  public async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .map(k => k.replace(STORAGE_PREFIX, ''));
    } catch (error) {
      logger.error('Failed to get keys', error);
      return [];
    }
  }

  /**
   * Get multiple items at once
   */
  public async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const fullKeys = keys.map(k => STORAGE_PREFIX + k);
      const results = await AsyncStorage.multiGet(fullKeys);
      
      const data: Record<string, T | null> = {};
      
      results.forEach(([fullKey, value]) => {
        const key = fullKey.replace(STORAGE_PREFIX, '');
        data[key] = value ? JSON.parse(value) : null;
      });
      
      return data;
    } catch (error) {
      logger.error('Failed to get multiple items', error);
      return {};
    }
  }

  /**
   * Set multiple items at once
   */
  public async setMultiple(items: Record<string, any>): Promise<void> {
    try {
      const pairs: [string, string][] = Object.entries(items).map(([key, value]) => [
        STORAGE_PREFIX + key,
        JSON.stringify(value),
      ]);
      
      await AsyncStorage.multiSet(pairs);
      
      // Update cache
      Object.entries(items).forEach(([key, value]) => {
        this.setCache(key, value);
      });
      
      logger.debug('Multiple items stored', { count: pairs.length });
    } catch (error) {
      logger.error('Failed to store multiple items', error);
      throw error;
    }
  }

  // =========================================================================
  // SECURE STORAGE (Sensitive data)
  // =========================================================================

  /**
   * Store sensitive data in SecureStore
   * (tokens, passwords, personal information)
   */
  public async setSecure(key: string, value: string): Promise<void> {
    try {
      const fullKey = SECURE_PREFIX + key;
      await SecureStore.setItemAsync(fullKey, value);
      logger.debug('Secure data stored', { key });
    } catch (error) {
      logger.error('Failed to store secure data', { key, error });
      throw error;
    }
  }

  /**
   * Get sensitive data from SecureStore
   */
  public async getSecure(key: string): Promise<string | null> {
    try {
      const fullKey = SECURE_PREFIX + key;
      const value = await SecureStore.getItemAsync(fullKey);
      
      if (value === null) {
        logger.debug('No secure data found', { key });
      } else {
        logger.debug('Secure data retrieved', { key });
      }
      
      return value;
    } catch (error) {
      logger.error('Failed to get secure data', { key, error });
      return null;
    }
  }

  /**
   * Remove sensitive data from SecureStore
   */
  public async removeSecure(key: string): Promise<void> {
    try {
      const fullKey = SECURE_PREFIX + key;
      await SecureStore.deleteItemAsync(fullKey);
      logger.debug('Secure data removed', { key });
    } catch (error) {
      logger.error('Failed to remove secure data', { key, error });
      throw error;
    }
  }

  /**
   * Store object in SecureStore (serialized)
   */
  public async setSecureObject<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.setSecure(key, serialized);
    } catch (error) {
      logger.error('Failed to store secure object', { key, error });
      throw error;
    }
  }

  /**
   * Get object from SecureStore (deserialized)
   */
  public async getSecureObject<T>(key: string): Promise<T | null> {
    try {
      const serialized = await this.getSecure(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      logger.error('Failed to get secure object', { key, error });
      return null;
    }
  }

  // =========================================================================
  // MEMORY CACHE (Performance optimization)
  // =========================================================================

  /**
   * Set data in memory cache
   */
  private setCache<T>(key: string, data: T, ttl: number = CACHE_DURATION_MS): void {
    const now = Date.now();
    this.memoryCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Get data from memory cache
   */
  private getCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Clear memory cache
   */
  public clearCache(): void {
    this.memoryCache.clear();
    logger.debug('Memory cache cleared');
  }

  /**
   * Clear expired cache entries
   */
  public pruneCache(): void {
    const now = Date.now();
    let count = 0;

    this.memoryCache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
        count++;
      }
    });

    if (count > 0) {
      logger.debug('Cache pruned', { expired: count });
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: number } {
    return {
      size: this.memoryCache.size,
      entries: this.memoryCache.size,
    };
  }

  // =========================================================================
  // CONVENIENCE METHODS FOR COMMON USE CASES
  // =========================================================================

  /**
   * Store user preferences
   */
  public async savePreferences(preferences: Record<string, any>): Promise<void> {
    return this.set('preferences', preferences);
  }

  /**
   * Get user preferences
   */
  public async getPreferences(): Promise<Record<string, any> | null> {
    return this.get('preferences');
  }

  /**
   * Store auth token securely
   */
  public async saveAuthToken(token: string): Promise<void> {
    return this.setSecure('auth_token', token);
  }

  /**
   * Get auth token
   */
  public async getAuthToken(): Promise<string | null> {
    return this.getSecure('auth_token');
  }

  /**
   * Remove auth token
   */
  public async removeAuthToken(): Promise<void> {
    return this.removeSecure('auth_token');
  }

  /**
   * Save refresh token securely
   */
  public async saveRefreshToken(token: string): Promise<void> {
    return this.setSecure('refresh_token', token);
  }

  /**
   * Get refresh token
   */
  public async getRefreshToken(): Promise<string | null> {
    return this.getSecure('refresh_token');
  }

  /**
   * Remove refresh token
   */
  public async removeRefreshToken(): Promise<void> {
    return this.removeSecure('refresh_token');
  }

  /**
   * Clear all auth data
   */
  public async clearAuthData(): Promise<void> {
    await Promise.all([
      this.removeAuthToken(),
      this.removeRefreshToken(),
      this.remove('user'),
      this.remove('auth_timestamp'),
    ]);
    logger.info('Auth data cleared');
  }

  // =========================================================================
  // DEBUGGING & UTILITIES
  // =========================================================================

  /**
   * Get storage usage info (estimate)
   */
  public async getStorageInfo(): Promise<{
    keys: number;
    estimatedSize: number;
  }> {
    try {
      const keys = await this.getAllKeys();
      const items = await this.getMultiple(keys);
      
      const estimatedSize = JSON.stringify(items).length;
      
      return {
        keys: keys.length,
        estimatedSize,
      };
    } catch (error) {
      logger.error('Failed to get storage info', error);
      return { keys: 0, estimatedSize: 0 };
    }
  }

  /**
   * Export all data (for debugging/backup)
   */
  public async exportData(): Promise<Record<string, any>> {
    try {
      const keys = await this.getAllKeys();
      return await this.getMultiple(keys);
    } catch (error) {
      logger.error('Failed to export data', error);
      return {};
    }
  }

  /**
   * Import data (for debugging/restore)
   */
  public async importData(data: Record<string, any>): Promise<void> {
    try {
      await this.setMultiple(data);
      logger.info('Data imported', { count: Object.keys(data).length });
    } catch (error) {
      logger.error('Failed to import data', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
