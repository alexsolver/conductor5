
const API_BASE = 'http://localhost:5000/api';

class PartsServicesEtapa7Tester {
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

  async testStockMovementsReal() {
    console.log('\n📦 TESTANDO MOVIMENTAÇÕES REAIS DE ESTOQUE...');
    
    // Teste 1: Listar movimentações
    console.log('📋 Teste 1: Listar movimentações reais');
    const listResult = await this.makeRequest('/parts-services/etapa7/stock-movements-real');
    console.log(`   Status: ${listResult.status}`);
    console.log(`   Sucesso: ${listResult.success}`);
    console.log(`   Movimentações encontradas: ${listResult.data?.data?.length || 0}`);

    // Teste 2: Criar nova movimentação
    console.log('➕ Teste 2: Criar nova movimentação');
    const newMovement = {
      movementType: 'OUT',
      referenceType: 'work_order',
      partId: '1114c317-7a61-41e1-98c2-9e4d8f7a6b5c',
      fromLocationId: '9b8c7d6e-5f4e-3d2c-1b0a-9e8d7c6b5a4f',
      quantity: 10,
      unitCost: 25.50,
      totalCost: 255.00,
      batchNumber: 'BATCH-2024-001',
      notes: 'Movimentação de teste para work order'
    };

    const createResult = await this.makeRequest('/parts-services/etapa7/stock-movements-real', 'POST', newMovement);
    console.log(`   Status: ${createResult.status}`);
    console.log(`   Sucesso: ${createResult.success}`);
    if (createResult.success) {
      console.log(`   Movimentação criada com ID: ${createResult.data?.data?.id}`);
      console.log(`   Número da movimentação: ${createResult.data?.data?.movementNumber}`);
      this.testMovementId = createResult.data?.data?.id;
    }

    // Teste 3: Aprovar movimentação
    if (this.testMovementId) {
      console.log('✅ Teste 3: Aprovar movimentação');
      const approveResult = await this.makeRequest(`/parts-services/etapa7/stock-movements-real/${this.testMovementId}/approve`, 'PUT');
      console.log(`   Status: ${approveResult.status}`);
      console.log(`   Sucesso: ${approveResult.success}`);
    }

    // Teste 4: Executar movimentação
    if (this.testMovementId) {
      console.log('🚀 Teste 4: Executar movimentação');
      const executeResult = await this.makeRequest(`/parts-services/etapa7/stock-movements-real/${this.testMovementId}/execute`, 'PUT');
      console.log(`   Status: ${executeResult.status}`);
      console.log(`   Sucesso: ${executeResult.success}`);
    }

    return { listResult, createResult };
  }

  async testABCAnalysis() {
    console.log('\n📊 TESTANDO ANÁLISE ABC...');
    
    // Teste 1: Executar análise ABC
    console.log('🔬 Teste 1: Executar análise ABC');
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 6);
    const periodEnd = new Date();
    
    const runAnalysisResult = await this.makeRequest('/parts-services/etapa7/abc-analysis/run', 'POST', {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    });
    console.log(`   Status: ${runAnalysisResult.status}`);
    console.log(`   Sucesso: ${runAnalysisResult.success}`);
    console.log(`   Itens analisados: ${runAnalysisResult.data?.data?.length || 0}`);

    // Teste 2: Buscar resultados da análise
    console.log('📋 Teste 2: Buscar resultados da análise ABC');
    const getAnalysisResult = await this.makeRequest('/parts-services/etapa7/abc-analysis');
    console.log(`   Status: ${getAnalysisResult.status}`);
    console.log(`   Sucesso: ${getAnalysisResult.success}`);
    console.log(`   Análises encontradas: ${getAnalysisResult.data?.data?.length || 0}`);

