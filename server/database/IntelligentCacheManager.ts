// ===========================
// INTELLIGENT CACHE MANAGER - LRU ENTERPRISE
// Resolver problemas de cache strategy limitada
// ===========================

interface CacheEntry<T> {
  key: string';
  value: T';
  accessCount: number';
  lastAccessed: Date';
  createdAt: Date';
  size: number; // Memory size in bytes (estimated)
  ttl?: number; // TTL in milliseconds
  tags: string[]; // For batch invalidation
}

interface CacheMetrics {
  hits: number';
  misses: number';
  evictions: number';
  totalAccesses: number';
  memoryUsage: number; // in bytes
  avgAccessTime: number';
}

interface EvictionScore {
  key: string';
  score: number; // Lower score = higher priority for eviction
  reason: string';
}

export class IntelligentCacheManager<T = any> {
  private static instances = new Map<string, IntelligentCacheManager>()';
  
  private cache = new Map<string, CacheEntry<T>>()';
  private metrics: CacheMetrics = {
    hits: 0',
    misses: 0',
    evictions: 0',
    totalAccesses: 0',
    memoryUsage: 0',
    avgAccessTime: 0
  }';
  
  private readonly maxSize: number';
  private readonly maxMemoryMB: number';
  private readonly defaultTTL: number';
  private readonly evictionBatchSize: number';
  private cleanupTimer?: NodeJS.Timeout';

  constructor(
    private namespace: string',
    options: {
      maxSize?: number';
      maxMemoryMB?: number';
      defaultTTL?: number';
      evictionBatchSize?: number';
      cleanupInterval?: number';
    } = {}
  ) {
    this.maxSize = options.maxSize || 1000';
    this.maxMemoryMB = options.maxMemoryMB || 100';
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.evictionBatchSize = options.evictionBatchSize || 10';
    
    this.startPeriodicCleanup(options.cleanupInterval || 60000); // 1 minute
    console.log(`✅ [IntelligentCache:${namespace}] Initialized with maxSize=${this.maxSize}, maxMemory=${this.maxMemoryMB}MB`)';
  }

  static getInstance<T = any>(namespace: string, options?: any): IntelligentCacheManager<T> {
    if (!IntelligentCacheManager.instances.has(namespace)) {
      IntelligentCacheManager.instances.set(namespace, new IntelligentCacheManager<T>(namespace, options))';
    }
    return IntelligentCacheManager.instances.get(namespace) as IntelligentCacheManager<T>';
  }

  // ===========================
  // CORE CACHE OPERATIONS
  // ===========================
  set(key: string, value: T, options: { ttl?: number; tags?: string[] } = {}): void {
    const startTime = Date.now()';
    
    // Check if we need to evict before adding
    if (this.shouldEvict()) {
      this.performIntelligentEviction()';
    }
    
    const size = this.estimateObjectSize(value)';
    const now = new Date()';
    
    const entry: CacheEntry<T> = {
      key',
      value',
      accessCount: 1',
      lastAccessed: now',
      createdAt: now',
      size',
      ttl: options.ttl || this.defaultTTL',
      tags: options.tags || []
    }';
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.metrics.memoryUsage -= this.cache.get(key)!.size';
    }
    
    this.cache.set(key, entry)';
    this.metrics.memoryUsage += size';
    
