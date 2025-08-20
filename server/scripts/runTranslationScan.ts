
/**
 * Translation Scanning Script
 * Executes complete translation scanning following 1qa.md patterns
 */

import { TranslationCompletionService } from '../services/TranslationCompletionService';

async function runCompleteScan() {
  console.log('🚀 [TRANSLATION-SCAN] Starting complete translation scanning...');
  
  const service = new TranslationCompletionService();
  
  try {
    // 1. Scan all translation keys
    console.log('📝 [SCAN-KEYS] Scanning translation keys...');
    const keys = await service.scanTranslationKeys();
    console.log(`✅ [SCAN-KEYS] Found ${keys.length} translation keys`);
    
    // Group by module
    const keysByModule = keys.reduce((acc, key) => {
      if (!acc[key.module]) acc[key.module] = [];
      acc[key.module].push(key);
      return acc;
    }, {} as Record<string, typeof keys>);
    
    console.log('📊 [SCAN-KEYS] Keys by module:');
    Object.entries(keysByModule).forEach(([module, moduleKeys]) => {
      console.log(`  - ${module}: ${moduleKeys.length} keys`);
    });
    
    // 2. Detect hardcoded texts
    console.log('\n🔍 [HARDCODED] Detecting hardcoded texts...');
    const hardcodedTexts = await service.detectHardcodedTexts();
    console.log(`✅ [HARDCODED] Found ${hardcodedTexts.length} hardcoded texts`);
    
    // Group by file
    const textsByFile = hardcodedTexts.reduce((acc, item) => {
      if (!acc[item.file]) acc[item.file] = [];
      acc[item.file].push(item);
      return acc;
    }, {} as Record<string, typeof hardcodedTexts>);
    
    console.log('📊 [HARDCODED] Texts by file:');
    Object.entries(textsByFile).slice(0, 10).forEach(([file, texts]) => {
      const shortFile = file.replace(process.cwd(), '');
      console.log(`  - ${shortFile}: ${texts.length} texts`);
    });
    
    if (Object.keys(textsByFile).length > 10) {
      console.log(`  ... and ${Object.keys(textsByFile).length - 10} more files`);
    }
    
    // 3. Analyze translation gaps
    console.log('\n📈 [GAPS] Analyzing translation gaps...');
    const gaps = await service.analyzeTranslationGaps();
    
    console.log('📊 [GAPS] Translation completeness:');
    gaps.forEach(gap => {
      const total = keys.length;
      const missing = gap.missingKeys.length;
      const existing = total - missing;
      const completeness = total > 0 ? (existing / total * 100).toFixed(1) : '100.0';
      
      console.log(`  - ${gap.language}: ${completeness}% (${existing}/${total})`);
    });
    
    // 4. Generate completeness report
    console.log('\n📋 [REPORT] Generating completeness report...');
    const report = await service.generateCompletenessReport();
    
    console.log('📊 [REPORT] Summary:');
    console.log(`  - Total translation keys: ${report.summary.totalKeys}`);
    console.log(`  - Hardcoded texts found: ${hardcodedTexts.length}`);
    console.log(`  - Files with hardcoded texts: ${Object.keys(textsByFile).length}`);
    
    // 5. Show top missing keys
    console.log('\n🔝 [TOP-MISSING] Most critical missing translations:');
    const highPriorityMissing = keys
      .filter(key => key.priority === 'high')
      .filter(key => gaps.some(gap => gap.missingKeys.includes(key.key)))
      .slice(0, 10);
    
    highPriorityMissing.forEach(key => {
      console.log(`  - ${key.key} (${key.module}) - used in ${key.usage.length} files`);
    });
    
    console.log('\n✅ [TRANSLATION-SCAN] Complete translation scanning finished!');
    console.log('\n💡 [NEXT-STEPS] Recommendations:');
    console.log('  1. Run auto-complete-all to fix hardcoded texts and missing translations');
    console.log('  2. Review high-priority missing translations');
    console.log('  3. Validate translation consistency across modules');
    
    return {
      keys,
      hardcodedTexts,
      gaps,
      report
    };
    
  } catch (error) {
    console.error('❌ [TRANSLATION-SCAN] Error during scanning:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  runCompleteScan()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runCompleteScan };
