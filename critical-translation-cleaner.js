// Critical Translation Cleaner - Remove Specific Technical Elements
// August 20, 2025 - Target specific problematic entries

import fs from 'fs';

// List of exact problematic entries to remove (from user's feedback)
const problematicEntries = [
    'Nível Superior',
    'validFrom',
    'validTo', 
    'version',
    'warrantyExpiry',
    'website',
    'Aninhada',
    '#3b82f6',
    '#8b5cf6',
    ',',
    '-',
    '/',
    'T',
    'a',
    '\\n',
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'BRL',
    'Brasil',
    'Ativo',
    'AND',
    'America/Sao_Paulo',
    '4',
    '400:',
    ':',
    '?',
    '@',
    'active',
    'acquisitionCost',
    'action',
    'address'
];

// API endpoints and patterns to remove
const apiPatternMatches = [
    '/api/approvals/',
    '/api/automation-rules',
    '/api/contracts',
    '/api/gdpr-compliance/',
    '/api/locations',
    '/api/materials-services/',
    '/api/sla/',
    '/api/user-management/'
];

function shouldRemoveEntry(key, value) {
    const content = typeof value === 'string' ? value : key;
    
    // Remove exact problematic entries
    if (problematicEntries.includes(content)) {
        return true;
    }
    
    // Remove API endpoints
    if (apiPatternMatches.some(pattern => content.includes(pattern))) {
        return true;
    }
    
    // Remove template strings with ${
    if (content.includes('${') || content.includes('`')) {
        return true;
    }
    
    // Remove hex colors
    if (/^#[0-9a-fA-F]{6}$/.test(content)) {
        return true;
    }
    
    // Remove single characters and numbers
    if (content.length === 1 && !/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/i.test(content)) {
        return true;
    }
    
    // Remove numbers only
    if (/^\d+:?$/.test(content)) {
        return true;
    }
    
    // Remove error messages and success messages (they're dynamic content, not UI labels)
    if (content.includes('Erro ao') || content.includes('Pipeline salvo') || content.includes('Query')) {
        return true;
    }
    
    // Remove permission keys (admin.create_tenant format)
    if (/^[a-z]+\.[a-z_]+$/.test(content)) {
        return true;
    }
    
    return false;
}

function cleanTranslationObject(obj, language, path = '') {
    let cleaned = {};
    let removedCount = 0;
    let keptCount = 0;
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            const result = cleanTranslationObject(value, language, `${path}${key}.`);
            if (Object.keys(result.cleaned).length > 0) {
                cleaned[key] = result.cleaned;
                keptCount++;
            } else {
                console.log(`🗑️ [${language}] Removed empty section: ${path}${key}`);
                removedCount++;
            }
            removedCount += result.removedCount;
            keptCount += result.keptCount;
        } else {
            if (shouldRemoveEntry(key, value)) {
                console.log(`🗑️ [${language}] Removed: "${key}" = "${value}" (from ${path})`);
                removedCount++;
            } else {
                cleaned[key] = value;
                keptCount++;
            }
        }
    }
    
    return { cleaned, removedCount, keptCount };
}

function criticalCleanTranslations() {
    console.log('🔥 Starting Critical Translation Cleaning...\n');
    
    const languages = ['en', 'pt', 'es'];
    let totalRemoved = 0;
    let totalKept = 0;
    
    languages.forEach(lang => {
        const filePath = `client/public/locales/${lang}/translation.json`;
        
        if (!fs.existsSync(filePath)) {
            console.log(`❌ File not found: ${filePath}`);
            return;
        }
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`📁 [${lang.toUpperCase()}] Processing ${Object.keys(data).length} top-level sections...`);
        
        const result = cleanTranslationObject(data, lang.toUpperCase());
        
        // Write cleaned file with backup
        const backupPath = `${filePath}.backup-${Date.now()}`;
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
        fs.writeFileSync(filePath, JSON.stringify(result.cleaned, null, 2));
        
        console.log(`\n✅ [${lang.toUpperCase()}] Cleaning completed:`);
        console.log(`   Backup created: ${backupPath}`);
        console.log(`   Removed: ${result.removedCount}`);
        console.log(`   Kept: ${result.keptCount}`);
        console.log(`   Cleaning percentage: ${((result.removedCount / (result.removedCount + result.keptCount)) * 100).toFixed(1)}%`);
        
        totalRemoved += result.removedCount;
        totalKept += result.keptCount;
    });
    
    console.log('\n🎯 Critical Cleaning Summary:');
    console.log(`   Total removed: ${totalRemoved}`);
    console.log(`   Total kept: ${totalKept}`);
    console.log(`   Overall cleaning: ${((totalRemoved / (totalRemoved + totalKept)) * 100).toFixed(1)}%`);
}

// Execute critical cleaning
criticalCleanTranslations();