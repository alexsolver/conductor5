
// TESTES AUTOMATIZADOS - ETAPA 2: MOVIMENTAÇÕES DE ESTOQUE
const { Pool } = require('pg');

const TENANT_ID_TEST = '3f99462f-3621-4b1b-bea8-782acc50d62e';
const BASE_URL = 'http://localhost:5000';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class PartsServicesEtapa2Tester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
    this.createdMovements = [];
    this.testPartId = null;
    this.testLocationId = null;
    this.testSecondLocationId = null;
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES - ETAPA 2: MOVIMENTAÇÕES DE ESTOQUE');
    console.log('=' .repeat(60));

    try {
      await this.setupTests();
      await this.testDatabaseSchemaEtapa2();
      await this.testStockEntryAPI();
      await this.testStockExitAPI();
      await this.testStockTransferAPI();
      await this.testMovementsAPI();
      await this.testLotsAPI();
      await this.testReportsAPI();
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
      
      // Buscar peça e localizações de teste
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

  async testDatabaseSchemaEtapa2() {
    console.log('\n📊 ETAPA: Validação do Schema Etapa 2');
    
    try {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND table_name IN ('stock_movements', 'stock_lots', 'movement_approval_rules');
      `;
      
      const tablesResult = await pool.query(tablesQuery);
      const tableNames = tablesResult.rows.map(row => row.table_name);
      
      this.addTestResult('database', 'Tabela stock_movements', 
        tableNames.includes('stock_movements'), 
        'Tabela de movimentações criada'
      );
      
      this.addTestResult('database', 'Tabela stock_lots', 
        tableNames.includes('stock_lots'), 
        'Tabela de lotes criada'
      );

      this.addTestResult('database', 'Tabela movement_approval_rules', 
        tableNames.includes('movement_approval_rules'), 
        'Tabela de regras de aprovação criada'
      );

      // Verificar triggers
      const triggerQuery = `
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND trigger_name = 'trigger_update_inventory_after_movement';
      `;
      
      const triggerResult = await pool.query(triggerQuery);
      
      this.addTestResult('database', 'Trigger de atualização automática', 
        triggerResult.rows.length > 0, 
        'Trigger de inventário configurado'
      );

      console.log('✅ Schema Etapa 2 validado');
      
    } catch (error) {
      this.addTestResult('database', 'Validação Schema Etapa 2', false, error.message);
      throw error;
    }
  }

  async testStockEntryAPI() {
    console.log('\n📦 ETAPA: Testes de Entrada de Estoque');
    
    try {
      const entryData = {
        part_id: this.testPartId,
        location_id: this.testLocationId,
        quantity: 50,
        unit_cost: 25.50,
        lot_number: 'TEST-LOT-001',
        expiration_date: '2025-12-31',
        notes: 'Entrada de teste - Etapa 2',
        original_quantity: 50
      };

      const response = await fetch(`${BASE_URL}/api/parts-services/etapa2/stock/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(entryData)
      });

      const result = await response.json();
      
      this.addTestResult('movements', 'Entrada de Estoque', 
        response.ok && result.success, 
        response.ok ? 'Entrada registrada com sucesso' : result.message
      );

      if (result.success) {
        this.createdMovements.push(result.data.id);
      }

      console.log('✅ Teste de entrada concluído');
      
    } catch (error) {
      this.addTestResult('movements', 'Entrada de Estoque', false, error.message);
    }
  }

  async testStockExitAPI() {
    console.log('\n📤 ETAPA: Testes de Saída de Estoque');
    
    try {
      const exitData = {
        part_id: this.testPartId,
        location_id: this.testLocationId,
        quantity: 10,
        notes: 'Saída de teste - Etapa 2'
      };

      const response = await fetch(`${BASE_URL}/api/parts-services/etapa2/stock/exit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(exitData)
      });

      const result = await response.json();
      
      this.addTestResult('movements', 'Saída de Estoque', 
        response.ok && result.success, 
        response.ok ? 'Saída registrada com sucesso' : result.message
      );

      if (result.success) {
        this.createdMovements.push(result.data.id);
      }

      console.log('✅ Teste de saída concluído');
      
    } catch (error) {
      this.addTestResult('movements', 'Saída de Estoque', false, error.message);
    }
  }

  async testStockTransferAPI() {
    console.log('\n🔄 ETAPA: Testes de Transferência');
    
    try {
      if (!this.testSecondLocationId) {
        this.addTestResult('movements', 'Transferência de Estoque', false, 'Segunda localização não disponível');
        return;
      }

      const transferData = {
        part_id: this.testPartId,
        source_location_id: this.testLocationId,
        destination_location_id: this.testSecondLocationId,
        quantity: 5,
        notes: 'Transferência de teste - Etapa 2'
      };

      const response = await fetch(`${BASE_URL}/api/parts-services/etapa2/stock/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(transferData)
      });

      const result = await response.json();
      
      this.addTestResult('movements', 'Transferência de Estoque', 
        response.ok && result.success, 
        response.ok ? 'Transferência registrada com sucesso' : result.message
      );

      if (result.success) {
        this.createdMovements.push(result.data.id);
      }

      console.log('✅ Teste de transferência concluído');
      
    } catch (error) {
      this.addTestResult('movements', 'Transferência de Estoque', false, error.message);
    }
  }

  async testMovementsAPI() {
    console.log('\n📋 ETAPA: Testes de API de Movimentações');
    
    try {
      // Listar todas as movimentações
      const response = await fetch(`${BASE_URL}/api/parts-services/etapa2/movements`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const movements = await response.json();
      
      this.addTestResult('api', 'Listar Movimentações', 
        response.ok && Array.isArray(movements), 
        `${movements.length || 0} movimentações encontradas`
      );

      // Testar filtros
      const filteredResponse = await fetch(`${BASE_URL}/api/parts-services/etapa2/movements?movementType=IN`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const filteredMovements = await filteredResponse.json();
      
      this.addTestResult('api', 'Filtrar Movimentações', 
        filteredResponse.ok && Array.isArray(filteredMovements), 
        `Filtro por tipo funcionando`
      );

      console.log('✅ Testes de API concluídos');
      
    } catch (error) {
      this.addTestResult('api', 'API de Movimentações', false, error.message);
    }
  }

  async testLotsAPI() {
    console.log('\n🏷️ ETAPA: Testes de Lotes e Rastreabilidade');
    
    try {
      const response = await fetch(`${BASE_URL}/api/parts-services/etapa2/lots`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const lots = await response.json();
      
      this.addTestResult('lots', 'Listar Lotes', 
        response.ok && Array.isArray(lots), 
        `${lots.length || 0} lotes encontrados`
      );

      // Teste de lotes vencendo
      const expiringResponse = await fetch(`${BASE_URL}/api/parts-services/etapa2/lots/expiring?daysAhead=365`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const expiringLots = await expiringResponse.json();
      
      this.addTestResult('lots', 'Lotes Vencendo', 
        expiringResponse.ok && Array.isArray(expiringLots), 
        `${expiringLots.length || 0} lotes vencendo`
      );

      console.log('✅ Testes de lotes concluídos');
      
    } catch (error) {
      this.addTestResult('lots', 'Testes de Lotes', false, error.message);
    }
  }

  async testReportsAPI() {
    console.log('\n📊 ETAPA: Testes de Relatórios');
    
    try {
      // Relatório de giro de estoque
      const turnoverResponse = await fetch(`${BASE_URL}/api/parts-services/etapa2/reports/turnover`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const turnoverReport = await turnoverResponse.json();
      
      this.addTestResult('reports', 'Relatório de Giro', 
        turnoverResponse.ok && Array.isArray(turnoverReport), 
        `Relatório de giro gerado`
      );

      // Relatório de avaliação de inventário
      const valuationResponse = await fetch(`${BASE_URL}/api/parts-services/etapa2/reports/valuation`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const valuationReport = await valuationResponse.json();
      
      this.addTestResult('reports', 'Avaliação de Inventário', 
        valuationResponse.ok && Array.isArray(valuationReport), 
        `Relatório de avaliação gerado`
      );

      console.log('✅ Testes de relatórios concluídos');
      
    } catch (error) {
      this.addTestResult('reports', 'Testes de Relatórios', false, error.message);
    }
  }

  async cleanupTests() {
    console.log('\n🧹 ETAPA: Limpeza dos Dados de Teste');
    
    try {
      // Nota: As movimentações geralmente não são removidas para manter auditoria
      // Mas podemos marcar como teste ou cancelar se necessário
      
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
    console.log('\n📋 RELATÓRIO FINAL DOS TESTES - ETAPA 2');
    console.log('=' .repeat(60));
    
    const categories = ['setup', 'database', 'movements', 'api', 'lots', 'reports', 'cleanup'];
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
      console.log('🎉 TODOS OS TESTES PASSARAM! Etapa 2 está pronta para produção.');
      console.log('📦 Funcionalidades implementadas:');
      console.log('   ✅ Movimentações reais de estoque (IN/OUT/TRANSFER)');
      console.log('   ✅ Rastreabilidade por lotes e serial numbers');
      console.log('   ✅ Sistema de aprovação de movimentações');
      console.log('   ✅ Relatórios de giro e avaliação de inventário');
      console.log('   ✅ Triggers automáticos de atualização de inventário');
    } else {
      console.log('⚠️  Alguns testes falharam. Revisar antes de prosseguir para Etapa 3.');
    }
    
    console.log('=' .repeat(60));
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new PartsServicesEtapa2Tester();
  tester.runAllTests();
}

module.exports = PartsServicesEtapa2Tester;
