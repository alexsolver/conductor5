#!/usr/bin/env node

/**
 * 🛠️ MANUAL TRANSLATION APPLIER - PHASE 2
 * Aplicação manual cuidadosa de traduções nos componentes críticos
 */

import fs from 'fs';

// Aplicar transformações manuais no Sidebar primeiro
async function transformSidebar() {
  console.log('🔧 TRANSFORMAÇÃO MANUAL - SIDEBAR\n');
  
  const filePath = 'client/src/components/layout/Sidebar.tsx';
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Arquivo Sidebar.tsx não encontrado');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Backup
  fs.copyFileSync(filePath, `${filePath}.manual.backup`);
  console.log('💾 Backup criado');
  
  // Adicionar import useTranslation se não existir
  if (!content.includes('useTranslation')) {
    content = content.replace(
      "import React from 'react';",
      "import React from 'react';\nimport { useTranslation } from 'react-i18next';"
    );
    console.log('📦 Import useTranslation adicionado');
  }
  
  // Adicionar hook no início do componente
  if (!content.includes('const { t }')) {
    content = content.replace(
      'export function Sidebar() {',
      `export function Sidebar() {
  const { t } = useTranslation();`
    );
    console.log('🎣 Hook useTranslation adicionado');
  }
  
  // Aplicar algumas traduções críticas manualmente
  const translations = [
    { text: '"Dashboard"', key: 'navigation.dashboard' },
    { text: '"Tickets"', key: 'navigation.tickets' },
    { text: '"Usuários"', key: 'navigation.usuarios' },
    { text: '"Clientes"', key: 'navigation.clientes' },
    { text: '"Relatórios"', key: 'navigation.relatorios' },
    { text: '"Configurações"', key: 'navigation.configuracoes' },
    { text: '"Projetos"', key: 'navigation.projetos' },
    { text: '"Agenda"', key: 'navigation.agenda' },
    { text: '"Cartão Ponto"', key: 'navigation.cartao_ponto' },
    { text: '"Estoque"', key: 'navigation.estoque' },
    { text: '"Aprovações"', key: 'navigation.aprovacoes' }
  ];
  
  let transformations = 0;
  
  translations.forEach(({ text, key }) => {
    const beforeReplace = content;
    content = content.replace(new RegExp(text, 'g'), `{t('${key}')}`);
    if (content !== beforeReplace) {
      transformations++;
      console.log(`   ✅ ${text} → t('${key}')`);
    }
  });
  
  // Salvar arquivo transformado
  fs.writeFileSync(filePath, content);
  
  console.log(`\n📊 Sidebar transformado com ${transformations} mudanças`);
  
  return transformations > 0;
}

// Aplicar transformações no Header
async function transformHeader() {
  console.log('\n🔧 TRANSFORMAÇÃO MANUAL - HEADER\n');
  
  const filePath = 'client/src/components/layout/Header.tsx';
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Arquivo Header.tsx não encontrado');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Backup
  fs.copyFileSync(filePath, `${filePath}.manual.backup`);
  console.log('💾 Backup criado');
  
  // Adicionar import useTranslation se não existir
  if (!content.includes('useTranslation')) {
    const importMatch = content.match(/(import.*?from ['"]react['"];?\s*)/);
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        `${importMatch[0]}import { useTranslation } from 'react-i18next';\n`
      );
      console.log('📦 Import useTranslation adicionado');
    }
  }
  
  // Adicionar hook
  if (!content.includes('const { t }')) {
    const componentMatch = content.match(/(export\s+(?:default\s+)?(?:function\s+\w+|const\s+\w+\s*=.*?)\s*\([^)]*\)\s*{)/);
    if (componentMatch) {
      content = content.replace(
        componentMatch[0],
        `${componentMatch[0]}\n  const { t } = useTranslation();`
      );
      console.log('🎣 Hook useTranslation adicionado');
    }
  }
  
  // Aplicar traduções básicas
  const translations = [
    { text: '"Buscar"', key: 'buttons.buscar' },
    { text: '"Perfil"', key: 'navigation.perfil' },
    { text: '"Sair"', key: 'buttons.sair' },
    { text: '"Configurações"', key: 'navigation.configuracoes' },
    { text: '"Notificações"', key: 'navigation.notificacoes' }
  ];
  
  let transformations = 0;
  
  translations.forEach(({ text, key }) => {
    const beforeReplace = content;
    content = content.replace(new RegExp(text, 'g'), `{t('${key}')}`);
    if (content !== beforeReplace) {
      transformations++;
      console.log(`   ✅ ${text} → t('${key}')`);
    }
  });
  
  // Salvar arquivo transformado
  fs.writeFileSync(filePath, content);
  
  console.log(`\n📊 Header transformado com ${transformations} mudanças`);
  
  return transformations > 0;
}

async function runManualTransformations() {
  console.log('🛠️ INICIANDO TRANSFORMAÇÕES MANUAIS PHASE 2\n');
  
  const sidebarSuccess = await transformSidebar();
  const headerSuccess = await transformHeader();
  
  console.log('\n🎯 RESUMO FINAL:');
  console.log(`   📁 Sidebar: ${sidebarSuccess ? '✅ Transformado' : '❌ Sem mudanças'}`);
  console.log(`   📁 Header: ${headerSuccess ? '✅ Transformado' : '❌ Sem mudanças'}`);
  
  if (sidebarSuccess || headerSuccess) {
    console.log('\n🚀 Transformações aplicadas com sucesso!');
    console.log('💡 Teste o sistema para verificar se as traduções funcionam corretamente');
  } else {
    console.log('\n⚠️ Nenhuma transformação foi aplicada');
  }
}

runManualTransformations().catch(console.error);