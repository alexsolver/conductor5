#!/usr/bin/env node

/**
 * Translation Keys Filter
 * Remove chaves técnicas inválidas do sistema de traduções
 */

import fs from 'fs';

class TranslationKeysFilter {
  constructor() {
    this.logFile = 'translation-filter.log';
    this.invalidPatterns = [
      // Códigos de cores hex
      /^#[0-9a-fA-F]{3,8}$/,
      
      // URLs e endpoints de API
      /^\/api\//,
      /^https?:\/\//,
      /\$\{.*\}/,
      
      // Códigos HTTP e métodos
      /^\d{3}:?$/,
      /^(GET|POST|PUT|PATCH|DELETE)$/,
      
      // Códigos de moeda e país
      /^[A-Z]{2,3}$/,
      /^(BRL|USD|EUR)$/,
      
      // Caracteres especiais isolados
      /^[,\-\/\?\@\:\n\\]+$/,
      
      // Palavras técnicas isoladas
      /^(T|a|active|action|address)$/i,
      
      // Códigos técnicos de propriedades
      /^[a-z]+[A-Z][a-zA-Z]*$/, // camelCase properties
      
      // Timezone codes
      /^[A-Z][a-z]+\/[A-Z][a-z_]+$/,
      
      // Números isolados
      /^\d+$/,
      
      // Strings vazias ou apenas espaços
      /^\s*$/,
      
      // Fragmentos de templates
      /\$\{[^}]+\}/,
      
      // Códigos de erro técnicos
      /^Erro (ao|na) /,
      /Pipeline salvo/,
      /Query (salva|testada)/
    ];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  isValidTranslationKey(key) {
    // Verificar se a chave corresponde a algum padrão inválido
    return !this.invalidPatterns.some(pattern => pattern.test(key));
  }

  filterTranslationFiles() {
    const languages = ['en', 'pt', 'es'];
    let totalFiltered = 0;
    
    for (const lang of languages) {
      const translationFile = `client/public/locales/${lang}/translation.json`;
      
      if (fs.existsSync(translationFile)) {
        try {
          const data = JSON.parse(fs.readFileSync(translationFile, 'utf-8'));
          const filteredData = this.filterObject(data);
          
          const originalCount = this.countKeys(data);
          const filteredCount = this.countKeys(filteredData);
          const removedCount = originalCount - filteredCount;
          
          fs.writeFileSync(translationFile, JSON.stringify(filteredData, null, 2));
          
          totalFiltered += removedCount;
          this.log(`✅ ${lang.toUpperCase()}: ${removedCount} chaves inválidas removidas (${originalCount} → ${filteredCount})`);
          
        } catch (error) {
          this.log(`❌ Erro ao filtrar ${lang}: ${error.message}`);
        }
      }
    }
    
    return totalFiltered;
  }

  filterObject(obj) {
    if (typeof obj === 'string') {
      return this.isValidTranslationKey(obj) ? obj : undefined;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.filterObject(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const filtered = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Filtrar chave inválida
        if (!this.isValidTranslationKey(key)) {
          continue;
        }
        
        const filteredValue = this.filterObject(value);
        if (filteredValue !== undefined) {
          filtered[key] = filteredValue;
        }
      }
      
      return filtered;
    }
    
    return obj;
  }

  countKeys(obj, count = 0) {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        count++;
        if (typeof value === 'object' && value !== null) {
          count = this.countKeys(value, count);
        }
      }
    }
    return count;
  }

  createCleanReport() {
    const report = {
      timestamp: new Date().toISOString(),
      phase: 'translation-keys-filter',
      description: 'Limpeza de chaves técnicas inválidas do sistema de traduções',
      
      invalidPatterns: [
        'Códigos de cores hex (#3b82f6, #8b5cf6)',
        'Endpoints de API (/api/approvals/...)',
        'Métodos HTTP (GET, POST, PUT, etc.)',
        'Códigos de moeda (BRL, USD)',
        'Caracteres especiais isolados',
        'Propriedades camelCase técnicas',
        'Números isolados',
        'Fragmentos de código'
      ],
      
      cleanupRules: {
        hexColors: 'Removidos códigos de cores hex',
        apiEndpoints: 'Removidos endpoints de API',
        httpMethods: 'Removidos métodos HTTP',
        currencyCodes: 'Removidos códigos de moeda',
        technicalProperties: 'Removidas propriedades técnicas',
        specialCharacters: 'Removidos caracteres especiais isolados',
        codeFragments: 'Removidos fragmentos de código'
      },
      
      result: 'Sistema de traduções limpo e organizado',
      nextStep: 'Implementar traduções nos componentes React'
    };
    
    fs.writeFileSync('translation-filter-report.json', JSON.stringify(report, null, 2));
    this.log('✅ Relatório de limpeza criado: translation-filter-report.json');
  }

  async cleanTranslationSystem() {
    this.log('🧹 INICIANDO LIMPEZA DO SISTEMA DE TRADUÇÕES');
    
    try {
      // 1. Filtrar arquivos de tradução
      this.log('🔄 Filtrando chaves inválidas...');
      const totalFiltered = this.filterTranslationFiles();
      
      // 2. Criar relatório de limpeza
      this.createCleanReport();
      
      this.log(`✅ LIMPEZA CONCLUÍDA COM SUCESSO!`);
      this.log(`📊 Total de chaves inválidas removidas: ${totalFiltered}`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ ERRO NA LIMPEZA: ${error.message}`);
      return false;
    }
  }
}

// Execução da limpeza
const filter = new TranslationKeysFilter();
filter.cleanTranslationSystem()
  .then(success => {
    if (success) {
      console.log('\n🧹 LIMPEZA CONCLUÍDA COM SUCESSO!');
      console.log('🎯 Sistema de traduções organizado e limpo');
      console.log('✨ Apenas chaves válidas de tradução mantidas');
    } else {
      console.log('\n❌ FALHA NA LIMPEZA!');
      console.log('🔄 Verificar logs para detalhes');
    }
  })
  .catch(console.error);