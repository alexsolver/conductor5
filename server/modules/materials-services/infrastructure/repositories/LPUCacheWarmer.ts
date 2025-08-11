
// ===========================
// LPU CACHE WARMER SERVICE
// Pré-carrega cache para melhor performance
// ===========================

export class LPUCacheWarmer {
  private static instance: LPUCacheWarmer;
  
  static getInstance(): LPUCacheWarmer {
    if (!LPUCacheWarmer.instance) {
      LPUCacheWarmer.instance = new LPUCacheWarmer();
    }
    return LPUCacheWarmer.instance;
  }

  async warmCache(tenantId: string, lpuRepository: any): Promise<void> {
    console.log(`🔥 [LPUCacheWarmer] Starting cache warming for tenant: ${tenantId}`);
    
    try {
      // Warm up stats cache
      console.log(`🔥 [LPUCacheWarmer] Warming stats cache...`);
      await lpuRepository.getLPUStats(tenantId);
      
      // Warm up price lists cache
      console.log(`🔥 [LPUCacheWarmer] Warming price lists cache...`);
      await lpuRepository.getAllPriceLists(tenantId);
      
      // Warm up pricing rules cache
      console.log(`🔥 [LPUCacheWarmer] Warming pricing rules cache...`);
      await lpuRepository.getAllPricingRules(tenantId);
      
      console.log(`✅ [LPUCacheWarmer] Cache warming completed for tenant: ${tenantId}`);
    } catch (error) {
      console.error(`❌ [LPUCacheWarmer] Cache warming failed for tenant ${tenantId}:`, error);
    }
  }

  async schedulePeriodicWarming(tenantId: string, lpuRepository: any): Promise<void> {
    // Warm cache every 90 seconds to keep it fresh
    setInterval(async () => {
      console.log(`🔥 [LPUCacheWarmer] Periodic warming for tenant: ${tenantId}`);
      await this.warmCache(tenantId, lpuRepository);
    }, 90000); // 90 seconds
  }
}

export const lpuCacheWarmer = LPUCacheWarmer.getInstance();
