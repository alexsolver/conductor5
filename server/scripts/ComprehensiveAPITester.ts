
import { createClient } from '@supabase/supabase-js';
import { sql } from 'drizzle-orm';
import { db } from '../db';

interface TestResult {
  module: string;
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  responseTime: number;
  statusCode: number;
  error?: string;
  dataIntegrity: boolean;
  schemaCompliance: boolean;
}

interface TestSuite {
  module: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  results: TestResult[];
}

class ComprehensiveAPITester {
  private results: TestSuite[] = [];
  private baseURL = 'http://localhost:5000';
  private authToken = '';
  private tenantId = '3f99462f-3621-4b1b-bea8-782acc50d62e';

  constructor() {
    console.log('🔧 [API-TESTER] Initializing Comprehensive API Testing System');
  }

  async setupAuthentication(): Promise<void> {
    try {
      console.log('🔐 [AUTH-SETUP] Setting up authentication for testing...');
      
      const authResponse = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'alex@lansolver.com',
          password: 'password123'
        })
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        this.authToken = authData.token || authData.data?.token || '';
        console.log('✅ [AUTH-SETUP] Authentication successful');
      } else {
        console.log('⚠️ [AUTH-SETUP] Using mock token for testing');
        this.authToken = 'test-token-123';
      }
    } catch (error) {
      console.log('⚠️ [AUTH-SETUP] Auth setup failed, using mock token');
      this.authToken = 'test-token-123';
    }
  }

  async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { message: 'No JSON response' };
      }

      const result: TestResult = {
        module: this.extractModuleFromEndpoint(endpoint),
        endpoint,
        method,
        status: response.ok ? 'PASS' : 'FAIL',
        responseTime,
        statusCode: response.status,
        dataIntegrity: this.validateDataIntegrity(responseData),
        schemaCompliance: this.validateSchemaCompliance(responseData),
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${responseData.message || 'Unknown error'}`;
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      return {
        module: this.extractModuleFromEndpoint(endpoint),
        endpoint,
        method,
        status: 'FAIL',
        responseTime: endTime - startTime,
        statusCode: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        dataIntegrity: false,
        schemaCompliance: false,
      };
    }
  }

  private extractModuleFromEndpoint(endpoint: string): string {
    const parts = endpoint.split('/');
    return parts[2] || 'unknown'; // /api/[module]/...
  }

  private validateDataIntegrity(data: any): boolean {
    if (!data) return false;
    
    // Verificar estrutura básica de resposta
    if (typeof data === 'object') {
      return data.hasOwnProperty('success') || data.hasOwnProperty('data') || Array.isArray(data);
    }
    
    return false;
  }

  private validateSchemaCompliance(data: any): boolean {
    if (!data) return false;
    
    // Verificar se segue padrão de resposta da API
    if (data.success !== undefined) {
      return typeof data.success === 'boolean';
    }
    
    return true; // Assume compliance if no specific structure
  }

  async testTicketsModule(): Promise<TestSuite> {
    console.log('🎫 [TICKETS-TEST] Testing Tickets Module APIs...');
    
    const suite: TestSuite = {
      module: 'tickets',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const ticketEndpoints = [
      // Core ticket operations
      { endpoint: '/api/tickets', method: 'GET' },
      { endpoint: '/api/tickets/urgent', method: 'GET' },
      
      // Ticket configuration
      { endpoint: '/api/ticket-config/categories', method: 'GET' },
      { endpoint: '/api/ticket-config/subcategories', method: 'GET' },
      { endpoint: '/api/ticket-config/actions', method: 'GET' },
      { endpoint: '/api/ticket-config/field-options', method: 'GET' },
      { endpoint: '/api/ticket-config/numbering', method: 'GET' },
      
      // Ticket views
      { endpoint: '/api/ticket-views', method: 'GET' },
      { endpoint: '/api/ticket-views/user/preferences', method: 'GET' },
      
      // Ticket relationships
      { endpoint: '/api/tickets/with-relationships', method: 'GET' },
      
      // Test specific ticket if exists
      { endpoint: '/api/tickets/e58325c6-f124-4dcc-be5c-02e6cd70fcfe', method: 'GET' },
      { endpoint: '/api/tickets/e58325c6-f124-4dcc-be5c-02e6cd70fcfe/relationships', method: 'GET' },
    ];

    for (const { endpoint, method } of ticketEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    // Test ticket creation
    const createTicketResult = await this.testTicketCreation();
    suite.results.push(createTicketResult);
    suite.totalTests++;
    if (createTicketResult.status === 'PASS') suite.passed++;
    else if (createTicketResult.status === 'FAIL') suite.failed++;
    else suite.warnings++;

    this.results.push(suite);
    return suite;
  }

  async testTicketCreation(): Promise<TestResult> {
    const createTicketData = {
      subject: 'Test Ticket - API Testing',
      description: 'Test ticket created by automated API testing system',
      priority: 'medium',
      status: 'open',
      category: 'Hardware',
      customerId: this.tenantId,
      assignedToId: '550e8400-e29b-41d4-a716-446655440001'
    };

    return await this.makeRequest('/api/tickets', 'POST', createTicketData);
  }

  async testCustomersModule(): Promise<TestSuite> {
    console.log('👥 [CUSTOMERS-TEST] Testing Customers Module APIs...');
    
    const suite: TestSuite = {
      module: 'customers',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const customerEndpoints = [
      { endpoint: '/api/customers', method: 'GET' },
      { endpoint: '/api/customers/companies', method: 'GET' },
      { endpoint: '/api/customers/customer-companies', method: 'GET' },
    ];

    for (const { endpoint, method } of customerEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    this.results.push(suite);
    return suite;
  }

  async testBeneficiariesModule(): Promise<TestSuite> {
    console.log('👤 [BENEFICIARIES-TEST] Testing Beneficiaries Module APIs...');
    
    const suite: TestSuite = {
      module: 'beneficiaries',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const beneficiariesEndpoints = [
      { endpoint: '/api/beneficiaries', method: 'GET' },
    ];

    for (const { endpoint, method } of beneficiariesEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    this.results.push(suite);
    return suite;
  }

  async testMaterialsServicesModule(): Promise<TestSuite> {
    console.log('📦 [MATERIALS-TEST] Testing Materials & Services Module APIs...');
    
    const suite: TestSuite = {
      module: 'materials-services',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const materialsEndpoints = [
      { endpoint: '/api/materials-services/items', method: 'GET' },
      { endpoint: '/api/materials-services/tickets/e58325c6-f124-4dcc-be5c-02e6cd70fcfe/available-for-consumption', method: 'GET' },
      { endpoint: '/api/materials-services/tickets/e58325c6-f124-4dcc-be5c-02e6cd70fcfe/planned-items', method: 'GET' },
      { endpoint: '/api/materials-services/tickets/e58325c6-f124-4dcc-be5c-02e6cd70fcfe/consumed-items', method: 'GET' },
      { endpoint: '/api/materials-services/tickets/e58325c6-f124-4dcc-be5c-02e6cd70fcfe/costs-summary', method: 'GET' },
    ];

    for (const { endpoint, method } of materialsEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    this.results.push(suite);
    return suite;
  }

  async testLocationsModule(): Promise<TestSuite> {
    console.log('📍 [LOCATIONS-TEST] Testing Locations Module APIs...');
    
    const suite: TestSuite = {
      module: 'locations',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const locationsEndpoints = [
      { endpoint: '/api/locations-new/regiao', method: 'GET' },
      { endpoint: '/api/locations-new/trecho', method: 'GET' },
      { endpoint: '/api/locations-new/local', method: 'GET' },
      { endpoint: '/api/locations-new/rota-dinamica', method: 'GET' },
      { endpoint: '/api/locations-new/rota-trecho', method: 'GET' },
    ];

    for (const { endpoint, method } of locationsEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    this.results.push(suite);
    return suite;
  }

  async testTimecardModule(): Promise<TestSuite> {
    console.log('⏰ [TIMECARD-TEST] Testing Timecard Module APIs...');
    
    const suite: TestSuite = {
      module: 'timecard',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const timecardEndpoints = [
      { endpoint: '/api/timecard/current-status', method: 'GET' },
      { endpoint: '/api/timecard/work-schedules', method: 'GET' },
    ];

    for (const { endpoint, method } of timecardEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    this.results.push(suite);
    return suite;
  }

  async testTenantAdminModule(): Promise<TestSuite> {
    console.log('🏢 [TENANT-ADMIN-TEST] Testing Tenant Admin Module APIs...');
    
    const suite: TestSuite = {
      module: 'tenant-admin',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const tenantAdminEndpoints = [
      { endpoint: '/api/tenant-admin/users', method: 'GET' },
      { endpoint: '/api/tenant-admin/integrations', method: 'GET' },
    ];

    for (const { endpoint, method } of tenantAdminEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    this.results.push(suite);
    return suite;
  }

  async testCustomFieldsModule(): Promise<TestSuite> {
    console.log('🔧 [CUSTOM-FIELDS-TEST] Testing Custom Fields Module APIs...');
    
    const suite: TestSuite = {
      module: 'custom-fields',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const customFieldsEndpoints = [
      { endpoint: '/api/custom-fields/fields', method: 'GET' },
    ];

    for (const { endpoint, method } of customFieldsEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    this.results.push(suite);
    return suite;
  }

  async testInternalFormsModule(): Promise<TestSuite> {
    console.log('📋 [INTERNAL-FORMS-TEST] Testing Internal Forms Module APIs...');
    
    const suite: TestSuite = {
      module: 'internal-forms',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };

    const internalFormsEndpoints = [
      { endpoint: '/api/internal-forms/forms', method: 'GET' },
    ];

    for (const { endpoint, method } of internalFormsEndpoints) {
      const result = await this.makeRequest(endpoint, method);
      suite.results.push(result);
      suite.totalTests++;
      
      if (result.status === 'PASS') suite.passed++;
      else if (result.status === 'FAIL') suite.failed++;
      else suite.warnings++;
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${method} ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
    }

    this.results.push(suite);
    return suite;
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 [API-TESTER] Starting Comprehensive API Testing...');
    console.log('================================================================================');
    
    await this.setupAuthentication();
    
    // Test all modules in order
    await this.testTicketsModule();
    await this.testCustomersModule();
    await this.testBeneficiariesModule();
    await this.testMaterialsServicesModule();
    await this.testLocationsModule();
    await this.testTimecardModule();
    await this.testTenantAdminModule();
    await this.testCustomFieldsModule();
    await this.testInternalFormsModule();
    
    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n================================================================================');
    console.log('📊 COMPREHENSIVE API TESTING REPORT');
    console.log('================================================================================');
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;
    
    this.results.forEach(suite => {
      totalTests += suite.totalTests;
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalWarnings += suite.warnings;
      
      const passRate = suite.totalTests > 0 ? ((suite.passed / suite.totalTests) * 100).toFixed(1) : '0.0';
      const status = suite.passed === suite.totalTests ? '✅' : suite.failed > 0 ? '❌' : '⚠️';
      
      console.log(`${status} ${suite.module.toUpperCase()}`);
      console.log(`   Tests: ${suite.totalTests} | Passed: ${suite.passed} | Failed: ${suite.failed} | Warnings: ${suite.warnings}`);
      console.log(`   Pass Rate: ${passRate}%`);
      
      // Show failed endpoints
      const failedTests = suite.results.filter(r => r.status === 'FAIL');
      if (failedTests.length > 0) {
        console.log(`   Failed Endpoints:`);
        failedTests.forEach(test => {
          console.log(`     - ${test.method} ${test.endpoint} (${test.statusCode}): ${test.error}`);
        });
      }
      console.log('');
    });
    
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
    const overallStatus = totalPassed === totalTests ? '✅' : totalFailed > 0 ? '❌' : '⚠️';
    
    console.log('📋 OVERALL SUMMARY:');
    console.log(`   ${overallStatus} Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   ⚠️  Warnings: ${totalWarnings}`);
    console.log(`   📈 Overall Pass Rate: ${overallPassRate}%`);
    
    console.log('\n🎯 SYSTEM HEALTH ASSESSMENT:');
    if (parseFloat(overallPassRate) >= 90) {
      console.log('✅ System is in excellent health');
    } else if (parseFloat(overallPassRate) >= 75) {
      console.log('⚠️ System is functional with some issues');
    } else if (parseFloat(overallPassRate) >= 50) {
      console.log('❌ System has significant issues requiring attention');
    } else {
      console.log('🚨 System is in critical condition');
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    if (totalFailed > 0) {
      console.log('1. Fix failed endpoints immediately');
      console.log('2. Review error logs for root cause analysis');
      console.log('3. Implement proper error handling');
    }
    if (totalWarnings > 0) {
      console.log('4. Address warning endpoints for optimal performance');
    }
    console.log('5. Run tests regularly to maintain system health');
    console.log('6. Monitor API performance and response times');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('- Fix critical API failures first');
    console.log('- Implement comprehensive error handling');
    console.log('- Add API monitoring and alerting');
    console.log('- Schedule regular health checks');
    
    console.log('\n✅ API Testing completed successfully');
  }
}

// Execute if run directly
if (require.main === module) {
  const tester = new ComprehensiveAPITester();
  tester.runAllTests().catch(console.error);
}

export { ComprehensiveAPITester };
