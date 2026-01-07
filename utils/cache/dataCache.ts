/**
 * Global Data Cache System
 * Provides memory cache with optional localStorage persistence
 * Supports TTL (Time To Live) and cache invalidation
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  persist?: boolean; // Persist to localStorage
  prefix?: string; // Cache key prefix
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl?: number;
}

export class DataCache {
  private cache: Map<string, CacheEntry>;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 3600000, // 1 hour default
      persist: options.persist ?? true,
      prefix: options.prefix || 'formx-data-',
    };
    this.cache = new Map();

    // Load from localStorage if persistence is enabled
    if (this.options.persist) {
      this.load();
    }
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: any, ttl?: number): void {
    const cacheKey = this.getCacheKey(key);
    const entry: CacheEntry = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
    };

    this.cache.set(cacheKey, entry);

    // Persist to localStorage if enabled
    if (this.options.persist) {
      try {
        const serialized = JSON.stringify(entry);
        localStorage.setItem(cacheKey, serialized);
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error);
      }
    }
  }

  /**
   * Get a value from the cache
   */
  get(key: string): any | null {
    const cacheKey = this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.ttl) {
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        this.delete(key);
        return null;
      }
    }

    return entry.data;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const cacheKey = this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (entry.ttl) {
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        this.delete(key);
        return false;
      }
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.delete(cacheKey);

    // Remove from localStorage if persistence is enabled
    if (this.options.persist) {
      try {
        localStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn('Failed to remove cache from localStorage:', error);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();

    // Clear localStorage if persistence is enabled
    if (this.options.persist) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(this.options.prefix)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Failed to clear cache from localStorage:', error);
      }
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.ttl) {
        const age = now - entry.timestamp;
        if (age > entry.ttl) {
          keysToDelete.push(key);
        }
      }
    });

    keysToDelete.forEach((key) => {
      const originalKey = key.replace(this.options.prefix, '');
      this.delete(originalKey);
    });
  }

  /**
   * Persist cache to localStorage
   */
  persist(): void {
    if (!this.options.persist) {
      return;
    }

    try {
      this.cache.forEach((entry, key) => {
        const serialized = JSON.stringify(entry);
        localStorage.setItem(key, serialized);
      });
    } catch (error) {
      console.warn('Failed to persist cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  load(): void {
    if (!this.options.persist) {
      return;
    }

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.options.prefix)) {
          const serialized = localStorage.getItem(key);
          if (serialized) {
            try {
              const entry: CacheEntry = JSON.parse(serialized);
              // Check if entry has expired
              if (entry.ttl) {
                const age = Date.now() - entry.timestamp;
                if (age <= entry.ttl) {
                  this.cache.set(key, entry);
                } else {
                  localStorage.removeItem(key);
                }
              } else {
                this.cache.set(key, entry);
              }
            } catch (error) {
              console.warn(`Failed to parse cache entry ${key}:`, error);
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Get cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map((key) =>
        key.replace(this.options.prefix, '')
      ),
    };
  }
}

// Global instance
export const dataCache = new DataCache({
  ttl: 3600000, // 1 hour default
  persist: true,
  prefix: 'formx-data-',
});

