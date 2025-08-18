
#!/usr/bin/env node

/**
 * CRITICAL SECURITY SCRIPT: Execute comprehensive tenant schema audit
 * JavaScript version for direct Node.js execution
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCriticalSecurityAudit() {
  console.log('🚨 [CRITICAL-SECURITY] Starting comprehensive tenant isolation audit...');
  
  try {
    // Execute TypeScript version using tsx
    const tsxPath = join(__dirname, '../../node_modules/.bin/tsx');
    const scriptPath = join(__dirname, 'runTenantSchemaAudit.ts');
    
    const child = spawn('npx', ['tsx', scriptPath], {
      stdio: 'inherit',
      cwd: join(__dirname, '../..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ [AUDIT-COMPLETE] Tenant schema audit completed successfully');
      } else {
        console.error('❌ [AUDIT-ERROR] Audit failed with code:', code);
        process.exit(1);
      }
    });
    
    child.on('error', (error) => {
      console.error('❌ [EXECUTION-ERROR] Failed to execute audit:', error.message);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ [AUDIT-ERROR] Failed to start security audit:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCriticalSecurityAudit();
}

export { runCriticalSecurityAudit };
