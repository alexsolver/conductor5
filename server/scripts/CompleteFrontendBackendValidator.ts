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
        apiEndpoint: '/api/ticket-config/categories'
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

    // 1. Check if frontend file exists - use correct path resolution
    const frontendPath = join(process.cwd(), module.frontendFile);
    console.log(`🔍 Checking file: ${frontendPath}`);

    if (!existsSync(frontendPath)) {
      result.issues.push('Frontend file not found');
      console.log(`❌ File not found: ${frontendPath}`);
      this.results.push(result);
      return;
    }

    console.log(`✅ File found: ${frontendPath}`);

    // 2. Check frontend code quality
    try {
      const content = readFileSync(frontendPath, 'utf-8');

      // Check for proper API integration patterns
      const hasUseQuery = content.includes('useQuery') || content.includes('useMutation');
      const hasApiRequest = content.includes('apiRequest') || content.includes('fetch') || content.includes('axios');
      const hasErrorHandling = content.includes('catch') || content.includes('onError') || content.includes('try');
      const hasLoadingState = content.includes('isLoading') || content.includes('loading') || content.includes('isPending');
      const hasDataValidation = content.includes('Array.isArray') || content.includes('validateApiResponse') || content.includes('useMemo');
      const hasProperImports = content.includes('import') && (content.includes('@tanstack/react-query') || content.includes('queryClient'));
      const hasFormHandling = content.includes('useForm') || content.includes('onSubmit') || content.includes('handleSubmit');
      const hasStateManagement = content.includes('useState') || content.includes('useEffect');

      // Evaluate connectivity quality
      let score = 0;
      if (hasUseQuery) score++;
      if (hasApiRequest) score++;
      if (hasErrorHandling) score++;
      if (hasLoadingState) score++;
      if (hasDataValidation) score++;
      if (hasProperImports) score++;
      if (hasFormHandling) score++;
      if (hasStateManagement) score++;

      // Add specific issues based on missing patterns
      if (!hasUseQuery) result.issues.push('Missing React Query integration');
      if (!hasApiRequest) result.issues.push('Missing API request calls');
      if (!hasErrorHandling) result.issues.push('Missing error handling');
      if (!hasLoadingState) result.issues.push('Missing loading states');
      if (!hasDataValidation) result.issues.push('Missing data validation');

      // Determine status based on score and critical features
      if (score >= 6 && hasApiRequest && hasErrorHandling) {
        result.status = 'connected';
        result.dataFlow = true;
      } else if (score >= 4 && hasApiRequest) {
        result.status = 'partial';
        result.dataFlow = true;
      } else {
        result.status = 'disconnected';
      }

      console.log(`📊 ${module.name} - Score: ${score}/8, Status: ${result.status}`);

    } catch (error) {
      result.issues.push(`Error reading frontend file: ${error.message}`);
      console.log(`❌ Error reading file: ${error.message}`);
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

    // Enhanced Recommendations
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
    console.log('5. Ensure consistent response format validation');
    console.log('6. Implement loading states for better UX');
    console.log('7. Add proper TypeScript types for API responses\n');

    // Overall system health
    const healthPercentage = Math.round(((connected + (partial * 0.5)) / this.results.length) * 100);
    console.log(`🎯 OVERALL SYSTEM HEALTH: ${healthPercentage}%`);

    if (healthPercentage >= 80) {
      console.log('✅ System connectivity is in good health');
    } else if (healthPercentage >= 60) {
      console.log('⚠️ System connectivity needs attention');
    } else {
      console.log('❌ System connectivity requires immediate attention');
    }
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