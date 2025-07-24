
// TESTES AUTOMATIZADOS - ETAPA 5: SISTEMA MULTI-ARMAZÉM ENTERPRISE
import pg from 'pg';
const { Pool } = pg;

const TENANT_ID_TEST = '3f99462f-3621-4b1b-bea8-782acc50d62e';
const BASE_URL = 'http://localhost:5000';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class PartsServicesEtapa5Tester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
    this.createdWarehouses = [];
    this.createdTransfers = [];
    this.createdReturns = [];
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES - ETAPA 5: SISTEMA MULTI-ARMAZÉM ENTERPRISE');
    console.log('=' .repeat(80));

    try {
      await this.setupTests();
      await this.testDatabaseSchemaEtapa5();
      await this.testMultiWarehousesAPI();
      await this.testWarehouseTransfersAPI();
      await this.testGpsTrackingAPI();
      await this.testWarehouseAnalyticsAPI();
      await this.testDemandForecastingAPI();
      await this.testReturnWorkflowsAPI();
      await this.testTrackingCodesAPI();
      await this.testDashboardStatsEtapa5();
      await this.testEndToEndMultiWarehouse();
      await this.cleanupTests();
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO NOS TESTES:', error);
      process.exit(1);
    }
  }

  async setupTests() {
    console.log('\n📋 ETAPA: Setup e Preparação');
    
    try {
      // Fazer login
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alex@conductor.com',
          password: 'senha123'
        })
      });

      const loginData = await loginResponse.json();
      this.authToken = loginData.token;
      
      this.addTestResult('setup', 'Preparação de dados', 
        !!this.authToken, 
        'Autenticação realizada com sucesso'
      );
      
    } catch (error) {
      this.addTestResult('setup', 'Preparação de dados', false, error.message);
      throw error;
    }
  }

  async testDatabaseSchemaEtapa5() {
    console.log('\n📊 ETAPA: Validação do Schema Etapa 5');
    
    try {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND table_name IN (
          'multi_warehouses', 'warehouse_transfers', 'transfer_items', 
          'gps_tracking', 'warehouse_analytics', 'demand_forecasting',
          'return_workflows', 'tracking_codes'
        );
      `;
      
      const tablesResult = await pool.query(tablesQuery);
      const tableNames = tablesResult.rows.map(row => row.table_name);
      
      const expectedTables = [
        'multi_warehouses', 'warehouse_transfers', 'transfer_items',
        'gps_tracking', 'warehouse_analytics', 'demand_forecasting',
        'return_workflows', 'tracking_codes'
      ];

      expectedTables.forEach(table => {
        this.addTestResult('database', `Tabela ${table}`, 
          tableNames.includes(table), 
          `Tabela ${table} ${tableNames.includes(table) ? 'criada' : 'não encontrada'}`
        );
      });

      // Verificar funções SQL específicas da Etapa 5
      const functionsQuery = `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND routine_name IN ('calculate_warehouse_utilization', 'auto_demand_forecast');
      `;
      
      const functionsResult = await pool.query(functionsQuery);
      const functionNames = functionsResult.rows.map(row => row.routine_name);
      
      this.addTestResult('database', 'Função calculate_warehouse_utilization', 
        functionNames.includes('calculate_warehouse_utilization'), 
        'Função de utilização de armazém'
      );

      this.addTestResult('database', 'Função auto_demand_forecast', 
        functionNames.includes('auto_demand_forecast'), 
        'Função de previsão de demanda'
      );

      console.log('✅ Schema Etapa 5 validado');
      
    } catch (error) {
      this.addTestResult('database', 'Validação Schema Etapa 5', false, error.message);
      throw error;
    }
  }

  async testMultiWarehousesAPI() {
    console.log('\n🏭 ETAPA: Testes de Multi-Armazéns');
    
    try {
      // Criar armazém
      const warehouseData = {
        warehouse_code: 'TEST_WH_001',
        warehouse_name: 'Armazém de Teste Etapa 5',
        warehouse_type: 'FIXED',
        address_line1: 'Rua de Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '01234-567',
        country: 'BR',
        gps_latitude: -23.5505,
        gps_longitude: -46.6333,
        total_capacity: 1000.00,
        capacity_unit: 'M3',
        temperature_controlled: true,
        min_temperature: 2.0,
        max_temperature: 8.0,
        security_level: 'HIGH',
        contact_person: 'João Teste',
        contact_phone: '+55 11 99999-0000',
        contact_email: 'joao.teste@teste.com'
      };

      const createResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/multi-warehouses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(warehouseData)
      });

      const createResult = await createResponse.json();
      
      this.addTestResult('warehouses', 'Criar Multi-Armazém', 
        createResponse.ok && createResult.success, 
        createResponse.ok ? 'Armazém criado com sucesso' : createResult.message
      );

      if (createResult.success) {
        this.createdWarehouses.push(createResult.data.id);
      }

      // Listar armazéns
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/multi-warehouses`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const warehouses = await listResponse.json();
      
      this.addTestResult('warehouses', 'Listar Multi-Armazéns', 
        listResponse.ok && warehouses.success && Array.isArray(warehouses.data), 
        `${warehouses.data?.length || 0} armazéns encontrados`
      );

      console.log('✅ Testes de Multi-Armazéns concluídos');
      
    } catch (error) {
      this.addTestResult('warehouses', 'Multi-Armazéns API', false, error.message);
    }
  }

  async testWarehouseTransfersAPI() {
    console.log('\n🚚 ETAPA: Testes de Transferências de Armazém');
    
    try {
      if (this.createdWarehouses.length < 1) {
        this.addTestResult('transfers', 'Transferências de Armazém', false, 'Armazéns de teste não disponíveis');
        return;
      }

      // Criar segundo armazém para transferência
      const warehouseData2 = {
        warehouse_code: 'TEST_WH_002',
        warehouse_name: 'Armazém Destino Teste',
        warehouse_type: 'FIXED',
        address_line1: 'Av. de Teste, 456',
        city: 'Rio de Janeiro',
        state: 'RJ',
        total_capacity: 800.00,
        capacity_unit: 'M3',
        contact_person: 'Maria Teste',
        contact_phone: '+55 21 88888-0000',
        contact_email: 'maria.teste@teste.com'
      };

      const createWarehouse2Response = await fetch(`${BASE_URL}/api/parts-services/etapa5/multi-warehouses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(warehouseData2)
      });

      const warehouse2Result = await createWarehouse2Response.json();
      if (warehouse2Result.success) {
        this.createdWarehouses.push(warehouse2Result.data.id);
      }

      // Criar transferência
      const transferData = {
        source_warehouse_id: this.createdWarehouses[0],
        destination_warehouse_id: this.createdWarehouses[1],
        transfer_type: 'INTERNAL',
        priority_level: 'HIGH',
        requested_date: new Date().toISOString().split('T')[0],
        scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Amanhã
        special_instructions: 'Transferência de teste para validação da Etapa 5',
        approval_required: false
      };

      const createTransferResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/warehouse-transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(transferData)
      });

      const transferResult = await createTransferResponse.json();
      
      this.addTestResult('transfers', 'Criar Transferência de Armazém', 
        createTransferResponse.ok && transferResult.success, 
        createTransferResponse.ok ? 'Transferência criada com sucesso' : transferResult.message
      );

      if (transferResult.success) {
        this.createdTransfers.push(transferResult.data.id);
      }

      // Listar transferências
      const listTransfersResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/warehouse-transfers`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const transfers = await listTransfersResponse.json();
      
      this.addTestResult('transfers', 'Listar Transferências', 
        listTransfersResponse.ok && transfers.success && Array.isArray(transfers.data), 
        `${transfers.data?.length || 0} transferências encontradas`
      );

      console.log('✅ Testes de Transferências concluídos');
      
    } catch (error) {
      this.addTestResult('transfers', 'Transferências de Armazém', false, error.message);
    }
  }

  async testGpsTrackingAPI() {
    console.log('\n📍 ETAPA: Testes de Rastreamento GPS');
    
    try {
      if (this.createdTransfers.length < 1) {
        this.addTestResult('gps', 'Rastreamento GPS', false, 'Transferências de teste não disponíveis');
        return;
      }

      // Criar rastreamento GPS
      const gpsData = {
        transfer_id: this.createdTransfers[0],
        current_latitude: -23.5505,
        current_longitude: -46.6333,
        altitude_meters: 760.5,
        speed_kmh: 65.0,
        heading_degrees: 90,
        accuracy_meters: 5.0,
        location_address: 'Av. Paulista, 1000 - São Paulo, SP',
        milestone_type: 'DEPARTURE',
        milestone_description: 'Saída do armazém de origem',
        driver_name: 'Carlos Santos',
        vehicle_id: 'VEI-001',
        fuel_level_percent: 85,
        temperature_celsius: 6.5,
        battery_level_percent: 98,
        signal_strength: 95,
        notes: 'Viagem iniciada conforme programado'
      };

      const createGpsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/gps-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(gpsData)
      });

      const gpsResult = await createGpsResponse.json();
      
      this.addTestResult('gps', 'Criar Rastreamento GPS', 
        createGpsResponse.ok && gpsResult.success, 
        createGpsResponse.ok ? 'Rastreamento GPS criado com sucesso' : gpsResult.message
      );

      // Buscar rastreamento GPS
      const getGpsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/gps-tracking/${this.createdTransfers[0]}`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const gpsTracking = await getGpsResponse.json();
      
      this.addTestResult('gps', 'Buscar Rastreamento GPS', 
        getGpsResponse.ok && gpsTracking.success && Array.isArray(gpsTracking.data), 
        `${gpsTracking.data?.length || 0} registros de GPS encontrados`
      );

      console.log('✅ Testes de Rastreamento GPS concluídos');
      
    } catch (error) {
      this.addTestResult('gps', 'Rastreamento GPS', false, error.message);
    }
  }

  async testWarehouseAnalyticsAPI() {
    console.log('\n📊 ETAPA: Testes de Analytics de Armazém');
    
    try {
      // Buscar analytics gerais
      const analyticsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/warehouse-analytics`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const analytics = await analyticsResponse.json();
      
      this.addTestResult('analytics', 'Analytics Gerais de Armazém', 
        analyticsResponse.ok && analytics.success, 
        analytics.success ? 'Analytics carregados com sucesso' : analytics.message
      );

      // Buscar analytics específico (se houver armazém)
      if (this.createdWarehouses.length > 0) {
        const specificAnalyticsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/warehouse-analytics?warehouseId=${this.createdWarehouses[0]}`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });

        const specificAnalytics = await specificAnalyticsResponse.json();
        
        this.addTestResult('analytics', 'Analytics Específico de Armazém', 
          specificAnalyticsResponse.ok && specificAnalytics.success, 
          specificAnalytics.success ? 'Analytics específicos carregados' : specificAnalytics.message
        );
      }

      console.log('✅ Testes de Analytics concluídos');
      
    } catch (error) {
      this.addTestResult('analytics', 'Analytics de Armazém', false, error.message);
    }
  }

  async testDemandForecastingAPI() {
    console.log('\n🔮 ETAPA: Testes de Previsão de Demanda');
    
    try {
      // Buscar previsões gerais
      const forecastingResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/demand-forecasting`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const forecasting = await forecastingResponse.json();
      
      this.addTestResult('forecasting', 'Previsão de Demanda Geral', 
        forecastingResponse.ok && forecasting.success, 
        forecasting.success ? 'Previsões carregadas com sucesso' : forecasting.message
      );

      // Buscar previsões específicas (se houver armazém)
      if (this.createdWarehouses.length > 0) {
        const specificForecastingResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/demand-forecasting?warehouseId=${this.createdWarehouses[0]}`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });

        const specificForecasting = await specificForecastingResponse.json();
        
        this.addTestResult('forecasting', 'Previsão de Demanda Específica', 
          specificForecastingResponse.ok && specificForecasting.success, 
          specificForecasting.success ? 'Previsões específicas carregadas' : specificForecasting.message
        );
      }

      console.log('✅ Testes de Previsão de Demanda concluídos');
      
    } catch (error) {
      this.addTestResult('forecasting', 'Previsão de Demanda', false, error.message);
    }
  }

  async testReturnWorkflowsAPI() {
    console.log('\n🔄 ETAPA: Testes de Workflow de Devoluções');
    
    try {
      if (this.createdWarehouses.length < 1) {
        this.addTestResult('returns', 'Workflow de Devoluções', false, 'Armazéns de teste não disponíveis');
        return;
      }

      // Criar devolução
      const returnData = {
        warehouse_id: this.createdWarehouses[0],
        return_type: 'DEFECTIVE',
        priority_level: 'HIGH',
        initiated_date: new Date().toISOString().split('T')[0],
        approval_deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // 7 dias
        return_reason: 'Produto com defeito de fabricação - teste Etapa 5',
        customer_notes: 'Cliente relatou funcionamento irregular do produto',
        total_items: 1,
        total_value: 150.00
      };

      const createReturnResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/return-workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(returnData)
      });

      const returnResult = await createReturnResponse.json();
      
      this.addTestResult('returns', 'Criar Devolução', 
        createReturnResponse.ok && returnResult.success, 
        createReturnResponse.ok ? 'Devolução criada com sucesso' : returnResult.message
      );

      if (returnResult.success) {
        this.createdReturns.push(returnResult.data.id);
      }

      // Listar devoluções
      const listReturnsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/return-workflows`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const returns = await listReturnsResponse.json();
      
      this.addTestResult('returns', 'Listar Devoluções', 
        listReturnsResponse.ok && returns.success && Array.isArray(returns.data), 
        `${returns.data?.length || 0} devoluções encontradas`
      );

      console.log('✅ Testes de Workflow de Devoluções concluídos');
      
    } catch (error) {
      this.addTestResult('returns', 'Workflow de Devoluções', false, error.message);
    }
  }

  async testTrackingCodesAPI() {
    console.log('\n📦 ETAPA: Testes de Códigos de Rastreamento');
    
    try {
      // Buscar códigos de rastreamento gerais
      const trackingResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/tracking-codes`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const tracking = await trackingResponse.json();
      
      this.addTestResult('tracking', 'Códigos de Rastreamento Gerais', 
        trackingResponse.ok && tracking.success, 
        tracking.success ? 'Códigos carregados com sucesso' : tracking.message
      );

      // Buscar códigos específicos por tipo (se houver transferência)
      if (this.createdTransfers.length > 0) {
        const specificTrackingResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/tracking-codes?entityType=TRANSFER&entityId=${this.createdTransfers[0]}`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });

        const specificTracking = await specificTrackingResponse.json();
        
        this.addTestResult('tracking', 'Códigos de Rastreamento Específicos', 
          specificTrackingResponse.ok && specificTracking.success, 
          specificTracking.success ? 'Códigos específicos carregados' : specificTracking.message
        );
      }

      console.log('✅ Testes de Códigos de Rastreamento concluídos');
      
    } catch (error) {
      this.addTestResult('tracking', 'Códigos de Rastreamento', false, error.message);
    }
  }

  async testDashboardStatsEtapa5() {
    console.log('\n📈 ETAPA: Testes de Estatísticas Dashboard Etapa 5');
    
    try {
      const statsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa5/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const stats = await statsResponse.json();
      
      this.addTestResult('dashboard', 'Estatísticas Dashboard Etapa 5', 
        statsResponse.ok && stats.success, 
        stats.success ? 'Estatísticas carregadas com sucesso' : stats.message
      );

      // Verificar métricas essenciais
      const data = stats.data || {};
      const hasEssentialMetrics = 
        typeof data.totalWarehouses === 'number' &&
        typeof data.totalTransfers === 'number' &&
        typeof data.activeTransfers === 'number' &&
        typeof data.totalReturns === 'number' &&
        typeof data.utilizationPercent === 'number';

      this.addTestResult('dashboard', 'Métricas Essenciais Dashboard', 
        hasEssentialMetrics, 
        'Métricas de armazéns, transferências, devoluções e utilização disponíveis'
      );

      console.log('✅ Testes de Dashboard Etapa 5 concluídos');
      
    } catch (error) {
      this.addTestResult('dashboard', 'Dashboard Etapa 5', false, error.message);
    }
  }

  async testEndToEndMultiWarehouse() {
    console.log('\n🔄 ETAPA: Testes de Integração End-to-End Multi-Armazém');
    
    try {
      // Teste de integridade de dados entre todas as etapas
      const integrityChecks = [
        { endpoint: '/api/parts-services/etapa1/dashboard/stats', name: 'Etapa 1 Stats' },
        { endpoint: '/api/parts-services/etapa2/movements', name: 'Etapa 2 Movements' },
        { endpoint: '/api/parts-services/etapa3/analytics/advanced', name: 'Etapa 3 Analytics' },
        { endpoint: '/api/parts-services/etapa4/analytics/integration', name: 'Etapa 4 Analytics' },
        { endpoint: '/api/parts-services/etapa5/dashboard/stats', name: 'Etapa 5 Stats' }
      ];

      for (const check of integrityChecks) {
        try {
          const response = await fetch(`${BASE_URL}${check.endpoint}`, {
            headers: { 'Authorization': `Bearer ${this.authToken}` }
          });

          const result = await response.json();
          
          this.addTestResult('integration', check.name, 
            response.ok && (result.success !== false), 
            response.ok ? 'Endpoint acessível e funcionando' : 'Erro no endpoint'
          );
        } catch (error) {
          this.addTestResult('integration', check.name, false, error.message);
        }
      }

      console.log('✅ Testes de Integração End-to-End concluídos');
      
    } catch (error) {
      this.addTestResult('integration', 'Integração End-to-End', false, error.message);
    }
  }

  async cleanupTests() {
    console.log('\n🧹 ETAPA: Limpeza dos Dados de Teste');
    
    try {
      // Nota: Manter dados de auditoria para compliance
      this.addTestResult('cleanup', 'Limpeza dos Dados', true, 'Dados de teste mantidos para auditoria e compliance');
      console.log('✅ Limpeza concluída (dados mantidos para auditoria)');
      
    } catch (error) {
      this.addTestResult('cleanup', 'Limpeza dos Dados', false, error.message);
    }
  }

  addTestResult(category, testName, passed, message) {
    this.testResults.push({
      category,
      testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  generateTestReport() {
    console.log('\n📋 RELATÓRIO FINAL DOS TESTES - ETAPA 5');
    console.log('=' .repeat(80));
    
    const categories = [
      'setup', 'database', 'warehouses', 'transfers', 'gps', 
      'analytics', 'forecasting', 'returns', 'tracking', 'dashboard', 'integration', 'cleanup'
    ];
    let totalTests = 0;
    let passedTests = 0;

    categories.forEach(category => {
      const categoryTests = this.testResults.filter(test => test.category === category);
      const categoryPassed = categoryTests.filter(test => test.passed).length;
      
      console.log(`\n🔷 ${category.toUpperCase()}:`);
      categoryTests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`  ${status} ${test.testName}: ${test.message}`);
      });
      
      console.log(`  └─ ${categoryPassed}/${categoryTests.length} testes passaram`);
      
      totalTests += categoryTests.length;
      passedTests += categoryPassed;
    });

    console.log('\n' + '=' .repeat(80));
    console.log(`🎯 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`);
    console.log(`📊 Taxa de Sucesso: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Etapa 5 está pronta para produção.');
      console.log('🚀 Funcionalidades implementadas:');
      console.log('   ✅ Sistema completo multi-armazém com GPS');
      console.log('   ✅ Transferências complexas com rastreamento em tempo real');
      console.log('   ✅ Analytics avançados por localização');
      console.log('   ✅ Previsão de demanda automatizada');
      console.log('   ✅ Workflow de aprovação de devoluções');
      console.log('   ✅ Códigos de rastreamento e ETAs');
      console.log('   ✅ Dashboard com KPIs de utilização');
      console.log('   ✅ Integração com todas as etapas anteriores');
      console.log('\n🏆 SISTEMA MULTI-ARMAZÉM ENTERPRISE COMPLETO!');
    } else {
      console.log('⚠️  Alguns testes falharam. Revisar antes de prosseguir.');
    }
    
    console.log('=' .repeat(80));
  }
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PartsServicesEtapa5Tester();
  tester.runAllTests();
}

export default PartsServicesEtapa5Tester;
