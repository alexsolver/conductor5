
import pkg from 'pg';
const { Pool } = pkg;
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ConnectivityResult {
  module: string;
  status: 'connected' | 'partial' | 'disconnected';
  apiEndpoint: string;
  frontendFile: string;
  issues: string[];
  dataFlow: boolean;
}

export class CompleteFrontendBackendValidator {
  private pool: Pool;
  private results: ConnectivityResult[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async validateCompleteConnectivity(): Promise<void> {
    console.log('🔍 VALIDATING COMPLETE FRONTEND-BACKEND CONNECTIVITY\n');

    const modules = [
      {
        name: 'TicketConfiguration',
        frontendFile: 'client/src/pages/TicketConfiguration.tsx',
        apiEndpoint: '/api/customers/companies'
      },
      {
        name: 'Companies',
        frontendFile: 'client/src/pages/Companies.tsx',
        apiEndpoint: '/api/customers/companies'
      },
      {
        name: 'Beneficiaries',
        frontendFile: 'client/src/pages/Beneficiaries.tsx',
        apiEndpoint: '/api/beneficiaries'
      },
      {
        name: 'OmniBridge',
        frontendFile: 'client/src/pages/OmniBridge.tsx',
        apiEndpoint: '/api/tenant-admin/integrations'
      },
      {
        name: 'InternalForms',
        frontendFile: 'client/src/pages/InternalForms.tsx',
        apiEndpoint: '/api/internal-forms/forms'
      },
      {
        name: 'CustomFields',
        frontendFile: 'client/src/pages/CustomFieldsAdministrator.tsx',
        apiEndpoint: '/api/custom-fields/fields'
      },
      {
        name: 'ItemCatalog',
        frontendFile: 'client/src/pages/ItemCatalog.tsx',
        apiEndpoint: '/api/materials-services/items'
      },
      {
        name: 'WorkSchedules',
        frontendFile: 'client/src/pages/WorkSchedules.tsx',
        apiEndpoint: '/api/timecard/work-schedules'
      },
      {
        name: 'LocationsNew',
        frontendFile: 'client/src/pages/LocationsNew.tsx',
        apiEndpoint: '/api/locations-new/local'
      }
    ];

    for (const module of modules) {
      await this.validateModuleConnectivity(module);
    }

    this.generateConnectivityReport();
  }

  private async validateModuleConnectivity(module: any): Promise<void> {
    const result: ConnectivityResult = {
      module: module.name,
      status: 'disconnected',
      apiEndpoint: module.apiEndpoint,
      frontendFile: module.frontendFile,
      issues: [],
      dataFlow: false
    };

    // 1. Check if frontend file exists
    if (!existsSync(join(process.cwd(), module.frontendFile))) {
      result.issues.push('Frontend file not found');
      this.results.push(result);
      return;
    }

    // 2. Check frontend code quality
    try {
      const content = readFileSync(join(process.cwd(), module.frontendFile), 'utf-8');
      
      // Check for proper API integration
      const hasUseQuery = content.includes('useQuery');
      const hasApiRequest = content.includes('apiRequest');
      const hasErrorHandling = content.includes('catch') || content.includes('onError');
      const hasLoadingState = content.includes('isLoading') || content.includes('loading');
      const hasDataValidation = content.includes('Array.isArray') || content.includes('validateApiResponse');

      if (!hasUseQuery) result.issues.push('Missing React Query integration');
      if (!hasApiRequest) result.issues.push('Missing API request calls');
      if (!hasErrorHandling) result.issues.push('Missing error handling');
      if (!hasLoadingState) result.issues.push('Missing loading states');
      if (!hasDataValidation) result.issues.push('Missing data validation');

      // Determine status
      if (result.issues.length === 0) {
        result.status = 'connected';
        result.dataFlow = true;
      } else if (result.issues.length <= 2) {
        result.status = 'partial';
      } else {
        result.status = 'disconnected';
      }

    } catch (error) {
      result.issues.push(`Error reading frontend file: ${error.message}`);
    }

    this.results.push(result);
  }

  private generateConnectivityReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔗 FRONTEND-BACKEND CONNECTIVITY REPORT');
    console.log('='.repeat(80));

    const connected = this.results.filter(r => r.status === 'connected').length;
    const partial = this.results.filter(r => r.status === 'partial').length;
    const disconnected = this.results.filter(r => r.status === 'disconnected').length;

    console.log(`📊 SUMMARY:`);
    console.log(`   ✅ Connected: ${connected}`);
    console.log(`   ⚠️  Partial: ${partial}`);
    console.log(`   ❌ Disconnected: ${disconnected}`);
    console.log(`   📈 Total: ${this.results.length}\n`);

    // Detailed results
    this.results.forEach(result => {
      const statusIcon = result.status === 'connected' ? '✅' : 
                        result.status === 'partial' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${result.module.toUpperCase()}`);
      console.log(`   API: ${result.apiEndpoint}`);
      console.log(`   Frontend: ${result.frontendFile}`);
      console.log(`   Data Flow: ${result.dataFlow ? '✅ Working' : '❌ Broken'}`);
      
      if (result.issues.length > 0) {
        console.log(`   Issues:`);
        result.issues.forEach(issue => console.log(`     - ${issue}`));
      }
      console.log('');
    });

    // Recommendations
    console.log('📋 RECOMMENDATIONS:');
    const criticalIssues = this.results.filter(r => r.status === 'disconnected');
    if (criticalIssues.length > 0) {
      console.log('1. Fix critical connectivity issues first');
      criticalIssues.forEach(r => console.log(`   - ${r.module}: ${r.issues.join(', ')}`));
    }
    
    const partialIssues = this.results.filter(r => r.status === 'partial');
    if (partialIssues.length > 0) {
      console.log('2. Improve partial connections');
      partialIssues.forEach(r => console.log(`   - ${r.module}: ${r.issues.join(', ')}`));
    }

    console.log('3. Implement data validation helpers globally');
    console.log('4. Add comprehensive error handling to all API calls');
    console.log('5. Ensure consistent response format validation\n');
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}

// Execute validation if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CompleteFrontendBackendValidator();
  validator.validateCompleteConnectivity()
    .then(() => validator.cleanup())
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}
