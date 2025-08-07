
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';
const TENANT_ID = '3f99462f-3621-4b1b-bea8-782acc50d62e';

// Simulação de token de autenticação (substitua pelo token real)
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

async function testLPUApis() {
  console.log('🧪 TESTANDO APIs DO MÓDULO LPU\n');

  const tests = [
    {
      name: '📋 Listar Price Lists',
      method: 'GET',
      url: `${API_BASE}/api/materials-services/price-lists`,
      headers: {
        'Authorization': AUTH_TOKEN,
        'X-Tenant-ID': TENANT_ID,
        'Content-Type': 'application/json'
      }
    },
    {
      name: '📊 Estatísticas Price Lists',
      method: 'GET', 
      url: `${API_BASE}/api/materials-services/price-lists/stats`,
      headers: {
        'Authorization': AUTH_TOKEN,
        'X-Tenant-ID': TENANT_ID,
        'Content-Type': 'application/json'
      }
    },
    {
      name: '⚙️ Regras de Precificação',
      method: 'GET',
      url: `${API_BASE}/api/materials-services/pricing-rules`,
      headers: {
        'Authorization': AUTH_TOKEN,
        'X-Tenant-ID': TENANT_ID,
        'Content-Type': 'application/json'
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`🔍 Testando: ${test.name}`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: test.headers
      });

      const status = response.status;
      const statusText = response.statusText;
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }

      const result = {
        test: test.name,
        status,
        statusText,
        success: status >= 200 && status < 300,
        data: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) + '...' : data.substring(0, 200) + '...'
      };

      results.push(result);

      if (result.success) {
        console.log(`  ✅ Sucesso: ${status} ${statusText}`);
      } else {
        console.log(`  ❌ Erro: ${status} ${statusText}`);
        console.log(`  📄 Resposta: ${result.data}`);
      }

    } catch (error) {
      console.log(`  ❌ Erro de conexão: ${error.message}`);
      results.push({
        test: test.name,
        status: 0,
        statusText: 'Connection Error',
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  // Gerar relatório
  console.log('📊 RELATÓRIO DE TESTES APIs LPU');
  console.log('═══════════════════════════════════');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ Sucessos: ${successCount}/${totalCount}`);
  console.log(`❌ Falhas: ${totalCount - successCount}/${totalCount}`);
  console.log(`📈 Taxa de Sucesso: ${((successCount/totalCount) * 100).toFixed(1)}%`);

  if (successCount === totalCount) {
    console.log('\n🎉 TODAS AS APIs DO LPU ESTÃO FUNCIONAIS!');
  } else {
    console.log('\n⚠️ Algumas APIs precisam de correção.');
  }

  return results;
}

// Executar testes
testLPUApis().catch(console.error);
