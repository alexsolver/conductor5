// Enhanced Translation Keys Filter - Remove All Technical Elements
// August 20, 2025 - Ultra-Conservative Filtering for Clean Translations

import fs from 'fs';

// Enhanced filter to remove technical elements completely
function isValidTranslationKey(key) {
    if (!key || typeof key !== 'string') return false;
    
    const trimmedKey = key.trim();
    
    // Remove empty strings and single characters
    if (trimmedKey.length <= 1) return false;
    
    // Remove "Nível Superior" entries - these are UI hierarchy labels, not translations
    if (trimmedKey === 'Nível Superior' || trimmedKey === 'Aninhada') return false;
    
    // Remove hex color codes
    if (/^#[0-9a-fA-F]{6}$/.test(trimmedKey)) return false;
    
    // Remove API endpoints and URLs
    if (trimmedKey.startsWith('/api/') || trimmedKey.startsWith('http')) return false;
    
    // Remove HTTP methods
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
    if (httpMethods.includes(trimmedKey)) return false;
    
    // Remove technical symbols and operators
    const technicalSymbols = [',', '-', '/', ':', '?', '@', '\\n', 'T', 'a'];
    if (technicalSymbols.includes(trimmedKey)) return false;
    
    // Remove currency codes
    const currencyCodes = ['BRL', 'USD', 'EUR', 'GBP'];
    if (currencyCodes.includes(trimmedKey)) return false;
    
    // Remove timezone identifiers
    if (trimmedKey.includes('America/') || /^[A-Z]{2,4}\/[A-Z]/.test(trimmedKey)) return false;
    
    // Remove numbers and numeric codes
    if (/^\d+$/.test(trimmedKey) || /^\d+:$/.test(trimmedKey)) return false;
    
    // Remove status codes
    if (/^\d{3}:?$/.test(trimmedKey)) return false;
    
    // Remove single words that are clearly technical
    const technicalWords = [
        'active', 'acquisitionCost', 'action', 'address', 'AND', 'Brasil', 
        'Ativo', 'version', 'website', 'validFrom', 'validTo', 'warrantyExpiry'
    ];
    if (technicalWords.includes(trimmedKey)) return false;
    
    // Remove permission keys (admin.create_tenant, etc)
    if (/^[a-z]+\.[a-z_]+$/.test(trimmedKey)) return false;
    
    // Remove template strings and code snippets
    if (trimmedKey.includes('${') || trimmedKey.includes('`')) return false;
    
    // Remove file paths and technical references
    if (trimmedKey.includes('\\') || trimmedKey.includes('console')) return false;
    
    // Remove single letter entries or very short technical terms
    if (trimmedKey.length < 3 && !/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/i.test(trimmedKey)) return false;
    
    // Only keep entries that look like meaningful UI text
    // Must contain letters and be longer than 2 characters
    if (!/[a-záàâãéêíóôõúçA-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(trimmedKey)) return false;
    
    return true;
}

// Enhanced cleaning function
function enhancedCleanTranslations() {
    console.log('🧹 Starting Enhanced Translation Cleaning...\n');
    
    const languages = ['en', 'pt', 'es'];
    let totalRemoved = 0;
    let totalKept = 0;
    
    const results = {
        languages: {},
        summary: {}
    };
    
    languages.forEach(lang => {
        const filePath = `client/public/locales/${lang}/translation.json`;
        
        if (!fs.existsSync(filePath)) {
            console.log(`❌ File not found: ${filePath}`);
            return;
        }
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const originalCount = Object.keys(data).length;
        
        // Enhanced recursive cleaning
        function cleanObject(obj, path = '') {
            const cleaned = {};
            let removedFromThis = 0;
            let keptFromThis = 0;
            
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null) {
                    const result = cleanObject(value, `${path}${key}.`);
                    if (Object.keys(result.cleaned).length > 0) {
                        cleaned[key] = result.cleaned;
                        keptFromThis++;
                    } else {
                        removedFromThis++;
                    }
                    removedFromThis += result.removed;
                    keptFromThis += result.kept;
                } else if (typeof value === 'string') {
                    if (isValidTranslationKey(value)) {
                        cleaned[key] = value;
                        keptFromThis++;
                    } else {
                        console.log(`🗑️  [${lang.toUpperCase()}] Removed: "${key}" = "${value}"`);
                        removedFromThis++;
                    }
                } else if (isValidTranslationKey(key)) {
                    cleaned[key] = value;
                    keptFromThis++;
                } else {
                    removedFromThis++;
                }
            }
            
            return {
                cleaned,
                removed: removedFromThis,
                kept: keptFromThis
            };
        }
        
        const result = cleanObject(data);
        const finalCount = Object.keys(result.cleaned).length;
        
        // Write cleaned file
        fs.writeFileSync(filePath, JSON.stringify(result.cleaned, null, 2), 'utf8');
        
        const langRemoved = result.removed;
        const langKept = result.kept;
        
        totalRemoved += langRemoved;
        totalKept += langKept;
        
        results.languages[lang] = {
            original: originalCount,
            removed: langRemoved,
            kept: langKept,
            final: finalCount,
            cleanPercentage: ((langRemoved / (langRemoved + langKept)) * 100).toFixed(1)
        };
        
        console.log(`\n✅ [${lang.toUpperCase()}] Cleaning completed:`);
        console.log(`   Original entries: ${originalCount}`);
        console.log(`   Removed: ${langRemoved}`);
        console.log(`   Kept: ${langKept}`);
        console.log(`   Final entries: ${finalCount}`);
        console.log(`   Cleaned: ${results.languages[lang].cleanPercentage}%`);
    });
    
    results.summary = {
        totalOriginal: totalRemoved + totalKept,
        totalRemoved,
        totalKept,
        overallCleanPercentage: ((totalRemoved / (totalRemoved + totalKept)) * 100).toFixed(1)
    };
    
    console.log('\n📊 Enhanced Cleaning Summary:');
    console.log(`   Total entries processed: ${results.summary.totalOriginal}`);
    console.log(`   Total removed: ${totalRemoved}`);
    console.log(`   Total kept: ${totalKept}`);
    console.log(`   Overall cleaning: ${results.summary.overallCleanPercentage}%`);
    
    // Save detailed report
    fs.writeFileSync('enhanced-translation-filter-report.json', JSON.stringify(results, null, 2));
    console.log('\n📝 Detailed report saved: enhanced-translation-filter-report.json');
    
    return results;
}

// Execute enhanced cleaning
enhancedCleanTranslations();