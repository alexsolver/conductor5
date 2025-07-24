
// TESTES AUTOMATIZADOS - ETAPA 1: LOCALIZAÇÕES E INVENTÁRIO MULTI-LOCALIZAÇÃO
const { Pool } = require('pg');

const TENANT_ID_TEST = '3f99462f-3621-4b1b-bea8-782acc50d62e';
const BASE_URL = 'http://localhost:5000';

// Configuração do banco para testes
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class PartsServicesEtapa1Tester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
    this.createdLocations = [];
    this.createdInventoryPositions = [];
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES - ETAPA 1: LOCALIZAÇÕES E INVENTÁRIO');
    console.log('=' .repeat(60));

    try {
      // 1. Setup e autenticação
      await this.setupTests();
      
      // 2. Testes de banco de dados
      await this.testDatabaseSchema();
      
      // 3. Testes de API - Localizações
      await this.testStockLocationsAPI();
      
      // 4. Testes de API - Inventário
      await this.testInventoryAPI();
      
      // 5. Testes de Dashboard
      await this.testDashboardStats();
      
      // 6. Testes de Alertas
      await this.testLowStockAlerts();
      
      // 7. Cleanup
      await this.cleanupTests();
      
      // 8. Relatório final
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO NOS TESTES:', error);
      process.exit(1);
    }
  }

  async setupTests() {
    console.log('\n📋 ETAPA: Setup e Autenticação');
    
    try {
      // Fazer login para obter token
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alex@conductor.com',
          password: 'senha123'
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Falha na autenticação');
      }

      const loginData = await loginResponse.json();
      this.authToken = loginData.token;
      
      this.addTestResult('setup', 'Autenticação', true, 'Token obtido com sucesso');
      console.log('✅ Autenticação realizada com sucesso');
      
    } catch (error) {
      this.addTestResult('setup', 'Autenticação', false, error.message);
      throw error;
    }
  }

  async testDatabaseSchema() {
    console.log('\n📊 ETAPA: Validação do Schema do Banco');
    
    try {
      // Verificar se as tabelas foram criadas
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND table_name IN ('stock_locations', 'inventory_multi_location');
      `;
      
      const tablesResult = await pool.query(tablesQuery);
      const tableNames = tablesResult.rows.map(row => row.table_name);
      
      this.addTestResult('database', 'Tabela stock_locations', 
        tableNames.includes('stock_locations'), 
        tableNames.includes('stock_locations') ? 'Tabela criada' : 'Tabela não encontrada'
      );
      
      this.addTestResult('database', 'Tabela inventory_multi_location', 
        tableNames.includes('inventory_multi_location'), 
        tableNames.includes('inventory_multi_location') ? 'Tabela criada' : 'Tabela não encontrada'
      );

      // Verificar índices
      const indexesQuery = `
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND indexname LIKE '%stock_locations%' OR indexname LIKE '%inventory_multi%';
      `;
      
      const indexesResult = await pool.query(indexesQuery);
      this.addTestResult('database', 'Índices criados', 
        indexesResult.rows.length >= 2, 
        `${indexesResult.rows.length} índices encontrados`
      );

      console.log('✅ Schema do banco validado');
      
    } catch (error) {
      this.addTestResult('database', 'Validação do Schema', false, error.message);
      throw error;
    }
  }

  async testStockLocationsAPI() {
    console.log('\n📍 ETAPA: Testes de API - Localizações de Estoque');
    
    try {
      // Teste 1: Criar localização
      const newLocation = {
        location_code: 'TEST001',
        location_name: 'Armazém de Teste',
        location_type: 'warehouse',
        address: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP'
      };

      const createResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/stock-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(newLocation)
      });

      const createResult = await createResponse.json();
      
      this.addTestResult('api', 'Criar Localização', 
        createResponse.ok && createResult.success, 
        createResponse.ok ? 'Localização criada com sucesso' : createResult.message
      );

      if (createResponse.ok) {
        this.createdLocations.push(createResult.data.id);
      }

      // Teste 2: Listar localizações
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/stock-locations`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const locations = await listResponse.json();
      
      this.addTestResult('api', 'Listar Localizações', 
        listResponse.ok && Array.isArray(locations), 
        `${locations.length || 0} localizações encontradas`
      );

      // Teste 3: Atualizar localização
      if (this.createdLocations.length > 0) {
        const updateResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/stock-locations/${this.createdLocations[0]}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({ location_name: 'Armazém Atualizado' })
        });

        const updateResult = await updateResponse.json();
        
        this.addTestResult('api', 'Atualizar Localização', 
          updateResponse.ok && updateResult.success, 
          updateResponse.ok ? 'Localização atualizada' : updateResult.message
        );
      }

      console.log('✅ Testes de API de Localizações concluídos');
      
    } catch (error) {
      this.addTestResult('api', 'Testes de Localizações', false, error.message);
      throw error;
    }
  }

  async testInventoryAPI() {
    console.log('\n📦 ETAPA: Testes de API - Inventário Multi-localização');
    
    try {
      // Primeiro, buscar uma peça existente
      const partsResponse = await fetch(`${BASE_URL}/api/parts-services/parts`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const parts = await partsResponse.json();
      
      if (!parts || parts.length === 0) {
        throw new Error('Nenhuma peça encontrada para testar inventário');
      }

      const testPart = parts[0];
      const testLocation = this.createdLocations[0];

      if (!testLocation) {
        throw new Error('Nenhuma localização disponível para teste');
      }

      // Teste 1: Criar posição de inventário
      const newInventory = {
        part_id: testPart.id,
        location_id: testLocation,
        current_quantity: 100,
        minimum_stock: 10,
        maximum_stock: 500,
        unit_cost: 25.50
      };

      const createInventoryResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/inventory-positions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(newInventory)
      });

      const createInventoryResult = await createInventoryResponse.json();
      
      this.addTestResult('inventory', 'Criar Posição de Inventário', 
        createInventoryResponse.ok && createInventoryResult.success, 
        createInventoryResponse.ok ? 'Posição criada com sucesso' : createInventoryResult.message
      );

      // Teste 2: Listar inventário por localização
      const listInventoryResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/inventory?locationId=${testLocation}`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const inventory = await listInventoryResponse.json();
      
      this.addTestResult('inventory', 'Listar Inventário por Localização', 
        listInventoryResponse.ok && Array.isArray(inventory), 
        `${inventory.length || 0} posições encontradas`
      );

      // Teste 3: Atualizar quantidade
      const updateQuantityResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/inventory/${testPart.id}/${testLocation}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ 
          quantity: 85, 
          reason: 'Teste de atualização' 
        })
      });

      const updateQuantityResult = await updateQuantityResponse.json();
      
      this.addTestResult('inventory', 'Atualizar Quantidade', 
        updateQuantityResponse.ok && updateQuantityResult.success, 
        updateQuantityResponse.ok ? 'Quantidade atualizada' : updateQuantityResult.message
      );

      console.log('✅ Testes de API de Inventário concluídos');
      
    } catch (error) {
      this.addTestResult('inventory', 'Testes de Inventário', false, error.message);
      console.error('❌ Erro nos testes de inventário:', error.message);
    }
  }

  async testDashboardStats() {
    console.log('\n📊 ETAPA: Testes de Dashboard');
    
    try {
      const statsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const stats = await statsResponse.json();
      
      this.addTestResult('dashboard', 'Estatísticas do Dashboard', 
        statsResponse.ok && stats.totalParts !== undefined, 
        statsResponse.ok ? `${stats.totalParts} peças, ${stats.totalLocations || 0} localizações` : 'Erro ao buscar stats'
      );

      console.log('✅ Testes de Dashboard concluídos');
      
    } catch (error) {
      this.addTestResult('dashboard', 'Testes de Dashboard', false, error.message);
    }
  }

  async testLowStockAlerts() {
    console.log('\n🚨 ETAPA: Testes de Alertas de Estoque Baixo');
    
    try {
      const alertsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa1/low-stock-alerts`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const alerts = await alertsResponse.json();
      
      this.addTestResult('alerts', 'Alertas de Estoque Baixo', 
        alertsResponse.ok && Array.isArray(alerts), 
        `${alerts.length || 0} alertas encontrados`
      );

      console.log('✅ Testes de Alertas concluídos');
      
    } catch (error) {
      this.addTestResult('alerts', 'Testes de Alertas', false, error.message);
    }
  }

  async cleanupTests() {
    console.log('\n🧹 ETAPA: Limpeza dos Dados de Teste');
    
    try {
      // Remover localizações criadas nos testes
      for (const locationId of this.createdLocations) {
        try {
          await fetch(`${BASE_URL}/api/parts-services/etapa1/stock-locations/${locationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.authToken}` }
          });
        } catch (error) {
          console.warn(`Não foi possível remover localização ${locationId}:`, error.message);
        }
      }

      this.addTestResult('cleanup', 'Limpeza dos Dados', true, 'Dados de teste removidos');
      console.log('✅ Limpeza concluída');
      
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
    console.log('\n📋 RELATÓRIO FINAL DOS TESTES');
    console.log('=' .repeat(60));
    
    const categories = ['setup', 'database', 'api', 'inventory', 'dashboard', 'alerts', 'cleanup'];
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

    console.log('\n' + '=' .repeat(60));
    console.log(`🎯 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`);
    console.log(`📊 Taxa de Sucesso: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Etapa 1 está pronta para produção.');
    } else {
      console.log('⚠️  Alguns testes falharam. Revisar antes de prosseguir.');
    }
    
    console.log('=' .repeat(60));
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new PartsServicesEtapa1Tester();
  tester.runAllTests();
}

module.exports = PartsServicesEtapa1Tester;
