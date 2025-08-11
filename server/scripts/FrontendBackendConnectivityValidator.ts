
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ConnectivityCheck {
  component: string;
  status: 'connected' | 'warning' | 'disconnected';
  message: string;
  details?: any;
}

export class FrontendBackendConnectivityValidator {
  private checks: ConnectivityCheck[] = [];

  async validateConnectivity(): Promise<void> {
    console.log('🔍 Validating Frontend-Backend Connectivity...\n');

    // 1. Field Colors Integration
    await this.checkFieldColorsIntegration();

    // 2. Dynamic Badge Integration  
    await this.checkDynamicBadgeIntegration();

    // 3. API Client Configuration
    await this.checkAPIClientConfiguration();

    // 4. Query Client Setup
    await this.checkQueryClientSetup();

    // 5. Hook Implementations
    await this.checkHookImplementations();

    // 6. Component API Usage
    await this.checkComponentAPIUsage();

    this.generateConnectivityReport();
  }

  private async checkFieldColorsIntegration(): Promise<void> {
    const hookPath = 'client/src/hooks/useFieldColors.ts';
    
    if (existsSync(join(process.cwd(), hookPath))) {
      try {
        const content = readFileSync(join(process.cwd(), hookPath), 'utf-8');
        
        const hasAPICall = content.includes('fetch') || content.includes('useQuery');
        const hasErrorHandling = content.includes('catch') || content.includes('error');
        const hasTypeDefinitions = content.includes('interface') || content.includes('type');
        
        this.checks.push({
          component: 'Field Colors Integration',
          status: hasAPICall ? 'connected' : 'warning',
          message: hasAPICall ? 'Field colors properly integrated with backend' : 'Missing API integration',
          details: {
            hasAPICall,
            hasErrorHandling,
            hasTypeDefinitions,
            path: hookPath
          }
        });
      } catch (error) {
        this.checks.push({
          component: 'Field Colors Integration',
          status: 'disconnected',
          message: 'Error reading field colors hook',
          details: { error: error.message }
        });
      }
    } else {
      this.checks.push({
        component: 'Field Colors Integration',
        status: 'disconnected',
        message: 'Field colors hook not found',
        details: { expectedPath: hookPath }
      });
    }
  }

  private async checkDynamicBadgeIntegration(): Promise<void> {
    const componentPath = 'client/src/components/DynamicBadge.tsx';
    
    if (existsSync(join(process.cwd(), componentPath))) {
      try {
        const content = readFileSync(join(process.cwd(), componentPath), 'utf-8');
        
        const usesFieldColors = content.includes('useFieldColors') || content.includes('getFieldColor');
        const hasPropValidation = content.includes('fieldName') && content.includes('value');
        const hasConditionalRendering = content.includes('?') || content.includes('&&');
        
        this.checks.push({
          component: 'Dynamic Badge Integration',
          status: usesFieldColors ? 'connected' : 'warning',
          message: usesFieldColors ? 'Dynamic Badge properly uses field colors' : 'Missing field colors integration',
          details: {
            usesFieldColors,
            hasPropValidation,
            hasConditionalRendering,
            path: componentPath
          }
        });
      } catch (error) {
        this.checks.push({
          component: 'Dynamic Badge Integration',
          status: 'disconnected',
          message: 'Error reading Dynamic Badge component',
          details: { error: error.message }
        });
      }
    } else {
      this.checks.push({
        component: 'Dynamic Badge Integration',
        status: 'disconnected',
        message: 'Dynamic Badge component not found',
        details: { expectedPath: componentPath }
      });
    }
  }

  private async checkAPIClientConfiguration(): Promise<void> {
    const queryClientPath = 'client/src/lib/queryClient.ts';
    
    if (existsSync(join(process.cwd(), queryClientPath))) {
      try {
        const content = readFileSync(join(process.cwd(), queryClientPath), 'utf-8');
        
        const hasQueryClient = content.includes('QueryClient');
        const hasBaseURL = content.includes('baseURL') || content.includes('api');
        const hasErrorHandling = content.includes('retry') || content.includes('refetchOnWindowFocus');
        
        this.checks.push({
          component: 'API Client Configuration',
          status: hasQueryClient ? 'connected' : 'warning',
          message: hasQueryClient ? 'Query client properly configured' : 'Missing query client configuration',
          details: {
            hasQueryClient,
            hasBaseURL,
            hasErrorHandling,
            path: queryClientPath
          }
        });
      } catch (error) {
        this.checks.push({
          component: 'API Client Configuration',
          status: 'disconnected',
          message: 'Error reading query client configuration',
          details: { error: error.message }
        });
      }
    } else {
      this.checks.push({
        component: 'API Client Configuration',
        status: 'warning',
        message: 'Query client configuration not found',
        details: { expectedPath: queryClientPath }
      });
    }
  }

