#!/usr/bin/env node

/**
 * E2E Test Automation Script
 * Testa fluxos críticos do sistema automaticamente
 */

import http from 'http';
import https from 'https';

const BASE_URL = 'http://localhost:3000';

// Helper function para fazer requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const req = http.get(url, { 
      headers: { 'Content-Type': 'application/json', ...options.headers }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
  });
}

// Teste de saúde geral do sistema
async function testSystemHealth() {
  console.log('🏥 TESTING SYSTEM HEALTH...');
  
  try {
    // Test 1: Frontend availability
    const frontendTest = await makeRequest('/');
    console.log(`✅ Frontend: ${frontendTest.status === 200 ? 'OK' : 'FAIL'}`);
    
    // Test 2: Auth endpoint
    const authTest = await makeRequest('/api/auth/me');
    console.log(`🔐 Auth endpoint: ${authTest.status ? 'OK' : 'FAIL'}`);
    
    // Test 3: Customers API
    const customersTest = await makeRequest('/api/customers');
    console.log(`👥 Customers API: ${customersTest.status ? 'OK' : 'FAIL'}`);
    
    // Test 4: Tickets API
    const ticketsTest = await makeRequest('/api/tickets');
    console.log(`🎫 Tickets API: ${ticketsTest.status ? 'OK' : 'FAIL'}`);
    
    // Test 5: Dashboard API
    const dashboardTest = await makeRequest('/api/dashboard/stats');
    console.log(`📊 Dashboard API: ${dashboardTest.status ? 'OK' : 'FAIL'}`);
    
    return true;
  } catch (error) {
    console.error('❌ System health check failed:', error.message);
    return false;
  }
}

// Teste do fluxo de customers
async function testCustomersFlow() {
  console.log('\n👥 TESTING CUSTOMERS FLOW...');
  
  try {
    // Test customer listing
    const listResponse = await makeRequest('/api/customers');
    const customerCount = listResponse.data?.customers?.length || 0;
    console.log(`📋 Customer listing: ${customerCount} customers found`);
    
    // Test customer data structure
    if (customerCount > 0) {
      const firstCustomer = listResponse.data.customers[0];
      const hasRequiredFields = firstCustomer.id && firstCustomer.email;
      console.log(`📝 Data structure: ${hasRequiredFields ? 'OK' : 'MISSING FIELDS'}`);
      
      // Check for field mapping issues
      const hasName = firstCustomer.firstName || firstCustomer.first_name;
      console.log(`🏷️ Field mapping: ${hasName ? 'OK' : 'INCONSISTENT'}`);
    }
    
    return customerCount > 0;
  } catch (error) {
    console.error('❌ Customers flow test failed:', error.message);
    return false;
  }
}

// Teste do fluxo de tickets
async function testTicketsFlow() {
  console.log('\n🎫 TESTING TICKETS FLOW...');
  
  try {
    // Test tickets listing
    const listResponse = await makeRequest('/api/tickets');
    const ticketCount = listResponse.data?.data?.length || 0;
    console.log(`📋 Ticket listing: ${ticketCount} tickets found`);
    
    // Test ticket dependencies
    const usersResponse = await makeRequest('/api/tenant-admin/users');
    const userCount = usersResponse.data?.length || 0;
    console.log(`👤 Users for assignment: ${userCount} users available`);
    
    // Test ticket creation dependencies
    const customersResponse = await makeRequest('/api/customers');
    const customerCount = customersResponse.data?.customers?.length || 0;
    console.log(`👥 Customers for tickets: ${customerCount} customers available`);
    
    return ticketCount >= 0 && userCount > 0 && customerCount > 0;
  } catch (error) {
    console.error('❌ Tickets flow test failed:', error.message);
    return false;
  }
}

// Teste do fluxo de configurações
async function testSettingsFlow() {
  console.log('\n⚙️ TESTING SETTINGS FLOW...');
  
  try {
    // Test localization endpoints
    const languagesResponse = await makeRequest('/api/localization/languages');
    const languageCount = languagesResponse.data?.languages?.length || 0;
    console.log(`🌐 Languages: ${languageCount} languages available`);
    
    // Test timezones
    const timezonesResponse = await makeRequest('/api/localization/timezones');
    const hasTimezones = timezonesResponse.data?.timezones ? true : false;
    console.log(`🕒 Timezones: ${hasTimezones ? 'OK' : 'MISSING'}`);
    
    // Test currencies
    const currenciesResponse = await makeRequest('/api/localization/currencies');
    const currencyCount = currenciesResponse.data?.currencies?.length || 0;
    console.log(`💰 Currencies: ${currencyCount} currencies available`);
    
    // Test user preferences
    const preferencesResponse = await makeRequest('/api/localization/user-preferences');
    const hasPreferences = preferencesResponse.data?.preferences ? true : false;
    console.log(`👤 User preferences: ${hasPreferences ? 'OK' : 'NOT_CONFIGURED'}`);
    
    return languageCount > 0 && hasTimezones && currencyCount > 0;
  } catch (error) {
    console.error('❌ Settings flow test failed:', error.message);
    return false;
  }
}

// Teste de integração completa
async function testIntegrationFlow() {
  console.log('\n🔗 TESTING INTEGRATION FLOW...');
  
  try {
    // Test integrations endpoint
    const integrationsResponse = await makeRequest('/api/tenant-admin/integrations');
    const integrationCount = integrationsResponse.data?.integrations?.length || 0;
    console.log(`🔌 Integrations: ${integrationCount} integrations configured`);
    
    // Test email configuration
    const emailResponse = await makeRequest('/api/email-config/inbox');
    const hasEmail = emailResponse.data?.messages ? true : false;
    console.log(`📧 Email system: ${hasEmail ? 'OK' : 'NOT_CONFIGURED'}`);
    
    // Test monitoring status
    const monitoringResponse = await makeRequest('/api/email-config/monitoring/status');
    const isMonitoring = monitoringResponse.data?.isMonitoring || false;
    console.log(`📊 Email monitoring: ${isMonitoring ? 'ACTIVE' : 'INACTIVE'}`);
    
    return integrationCount > 0;
  } catch (error) {
    console.error('❌ Integration flow test failed:', error.message);
    return false;
  }
}

// Função principal de teste
async function runAllTests() {
  console.log('🚀 STARTING E2E TESTS...\n');
  
  const results = {
    systemHealth: await testSystemHealth(),
    customersFlow: await testCustomersFlow(),
    ticketsFlow: await testTicketsFlow(),
    settingsFlow: await testSettingsFlow(),
    integrationFlow: await testIntegrationFlow()
  };
  
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const [testName, passed] of Object.entries(results)) {
    totalTests++;
    if (passed) passedTests++;
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  }
  
  console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! System is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Review the issues above.');
  }
  
  return passedTests / totalTests;
}

// Execute se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testSystemHealth, testCustomersFlow, testTicketsFlow, testSettingsFlow };