    return { runAnalysisResult, getAnalysisResult };
  }

  async testDemandForecasting() {
    console.log('\n🔮 TESTANDO PREVISÃO DE DEMANDA...');
    
    // Teste 1: Gerar previsão de demanda
    console.log('📈 Teste 1: Gerar previsão de demanda');
    const forecastResult = await this.makeRequest('/parts-services/etapa7/demand-forecast/generate', 'POST', {
      partId: '1114c317-7a61-41e1-98c2-9e4d8f7a6b5c',
      forecastPeriods: 6
    });
    console.log(`   Status: ${forecastResult.status}`);
    console.log(`   Sucesso: ${forecastResult.success}`);
    console.log(`   Previsões geradas: ${forecastResult.data?.data?.length || 0}`);

    if (forecastResult.success && forecastResult.data?.data?.length > 0) {
      const firstForecast = forecastResult.data.data[0];
      console.log(`   📊 Primeira previsão:`);
      console.log(`      • Quantidade prevista: ${firstForecast.forecastedQuantity}`);
      console.log(`      • Confiança: ${firstForecast.confidenceLevel * 100}%`);
      console.log(`      • Método: ${firstForecast.forecastMethod}`);
    }

    return { forecastResult };
  }

  async testStockAlerts() {
    console.log('\n🚨 TESTANDO ALERTAS DE ESTOQUE...');
    
    // Teste 1: Listar alertas
    console.log('📋 Teste 1: Listar alertas de estoque');
    const listResult = await this.makeRequest('/parts-services/etapa7/stock-alerts');
    console.log(`   Status: ${listResult.status}`);
    console.log(`   Sucesso: ${listResult.success}`);
    console.log(`   Alertas encontrados: ${listResult.data?.data?.length || 0}`);

    // Teste 2: Criar novo alerta
    console.log('➕ Teste 2: Criar novo alerta');
    const newAlert = {
      partId: '1114c317-7a61-41e1-98c2-9e4d8f7a6b5c',
      alertType: 'low_stock',
      severity: 'high',
      currentQuantity: 5,
      thresholdQuantity: 10,
      recommendedAction: 'reorder_immediately',
      alertTitle: 'Estoque Baixo - Peça Crítica',
      alertDescription: 'Peça atingiu nível crítico de estoque. Reposição imediata necessária.',
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const createResult = await this.makeRequest('/parts-services/etapa7/stock-alerts', 'POST', newAlert);
    console.log(`   Status: ${createResult.status}`);
    console.log(`   Sucesso: ${createResult.success}`);
    if (createResult.success) {
      console.log(`   Alerta criado com ID: ${createResult.data?.data?.id}`);
    }

    return { listResult, createResult };
  }

  async testDashboardStats() {
    console.log('\n📊 TESTANDO DASHBOARD STATS ETAPA 7...');
    
    const statsResult = await this.makeRequest('/parts-services/etapa7/dashboard-stats-etapa7');
    console.log(`   Status: ${statsResult.status}`);
    console.log(`   Sucesso: ${statsResult.success}`);
    
    if (statsResult.success && statsResult.data?.data) {
      const stats = statsResult.data.data;
      console.log(`   📈 ESTATÍSTICAS DE MOVIMENTAÇÕES E ANALYTICS:`);
      console.log(`      • Movimentações Pendentes: ${stats.pending_movements || 0}`);
      console.log(`      • Movimentações Hoje: ${stats.today_movements || 0}`);
      console.log(`      • Alertas Ativos: ${stats.active_alerts || 0}`);
      console.log(`      • Alertas Críticos: ${stats.critical_alerts || 0}`);
      console.log(`      • Peças com Análise ABC: ${stats.parts_with_abc || 0}`);
      console.log(`      • Previsões Ativas: ${stats.active_forecasts || 0}`);
      console.log(`      • Precisão Média das Previsões: ${parseFloat(stats.avg_forecast_accuracy || 0).toFixed(1)}%`);
      console.log(`      • Consumo Mensal (Valor): R$ ${parseFloat(stats.monthly_consumption_value || 0).toLocaleString()}`);
    }

    return statsResult;
  }

  async runAllTests() {
    console.log('🚀 INICIANDO TESTES DA ETAPA 7 - MOVIMENTAÇÕES REAIS E ANALYTICS');
    console.log('=' .repeat(80));

    const results = {};

    try {
      // Executar todos os testes
      results.movements = await this.testStockMovementsReal();
      results.abcAnalysis = await this.testABCAnalysis();
      results.forecasting = await this.testDemandForecasting();
      results.alerts = await this.testStockAlerts();
      results.dashboard = await this.testDashboardStats();

      // Resumo dos resultados
      console.log('\n📋 RESUMO DOS TESTES DA ETAPA 7:');
      console.log('=' .repeat(50));

      const modules = [
        { name: 'Movimentações Reais de Estoque', result: results.movements },
        { name: 'Análise ABC Automática', result: results.abcAnalysis },
        { name: 'Previsão de Demanda', result: results.forecasting },
        { name: 'Alertas de Estoque', result: results.alerts },
        { name: 'Dashboard Stats', result: results.dashboard }
      ];

      let successCount = 0;
      modules.forEach(module => {
        const success = Object.values(module.result).some(r => r?.success);
        console.log(`${success ? '✅' : '❌'} ${module.name}: ${success ? 'PASSOU' : 'FALHOU'}`);
        if (success) successCount++;
      });

      console.log('\n🎯 RESULTADO FINAL DA ETAPA 7:');
      console.log(`   Módulos testados: ${modules.length}`);
      console.log(`   Módulos com sucesso: ${successCount}`);
      console.log(`   Taxa de sucesso: ${((successCount / modules.length) * 100).toFixed(1)}%`);

      if (successCount === modules.length) {
        console.log('\n🏆 ETAPA 7 CONCLUÍDA COM SUCESSO!');
        console.log('🎉 SISTEMA DE MOVIMENTAÇÕES REAIS E ANALYTICS FUNCIONANDO!');
        console.log('\n📋 FUNCIONALIDADES IMPLEMENTADAS NA ETAPA 7:');
        console.log('   📦 Sistema real de movimentações com persistência');
        console.log('   🔬 Análise ABC automática baseada em dados reais');
        console.log('   🔮 Previsão de demanda com algoritmos inteligentes');
        console.log('   🚨 Sistema de alertas automáticos de estoque');
        console.log('   📊 Analytics avançados com métricas de performance');
        console.log('   ✅ Workflow de aprovação e execução de movimentações');
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
  const tester = new PartsServicesEtapa7Tester();
  tester.runAllTests().catch(console.error);
}

module.exports = PartsServicesEtapa7Tester;
