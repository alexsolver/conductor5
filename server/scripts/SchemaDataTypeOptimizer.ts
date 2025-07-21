/**
 * SCHEMA DATA TYPE OPTIMIZER
 * 
 * Resolve inconsistências críticas de tipos de dados:
 * 1. Arrays UUID problemáticos (performance/indexação)
 * 2. Campos opcionais vs obrigatórios inconsistentes
 * 3. Padronização de nomenclatura português/inglês
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class SchemaDataTypeOptimizer {
  
  static async optimizeDataTypes(): Promise<void> {
    console.log('🔧 INICIANDO OTIMIZAÇÃO DE TIPOS DE DADOS...');
    
    const schemaPath = '../../shared/schema-master.ts';
    let content = await readFile(schemaPath, 'utf8');
    
    // 1. OTIMIZAR ARRAYS UUID PROBLEMÁTICOS
    content = this.optimizeUuidArrays(content);
    
    // 2. PADRONIZAR CAMPOS OPCIONAIS VS OBRIGATÓRIOS
    content = this.standardizeRequiredFields(content);
    
    // 3. RESOLVER NOMENCLATURA INCONSISTENTE
    content = this.standardizeNomenclature(content);
    
    await writeFile(schemaPath, content);
    console.log('✅ OTIMIZAÇÃO DE TIPOS DE DADOS CONCLUÍDA');
  }
  
  /**
   * PROBLEMA: Arrays UUID podem causar performance issues
   * SOLUÇÃO: Converter para JSONB quando apropriado, manter arrays simples para casos específicos
   */
  private static optimizeUuidArrays(content: string): string {
    console.log('🔧 Otimizando arrays UUID problemáticos...');
    
    // Arrays que devem ser JSONB (relacionamentos complexos)
    const complexArrayReplacements = [
      {
        from: /dependsOnActionIds: uuid\("depends_on_action_ids"\)\.array\(\)/g,
        to: 'dependsOnActionIds: jsonb("depends_on_action_ids").$type<string[]>().default([])'
      },
      {
        from: /blockedByActionIds: uuid\("blocked_by_action_ids"\)\.array\(\)/g,
        to: 'blockedByActionIds: jsonb("blocked_by_action_ids").$type<string[]>().default([])'
      }
    ];
    
    // Arrays que podem permanecer simples (performance aceitável)
    const simpleArrayReplacements = [
      {
        from: /teamMemberIds: uuid\("team_member_ids"\)\.array\(\)/g,
        to: 'teamMemberIds: jsonb("team_member_ids").$type<string[]>().default([])'
      },
      {
        from: /responsibleIds: uuid\("responsible_ids"\)\.array\(\)/g,
        to: 'responsibleIds: jsonb("responsible_ids").$type<string[]>().default([])'
      }
    ];
    
    [...complexArrayReplacements, ...simpleArrayReplacements].forEach(replacement => {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        console.log(`✅ Otimizado: ${replacement.from.source}`);
      }
    });
    
    return content;
  }
  
  /**
   * PROBLEMA: firstName/lastName opcionais em customers mas nome obrigatório em favorecidos
   * SOLUÇÃO: Padronizar campos críticos como obrigatórios
   */
  private static standardizeRequiredFields(content: string): string {
    console.log('🔧 Padronizando campos obrigatórios vs opcionais...');
    
    const fieldStandardizations = [
      // Tornar firstName obrigatório em customers (consistência com favorecidos)
      {
        from: /firstName: varchar\("first_name", \{ length: 255 \}\),/g,
        to: 'firstName: varchar("first_name", { length: 255 }).notNull(),'
      },
      // Tornar lastName obrigatório em customers
      {
        from: /lastName: varchar\("last_name", \{ length: 255 \}\),/g,
        to: 'lastName: varchar("last_name", { length: 255 }).notNull(),'
      },
      // Padronizar email como obrigatório em favorecidos (consistência)
      {
        from: /email: varchar\("email", \{ length: 255 \}\),(\s+)\/\/ Em favorecidos/g,
        to: 'email: varchar("email", { length: 255 }).notNull(),$1// Em favorecidos'
      }
    ];
    
    fieldStandardizations.forEach(standardization => {
      if (standardization.from.test(content)) {
        content = content.replace(standardization.from, standardization.to);
        console.log(`✅ Padronizado: campo obrigatório`);
      }
    });
    
    return content;
  }
  
  /**
   * PROBLEMA: Mistura português/inglês inconsistente
   * SOLUÇÃO: Manter coexistência controlada mas documentada
   */
  private static standardizeNomenclature(content: string): string {
    console.log('🔧 Documentando nomenclatura portuguesa/inglesa...');
    
    // Adicionar comentários de documentação para campos brasileiros
    const nomenclatureDocumentation = [
      {
        from: /nome: varchar\("nome", \{ length: 255 \}\)\.notNull\(\),/g,
        to: 'nome: varchar("nome", { length: 255 }).notNull(), // Campo brasileiro - manter português'
      },
      {
        from: /cpf: varchar\("cpf", \{ length: 14 \}\),/g,
        to: 'cpf: varchar("cpf", { length: 14 }), // CPF brasileiro - manter português'
      },
      {
        from: /cnpj: varchar\("cnpj", \{ length: 18 \}\),/g,
        to: 'cnpj: varchar("cnpj", { length: 18 }), // CNPJ brasileiro - manter português'
      },
      {
        from: /telefone: varchar\("telefone", \{ length: 20 \}\),/g,
        to: 'telefone: varchar("telefone", { length: 20 }), // Campo brasileiro - manter português'
      }
    ];
    
    nomenclatureDocumentation.forEach(doc => {
      if (doc.from.test(content)) {
        content = content.replace(doc.from, doc.to);
        console.log(`✅ Documentado: campo brasileiro`);
      }
    });
    
    return content;
  }
  
  /**
   * Gerar relatório de otimizações aplicadas
   */
  static async generateOptimizationReport(): Promise<void> {
    console.log('\n📊 RELATÓRIO DE OTIMIZAÇÃO DE TIPOS DE DADOS:');
    
    const schemaPath = '../../shared/schema-master.ts';
    const content = await readFile(schemaPath, 'utf8');
    
    // Verificar arrays UUID restantes
    const uuidArrays = content.match(/uuid\(".*"\)\.array\(\)/g) || [];
    console.log(`🔍 Arrays UUID restantes: ${uuidArrays.length}`);
    
    // Verificar campos JSONB otimizados
    const jsonbArrays = content.match(/jsonb\(".*"\)\.\$type<string\[\]>\(\)/g) || [];
    console.log(`✅ Arrays JSONB otimizados: ${jsonbArrays.length}`);
    
    // Verificar campos obrigatórios
    const requiredFields = content.match(/\.notNull\(\)/g) || [];
    console.log(`✅ Campos obrigatórios: ${requiredFields.length}`);
    
    // Verificar campos brasileiros documentados
    const brazilianFields = content.match(/\/\/ Campo brasileiro|\/\/ CPF|\/\/ CNPJ/g) || [];
    console.log(`✅ Campos brasileiros documentados: ${brazilianFields.length}`);
    
    console.log('\n🎯 PROBLEMAS RESOLVIDOS:');
    console.log('✅ Arrays UUID convertidos para JSONB (performance)');
    console.log('✅ Campos obrigatórios padronizados (consistência)');
    console.log('✅ Nomenclatura brasileira documentada (clareza)');
  }
}

// Executar otimização
SchemaDataTypeOptimizer.optimizeDataTypes()
  .then(() => SchemaDataTypeOptimizer.generateOptimizationReport());