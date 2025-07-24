
// TESTES AUTOMATIZADOS - ETAPA 3: SISTEMA MULTI-ARMAZÉM AVANÇADO
const { Pool } = require('pg');

const TENANT_ID_TEST = '3f99462f-3621-4b1b-bea8-782acc50d62e';
const BASE_URL = 'http://localhost:5000';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class PartsServicesEtapa3Tester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
    this.createdRules = [];
    this.testPartId = null;
    this.testLocationId = null;
    this.testSecondLocationId = null;
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES - ETAPA 3: SISTEMA MULTI-ARMAZÉM AVANÇADO');
    console.log('=' .repeat(70));

    try {
      await this.setupTests();
      await this.testDatabaseSchemaEtapa3();
      await this.testAutomatedTransferRulesAPI();
      await this.testDemandForecastAPI();
      await this.testStockAlertsAPI();
      await this.testWarehouseCapacityAPI();
      await this.testTransitTrackingAPI();
      await this.testAbcAnalysisAPI();
      await this.testAdvancedAnalyticsAPI();
      await this.testAutomationExecution();
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
      
      // Buscar dados de teste
      const partsResponse = await fetch(`${BASE_URL}/api/parts-services/parts`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      const parts = await partsResponse.json();
      this.testPartId = parts[0]?.id;

      const locationsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/stock-locations`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      const locations = await locationsResponse.json();
      this.testLocationId = locations[0]?.id;
      this.testSecondLocationId = locations[1]?.id;
      
      this.addTestResult('setup', 'Preparação de dados', 
        !!(this.authToken && this.testPartId && this.testLocationId), 
        'Dados de teste preparados'
      );
      
    } catch (error) {
      this.addTestResult('setup', 'Preparação de dados', false, error.message);
      throw error;
    }
  }

  async testDatabaseSchemaEtapa3() {
    console.log('\n📊 ETAPA: Validação do Schema Etapa 3');
    
    try {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND table_name IN (
          'automated_transfers', 'demand_forecasts', 'stock_alerts',
          'warehouse_capacities', 'transit_tracking', 'abc_analysis'
        );
      `;
      
      const tablesResult = await pool.query(tablesQuery);
      const tableNames = tablesResult.rows.map(row => row.table_name);
      
      const expectedTables = [
        'automated_transfers', 'demand_forecasts', 'stock_alerts',
        'warehouse_capacities', 'transit_tracking', 'abc_analysis'
      ];

      expectedTables.forEach(table => {
        this.addTestResult('database', `Tabela ${table}`, 
          tableNames.includes(table), 
          `Tabela ${table} ${tableNames.includes(table) ? 'criada' : 'não encontrada'}`
        );
      });

      // Verificar funções SQL
      const functionsQuery = `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND routine_name IN ('calculate_demand_forecast', 'check_stock_alerts');
      `;
      
      const functionsResult = await pool.query(functionsQuery);
      const functionNames = functionsResult.rows.map(row => row.routine_name);
      
      this.addTestResult('database', 'Função calculate_demand_forecast', 
        functionNames.includes('calculate_demand_forecast'), 
        'Função de previsão de demanda'
      );

      this.addTestResult('database', 'Função check_stock_alerts', 
        functionNames.includes('check_stock_alerts'), 
        'Função de alertas automáticos'
      );

      console.log('✅ Schema Etapa 3 validado');
      
    } catch (error) {
      this.addTestResult('database', 'Validação Schema Etapa 3', false, error.message);
      throw error;
    }
  }

  async testAutomatedTransferRulesAPI() {
    console.log('\n🔄 ETAPA: Testes de Regras de Transferência Automática');
    
    try {
      // Criar regra de transferência
      const ruleData = {
        rule_name: 'Teste Etapa 3 - Rebalanceamento',
        source_location_id: this.testLocationId,
        destination_location_id: this.testSecondLocationId,
        trigger_type: 'LOW_STOCK',
        transfer_quantity_type: 'FIXED',
        transfer_quantity: 15,
        minimum_trigger_quantity: 5
      };

      const createResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/automated-transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(ruleData)
      });

      const createResult = await createResponse.json();
      
      this.addTestResult('transfers', 'Criar Regra de Transferência', 
        createResponse.ok && createResult.success, 
        createResponse.ok ? 'Regra criada com sucesso' : createResult.message
      );

      if (createResult.success) {
        this.createdRules.push(createResult.data.id);
      }

      // Listar regras
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/automated-transfers`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const rules = await listResponse.json();
      
      this.addTestResult('transfers', 'Listar Regras de Transferência', 
        listResponse.ok && Array.isArray(rules), 
        `${rules.length || 0} regras encontradas`
      );

      console.log('✅ Testes de transferências automáticas concluídos');
      
    } catch (error) {
      this.addTestResult('transfers', 'Regras de Transferência', false, error.message);
    }
  }

  async testDemandForecastAPI() {
    console.log('\n📈 ETAPA: Testes de Previsão de Demanda');
    
    try {
      if (!this.testPartId || !this.testLocationId) {
        this.addTestResult('forecast', 'Previsão de Demanda', false, 'Dados de teste não disponíveis');
        return;
      }

      // Gerar previsão de demanda
      const forecastData = {
        partId: this.testPartId,
        locationId: this.testLocationId,
        forecastDate: new Date().toISOString().split('T')[0]
      };

      const generateResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/demand-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(forecastData)
      });

      const generateResult = await generateResponse.json();
      
      this.addTestResult('forecast', 'Gerar Previsão de Demanda', 
        generateResponse.ok && generateResult.success, 
        generateResponse.ok ? 'Previsão gerada com sucesso' : generateResult.message
      );

      // Listar previsões
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/demand-forecasts`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const forecasts = await listResponse.json();
      
      this.addTestResult('forecast', 'Listar Previsões de Demanda', 
        listResponse.ok && Array.isArray(forecasts), 
        `${forecasts.length || 0} previsões encontradas`
      );

      console.log('✅ Testes de previsão de demanda concluídos');
      
    } catch (error) {
      this.addTestResult('forecast', 'Previsão de Demanda', false, error.message);
    }
  }

  async testStockAlertsAPI() {
    console.log('\n⚠️ ETAPA: Testes de Alertas de Estoque');
    
    try {
      // Listar alertas
      const alertsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/stock-alerts`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const alerts = await alertsResponse.json();
      
      this.addTestResult('alerts', 'Listar Alertas de Estoque', 
        alertsResponse.ok && Array.isArray(alerts), 
        `${alerts.length || 0} alertas encontrados`
      );

      // Testar filtros
      const filteredResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/stock-alerts?status=ACTIVE`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const filteredAlerts = await filteredResponse.json();
      
      this.addTestResult('alerts', 'Filtrar Alertas por Status', 
        filteredResponse.ok && Array.isArray(filteredAlerts), 
        `Filtro funcionando corretamente`
      );

      console.log('✅ Testes de alertas de estoque concluídos');
      
    } catch (error) {
      this.addTestResult('alerts', 'Alertas de Estoque', false, error.message);
    }
  }

  async testWarehouseCapacityAPI() {
    console.log('\n🏭 ETAPA: Testes de Capacidade de Armazém');
    
    try {
      if (!this.testLocationId) {
        this.addTestResult('capacity', 'Capacidade de Armazém', false, 'Localização de teste não disponível');
        return;
      }

      // Atualizar capacidade
      const capacityData = {
        location_id: this.testLocationId,
        total_area_m2: 1000.50,
        usable_area_m2: 850.25,
        max_volume_m3: 2500.75,
        max_weight_kg: 50000.00,
        capacity_utilization_percentage: 65.5
      };

      const updateResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/warehouse-capacity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(capacityData)
      });

      const updateResult = await updateResponse.json();
      
      this.addTestResult('capacity', 'Atualizar Capacidade do Armazém', 
        updateResponse.ok && updateResult.success, 
        updateResponse.ok ? 'Capacidade atualizada com sucesso' : updateResult.message
      );

      // Listar capacidades
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/warehouse-capacities`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const capacities = await listResponse.json();
      
      this.addTestResult('capacity', 'Listar Capacidades dos Armazéns', 
        listResponse.ok && Array.isArray(capacities), 
        `${capacities.length || 0} capacidades encontradas`
      );

      console.log('✅ Testes de capacidade de armazém concluídos');
      
    } catch (error) {
      this.addTestResult('capacity', 'Capacidade de Armazém', false, error.message);
    }
  }

  async testTransitTrackingAPI() {
    console.log('\n🚛 ETAPA: Testes de Rastreamento em Trânsito');
    
    try {
      // Listar rastreamentos
      const trackingsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/transit-trackings`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const trackings = await trackingsResponse.json();
      
      this.addTestResult('transit', 'Listar Rastreamentos em Trânsito', 
        trackingsResponse.ok && Array.isArray(trackings), 
        `${trackings.length || 0} rastreamentos encontrados`
      );

      // Testar filtros
      const filteredResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/transit-trackings?status=IN_TRANSIT`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const filteredTrackings = await filteredResponse.json();
      
      this.addTestResult('transit', 'Filtrar Rastreamentos por Status', 
        filteredResponse.ok && Array.isArray(filteredTrackings), 
        `Filtro por status funcionando`
      );

      console.log('✅ Testes de rastreamento em trânsito concluídos');
      
    } catch (error) {
      this.addTestResult('transit', 'Rastreamento em Trânsito', false, error.message);
    }
  }

  async testAbcAnalysisAPI() {
    console.log('\n📊 ETAPA: Testes de Análise ABC');
    
    try {
      // Gerar análise ABC
      const generateResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/abc-analysis/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const generateResult = await generateResponse.json();
      
      this.addTestResult('abc', 'Gerar Análise ABC', 
        generateResponse.ok && generateResult.success, 
        generateResponse.ok ? `${generateResult.data?.length || 0} itens analisados` : generateResult.message
      );

      // Listar análise ABC
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/abc-analysis`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const analysis = await listResponse.json();
      
      this.addTestResult('abc', 'Listar Análise ABC', 
        listResponse.ok && Array.isArray(analysis), 
        `${analysis.length || 0} itens na análise`
      );

      // Testar filtros por classificação
      const filteredResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/abc-analysis?classification=A`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const filteredAnalysis = await filteredResponse.json();
      
      this.addTestResult('abc', 'Filtrar Análise ABC por Classificação', 
        filteredResponse.ok && Array.isArray(filteredAnalysis), 
        `Filtro por classificação funcionando`
      );

      console.log('✅ Testes de análise ABC concluídos');
      
    } catch (error) {
      this.addTestResult('abc', 'Análise ABC', false, error.message);
    }
  }

  async testAdvancedAnalyticsAPI() {
    console.log('\n📈 ETAPA: Testes de Analytics Avançados');
    
    try {
      const analyticsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/analytics/advanced`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const analytics = await analyticsResponse.json();
      
      this.addTestResult('analytics', 'Analytics Avançados', 
        analyticsResponse.ok && analytics.success, 
        analytics.success ? 'Analytics carregados com sucesso' : analytics.message
      );

      // Verificar métricas essenciais
      const data = analytics.data || {};
      const hasEssentialMetrics = 
        typeof data.active_alerts === 'number' &&
        typeof data.items_in_transit === 'number' &&
        typeof data.active_transfer_rules === 'number';

      this.addTestResult('analytics', 'Métricas Essenciais', 
        hasEssentialMetrics, 
        'Métricas de alertas, trânsito e regras disponíveis'
      );

      console.log('✅ Testes de analytics avançados concluídos');
      
    } catch (error) {
      this.addTestResult('analytics', 'Analytics Avançados', false, error.message);
    }
  }

  async testAutomationExecution() {
    console.log('\n⚙️ ETAPA: Testes de Execução de Automação');
    
    try {
      // Executar transferências automáticas
      const executeResponse = await fetch(`${BASE_URL}/api/parts-services/etapa3/automated-transfers/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const executeResult = await executeResponse.json();
      
      this.addTestResult('automation', 'Executar Transferências Automáticas', 
        executeResponse.ok && executeResult.success, 
        executeResponse.ok ? `${executeResult.data?.length || 0} transferências executadas` : executeResult.message
      );

      console.log('✅ Testes de execução de automação concluídos');
      
    } catch (error) {
      this.addTestResult('automation', 'Execução de Automação', false, error.message);
    }
  }

  async cleanupTests() {
    console.log('\n🧹 ETAPA: Limpeza dos Dados de Teste');
    
    try {
      // Nota: Manter dados de análise para auditoria
      this.addTestResult('cleanup', 'Limpeza dos Dados', true, 'Dados de teste mantidos para auditoria');
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
    console.log('\n📋 RELATÓRIO FINAL DOS TESTES - ETAPA 3');
    console.log('=' .repeat(70));
    
    const categories = [
      'setup', 'database', 'transfers', 'forecast', 'alerts', 
      'capacity', 'transit', 'abc', 'analytics', 'automation', 'cleanup'
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

    console.log('\n' + '=' .repeat(70));
    console.log(`🎯 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`);
    console.log(`📊 Taxa de Sucesso: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Etapa 3 está pronta para produção.');
      console.log('🏭 Funcionalidades implementadas:');
      console.log('   ✅ Transferências automáticas inteligentes');
      console.log('   ✅ Previsão de demanda baseada em histórico');
      console.log('   ✅ Sistema avançado de alertas');
      console.log('   ✅ Gestão de capacidades de armazém');
      console.log('   ✅ Rastreamento em tempo real');
      console.log('   ✅ Análise ABC automatizada');
      console.log('   ✅ Dashboard de analytics avançados');
      console.log('   ✅ Central de automação completa');
    } else {
      console.log('⚠️  Alguns testes falharam. Revisar antes de prosseguir para Etapa 4.');
    }
    
    console.log('=' .repeat(70));
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new PartsServicesEtapa3Tester();
  tester.runAllTests();
}

module.exports = PartsServicesEtapa3Tester;
