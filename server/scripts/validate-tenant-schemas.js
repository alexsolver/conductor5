
#!/usr/bin/env node

/**
 * CRITICAL: JavaScript version for Node.js execution
 * Validates all tenant schemas and detects public schema violations
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 [TENANT-SCHEMA-VALIDATOR] Starting critical schema validation...');

// Patterns that indicate public schema usage violations
const PROBLEMATIC_PATTERNS = [
  /FROM\s+public\./gi,
  /JOIN\s+public\./gi,
  /UPDATE\s+public\./gi,
  /INSERT\s+INTO\s+public\./gi,
  /DELETE\s+FROM\s+public\./gi,
  /db\.execute\(sql`[^`]*SELECT[^`]*FROM\s+(?!information_schema|pg_)[a-zA-Z_]+[^`]*`\)/g,
  /db\.select\(\)\.from\([^)]+\)(?!\.where\([^)]*tenant)/g
];

// Files that must use tenant schema
const TENANT_REQUIRED_PATHS = [
  'server/modules/**/repositories/**/*.ts',
  'server/modules/**/controllers/**/*.ts',
  'server/routes/**/*.ts'
];

function scanFileForViolations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const violations = [];
    
    PROBLEMATIC_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          file: filePath,
          pattern: pattern.source,
          matches: matches.length,
          severity: 'critical'
        });
      }
    });
    
    return violations;
  } catch (error) {
    console.warn(`⚠️ Could not scan file: ${filePath}`);
    return [];
  }
}

function walkDirectory(dir, violations = []) {
  if (!fs.existsSync(dir)) return violations;
  
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDirectory(fullPath, violations);
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      const fileViolations = scanFileForViolations(fullPath);
      violations.push(...fileViolations);
    }
  });
  
  return violations;
}

// Execute validation
const violations = walkDirectory('server');

console.log(`\n📊 [VALIDATION-RESULTS] Found ${violations.length} potential violations`);

if (violations.length > 0) {
  console.log('\n🚨 [CRITICAL-VIOLATIONS]:');
  violations.slice(0, 10).forEach((violation, index) => {
    console.log(`${index + 1}. ${violation.file}`);
    console.log(`   Pattern: ${violation.pattern}`);
    console.log(`   Matches: ${violation.matches}`);
    console.log('');
  });
  
  console.log('\n🔧 [IMMEDIATE-ACTIONS-REQUIRED]:');
  console.log('1. Apply tenant schema enforcement middleware');
  console.log('2. Replace public schema queries with tenant-aware queries');
  console.log('3. Add tenant validation to all database operations');
  console.log('4. Activate continuous monitoring');
  
  process.exit(1);
} else {
  console.log('✅ [VALIDATION-SUCCESS] No critical violations found');
  process.exit(0);
}
