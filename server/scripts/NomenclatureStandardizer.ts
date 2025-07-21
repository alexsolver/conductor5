/**
 * NOMENCLATURE STANDARDIZER
 * 
 * Resolve inconsistências de nomenclatura português/inglês
 * Análise: customers = solicitantes (mesma entidade)
 * favorecidos = entidade distinta brasileira
 */

import { readFile, writeFile } from 'fs/promises';

export class NomenclatureStandardizer {
  
  static async analyzeNomenclatureInconsistencies(): Promise<void> {
    console.log('🔍 ANALISANDO INCONSISTÊNCIAS DE NOMENCLATURA...');
    
    const schemaPath = '../../shared/schema-master.ts';
    const content = await readFile(schemaPath, 'utf8');
    
    // 1. IDENTIFICAR ENTIDADES DUPLICADAS
    console.log('\n📊 ANÁLISE DE ENTIDADES:');
    
    const customerTable = content.includes('export const customers') ? '✅ customers (inglês)' : '❌ customers ausente';
    const solicitantesTable = content.includes('export const solicitantes') ? '✅ solicitantes (português)' : '❌ solicitantes ausente';
    const favorecidosTable = content.includes('export const favorecidos') ? '✅ favorecidos (português - entidade distinta)' : '❌ favorecidos ausente';
    
    console.log(`${customerTable}`);
    console.log(`${solicitantesTable}`);  
    console.log(`${favorecidosTable}`);
    
    // 2. ANALISAR CAMPOS DUPLICADOS/INCONSISTENTES
    console.log('\n🔍 CAMPOS INCONSISTENTES:');
    
    const englishFields = [
      { field: 'firstName/lastName', context: 'customers (inglês)' },
      { field: 'email/phone', context: 'campos internacionais' },
      { field: 'company', context: 'termo internacional' }
    ];
    
    const portugueseFields = [
      { field: 'nome', context: 'favorecidos (português)' },
      { field: 'cpf/cnpj/rg', context: 'documentos brasileiros' },
      { field: 'telefone/celular', context: 'termos brasileiros' },
      { field: 'endereco/cidade/estado/cep', context: 'endereço brasileiro' }
    ];
    
    englishFields.forEach(field => console.log(`📝 ${field.field} - ${field.context}`));
    portugueseFields.forEach(field => console.log(`📝 ${field.field} - ${field.context}`));
    
    // 3. VERIFICAR SE CUSTOMERS = SOLICITANTES
    if (content.includes('customers') && !content.includes('solicitantes')) {
      console.log('\n✅ CONFIRMADO: customers é usado como solicitantes (sem duplicação)');
    } else if (content.includes('customers') && content.includes('solicitantes')) {
      console.log('\n❌ PROBLEMA: customers E solicitantes existem (duplicação detectada)');
    }
    
    // 4. RECOMENDAÇÕES
    console.log('\n💡 RECOMENDAÇÕES DE PADRONIZAÇÃO:');
    console.log('1. customers = solicitantes internos (manter inglês para internacional)');
    console.log('2. favorecidos = entidade brasileira específica (manter português)');
    console.log('3. Campos contextuais: cpf/cnpj (português), email/phone (inglês)');
    console.log('4. Coexistência controlada com documentação clara');
  }
  