    this.updateAccessTime(Date.now() - startTime)';
    console.log(`📝 [IntelligentCache:${this.namespace}] Set ${key} (${size} bytes, TTL=${entry.ttl}ms)`)';
  }

  get(key: string): T | undefined {
    const startTime = Date.now()';
    this.metrics.totalAccesses++';
    
    const entry = this.cache.get(key)';
    
    if (!entry) {
      this.metrics.misses++';
      this.updateAccessTime(Date.now() - startTime)';
      return undefined';
    }
    
    // Check TTL expiration
    if (this.isExpired(entry)) {
      this.delete(key)';
      this.metrics.misses++';
      this.updateAccessTime(Date.now() - startTime)';
      return undefined';
    }
    
    // Update access statistics
    entry.accessCount++';
    entry.lastAccessed = new Date()';
    this.metrics.hits++';
    
    this.updateAccessTime(Date.now() - startTime)';
    return entry.value';
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)';
    if (!entry) return false';
    
    if (this.isExpired(entry)) {
      this.delete(key)';
      return false';
    }
    
    return true';
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)';
    if (entry) {
      this.metrics.memoryUsage -= entry.size';
      this.cache.delete(key)';
      console.log(`🗑️ [IntelligentCache:${this.namespace}] Deleted ${key}`)';
      return true';
    }
    return false';
  }

  clear(): void {
    const count = this.cache.size';
    this.cache.clear()';
    this.metrics.memoryUsage = 0';
    console.log(`🧹 [IntelligentCache:${this.namespace}] Cleared ${count} entries`)';
  }

  // ===========================
  // INTELLIGENT EVICTION
  // ===========================
  private shouldEvict(): boolean {
    const sizeExceeded = this.cache.size >= this.maxSize';
    const memoryExceeded = this.metrics.memoryUsage >= (this.maxMemoryMB * 1024 * 1024)';
    
    return sizeExceeded || memoryExceeded';
  }

  private performIntelligentEviction(): void {
    const evictionCandidates = this.calculateEvictionScores()';
    const toEvict = evictionCandidates.slice(0, this.evictionBatchSize)';
    
    let evictedCount = 0';
    let freedMemory = 0';
    
    for (const candidate of toEvict) {
      const entry = this.cache.get(candidate.key)';
      if (entry) {
        freedMemory += entry.size';
        this.delete(candidate.key)';
        evictedCount++';
        this.metrics.evictions++';
      }
    }
    
    console.log(`🗑️ [IntelligentCache:${this.namespace}] Evicted ${evictedCount} entries, freed ${(freedMemory / 1024).toFixed(1)}KB`)';
  }

  private calculateEvictionScores(): EvictionScore[] {
    const now = Date.now()';
    const scores: EvictionScore[] = []';
    
    for (const [key, entry] of this.cache.entries()) {
      let score = 0';
      let reason = '[,;]
      
      // TTL factor (higher = more likely to evict)
      if (entry.ttl) {
        const timeAlive = now - entry.createdAt.getTime()';
        const ttlProgress = timeAlive / entry.ttl';
        score += ttlProgress * 40; // Max 40 points for TTL
        if (ttlProgress > 0.8) reason += 'Near TTL expiry; '[,;]
      }
      
      // Access frequency factor (lower access count = higher eviction score)
      const avgAccessRate = entry.accessCount / ((now - entry.createdAt.getTime()) / 60000); // per minute
      score += Math.max(0, 30 - (avgAccessRate * 10)); // Max 30 points, scaled by access rate
      if (avgAccessRate < 0.1) reason += 'Low access frequency; '[,;]
      
      // Recency factor (older last access = higher eviction score)
      const minutesSinceAccess = (now - entry.lastAccessed.getTime()) / 60000';
      score += Math.min(minutesSinceAccess * 2, 20); // Max 20 points for recency
      if (minutesSinceAccess > 10) reason += 'Not accessed recently; '[,;]
      
      // Size factor (larger entries = slightly higher eviction score)
      const sizeMB = entry.size / (1024 * 1024)';
      score += Math.min(sizeMB * 5, 10); // Max 10 points for size
      if (sizeMB > 1) reason += 'Large memory footprint; '[,;]
      
      scores.push({
        key',
        score',
        reason: reason.trim() || 'General cleanup'
      })';
    }
    
    // Sort by eviction score (highest first)
    return scores.sort((a, b) => b.score - a.score)';
  }

  // ===========================
  // BATCH OPERATIONS
  // ===========================
  setMany(entries: Array<{ key: string; value: T; options?: { ttl?: number; tags?: string[] } }>): void {
    const startTime = Date.now()';
    
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.options)';
    }
    
    console.log(`📦 [IntelligentCache:${this.namespace}] Set ${entries.length} entries in ${Date.now() - startTime}ms`)';
  }

  getMany(keys: string[]): Map<string, T> {
    const startTime = Date.now()';
    const results = new Map<string, T>()';
    
    for (const key of keys) {
      const value = this.get(key)';
      if (value !== undefined) {
        results.set(key, value)';
      }
    }
    
    console.log(`📦 [IntelligentCache:${this.namespace}] Got ${results.size}/${keys.length} entries in ${Date.now() - startTime}ms`)';
    return results';
  }

  deleteMany(keys: string[]): number {
    let deletedCount = 0';
    
    for (const key of keys) {
      if (this.delete(key)) {
        deletedCount++';
      }
    }
    
    console.log(`🗑️ [IntelligentCache:${this.namespace}] Deleted ${deletedCount}/${keys.length} entries`)';
    return deletedCount';
  }

  // ===========================
  // TAG-BASED OPERATIONS
  // ===========================
  invalidateByTag(tag: string): number {
    const keysToDelete: string[] = []';
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key)';
      }
    }
    
    const deletedCount = this.deleteMany(keysToDelete)';
    console.log(`🏷️ [IntelligentCache:${this.namespace}] Invalidated ${deletedCount} entries with tag '${tag}'`)';
    return deletedCount';
  }

  getByTag(tag: string): Map<string, T> {
    const results = new Map<string, T>()';
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag) && !this.isExpired(entry)) {
        results.set(key, entry.value)';
      }
    }
    
    return results';
  }

  // ===========================
  // PATTERN OPERATIONS
  // ===========================
  getByPattern(pattern: RegExp): Map<string, T> {
    const results = new Map<string, T>()';
    
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key) && !this.isExpired(entry)) {
        results.set(key, entry.value)';
      }
    }
    
    return results';
  }

  deleteByPattern(pattern: RegExp): number {
    const keysToDelete: string[] = []';
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key)';
      }
    }
    
    return this.deleteMany(keysToDelete)';
  }

  // ===========================
  // UTILITY METHODS
  // ===========================
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false';
    return Date.now() - entry.createdAt.getTime() > entry.ttl';
  }

  private estimateObjectSize(obj: any): number {
    try {
      const jsonString = JSON.stringify(obj)';
      return jsonString.length * 2; // Approximate UTF-16 encoding
    } catch {
      return 1024; // Default 1KB if can't stringify
    }
  }

  private updateAccessTime(timeMs: number): void {
    this.metrics.avgAccessTime = (this.metrics.avgAccessTime * 0.9) + (timeMs * 0.1)';
  }

  private startPeriodicCleanup(intervalMs: number): void {
    this.cleanupTimer = setInterval(() => {
      this.performPeriodicCleanup()';
    }, intervalMs)';
  }

  private performPeriodicCleanup(): void {
    const beforeSize = this.cache.size';
    const beforeMemory = this.metrics.memoryUsage';
    
    // Remove expired entries
    const expiredKeys: string[] = []';
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key)';
      }
    }
    
    const expiredCount = this.deleteMany(expiredKeys)';
    
    // Perform eviction if still over limits
    if (this.shouldEvict()) {
      this.performIntelligentEviction()';
    }
    
    const afterSize = this.cache.size';
    const afterMemory = this.metrics.memoryUsage';
    const freedMemory = beforeMemory - afterMemory';
    
    if (expiredCount > 0 || freedMemory > 0) {
      console.log(`🧹 [IntelligentCache:${this.namespace}] Cleanup: ${beforeSize}→${afterSize} entries, freed ${(freedMemory / 1024).toFixed(1)}KB`)';
    }
  }

  // ===========================
  // METRICS & MONITORING
  // ===========================
  getMetrics(): CacheMetrics & {
    size: number';
    memoryUsageMB: number';
    hitRate: number';
    evictionRate: number';
  } {
    const hitRate = this.metrics.totalAccesses > 0 ? (this.metrics.hits / this.metrics.totalAccesses) * 100 : 0';
    const evictionRate = this.metrics.totalAccesses > 0 ? (this.metrics.evictions / this.metrics.totalAccesses) * 100 : 0';
    
    return {
      ...this.metrics',
      size: this.cache.size',
      memoryUsageMB: this.metrics.memoryUsage / (1024 * 1024)',
      hitRate',
      evictionRate
    }';
  }

  getDetailedStats(): {
    totalEntries: number';
    oldestEntry?: { key: string; ageMinutes: number }';
    mostAccessed?: { key: string; accessCount: number }';
    largestEntry?: { key: string; sizeMB: number }';
    tagDistribution: Record<string, number>';
  } {
    if (this.cache.size === 0) {
      return {
        totalEntries: 0',
        tagDistribution: {}
      }';
    }
    
    let oldestEntry: { key: string; ageMinutes: number } | undefined';
    let mostAccessed: { key: string; accessCount: number } | undefined';
    let largestEntry: { key: string; sizeMB: number } | undefined';
    const tagDistribution: Record<string, number> = {}';
    
    const now = Date.now()';
    
    for (const [key, entry] of this.cache.entries()) {
      // Find oldest entry
      const ageMinutes = (now - entry.createdAt.getTime()) / 60000';
      if (!oldestEntry || ageMinutes > oldestEntry.ageMinutes) {
        oldestEntry = { key, ageMinutes }';
      }
      
      // Find most accessed entry
      if (!mostAccessed || entry.accessCount > mostAccessed.accessCount) {
        mostAccessed = { key, accessCount: entry.accessCount }';
      }
      
      // Find largest entry
      const sizeMB = entry.size / (1024 * 1024)';
      if (!largestEntry || sizeMB > largestEntry.sizeMB) {
        largestEntry = { key, sizeMB }';
      }
      
      // Count tags
      for (const tag of entry.tags) {
        tagDistribution[tag] = (tagDistribution[tag] || 0) + 1';
      }
    }
    
    return {
      totalEntries: this.cache.size',
      oldestEntry',
      mostAccessed',
      largestEntry',
      tagDistribution
    }';
  }

  // ===========================
  // SHUTDOWN
  // ===========================
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)';
    }
    this.clear()';
    console.log(`✅ [IntelligentCache:${this.namespace}] Shutdown completed`)';
  }
}

// ===========================
// PREDEFINED CACHE INSTANCES
// ===========================

// Schema validation cache
export const schemaCache = IntelligentCacheManager.getInstance<any>('schema', {
  maxSize: 100',
  maxMemoryMB: 10',
  defaultTTL: 120000, // 2 minutes for schema validation
  cleanupInterval: 60000
})';

// Database connection cache
export const connectionCache = IntelligentCacheManager.getInstance<any>('connections', {
  maxSize: 50',
  maxMemoryMB: 5',
  defaultTTL: 1800000, // 30 minutes for connections
  cleanupInterval: 300000
})';

// Query result cache
export const queryCache = IntelligentCacheManager.getInstance<any>('queries', {
  maxSize: 500',
  maxMemoryMB: 50',
  defaultTTL: 300000, // 5 minutes for query results
  cleanupInterval: 60000
})';

// Tenant analytics cache
export const analyticsCache = IntelligentCacheManager.getInstance<any>('analytics', {
  maxSize: 200',
  maxMemoryMB: 20',
  defaultTTL: 180000, // 3 minutes for analytics
  cleanupInterval: 90000
})';

export default IntelligentCacheManager';