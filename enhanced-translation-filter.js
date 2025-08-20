/**
 * Enhanced Translation Filter - Remove Technical Keys
 * Removes invalid keys from translation files with enhanced filtering
 */

import { promises as fs } from 'fs';
import path from 'path';

// Enhanced filter patterns to exclude technical elements
const INVALID_PATTERNS = [
  // Technical codes and hex colors
  /^#[0-9a-fA-F]{3,8}$/,
  
  // API endpoints and routes
  /^\/api\//,
  /^\/[a-z-]+\/\$\{.*\}$/,
  
  // HTTP methods
  /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)$/,
  
  // Status codes
  /^\d{3}:?$/,
  
  // Single characters and symbols
  /^[,\-\/\?\@\:\\\n\#\&\+\=\*\(\)\[\]\_\%\$\^\!\~\`\|]$/,
  
  // Technical constants
  /^(BRL|USD|EUR|America\/Sao_Paulo|Brasil|Ativo|T|AND|OR)$/,
  
  // camelCase property names
  /^[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*$/,
  
  // Technical field names
  /^(validFrom|validTo|version|warrantyExpiry|website|acquisitionCost|action|active|address|admin\.[a-z_]+)$/,
  
  // URLs and technical paths
  /^https?:\/\//,
  
  // Database field patterns
  /^[a-z_]+\.[a-z_]+$/,
  
  // Permission patterns
  /^[a-z]+\.[a-z_]+$/,
  
  // Single words that are clearly technical
  /^(Nível Superior|Aninhada)$/,
  
  // Error messages with variables
  /\$\{.*\}/,
  
  // Empty or whitespace only
  /^\s*$/,
  
  // Numbers only
  /^\d+$/,
  
  // Boolean values
  /^(true|false)$/i,
  
  // Technical abbreviations
  /^[A-Z]{2,}$/,
  
  // File extensions
  /\.[a-z]{2,4}$/i,
  
  // Query parameters
  /^\?[a-zA-Z0-9_=&]+$/
];

// Additional specific invalid keys
const SPECIFIC_INVALID_KEYS = [
  'Nível Superior',
  'Aninhada',
  'validFrom',
  'validTo',
  'version',
  'warrantyExpiry',
  'website',
  'acquisitionCost',
  'action',
  'active',
  'address',
  'a',
  'T',
  '\\n',
  '\\n\\n--- Mensagem Original ---\\nDe: ${email.from}\\nData: ${new Date(email.createdAt).toLocaleString()}\\n\\n${email.content}',
  'América/Sao_Paulo',
  'Brasil',
  'Ativo',
  'BRL',
  'DELETE',
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'AND',
  '4',
  '400:',
  ':',
  '?',
  '@',
  ',',
  '-',
  '/'
];

/**
 * Check if a key is invalid based on patterns and specific keys
 */
function isInvalidKey(key) {
  // Check specific invalid keys
  if (SPECIFIC_INVALID_KEYS.includes(key)) {
    return true;
  }
  
  // Check against patterns
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(key)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Recursively filter translation object
 */
function filterTranslationObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const filtered = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip invalid keys
    if (isInvalidKey(key)) {
      console.log(`🗑️ Removing invalid key: "${key}"`);
      continue;
    }
    
    // Recursively filter nested objects
    if (typeof value === 'object' && value !== null) {
      const filteredValue = filterTranslationObject(value);
      // Only add if the filtered object is not empty
      if (Object.keys(filteredValue).length > 0) {
        filtered[key] = filteredValue;
      }
    } else if (typeof value === 'string') {
      // Check if the value itself is invalid
      if (!isInvalidKey(value)) {
        filtered[key] = value;
      } else {
        console.log(`🗑️ Removing key "${key}" with invalid value: "${value}"`);
      }
    } else {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

/**
 * Filter translation file
 */
async function filterTranslationFile(filePath) {
  try {
    console.log(`📖 Processing: ${filePath}`);
    
    const content = await fs.readFile(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    const originalKeyCount = JSON.stringify(translations).match(/"/g)?.length / 2 || 0;
    
    const filtered = filterTranslationObject(translations);
    
    const finalKeyCount = JSON.stringify(filtered).match(/"/g)?.length / 2 || 0;
    const removed = originalKeyCount - finalKeyCount;
    
    // Write filtered content back
    await fs.writeFile(filePath, JSON.stringify(filtered, null, 2), 'utf8');
    
    console.log(`✅ ${path.basename(filePath)}: ${removed} invalid keys removed (${originalKeyCount} → ${finalKeyCount})`);
    
    return { original: originalKeyCount, final: finalKeyCount, removed };
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🧹 Enhanced Translation Filter - Cleaning Invalid Keys\n');
  
  const translationFiles = [
    'client/public/locales/en/translation.json',
    'client/public/locales/pt/translation.json', 
    'client/public/locales/es/translation.json'
  ];
  
  const results = [];
  
  for (const file of translationFiles) {
    const result = await filterTranslationFile(file);
    if (result) {
      results.push({ file, ...result });
    }
  }
  
  // Summary
  const totalOriginal = results.reduce((sum, r) => sum + r.original, 0);
  const totalFinal = results.reduce((sum, r) => sum + r.final, 0);
  const totalRemoved = results.reduce((sum, r) => sum + r.removed, 0);
  
  console.log('\n📊 Enhanced Filtering Results:');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔍 Total keys before: ${totalOriginal}`);
  console.log(`✅ Total keys after: ${totalFinal}`);
  console.log(`🗑️ Invalid keys removed: ${totalRemoved}`);
  console.log(`📈 Optimization: ${((totalRemoved / totalOriginal) * 100).toFixed(1)}%`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  // Write summary report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalOriginal,
      totalFinal,
      totalRemoved,
      optimizationPercentage: ((totalRemoved / totalOriginal) * 100).toFixed(1)
    },
    files: results,
    invalidPatterns: INVALID_PATTERNS.map(p => p.toString()),
    specificInvalidKeys: SPECIFIC_INVALID_KEYS
  };
  
  await fs.writeFile('enhanced-translation-filter-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Report saved: enhanced-translation-filter-report.json');
}

main().catch(console.error);