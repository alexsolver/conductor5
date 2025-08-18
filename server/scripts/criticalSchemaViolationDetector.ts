#!/usr/bin/env node

/**
 * CRITICAL: Schema Violation Detector
 * Detecta automaticamente violações críticas de schema multi-tenant
 */

import fs from 'fs';
import path from 'path';

// Padrões que indicam violações críticas
const CRITICAL_PATTERNS = {
  // Direct database queries sem tenant context
  directDbQueries: [
    /db\.execute\s*\(\s*sql`[^`]*FROM\s+(?![\$\{])[a-zA-Z_][a-zA-Z0-9_]*\./g,
    /db\.select\(\)\.from\([^)]*\)(?!\s*\.where\([^)]*tenantId)/g,
    /FROM\s+public\./gi,
    /UPDATE\s+public\./gi,
    /INSERT\s+INTO\s+public\./gi,
    /DELETE\s+FROM\s+public\./gi
  ],
  
  // Hardcoded schema references
  hardcodedSchemas: [
    /FROM\s+public\./gi,
    /JOIN\s+public\./gi,
    /UPDATE\s+public\./gi,
    /INSERT\s+INTO\s+public\./gi
  ],
  
  // Missing tenant validation
  missingTenantValidation: [
    /app\.(get|post|put|delete|patch)\([^,]*,\s*(?!jwtAuth)/g,
    /const\s+result\s*=\s*await\s+db\./g
  ]
};

// Arquivos para escanear
const FILES_TO_SCAN = [
  'server/routes.ts',
  'server/index.ts',
  'server/repositories/*.ts',
  'server/services/*.ts',
  'server/middleware/*.ts'
];

// Exceções permitidas (rotas que podem usar schema público)
const ALLOWED_PUBLIC_ROUTES = [
  '/health',
  '/api/auth/',
  '/auth/login',
  '/auth/register'
];

interface ViolationResult {
  file: string;
  line: number;
  column: number;
  pattern: string;
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
}

async function scanFile(filePath: string): Promise<ViolationResult[]> {
  const violations: ViolationResult[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for direct db queries without tenant context
      CRITICAL_PATTERNS.directDbQueries.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          violations.push({
            file: filePath,
            line: lineNumber,
            column: line.indexOf(matches[0]) + 1,
            pattern: pattern.toString(),
            code: line.trim(),
            severity: 'CRITICAL',
            description: 'Direct database query without tenant context - SECURITY RISK'
          });
        }
      });
      
      // Check for hardcoded public schema
      if (line.includes('FROM public.') || line.includes('UPDATE public.')) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: line.indexOf('public.') + 1,
          pattern: 'hardcoded_public_schema',
          code: line.trim(),
          severity: 'CRITICAL',
          description: 'Hardcoded public schema usage - TENANT ISOLATION VIOLATION'
        });
      }
    });
    
  } catch (error) {
    console.error(`❌ Error scanning ${filePath}:`, error);
  }
  
  return violations;
}

async function scanDirectory(): Promise<ViolationResult[]> {
  const allViolations: ViolationResult[] = [];
  
  for (const filePattern of FILES_TO_SCAN) {
    if (filePattern.includes('*')) {
      // Handle glob patterns
      const dir = path.dirname(filePattern);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
          .filter(f => f.endsWith('.ts'))
          .map(f => path.join(dir, f));
        
        for (const file of files) {
          const violations = await scanFile(file);
          allViolations.push(...violations);
        }
      }
    } else {
      // Handle single files
      if (fs.existsSync(filePattern)) {
        const violations = await scanFile(filePattern);
        allViolations.push(...violations);
      }
    }
  }
  
  return allViolations;
}

async function main() {
  console.log('🔍 [SCHEMA-VIOLATION-DETECTOR] Starting critical scan...\n');
  
  const violations = await scanDirectory();
  
  if (violations.length === 0) {
    console.log('✅ [SCAN-COMPLETE] No critical schema violations detected!');
    return;
  }
  
  console.log(`⚠️ [CRITICAL-VIOLATIONS] Found ${violations.length} violations:\n`);
  
  // Group by severity
  const critical = violations.filter(v => v.severity === 'CRITICAL');
  const high = violations.filter(v => v.severity === 'HIGH');
  
  if (critical.length > 0) {
    console.log(`🚨 CRITICAL VIOLATIONS (${critical.length}):`);
    critical.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}:${violation.line}:${violation.column}`);
      console.log(`   Code: ${violation.code}`);
      console.log(`   Issue: ${violation.description}\n`);
    });
  }
  
  if (high.length > 0) {
    console.log(`⚠️ HIGH SEVERITY VIOLATIONS (${high.length}):`);
    high.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}:${violation.line}:${violation.column}`);
      console.log(`   Code: ${violation.code}`);
      console.log(`   Issue: ${violation.description}\n`);
    });
  }
  
  // Generate fix recommendations
  console.log('🔧 [FIX-RECOMMENDATIONS]:');
  console.log('1. Replace direct db.execute() calls with tenantDb.execute()');
  console.log('2. Remove hardcoded "public." schema references');
  console.log('3. Add tenant validation to all API routes');
  console.log('4. Use ${sql.identifier(schemaName)} for dynamic schema names');
  
  process.exit(violations.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

export { scanDirectory, scanFile };