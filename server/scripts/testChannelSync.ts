
import { DrizzleChannelRepository } from '../modules/omnibridge/infrastructure/repositories/DrizzleChannelRepository';
import { IntegrationChannelSync } from '../modules/omnibridge/infrastructure/services/IntegrationChannelSync';
import { storage } from '../storage-simple';

async function testChannelSync() {
  console.log('🧪 [TEST-CHANNEL-SYNC] Starting channel synchronization test');
  
  try {
    const testTenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
    
    console.log(`🔍 [TEST] Testing with tenant: ${testTenantId}`);

    // 1. Check integrations from Tenant Admin
    console.log('\n📋 [TEST] Step 1: Getting tenant integrations...');
    const integrations = await storage.getTenantIntegrations(testTenantId);
    console.log(`✅ [TEST] Found ${integrations.length} total integrations`);
    
    // Filter communication integrations
    const communicationIntegrations = integrations.filter((integration: any) => {
      const category = integration.category?.toLowerCase() || '';
      const name = integration.name?.toLowerCase() || '';
      
      return category.includes('comunicaç') || category.includes('communication') || 
             name.includes('email') || name.includes('whatsapp') || name.includes('telegram') ||
             name.includes('sms') || name.includes('chat') || name.includes('imap') ||
             name.includes('smtp') || name.includes('gmail') || name.includes('outlook');
    });

    console.log(`📡 [TEST] Found ${communicationIntegrations.length} communication integrations:`);
    communicationIntegrations.forEach((integration: any) => {
      console.log(`  - ${integration.name} (${integration.category}) - Status: ${integration.status || integration.enabled}`);
    });

    // 2. Check existing channels
    console.log('\n🔧 [TEST] Step 2: Checking existing channels...');
    const channelRepository = new DrizzleChannelRepository();
    const existingChannels = await channelRepository.findByTenant(testTenantId);
    console.log(`✅ [TEST] Found ${existingChannels.length} existing channels`);

    // 3. Run synchronization
    console.log('\n🔄 [TEST] Step 3: Running synchronization...');
    const syncService = new IntegrationChannelSync(channelRepository, storage);
    await syncService.syncIntegrationsToChannels(testTenantId);
    console.log('✅ [TEST] Synchronization completed');

    // 4. Check channels after sync
    console.log('\n✅ [TEST] Step 4: Verifying channels after sync...');
    const channelsAfterSync = await channelRepository.findByTenant(testTenantId);
    console.log(`✅ [TEST] Found ${channelsAfterSync.length} channels after sync`);
    
    channelsAfterSync.forEach((channel: any) => {
      console.log(`  - ${channel.name} (${channel.type}) - Status: ${channel.status} - Integration: ${channel.integrationId}`);
    });

    // 5. Summary
    console.log('\n🎉 [TEST] Test Summary:');
    console.log(`  - Total integrations: ${integrations.length}`);
    console.log(`  - Communication integrations: ${communicationIntegrations.length}`);
    console.log(`  - Channels before sync: ${existingChannels.length}`);
    console.log(`  - Channels after sync: ${channelsAfterSync.length}`);

    if (channelsAfterSync.length > 0) {
      console.log('✅ [TEST] Channel synchronization is working correctly!');
    } else {
      console.log('⚠️ [TEST] No channels found after sync. Check integration configuration.');
    }

    return {
      success: true,
      totalIntegrations: integrations.length,
      communicationIntegrations: communicationIntegrations.length,
      channelsAfterSync: channelsAfterSync.length,
      channels: channelsAfterSync
    };

  } catch (error) {
    console.error('❌ [TEST] Channel sync test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run test if called directly
if (require.main === module) {
  testChannelSync().then(result => {
    console.log('\n📊 [TEST] Final Result:', result);
    process.exit(result.success ? 0 : 1);
  });
}

export { testChannelSync };
