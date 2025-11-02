/**
 * API Cache Service
 * =================
 * LRU cache for API responses with TTL support
 */

import { createLogger } from './Logger';

const logger = createLogger('ApiCacheService');

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  enableStats?: boolean;
}

/**
 * LRU Cache with TTL support
 */
class ApiCacheService {
  private static instance: ApiCacheService;
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private defaultTTL: number;
  private hits: number = 0;
  private misses: number = 0;
  private enableStats: boolean;

  private constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.maxSize = config.maxSize || 100;
    this.defaultTTL = config.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.enableStats = config.enableStats !== false;
  }

  static getInstance(config?: CacheConfig): ApiCacheService {
    if (!ApiCacheService.instance) {
      ApiCacheService.instance = new ApiCacheService(config);
    }
    return ApiCacheService.instance;
  }

  /**
   * Generate cache key from URL and params
   */
  private generateKey(url: string, params?: any): string {
    if (!params) return url;
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${url}?${sortedParams}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict oldest entry (LRU)
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }

  /**
   * Get cached data
   */
  get<T>(url: string, params?: any): T | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.enableStats) this.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.enableStats) this.misses++;
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    if (this.enableStats) this.hits++;
    return entry.data;
  }

  /**
   * Set cache data
   */
  set<T>(url: string, data: T, params?: any, ttl?: number): void {
    const key = this.generateKey(url, params);

    // Evict if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      key,
    };

    // Remove old entry if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, entry);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(url: string, params?: any): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching URL pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Print cache statistics
   */
  printStats(): void {
    const stats = this.getStats();
    logger.info('API Cache Statistics', {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
      size: `${stats.size} / ${stats.maxSize}`,
    });
  }

  /**
   * Get cache size in bytes (approximate)
   */
  getSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry.data).length;
    }
    return size;
  }

  /**
   * Check if cache has entry
   */
  has(url: string, params?: any): boolean {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Configure cache
   */
  configure(config: CacheConfig): void {
    if (config.maxSize !== undefined) {
      this.maxSize = config.maxSize;
      // Evict entries if new max size is smaller
      while (this.cache.size > this.maxSize) {
        this.evictOldest();
      }
    }
    if (config.defaultTTL !== undefined) {
      this.defaultTTL = config.defaultTTL;
    }
    if (config.enableStats !== undefined) {
      this.enableStats = config.enableStats;
    }
  }
}

export default ApiCacheService;
export { ApiCacheService };
