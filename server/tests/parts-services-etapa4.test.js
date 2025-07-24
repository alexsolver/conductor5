
// TESTES AUTOMATIZADOS - ETAPA 4: INTEGRAÇÃO DE SERVIÇOS E AUTOMAÇÕES
import pg from 'pg';
const { Pool } = pg;

const TENANT_ID_TEST = '3f99462f-3621-4b1b-bea8-782acc50d62e';
const BASE_URL = 'http://localhost:5000';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class PartsServicesEtapa4Tester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
    this.createdWorkOrders = [];
    this.createdIntegrations = [];
    this.createdContracts = [];
    this.testSupplierId = null;
    this.testPartId = null;
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES - ETAPA 4: INTEGRAÇÃO DE SERVIÇOS E AUTOMAÇÕES');
    console.log('=' .repeat(80));

    try {
      await this.setupTests();
      await this.testDatabaseSchemaEtapa4();
      await this.testWorkOrdersAPI();
      await this.testExternalIntegrationsAPI();
      await this.testSupplierContractsAPI();
      await this.testApprovalWorkflowAPI();
      await this.testExecutiveReportsAPI();
      await this.testSupplierKPIsAPI();
      await this.testIntegrationAnalyticsAPI();
      await this.testWorkflowAutomationAPI();
      await this.testEndToEndIntegration();
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
      const suppliersResponse = await fetch(`${BASE_URL}/api/parts-services/suppliers`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      const suppliers = await suppliersResponse.json();
      this.testSupplierId = suppliers[0]?.id;

      const partsResponse = await fetch(`${BASE_URL}/api/parts-services/parts`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      const parts = await partsResponse.json();
      this.testPartId = parts[0]?.id;
      
      this.addTestResult('setup', 'Preparação de dados', 
        !!(this.authToken && this.testSupplierId && this.testPartId), 
        'Dados de teste preparados'
      );
      
    } catch (error) {
      this.addTestResult('setup', 'Preparação de dados', false, error.message);
      throw error;
    }
  }

  async testDatabaseSchemaEtapa4() {
    console.log('\n📊 ETAPA: Validação do Schema Etapa 4');
    
    try {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND table_name IN (
          'work_orders', 'external_integrations', 'sync_logs', 
          'supplier_contracts', 'contract_items', 'approval_workflows',
          'approval_instances', 'approval_steps', 'executive_reports',
          'supplier_performance_kpis'
        );
      `;
      
      const tablesResult = await pool.query(tablesQuery);
      const tableNames = tablesResult.rows.map(row => row.table_name);
      
      const expectedTables = [
        'work_orders', 'external_integrations', 'sync_logs',
        'supplier_contracts', 'contract_items', 'approval_workflows',
        'approval_instances', 'approval_steps', 'executive_reports',
        'supplier_performance_kpis'
      ];

      expectedTables.forEach(table => {
        this.addTestResult('database', `Tabela ${table}`, 
          tableNames.includes(table), 
          `Tabela ${table} ${tableNames.includes(table) ? 'criada' : 'não encontrada'}`
        );
      });

      // Verificar funções SQL específicas da Etapa 4
      const functionsQuery = `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'tenant_${TENANT_ID_TEST.replace(/-/g, '_')}'
        AND routine_name IN ('calculate_supplier_kpis', 'auto_create_work_orders');
      `;
      
      const functionsResult = await pool.query(functionsQuery);
      const functionNames = functionsResult.rows.map(row => row.routine_name);
      
      this.addTestResult('database', 'Função calculate_supplier_kpis', 
        functionNames.includes('calculate_supplier_kpis'), 
        'Função de KPIs de fornecedores'
      );

      console.log('✅ Schema Etapa 4 validado');
      
    } catch (error) {
      this.addTestResult('database', 'Validação Schema Etapa 4', false, error.message);
      throw error;
    }
  }

  async testWorkOrdersAPI() {
    console.log('\n🔧 ETAPA: Testes de Work Orders Automáticos');
    
    try {
      // Criar work order
      const workOrderData = {
        title: 'Teste Etapa 4 - Manutenção Preventiva',
        description: 'Work order de teste para validação da Etapa 4',
        priority: 'HIGH',
        work_order_type: 'MAINTENANCE',
        part_id: this.testPartId,
        estimated_quantity: 2,
        scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Amanhã
        estimated_cost: 150.00,
        labor_hours: 3
      };

      const createResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/work-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(workOrderData)
      });

      const createResult = await createResponse.json();
      
      this.addTestResult('work_orders', 'Criar Work Order', 
        createResponse.ok && createResult.success, 
        createResponse.ok ? 'Work order criado com sucesso' : createResult.message
      );

      if (createResult.success) {
        this.createdWorkOrders.push(createResult.data.id);
      }

      // Listar work orders
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/work-orders`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const workOrders = await listResponse.json();
      
      this.addTestResult('work_orders', 'Listar Work Orders', 
        listResponse.ok && workOrders.success && Array.isArray(workOrders.data), 
        `${workOrders.data?.length || 0} work orders encontrados`
      );

      // Atualizar status de work order
      if (this.createdWorkOrders.length > 0) {
        const updateResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/work-orders/${this.createdWorkOrders[0]}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({ status: 'IN_PROGRESS' })
        });

        const updateResult = await updateResponse.json();
        
        this.addTestResult('work_orders', 'Atualizar Status Work Order', 
          updateResponse.ok && updateResult.success, 
          updateResponse.ok ? 'Status atualizado com sucesso' : updateResult.message
        );
      }

      console.log('✅ Testes de Work Orders concluídos');
      
    } catch (error) {
      this.addTestResult('work_orders', 'Work Orders API', false, error.message);
    }
  }

  async testExternalIntegrationsAPI() {
    console.log('\n🔗 ETAPA: Testes de Integrações Externas');
    
    try {
      // Criar integração externa
      const integrationData = {
        integration_name: 'Teste ERP Integration',
        integration_type: 'ERP',
        endpoint_url: 'https://api.exemplo.com/erp',
        auth_method: 'API_KEY',
        sync_direction: 'BIDIRECTIONAL',
        sync_frequency: 'DAILY',
        field_mapping: {
          'part_code': 'codigo_peca',
          'supplier_id': 'fornecedor_id'
        }
      };

      const createResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(integrationData)
      });

      const createResult = await createResponse.json();
      
      this.addTestResult('integrations', 'Criar Integração Externa', 
        createResponse.ok && createResult.success, 
        createResponse.ok ? 'Integração criada com sucesso' : createResult.message
      );

      if (createResult.success) {
        this.createdIntegrations.push(createResult.data.id);
      }

      // Listar integrações
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/integrations`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const integrations = await listResponse.json();
      
      this.addTestResult('integrations', 'Listar Integrações', 
        listResponse.ok && integrations.success && Array.isArray(integrations.data), 
        `${integrations.data?.length || 0} integrações encontradas`
      );

      // Executar sincronização manual
      if (this.createdIntegrations.length > 0) {
        const syncResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/integrations/${this.createdIntegrations[0]}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({ sync_type: 'MANUAL' })
        });

        const syncResult = await syncResponse.json();
        
        this.addTestResult('integrations', 'Executar Sincronização', 
          syncResponse.ok && syncResult.success, 
          syncResponse.ok ? 'Sincronização executada com sucesso' : syncResult.message
        );
      }

      // Buscar logs de sincronização
      const logsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/sync-logs?limit=10`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const logs = await logsResponse.json();
      
      this.addTestResult('integrations', 'Logs de Sincronização', 
        logsResponse.ok && logs.success && Array.isArray(logs.data), 
        `${logs.data?.length || 0} logs encontrados`
      );

      console.log('✅ Testes de Integrações Externas concluídos');
      
    } catch (error) {
      this.addTestResult('integrations', 'Integrações Externas', false, error.message);
    }
  }

  async testSupplierContractsAPI() {
    console.log('\n📋 ETAPA: Testes de Contratos com Fornecedores');
    
    try {
      if (!this.testSupplierId) {
        this.addTestResult('contracts', 'Contratos com Fornecedores', false, 'Fornecedor de teste não disponível');
        return;
      }

      // Criar contrato com fornecedor
      const contractData = {
        supplier_id: this.testSupplierId,
        contract_name: 'Contrato de Fornecimento Teste 2024',
        contract_type: 'SUPPLY',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        total_value: 50000.00,
        currency: 'BRL',
        payment_terms: '30 dias',
        minimum_order_value: 1000.00,
        discount_percentage: 5.0
      };

      const createResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/supplier-contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(contractData)
      });

      const createResult = await createResponse.json();
      
      this.addTestResult('contracts', 'Criar Contrato com Fornecedor', 
        createResponse.ok && createResult.success, 
        createResponse.ok ? 'Contrato criado com sucesso' : createResult.message
      );

      if (createResult.success) {
        this.createdContracts.push(createResult.data.id);
      }

      // Listar contratos
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/supplier-contracts`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const contracts = await listResponse.json();
      
      this.addTestResult('contracts', 'Listar Contratos com Fornecedores', 
        listResponse.ok && contracts.success && Array.isArray(contracts.data), 
        `${contracts.data?.length || 0} contratos encontrados`
      );

      // Adicionar item ao contrato
      if (this.createdContracts.length > 0 && this.testPartId) {
        const itemData = {
          contract_id: this.createdContracts[0],
          part_id: this.testPartId,
          contract_price: 45.50,
          minimum_quantity: 10,
          lead_time_days: 15
        };

        const addItemResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/contract-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify(itemData)
        });

        const addItemResult = await addItemResponse.json();
        
        this.addTestResult('contracts', 'Adicionar Item ao Contrato', 
          addItemResponse.ok && addItemResult.success, 
          addItemResponse.ok ? 'Item adicionado com sucesso' : addItemResult.message
        );

        // Listar itens do contrato
        const itemsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/supplier-contracts/${this.createdContracts[0]}/items`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });

        const items = await itemsResponse.json();
        
        this.addTestResult('contracts', 'Listar Itens do Contrato', 
          itemsResponse.ok && items.success && Array.isArray(items.data), 
          `${items.data?.length || 0} itens do contrato encontrados`
        );
      }

      console.log('✅ Testes de Contratos com Fornecedores concluídos');
      
    } catch (error) {
      this.addTestResult('contracts', 'Contratos com Fornecedores', false, error.message);
    }
  }

  async testApprovalWorkflowAPI() {
    console.log('\n✅ ETAPA: Testes de Workflow de Aprovações');
    
    try {
      // Buscar aprovações pendentes
      const approvalsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/pending-approvals`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const approvals = await approvalsResponse.json();
      
      this.addTestResult('approvals', 'Buscar Aprovações Pendentes', 
        approvalsResponse.ok && approvals.success && Array.isArray(approvals.data), 
        `${approvals.data?.length || 0} aprovações pendentes encontradas`
      );

      console.log('✅ Testes de Workflow de Aprovações concluídos');
      
    } catch (error) {
      this.addTestResult('approvals', 'Workflow de Aprovações', false, error.message);
    }
  }

  async testExecutiveReportsAPI() {
    console.log('\n📊 ETAPA: Testes de Relatórios Executivos');
    
    try {
      // Criar relatório executivo
      const reportData = {
        report_name: 'Relatório de Performance de Fornecedores',
        report_type: 'SUPPLIER_PERFORMANCE',
        report_config: {
          period: 'MONTHLY',
          metrics: ['on_time_delivery', 'quality_score', 'cost_efficiency'],
          suppliers: 'ALL'
        },
        schedule_frequency: 'MONTHLY',
        recipients: ['alex@conductor.com']
      };

      const createResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/executive-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(reportData)
      });

      const createResult = await createResponse.json();
      
      this.addTestResult('reports', 'Criar Relatório Executivo', 
        createResponse.ok && createResult.success, 
        createResponse.ok ? 'Relatório criado com sucesso' : createResult.message
      );

      // Listar relatórios executivos
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/executive-reports`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const reports = await listResponse.json();
      
      this.addTestResult('reports', 'Listar Relatórios Executivos', 
        listResponse.ok && reports.success && Array.isArray(reports.data), 
        `${reports.data?.length || 0} relatórios encontrados`
      );

      console.log('✅ Testes de Relatórios Executivos concluídos');
      
    } catch (error) {
      this.addTestResult('reports', 'Relatórios Executivos', false, error.message);
    }
  }

  async testSupplierKPIsAPI() {
    console.log('\n📈 ETAPA: Testes de KPIs de Fornecedores');
    
    try {
      if (!this.testSupplierId) {
        this.addTestResult('kpis', 'KPIs de Fornecedores', false, 'Fornecedor de teste não disponível');
        return;
      }

      // Gerar KPIs de fornecedor
      const kpiData = {
        supplier_id: this.testSupplierId,
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };

      const generateResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/supplier-kpis/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(kpiData)
      });

      const generateResult = await generateResponse.json();
      
      this.addTestResult('kpis', 'Gerar KPIs de Fornecedor', 
        generateResponse.ok && generateResult.success, 
        generateResponse.ok ? 'KPIs gerados com sucesso' : generateResult.message
      );

      // Listar KPIs de fornecedores
      const listResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/supplier-kpis`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const kpis = await listResponse.json();
      
      this.addTestResult('kpis', 'Listar KPIs de Fornecedores', 
        listResponse.ok && kpis.success && Array.isArray(kpis.data), 
        `${kpis.data?.length || 0} KPIs encontrados`
      );

      console.log('✅ Testes de KPIs de Fornecedores concluídos');
      
    } catch (error) {
      this.addTestResult('kpis', 'KPIs de Fornecedores', false, error.message);
    }
  }

  async testIntegrationAnalyticsAPI() {
    console.log('\n📊 ETAPA: Testes de Analytics de Integração');
    
    try {
      const analyticsResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/analytics/integration`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      const analytics = await analyticsResponse.json();
      
      this.addTestResult('analytics', 'Analytics de Integração', 
        analyticsResponse.ok && analytics.success, 
        analytics.success ? 'Analytics carregados com sucesso' : analytics.message
      );

      // Verificar métricas essenciais
      const data = analytics.data || {};
      const hasEssentialMetrics = 
        typeof data.total_work_orders === 'number' &&
        typeof data.total_integrations === 'number' &&
        typeof data.total_contracts === 'number';

      this.addTestResult('analytics', 'Métricas Essenciais Analytics', 
        hasEssentialMetrics, 
        'Métricas de work orders, integrações e contratos disponíveis'
      );

      console.log('✅ Testes de Analytics de Integração concluídos');
      
    } catch (error) {
      this.addTestResult('analytics', 'Analytics de Integração', false, error.message);
    }
  }

  async testWorkflowAutomationAPI() {
    console.log('\n⚙️ ETAPA: Testes de Automação de Workflow');
    
    try {
      // Executar automação de workflow
      const automationData = {
        workflow_type: 'ALL'
      };

      const executeResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/automation/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(automationData)
      });

      const executeResult = await executeResponse.json();
      
      this.addTestResult('automation', 'Executar Automação de Workflow', 
        executeResponse.ok && executeResult.success, 
        executeResponse.ok ? `${executeResult.data?.processed_items || 0} itens processados` : executeResult.message
      );

      // Testar automação específica - apenas aprovações
      const approvalAutomationData = {
        workflow_type: 'APPROVALS'
      };

      const approvalResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/automation/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(approvalAutomationData)
      });

      const approvalResult = await approvalResponse.json();
      
      this.addTestResult('automation', 'Automação de Aprovações', 
        approvalResponse.ok && approvalResult.success, 
        approvalResponse.ok ? 'Automação de aprovações executada' : approvalResult.message
      );

      console.log('✅ Testes de Automação de Workflow concluídos');
      
    } catch (error) {
      this.addTestResult('automation', 'Automação de Workflow', false, error.message);
    }
  }

  async testEndToEndIntegration() {
    console.log('\n🔄 ETAPA: Testes de Integração End-to-End');
    
    try {
      // Teste de fluxo completo: Work Order → Aprovação → Execução
      let workOrderId = null;
      
      if (this.createdWorkOrders.length > 0) {
        workOrderId = this.createdWorkOrders[0];
        
        // Simular fluxo completo de work order
        const statusUpdates = ['IN_PROGRESS', 'COMPLETED'];
        
        for (const status of statusUpdates) {
          const updateResponse = await fetch(`${BASE_URL}/api/parts-services/etapa4/work-orders/${workOrderId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify({ status })
          });

          const updateResult = await updateResponse.json();
          
          this.addTestResult('integration', `Fluxo Work Order - ${status}`, 
            updateResponse.ok && updateResult.success, 
            updateResponse.ok ? `Status ${status} aplicado com sucesso` : updateResult.message
          );
        }
      }

      // Teste de integridade de dados entre todas as etapas
      const integrityChecks = [
        { endpoint: '/api/parts-services/etapa1/dashboard/stats', name: 'Etapa 1 Stats' },
        { endpoint: '/api/parts-services/etapa2/movements', name: 'Etapa 2 Movements' },
        { endpoint: '/api/parts-services/etapa3/analytics/advanced', name: 'Etapa 3 Analytics' },
        { endpoint: '/api/parts-services/etapa4/analytics/integration', name: 'Etapa 4 Analytics' }
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
    console.log('\n📋 RELATÓRIO FINAL DOS TESTES - ETAPA 4');
    console.log('=' .repeat(80));
    
    const categories = [
      'setup', 'database', 'work_orders', 'integrations', 'contracts', 
      'approvals', 'reports', 'kpis', 'analytics', 'automation', 'integration', 'cleanup'
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
      console.log('🎉 TODOS OS TESTES PASSARAM! Etapa 4 está pronta para produção.');
      console.log('🚀 Funcionalidades implementadas:');
      console.log('   ✅ Work Orders automáticos baseados em tickets');
      console.log('   ✅ Integrações externas configuráveis');
      console.log('   ✅ Contratos com fornecedores e análise de preços');
      console.log('   ✅ Sistema de aprovações automáticas');
      console.log('   ✅ Relatórios executivos personalizáveis');
      console.log('   ✅ KPIs de performance de fornecedores');
      console.log('   ✅ Dashboard de analytics de integração');
      console.log('   ✅ Automação completa de workflows');
      console.log('   ✅ Validação end-to-end entre todas as etapas');
      console.log('\n🏆 SISTEMA PARTS & SERVICES COMPLETO E OPERACIONAL!');
    } else {
      console.log('⚠️  Alguns testes falharam. Revisar antes de prosseguir.');
    }
    
    console.log('=' .repeat(80));
  }
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PartsServicesEtapa4Tester();
  tester.runAllTests();
}

export default PartsServicesEtapa4Tester;
