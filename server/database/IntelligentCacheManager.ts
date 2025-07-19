// ===========================
// INTELLIGENT CACHE MANAGER
// Resolver problema 2: Cache LRU strategy deficiente
// ===========================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
  size?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  memoryUsage: number;
  entryCount: number;
}

export class IntelligentCacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0,
    memoryUsage: 0,
    entryCount: 0
  };

  // Strategy weights for eviction scoring
  private readonly AGE_WEIGHT = 0.3;
  private readonly FREQUENCY_WEIGHT = 0.4;
  private readonly RECENCY_WEIGHT = 0.3;

  constructor(maxSize: number = 100, ttlMinutes: number = 30) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    
    // Start cleanup routine
    this.startCleanupRoutine();
  }

  // ===========================
  // OPERAÇÕES BÁSICAS DE CACHE
  // ===========================
  get(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check TTL
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = now;
    this.stats.hits++;
    this.updateHitRate();

    return entry.value;
  }

  set(key: string, value: T, customTtl?: number): void {
    const now = Date.now();
    const effectiveTtl = customTtl || this.ttl;

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.intelligentEviction();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      hits: 0,
      lastAccessed: now,
      size: this.estimateSize(value)
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.entryCount = 0;
    this.stats.memoryUsage = 0;
  }

  // ===========================
  // INTELLIGENT LRU EVICTION
  // ===========================
  private intelligentEviction(): void {
    if (this.cache.size === 0) return;

    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Score each entry based on multiple factors
    const scored = entries.map(([key, entry]) => {
      const age = now - entry.timestamp;
      const recency = now - entry.lastAccessed;
      const frequency = entry.hits;

      // Normalize scores (0-1)
      const ageScore = Math.min(age / this.ttl, 1);
      const recencyScore = Math.min(recency / this.ttl, 1);
      const frequencyScore = frequency > 0 ? 1 / Math.log(frequency + 1) : 1;

      // Calculate composite score (higher = more likely to evict)
      const score = (ageScore * this.AGE_WEIGHT) + 
                   (recencyScore * this.RECENCY_WEIGHT) + 
                   (frequencyScore * this.FREQUENCY_WEIGHT);

      return { key, entry, score };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Evict entries until we're under the limit
    const evictCount = Math.max(1, Math.floor(this.maxSize * 0.1)); // Evict 10% at once
    for (let i = 0; i < evictCount && this.cache.size > 0; i++) {
      const toEvict = scored[i];
      if (toEvict) {
        this.cache.delete(toEvict.key);
        this.stats.evictions++;
      }
    }

    this.updateStats();
    console.log(`[IntelligentCache] Evicted ${evictCount} entries using intelligent scoring`);
  }

  // ===========================
  // CACHE WARMING E PRE-LOADING
  // ===========================
  async warmCache(keys: string[], valueLoader: (key: string) => Promise<T>): Promise<void> {
    console.log(`[IntelligentCache] Warming cache with ${keys.length} entries...`);
    
    const promises = keys.map(async (key) => {
      if (!this.cache.has(key)) {
        try {
          const value = await valueLoader(key);
          this.set(key, value);
        } catch (error) {
          console.warn(`[IntelligentCache] Failed to warm cache for key ${key}:`, error);
        }
      }
    });

    await Promise.all(promises);
    console.log(`[IntelligentCache] Cache warming completed. ${this.cache.size} entries cached.`);
  }

  // ===========================
  // CACHE WITH REFRESH
  // ===========================
  async getOrRefresh(
    key: string, 
    refreshFunction: () => Promise<T>, 
    forceRefresh: boolean = false
  ): Promise<T> {
    if (!forceRefresh) {
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const fresh = await refreshFunction();
      this.set(key, fresh);
      return fresh;
    } catch (error) {
      // Return stale data if refresh fails and we have it
      const stale = this.cache.get(key);
      if (stale) {
        console.warn(`[IntelligentCache] Refresh failed for ${key}, returning stale data`);
        return stale.value;
      }
      throw error;
    }
  }

  // ===========================
  // BATCH OPERATIONS
  // ===========================
  getMultiple(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        results.set(key, value);
      }
    }

    return results;
  }

  setMultiple(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.ttl);
    }
  }

  // ===========================
  // PATTERN-BASED OPERATIONS
  // ===========================
  getByPattern(pattern: RegExp): Map<string, T> {
    const results = new Map<string, T>();
    
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key)) {
        const value = this.get(key); // Use get() to update access stats
        if (value !== null) {
          results.set(key, value);
        }
      }
    }

    return results;
  }

  deleteByPattern(pattern: RegExp): number {
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    this.updateStats();
    return deletedCount;
  }

  // ===========================
  // MÉTRICAS E MONITORAMENTO
  // ===========================
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private updateStats(): void {
    this.stats.entryCount = this.cache.size;
    this.stats.memoryUsage = this.estimateTotalSize();
    this.updateHitRate();
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimation (bytes)
    } catch {
      return 100; // Default size if JSON.stringify fails
    }
  }

  private estimateTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size || 100;
    }
    return total;
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  getDetailedStats(): any {
    const stats = this.getStats();
    const now = Date.now();
    
    const entryAges = Array.from(this.cache.values())
      .map(entry => now - entry.timestamp);
    
    const entryHits = Array.from(this.cache.values())
      .map(entry => entry.hits);

    return {
      ...stats,
      averageAge: entryAges.length > 0 ? entryAges.reduce((a, b) => a + b, 0) / entryAges.length : 0,
      averageHits: entryHits.length > 0 ? entryHits.reduce((a, b) => a + b, 0) / entryHits.length : 0,
      oldestEntry: entryAges.length > 0 ? Math.max(...entryAges) : 0,
      newestEntry: entryAges.length > 0 ? Math.min(...entryAges) : 0,
      hotKeys: this.getHotKeys(5)
    };
  }

  private getHotKeys(limit: number): Array<{ key: string; hits: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  // ===========================
  // CLEANUP E MANUTENÇÃO
  // ===========================
  private startCleanupRoutine(): void {
    setInterval(() => {
      this.cleanup();
    }, this.ttl / 4); // Cleanup every quarter of TTL
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.updateStats();
      console.log(`[IntelligentCache] Cleaned up ${expiredCount} expired entries`);
    }
  }

  // Force cleanup for expired entries
  forceCleanup(): number {
    const sizeBefore = this.cache.size;
    this.cleanup();
    return sizeBefore - this.cache.size;
  }
}

// ===========================
// CACHE MANAGER SINGLETON
// ===========================
export class GlobalCacheManager {
  private static instance: GlobalCacheManager;
  private caches = new Map<string, IntelligentCacheManager<any>>();

  static getInstance(): GlobalCacheManager {
    if (!GlobalCacheManager.instance) {
      GlobalCacheManager.instance = new GlobalCacheManager();
    }
    return GlobalCacheManager.instance;
  }

  getCache<T>(
    name: string, 
    maxSize: number = 100, 
    ttlMinutes: number = 30
  ): IntelligentCacheManager<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new IntelligentCacheManager<T>(maxSize, ttlMinutes));
      console.log(`[GlobalCacheManager] Created cache: ${name} (maxSize: ${maxSize}, ttl: ${ttlMinutes}min)`);
    }
    return this.caches.get(name)!;
  }

  getAllCacheStats(): Map<string, any> {
    const stats = new Map();
    for (const [name, cache] of this.caches.entries()) {
      stats.set(name, cache.getDetailedStats());
    }
    return stats;
  }

  clearAllCaches(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    console.log('[GlobalCacheManager] All caches cleared');
  }
}

export const globalCacheManager = GlobalCacheManager.getInstance();