  static async standardizeEntityNomenclature(): Promise<void> {
    console.log('\n🔧 APLICANDO PADRONIZAÇÃO DE NOMENCLATURA...');
    
    const schemaPath = '../../shared/schema-master.ts';
    let content = await readFile(schemaPath, 'utf8');
    
    // 1. MELHORAR COMENTÁRIOS DE CONTEXTO
    const contextualizations = [
      {
        from: /\/\/ Customers table/g,
        to: '// Customers table (Solicitantes - internal system requesters)'
      },
      {
        from: /\/\/ Favorecidos table \(Brazilian business context\)/g,
        to: '// Favorecidos table (Brazilian business context - external beneficiaries)'
      }
    ];
    
    contextualizations.forEach(contextualization => {
      if (contextualization.from.test(content)) {
        content = content.replace(contextualization.from, contextualization.to);
        console.log(`✅ Contextualização aplicada`);
      }
    });
    
    // 2. ADICIONAR DOCUMENTAÇÃO DE CAMPOS HÍBRIDOS
    const hybridDocumentation = [
      {
        from: /email: varchar\("email", \{ length: 255 \}\)\.notNull\(\),(\s+)\/\/ Em customers/g,
        to: 'email: varchar("email", { length: 255 }).notNull(), // Campo internacional - inglês adequado$1'
      },
      {
        from: /phone: varchar\("phone", \{ length: 50 \}\),(\s+)\/\/ Em customers/g,
        to: 'phone: varchar("phone", { length: 50 }), // Campo internacional - inglês adequado$1'
      }
    ];
    
    hybridDocumentation.forEach(doc => {
      if (doc.from.test(content)) {
        content = content.replace(doc.from, doc.to);
        console.log(`✅ Documentação híbrida aplicada`);
      }
    });
    
    await writeFile(schemaPath, content);
    console.log('✅ PADRONIZAÇÃO DE NOMENCLATURA CONCLUÍDA');
  }
  
  static async generateNomenclatureGuide(): Promise<void> {
    console.log('\n📚 GERANDO GUIA DE NOMENCLATURA...');
    
    const guide = `
# GUIA DE NOMENCLATURA - PORTUGUÊS/INGLÊS

## ENTIDADES PRINCIPAIS

### 1. CUSTOMERS (Solicitantes)
- **Contexto**: Usuários internos do sistema, solicitantes de tickets
- **Idioma**: Inglês (internacional)
- **Campos**: firstName, lastName, email, phone, company
- **Justificativa**: Terminologia padrão em sistemas SaaS internacionais

### 2. FAVORECIDOS (Beneficiários externos)
- **Contexto**: Entidade específica brasileira, pessoas beneficiadas
- **Idioma**: Português (contexto brasileiro)
- **Campos**: nome, cpf, cnpj, rg, telefone, celular, endereco
- **Justificativa**: Conceito específico brasileiro sem equivalente direto

## PADRÕES DE NOMENCLATURA

### Campos Internacionais (Inglês)
- \`email\`, \`phone\` - Padrão global
- \`firstName\`, \`lastName\` - Formato internacional
- \`company\`, \`status\`, \`priority\` - Terminologia SaaS

### Campos Brasileiros (Português)
- \`cpf\`, \`cnpj\`, \`rg\` - Documentos específicos do Brasil
- \`telefone\`, \`celular\` - Termos brasileiros comuns
- \`endereco\`, \`cidade\`, \`estado\`, \`cep\` - Endereçamento brasileiro

### Campos Sistema (Inglês)
- \`tenantId\`, \`createdAt\`, \`updatedAt\` - Padrão técnico
- \`isActive\` - Convenção boolean internacional

## COEXISTÊNCIA CONTROLADA

✅ **CORRETO**: Manter ambos idiomas com contexto claro
❌ **ERRADO**: Misturar idiomas na mesma entidade sem justificativa

### Exemplo Correto:
\`\`\`typescript
// Entidade internacional
customers: { firstName, lastName, email, phone }

// Entidade brasileira  
favorecidos: { nome, cpf, telefone, endereco }
\`\`\`

### Exemplo Incorreto:
\`\`\`typescript
// Mistura sem contexto
entity: { firstName, nome, email, telefone }
\`\`\`
`;
    
    await writeFile('../../NOMENCLATURE_STANDARDS.md', guide);
    console.log('✅ Guia criado: NOMENCLATURE_STANDARDS.md');
  }
}

// Executar análise e padronização
NomenclatureStandardizer.analyzeNomenclatureInconsistencies()
  .then(() => NomenclatureStandardizer.standardizeEntityNomenclature())
  .then(() => NomenclatureStandardizer.generateNomenclatureGuide());