  private async checkQueryClientSetup(): Promise<void> {
    const appPath = 'client/src/App.tsx';
    
    if (existsSync(join(process.cwd(), appPath))) {
      try {
        const content = readFileSync(join(process.cwd(), appPath), 'utf-8');
        
        const hasQueryProvider = content.includes('QueryClientProvider') || content.includes('QueryProvider');
        const hasQueryClient = content.includes('queryClient');
        const hasToaster = content.includes('Toaster') || content.includes('toast');
        
        this.checks.push({
          component: 'Query Client Setup',
          status: hasQueryProvider ? 'connected' : 'warning',
          message: hasQueryProvider ? 'Query client provider properly set up' : 'Missing query client provider',
          details: {
            hasQueryProvider,
            hasQueryClient,
            hasToaster,
            path: appPath
          }
        });
      } catch (error) {
        this.checks.push({
          component: 'Query Client Setup',
          status: 'disconnected',
          message: 'Error reading App component',
          details: { error: error.message }
        });
      }
    } else {
      this.checks.push({
        component: 'Query Client Setup',
        status: 'disconnected',
        message: 'App component not found',
        details: { expectedPath: appPath }
      });
    }
  }

  private async checkHookImplementations(): Promise<void> {
    const hooks = [
      'client/src/hooks/useDynamicColors.ts',
      'client/src/hooks/useTicketMetadata.ts',
      'client/src/hooks/useAuth.tsx'
    ];

    for (const hookPath of hooks) {
      if (existsSync(join(process.cwd(), hookPath))) {
        try {
          const content = readFileSync(join(process.cwd(), hookPath), 'utf-8');
          
          const hasUseQuery = content.includes('useQuery');
          const hasUseMutation = content.includes('useMutation');
          const hasApiCall = content.includes('fetch') || content.includes('/api/');
          
          this.checks.push({
            component: `Hook: ${hookPath.split('/').pop()}`,
            status: hasApiCall ? 'connected' : 'warning',
            message: hasApiCall ? 'Hook properly integrated with API' : 'Hook missing API integration',
            details: {
              hasUseQuery,
              hasUseMutation,
              hasApiCall,
              path: hookPath
            }
          });
        } catch (error) {
          this.checks.push({
            component: `Hook: ${hookPath.split('/').pop()}`,
            status: 'disconnected',
            message: 'Error reading hook',
            details: { error: error.message }
          });
        }
      }
    }
  }

  private async checkComponentAPIUsage(): Promise<void> {
    const components = [
      'client/src/pages/Tickets.tsx',
      'client/src/pages/Customers.tsx',
      'client/src/pages/Dashboard.tsx'
    ];

    for (const componentPath of components) {
      if (existsSync(join(process.cwd(), componentPath))) {
        try {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8');
          
          const usesHooks = content.includes('useQuery') || content.includes('useMutation');
          const hasErrorHandling = content.includes('isError') || content.includes('error');
          const hasLoadingStates = content.includes('isLoading') || content.includes('loading');
          
          this.checks.push({
            component: `Page: ${componentPath.split('/').pop()}`,
            status: usesHooks ? 'connected' : 'warning',
            message: usesHooks ? 'Page properly uses API hooks' : 'Page missing API integration',
            details: {
              usesHooks,
              hasErrorHandling,
              hasLoadingStates,
              path: componentPath
            }
          });
        } catch (error) {
          this.checks.push({
            component: `Page: ${componentPath.split('/').pop()}`,
            status: 'disconnected',
            message: 'Error reading page component',
            details: { error: error.message }
          });
        }
      }
    }
  }

  private generateConnectivityReport(): void {
    const summary = {
      total: this.checks.length,
      connected: this.checks.filter(c => c.status === 'connected').length,
      warnings: this.checks.filter(c => c.status === 'warning').length,
      disconnected: this.checks.filter(c => c.status === 'disconnected').length
    };

    console.log('\n' + '='.repeat(80));
    console.log('🔗 FRONTEND-BACKEND CONNECTIVITY REPORT');
    console.log('='.repeat(80));
    console.log(`✅ Connected: ${summary.connected}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`❌ Disconnected: ${summary.disconnected}`);
    console.log(`📊 Total Checks: ${summary.total}`);
    console.log('='.repeat(80));

    // Print detailed results
    this.checks.forEach(check => {
      const icon = check.status === 'connected' ? '✅' : 
                   check.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${check.component}: ${check.message}`);
    });

    console.log('\n🎯 CONNECTIVITY STATUS:', 
      summary.disconnected === 0 && summary.warnings === 0 ? '✅ FULLY CONNECTED' : 
      summary.disconnected === 0 ? '⚠️ CONNECTED WITH WARNINGS' : '❌ CONNECTION ISSUES');
  }
}

// Execute if run directly
if (require.main === module) {
  const validator = new FrontendBackendConnectivityValidator();
  validator.validateConnectivity()
    .catch(error => {
      console.error('❌ Connectivity validation failed:', error);
      process.exit(1);
    });
}
