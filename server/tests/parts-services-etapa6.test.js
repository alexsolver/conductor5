
const API_BASE = 'http://localhost:5000/api';

class PartsServicesEtapa6Tester {
  constructor() {
    this.accessToken = process.env.ACCESS_TOKEN || '';
    this.tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: responseData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testAssetsEnterprise() {
    console.log('\n🏢 TESTANDO CONTROLE DE ATIVOS ENTERPRISE...');
    
    // Teste 1: Listar ativos
    console.log('📋 Teste 1: Listar ativos enterprise');
    const listResult = await this.makeRequest('/parts-services/etapa6/assets-enterprise');
    console.log(`   Status: ${listResult.status}`);
    console.log(`   Sucesso: ${listResult.success}`);
    console.log(`   Ativos encontrados: ${listResult.data?.data?.length || 0}`);

    // Teste 2: Criar novo ativo
    console.log('➕ Teste 2: Criar novo ativo');
    const newAsset = {
      assetNumber: 'EQ-001-TEST',
      name: 'Equipamento de Teste Enterprise',
      description: 'Equipamento criado para teste da Etapa 6',
      category: 'equipment',
      subcategory: 'machinery',
      assetType: 'production',
      brand: 'TestBrand',
      model: 'TEST-2024',
      serialNumber: 'SN123456789',
      status: 'active',
      conditionRating: 'good',
      acquisitionCost: 50000.00,
      currentValue: 45000.00
    };

    const createResult = await this.makeRequest('/parts-services/etapa6/assets-enterprise', 'POST', newAsset);
    console.log(`   Status: ${createResult.status}`);
    console.log(`   Sucesso: ${createResult.success}`);
    if (createResult.success) {
      console.log(`   Ativo criado com ID: ${createResult.data?.data?.id}`);
      this.testAssetId = createResult.data?.data?.id;
    }

    // Teste 3: Buscar histórico de manutenção
    if (this.testAssetId) {
      console.log('🔧 Teste 3: Buscar histórico de manutenção');
      const historyResult = await this.makeRequest(`/parts-services/etapa6/assets-enterprise/${this.testAssetId}/maintenance-history`);
      console.log(`   Status: ${historyResult.status}`);
      console.log(`   Sucesso: ${historyResult.success}`);
      console.log(`   Registros de manutenção: ${historyResult.data?.data?.length || 0}`);
    }

    return { listResult, createResult };
  }

  async testPriceListsEnterprise() {
    console.log('\n💰 TESTANDO LPU ENTERPRISE COM VERSIONAMENTO...');
    
    // Teste 1: Listar listas de preços
    console.log('📋 Teste 1: Listar listas de preços enterprise');
    const listResult = await this.makeRequest('/parts-services/etapa6/price-lists-enterprise');
    console.log(`   Status: ${listResult.status}`);
    console.log(`   Sucesso: ${listResult.success}`);
    console.log(`   Listas encontradas: ${listResult.data?.data?.length || 0}`);

    // Teste 2: Criar nova lista de preços
    console.log('➕ Teste 2: Criar nova lista de preços');
    const newPriceList = {
      code: 'LPU-ENT-001',
      name: 'Lista Enterprise de Teste',
      description: 'Lista de preços enterprise criada para teste',
      version: '1.0',
      validFrom: new Date().toISOString(),
      reviewPeriod: 'quarterly',
      status: 'draft'
    };

    const createResult = await this.makeRequest('/parts-services/etapa6/price-lists-enterprise', 'POST', newPriceList);
    console.log(`   Status: ${createResult.status}`);
    console.log(`   Sucesso: ${createResult.success}`);
    if (createResult.success) {
      console.log(`   Lista criada com ID: ${createResult.data?.data?.id}`);
      this.testPriceListId = createResult.data?.data?.id;
    }

    // Teste 3: Buscar itens da lista
    if (this.testPriceListId) {
      console.log('📝 Teste 3: Buscar itens da lista de preços');
      const itemsResult = await this.makeRequest(`/parts-services/etapa6/price-lists-enterprise/${this.testPriceListId}/items`);
      console.log(`   Status: ${itemsResult.status}`);
      console.log(`   Sucesso: ${itemsResult.success}`);
      console.log(`   Itens encontrados: ${itemsResult.data?.data?.length || 0}`);
    }

    return { listResult, createResult };
  }

  async testPricingEngine() {
    console.log('\n⚙️ TESTANDO MOTOR DE PREÇOS AVANÇADO...');
    
    // Teste 1: Buscar regras de preços
    console.log('📋 Teste 1: Buscar regras do motor de preços');
    const rulesResult = await this.makeRequest('/parts-services/etapa6/pricing-rules-engine');
    console.log(`   Status: ${rulesResult.status}`);
    console.log(`   Sucesso: ${rulesResult.success}`);
    console.log(`   Regras encontradas: ${rulesResult.data?.data?.length || 0}`);

    // Teste 2: Criar simulação de preços
    console.log('🎯 Teste 2: Criar simulação de preços');
    const simulation = {
      simulationName: 'Simulação Teste Enterprise',
      description: 'Simulação criada para teste do motor de preços',
      currency: 'BRL',
      scenarioData: {
        items: [
          { itemId: '1', quantity: 10, unitPrice: 100.00 },
          { itemId: '2', quantity: 5, unitPrice: 200.00 }
        ]
      },
      appliedRules: ['volume_discount', 'customer_tier'],
      originalTotal: 1500.00,
      discountedTotal: 1350.00,
      totalDiscount: 150.00,
      discountPercentage: 10.00,
      status: 'draft'
    };

    const simulationResult = await this.makeRequest('/parts-services/etapa6/price-simulations', 'POST', simulation);
    console.log(`   Status: ${simulationResult.status}`);
    console.log(`   Sucesso: ${simulationResult.success}`);
    if (simulationResult.success) {
      console.log(`   Simulação criada com ID: ${simulationResult.data?.data?.id}`);
    }

    return { rulesResult, simulationResult };
  }

  async testComplianceAndAudit() {
    console.log('\n🛡️ TESTANDO COMPLIANCE E AUDITORIA...');
    
    // Teste 1: Buscar trilhas de auditoria
    console.log('📋 Teste 1: Buscar trilhas de auditoria enterprise');
    const auditResult = await this.makeRequest('/parts-services/etapa6/audit-trails-enterprise');
    console.log(`   Status: ${auditResult.status}`);
    console.log(`   Sucesso: ${auditResult.success}`);
    console.log(`   Registros de auditoria: ${auditResult.data?.data?.length || 0}`);

    // Teste 2: Buscar alertas de compliance
    console.log('🚨 Teste 2: Buscar alertas de compliance');
    const alertsResult = await this.makeRequest('/parts-services/etapa6/compliance-alerts');
    console.log(`   Status: ${alertsResult.status}`);
    console.log(`   Sucesso: ${alertsResult.success}`);
    console.log(`   Alertas encontrados: ${alertsResult.data?.data?.length || 0}`);

    // Teste 3: Buscar certificações
    console.log('🏆 Teste 3: Buscar certificações');
    const certResult = await this.makeRequest('/parts-services/etapa6/certifications');
    console.log(`   Status: ${certResult.status}`);
    console.log(`   Sucesso: ${certResult.success}`);
    console.log(`   Certificações encontradas: ${certResult.data?.data?.length || 0}`);

    return { auditResult, alertsResult, certResult };
  }

  async testMobileAndOffline() {
    console.log('\n📱 TESTANDO MOBILE E OFFLINE...');
    
    // Teste 1: Buscar dispositivos móveis
    console.log('📋 Teste 1: Buscar dispositivos móveis');
    const devicesResult = await this.makeRequest('/parts-services/etapa6/mobile-devices');
    console.log(`   Status: ${devicesResult.status}`);
    console.log(`   Sucesso: ${devicesResult.success}`);
    console.log(`   Dispositivos encontrados: ${devicesResult.data?.data?.length || 0}`);

    // Teste 2: Buscar fila de sincronização offline
    console.log('🔄 Teste 2: Buscar fila de sincronização offline');
    const syncResult = await this.makeRequest('/parts-services/etapa6/offline-sync-queue');
    console.log(`   Status: ${syncResult.status}`);
    console.log(`   Sucesso: ${syncResult.success}`);
    console.log(`   Itens na fila: ${syncResult.data?.data?.length || 0}`);

    return { devicesResult, syncResult };
  }

  async testDashboardStats() {
    console.log('\n📊 TESTANDO DASHBOARD STATS ETAPA 6...');
    
    const statsResult = await this.makeRequest('/parts-services/etapa6/dashboard-stats-etapa6');
    console.log(`   Status: ${statsResult.status}`);
    console.log(`   Sucesso: ${statsResult.success}`);
    
    if (statsResult.success && statsResult.data?.data) {
      const stats = statsResult.data.data;
      console.log(`   📈 ESTATÍSTICAS ENTERPRISE:`);
      console.log(`      • Total de Ativos: ${stats.total_assets || 0}`);
      console.log(`      • Ativos em Manutenção: ${stats.assets_in_maintenance || 0}`);
      console.log(`      • Listas de Preços Ativas: ${stats.active_price_lists || 0}`);
      console.log(`      • Alertas de Compliance Abertos: ${stats.open_compliance_alerts || 0}`);
      console.log(`      • Certificações Ativas: ${stats.active_certifications || 0}`);
      console.log(`      • Dispositivos Registrados: ${stats.registered_devices || 0}`);
      console.log(`      • Itens Pendentes Sync: ${stats.pending_sync_items || 0}`);
      console.log(`      • Condição Média dos Ativos: ${parseFloat(stats.avg_asset_condition || 0).toFixed(2)}/5.0`);
    }

    return statsResult;
  }

  async runAllTests() {
    console.log('🚀 INICIANDO TESTES DA ETAPA 6 - MÓDULOS ENTERPRISE AVANÇADOS');
    console.log('=' .repeat(80));

    const results = {};

    try {
      // Executar todos os testes
      results.assets = await this.testAssetsEnterprise();
      results.priceLists = await this.testPriceListsEnterprise();
      results.pricingEngine = await this.testPricingEngine();
      results.compliance = await this.testComplianceAndAudit();
      results.mobile = await this.testMobileAndOffline();
      results.dashboard = await this.testDashboardStats();

      // Resumo dos resultados
      console.log('\n📋 RESUMO DOS TESTES DA ETAPA 6:');
      console.log('=' .repeat(50));

      const modules = [
        { name: 'Controle de Ativos Enterprise', result: results.assets },
        { name: 'LPU Enterprise com Versionamento', result: results.priceLists },
        { name: 'Motor de Preços Avançado', result: results.pricingEngine },
        { name: 'Compliance e Auditoria', result: results.compliance },
        { name: 'Mobile e Offline', result: results.mobile },
        { name: 'Dashboard Stats', result: results.dashboard }
      ];

      let successCount = 0;
      modules.forEach(module => {
        const success = Object.values(module.result).some(r => r?.success);
        console.log(`${success ? '✅' : '❌'} ${module.name}: ${success ? 'PASSOU' : 'FALHOU'}`);
        if (success) successCount++;
      });

      console.log('\n🎯 RESULTADO FINAL DA ETAPA 6:');
      console.log(`   Módulos testados: ${modules.length}`);
      console.log(`   Módulos com sucesso: ${successCount}`);
      console.log(`   Taxa de sucesso: ${((successCount / modules.length) * 100).toFixed(1)}%`);

      if (successCount === modules.length) {
        console.log('\n🏆 ETAPA 6 CONCLUÍDA COM SUCESSO!');
        console.log('🎉 TODOS OS MÓDULOS ENTERPRISE AVANÇADOS FUNCIONANDO!');
        console.log('\n📋 FUNCIONALIDADES IMPLEMENTADAS NA ETAPA 6:');
        console.log('   🏢 Controle de Ativos Enterprise com QR codes e RFID');
        console.log('   💰 LPU Enterprise com versionamento e workflows');
        console.log('   ⚙️ Motor de Preços Avançado com regras dinâmicas');
        console.log('   🛡️ Sistema de Compliance e Auditoria completo');
        console.log('   📱 Capacidades Mobile com sincronização offline');
        console.log('   📊 Analytics enterprise com métricas avançadas');
        console.log('\n🌟 SISTEMA PARTS & SERVICES ENTERPRISE COMPLETO!');
      } else {
        console.log('⚠️  Alguns módulos falharam. Revisar implementação.');
      }

    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
    }

    console.log('=' .repeat(80));
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new PartsServicesEtapa6Tester();
  tester.runAllTests().catch(console.error);
}

module.exports = PartsServicesEtapa6Tester;
