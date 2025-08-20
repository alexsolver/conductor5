
/**
 * Automatic Translation Fixing Script
 * Fixes all translation issues following 1qa.md patterns
 */

import { TranslationCompletionService } from '../services/TranslationCompletionService';

async function autoFixTranslations() {
  console.log('🚀 [AUTO-FIX] Starting automatic translation fixing...');
  
  const service = new TranslationCompletionService();
  
  try {
    // 1. First, analyze current state
    console.log('📊 [ANALYZE] Analyzing current translation state...');
    const initialReport = await service.generateCompletenessReport();
    
    console.log('📈 [INITIAL-STATE] Current completeness:');
    Object.entries(initialReport.summary.languageStats).forEach(([lang, stats]) => {
      console.log(`  - ${lang}: ${stats.completeness}% (${stats.existingKeys}/${stats.existingKeys + stats.missingKeys})`);
    });
    
    // 2. Replace hardcoded texts with translation keys
    console.log('\n🔄 [REPLACE] Replacing hardcoded texts...');
    const replaceResults = await service.replaceHardcodedTexts(false); // false = actually apply changes
    
    const totalReplacements = replaceResults.reduce((sum, r) => sum + r.replacements, 0);
    const successfulFiles = replaceResults.filter(r => r.success && r.replacements > 0).length;
    
    console.log(`✅ [REPLACE] Replaced ${totalReplacements} hardcoded texts in ${successfulFiles} files`);
    
    // Show files with most replacements
    const topFiles = replaceResults
      .filter(r => r.replacements > 0)
      .sort((a, b) => b.replacements - a.replacements)
      .slice(0, 5);
    
    if (topFiles.length > 0) {
      console.log('🔝 [TOP-FILES] Files with most replacements:');
      topFiles.forEach(file => {
        const shortPath = file.file.replace(process.cwd(), '');
        console.log(`  - ${shortPath}: ${file.replacements} replacements`);
      });
    }
    
    // 3. Complete missing translations
    console.log('\n📝 [COMPLETE] Completing missing translations...');
    const completionResults = await service.completeTranslations(true); // true = force generation
    
    const totalAdded = completionResults.reduce((sum, r) => sum + r.addedKeys.length, 0);
    const successfulLanguages = completionResults.filter(r => r.errors.length === 0).length;
    
    console.log(`✅ [COMPLETE] Added ${totalAdded} translations for ${successfulLanguages} languages`);
    
    // Show completion by language
    console.log('📊 [BY-LANGUAGE] Completion results:');
    completionResults.forEach(result => {
      const status = result.errors.length === 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${result.language}: +${result.addedKeys.length} keys${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`);
    });
    
    // 4. Final validation
    console.log('\n🔍 [VALIDATE] Running final validation...');
    const finalReport = await service.generateCompletenessReport();
    
    console.log('📈 [FINAL-STATE] Final completeness:');
    Object.entries(finalReport.summary.languageStats).forEach(([lang, stats]) => {
      const initial = initialReport.summary.languageStats[lang];
      const improvement = initial ? (stats.completeness - initial.completeness).toFixed(1) : '0.0';
      const arrow = parseFloat(improvement) > 0 ? '↗️' : parseFloat(improvement) < 0 ? '↘️' : '➡️';
      
      console.log(`  ${arrow} ${lang}: ${stats.completeness}% (${improvement > '0' ? '+' : ''}${improvement}%)`);
    });
    
    // 5. Show remaining issues
    const gaps = await service.analyzeTranslationGaps();
    const remainingIssues = gaps.filter(gap => gap.missingKeys.length > 0);
    
    if (remainingIssues.length > 0) {
      console.log('\n⚠️ [REMAINING] Remaining translation gaps:');
      remainingIssues.forEach(gap => {
        if (gap.missingKeys.length > 0) {
          console.log(`  - ${gap.language}: ${gap.missingKeys.length} missing keys`);
          
          // Show top missing keys
          const topMissing = gap.missingKeys.slice(0, 3);
          topMissing.forEach(key => {
            console.log(`    • ${key}`);
          });
          if (gap.missingKeys.length > 3) {
            console.log(`    • ... and ${gap.missingKeys.length - 3} more`);
          }
        }
      });
    } else {
      console.log('\n🎉 [PERFECT] All translations are complete!');
    }
    
    // 6. Summary
    console.log('\n📋 [SUMMARY] Translation fixing results:');
    console.log(`  • Files modified: ${successfulFiles}`);
    console.log(`  • Hardcoded texts replaced: ${totalReplacements}`);
    console.log(`  • Translation keys added: ${totalAdded}`);
    console.log(`  • Languages processed: ${completionResults.length}`);
    
    const overallImprovement = Object.values(finalReport.summary.languageStats)
      .map(stats => stats.completeness)
      .reduce((sum, comp) => sum + comp, 0) / Object.keys(finalReport.summary.languageStats).length;
    
    console.log(`  • Average completeness: ${overallImprovement.toFixed(1)}%`);
    
    console.log('\n✅ [AUTO-FIX] Automatic translation fixing completed!');
    
    return {
      initialReport,
      finalReport,
      replaceResults,
      completionResults,
      totalReplacements,
      totalAdded,
      overallImprovement
    };
    
  } catch (error) {
    console.error('❌ [AUTO-FIX] Error during automatic fixing:', error);
    throw error;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  autoFixTranslations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { autoFixTranslations };
