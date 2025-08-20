#!/usr/bin/env node

/**
 * 🔑 TRANSLATION KEYS GENERATOR - PHASE 2
 * Geração automática de chaves de tradução para textos da Fase 2
 */

import fs from 'fs';

// Carregar resultados da análise
const scanResults = JSON.parse(fs.readFileSync('PHASE2_SCAN_RESULTS.json', 'utf8'));

// Carregar traduções existentes
const loadExistingTranslations = () => {
  try {
    return JSON.parse(fs.readFileSync('client/src/i18n/locales/pt-BR.json', 'utf8'));
  } catch (error) {
    return {};
  }
};

// Função para categorizar textos semanticamente
const categorizeText = (text) => {
  const lowerText = text.toLowerCase();
  
  // Categorização semântica avançada
  if (lowerText.includes('erro') || lowerText.includes('falha') || lowerText.includes('não foi possível') || 
      lowerText.includes('inválido') || lowerText.includes('incorreto')) {
    return 'errors';
  }
  
  if (lowerText.includes('sucesso') || lowerText.includes('salvo') || lowerText.includes('criado') || 
      lowerText.includes('atualizado') || lowerText.includes('concluído')) {
    return 'success';
  }
  
  if (lowerText.match(/^(salvar|cancelar|enviar|criar|editar|excluir|confirmar|voltar|próximo|anterior|buscar|filtrar|limpar|aplicar|adicionar|remover|atualizar|visualizar|baixar|exportar|importar)/)) {
    return 'buttons';
  }
  
  if (lowerText.includes('carregando') || lowerText.includes('aguarde') || lowerText.includes('processando')) {
    return 'loading';
  }
  
  if (lowerText.includes('dashboard') || lowerText.includes('painel') || lowerText.includes('relatório') || 
      lowerText.includes('estatística') || lowerText.includes('gráfico')) {
    return 'dashboard';
  }
  
  if (lowerText.includes('ticket') || lowerText.includes('chamado') || lowerText.includes('solicitação')) {
    return 'tickets';
  }
  
  if (lowerText.includes('usuário') || lowerText.includes('perfil') || lowerText.includes('conta')) {
    return 'users';
  }
  
  if (lowerText.includes('configuração') || lowerText.includes('configurar') || lowerText.includes('preferência')) {
    return 'settings';
  }
  
  if (lowerText.includes('menu') || lowerText.includes('navegação') || lowerText.includes('início')) {
    return 'navigation';
  }
  
  if (lowerText.match(/^(digite|selecione|escolha|informe|insira)/)) {
    return 'placeholders';
  }
  
  if (lowerText.includes('título') || lowerText.includes('cabeçalho') || text.length <= 20) {
    return 'titles';
  }
  
  if (text.includes('?')) {
    return 'questions';
  }
  
  if (text.length > 50) {
    return 'descriptions';
  }
  
  if (lowerText.match(/^(nome|email|telefone|endereço|data|hora|valor|quantidade|tipo|status|prioridade)/)) {
    return 'labels';
  }
  
  return 'messages';
};

// Função para gerar chave única
const generateKey = (text, category, usedKeys) => {
  let baseKey = text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  let key = baseKey;
  let counter = 1;
  
  while (usedKeys.has(`${category}.${key}`) || usedKeys.has(key)) {
    key = `${baseKey}_${counter}`;
    counter++;
  }
  
  return key;
};

async function generatePhase2Keys() {
  console.log('🔑 GERANDO CHAVES DE TRADUÇÃO - FASE 2\n');
  
  const existingTranslations = loadExistingTranslations();
  const usedKeys = new Set();
  
  // Coletar chaves existentes
  Object.keys(existingTranslations).forEach(category => {
    Object.keys(existingTranslations[category]).forEach(key => {
      usedKeys.add(`${category}.${key}`);
      usedKeys.add(key);
    });
  });
  
  const newTranslations = { ...existingTranslations };
  let totalNewKeys = 0;
  
  // Processar todos os textos encontrados
  scanResults.results.forEach(result => {
    console.log(`\n📄 Processando: ${result.file}`);
    console.log(`   📝 ${result.textsCount} textos encontrados`);
    
    result.texts.forEach(text => {
      const category = categorizeText(text);
      const key = generateKey(text, category, usedKeys);
      
      if (!newTranslations[category]) {
        newTranslations[category] = {};
      }
      
      if (!newTranslations[category][key]) {
        newTranslations[category][key] = text;
        usedKeys.add(`${category}.${key}`);
        usedKeys.add(key);
        totalNewKeys++;
      }
    });
    
    console.log(`   ✅ Chaves geradas para ${result.file}`);
  });
  
  // Salvar traduções atualizadas
  const languages = ['pt-BR', 'en', 'es', 'fr', 'de'];
  
  languages.forEach(lang => {
    const filePath = `client/src/i18n/locales/${lang}.json`;
    
    if (lang === 'pt-BR') {
      // Português - usar textos originais
      fs.writeFileSync(filePath, JSON.stringify(newTranslations, null, 2));
    } else {
      // Outros idiomas - usar chaves como placeholder
      const translatedContent = {};
      Object.keys(newTranslations).forEach(category => {
        translatedContent[category] = {};
        Object.keys(newTranslations[category]).forEach(key => {
          if (existingTranslations[category] && existingTranslations[category][key]) {
            // Manter tradução existente
            translatedContent[category][key] = existingTranslations[category][key];
          } else {
            // Nova chave - usar placeholder
            translatedContent[category][key] = `[${lang.toUpperCase()}] ${newTranslations[category][key]}`;
          }
        });
      });
      fs.writeFileSync(filePath, JSON.stringify(translatedContent, null, 2));
    }
    
    console.log(`✅ ${lang}.json atualizado`);
  });
  
  console.log(`\n📊 RESUMO DA GERAÇÃO DE CHAVES:`);
  console.log(`   🆕 Novas chaves geradas: ${totalNewKeys}`);
  console.log(`   📚 Total de chaves: ${Object.keys(newTranslations).reduce((sum, cat) => sum + Object.keys(newTranslations[cat]).length, 0)}`);
  console.log(`   🌐 Idiomas atualizados: ${languages.length}`);
  
  // Salvar mapeamento de arquivos para chaves
  const mappingResults = {
    timestamp: new Date().toISOString(),
    totalNewKeys,
    totalExistingKeys: usedKeys.size - totalNewKeys,
    fileMapping: scanResults.results.map(result => ({
      file: result.file,
      textCount: result.textsCount,
      readyForTransformation: true
    }))
  };
  
  fs.writeFileSync('PHASE2_KEYS_MAPPING.json', JSON.stringify(mappingResults, null, 2));
  
  console.log(`\n✅ Mapeamento salvo em: PHASE2_KEYS_MAPPING.json`);
  console.log(`🚀 Pronto para aplicar transformações na Fase 2!`);
}

generatePhase2Keys().catch(console.error);