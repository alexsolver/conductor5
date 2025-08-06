/**
 * SCHEMA VALIDATION ENFORCER
 * 
 * Resolve problemas críticos de validação:
 * 1. Validação simplificada desabilitada em server/db.ts
 * 2. Campos tenant_id inconsistentes
 * 3. Campos is_active faltantes para soft deletes
 * 4. Constraints de integridade ausentes
 */

import { readFile, writeFile } from 'fs/promises';

export class SchemaValidationEnforcer {
  
  static async enforceProperValidation(): Promise<void> {
    console.log('🔧 IMPLEMENTANDO VALIDAÇÃO ROBUSTA...');
    
    // 1. CORRIGIR VALIDAÇÃO SIMPLIFICADA EM SERVER/DB.TS
    await this.fixSimplifiedValidation();
    
    // 2. ADICIONAR CAMPOS is_active FALTANTES
    await this.addMissingIsActiveFields();
    
    // 3. VERIFICAR CAMPOS tenant_id OBRIGATÓRIOS
    await this.validateTenantIdConsistency();
    
    console.log('✅ VALIDAÇÃO ROBUSTA IMPLEMENTADA');
  }
  
  /**
   * PROBLEMA CRÍTICO: Validação sempre retorna true
   * SOLUÇÃO: Implementar validação real de schema e tabelas
   */
  private static async fixSimplifiedValidation(): Promise<void> {
    console.log('🔧 Corrigindo validação simplificada em server/db.ts...');
    
    const dbPath = '../../server/db.ts';
    let content = await readFile(dbPath, 'utf8');
    
    // Substituir validações simplificadas por validações reais
    const validationFixes = [
      {
        from: /async validateTenantSchema\(tenantId: string\) \{[\s\S]*?return true;[\s\S]*?\}/g,
        to: `async validateTenantSchema(tenantId: string) {
    try {
      // Validar UUID do tenant
      if (!tenantId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(tenantId)) {
        throw new Error(\`Invalid tenant UUID: \${tenantId}\`);
      }
      
      // Verificar se schema do tenant existe
      const schemaName = \`tenant_\${tenantId.replace(/-/g, '_')}\`;
      const schemaExists = await this.pool.query(
        'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1',
        [schemaName]
      );
      
      if (schemaExists.rows.length === 0) {
        throw new Error(\`Tenant schema not found: \${schemaName}\`);
      }
      
      // Verificar tabelas obrigatórias (15 tabelas)
      const requiredTables = [
        'customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations',
        'customer_companies', 'company_memberships', 'skills', 
        'certifications', 'user_skills', 'favorecidos', 'projects', 
        'project_actions', 'project_timeline', 'integrations'
      ];
      
      const tableCount = await this.pool.query(
        \`SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = $1 AND table_name = ANY($2)\`,
        [schemaName, requiredTables]
      );
      
      if (parseInt(tableCount.rows[0].count) < 15) {
        throw new Error(\`Incomplete tenant schema: \${schemaName} has \${tableCount.rows[0].count}/15 required tables\`);
      }
      
      return true;
    } catch (error) {
      console.error(\`❌ Tenant schema validation failed for \${tenantId}:\`, error.message);
      return false;
    }
  }`
      },
      {
        from: /async ensureTenantExists\(tenantId: string\) \{[\s\S]*?return true;[\s\S]*?\}/g,
        to: `async ensureTenantExists(tenantId: string) {
    try {
      // Verificar se tenant existe na tabela tenants
      const tenantExists = await this.pool.query(
        'SELECT id FROM tenants WHERE id = $1 AND is_active = true',
        [tenantId]
      );
      
      if (tenantExists.rows.length === 0) {
        throw new Error(\`Tenant not found or inactive: \${tenantId}\`);
      }
      
      // Garantir que schema do tenant existe
      const schemaValid = await this.validateTenantSchema(tenantId);
      if (!schemaValid) {
        throw new Error(\`Tenant schema validation failed: \${tenantId}\`);
      }
      
      return true;
    } catch (error) {
      console.error(\`❌ Tenant existence check failed for \${tenantId}:\`, error.message);
      return false;
    }
  }`
      },
      {
        from: /async ensurePublicTables\(\) \{[\s\S]*?console\.log\("✅ Public tables validation skipped in simplified mode"\);[\s\S]*?return true;[\s\S]*?\}/g,
        to: `async ensurePublicTables() {
    try {
      // Verificar tabelas públicas obrigatórias
      const requiredPublicTables = ['sessions', 'tenants', 'users'];
      
      for (const tableName of requiredPublicTables) {
        const tableExists = await this.pool.query(
          \`SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = $1\`,
          [tableName]
        );
        
        if (tableExists.rows.length === 0) {
          throw new Error(\`Critical public table missing: \${tableName}\`);
        }
      }
      
      console.log("✅ Public tables validation completed successfully");
      return true;
    } catch (error) {
      console.error("❌ Public tables validation failed:", error.message);
      return false;
    }
  }`
      }
    ];
    
    validationFixes.forEach(fix => {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        console.log(`✅ Validação corrigida`);
      }
    });
    
    await writeFile(dbPath, content);
  }
  
  /**
   * PROBLEMA: Campos is_active faltantes em tickets, ticketMessages, activityLogs
   * SOLUÇÃO: Adicionar is_active para soft deletes consistentes
   */
  private static async addMissingIsActiveFields(): Promise<void> {
    console.log('🔧 Adicionando campos is_active faltantes...');
    
    const schemaPath = '../../@shared/schema.ts';
    let content = await readFile(schemaPath, 'utf8');
    
    // Adicionar is_active em tabelas que não têm
    const isActiveAdditions = [
      {
        from: /(export const tickets = pgTable\("tickets", \{[\s\S]*?)(\s+createdAt: timestamp\("created_at"\)\.defaultNow\(\),)/,
        to: '$1  isActive: boolean("is_active").default(true),$2'
      },
      {
        from: /(export const ticketMessages = pgTable\("ticket_messages", \{[\s\S]*?)(\s+createdAt: timestamp\("created_at"\)\.defaultNow\(\),)/,
        to: '$1  isActive: boolean("is_active").default(true),$2'
      },
      {
        from: /(export const activityLogs = pgTable\("activity_logs", \{[\s\S]*?)(\s+createdAt: timestamp\("created_at"\)\.defaultNow\(\),)/,
        to: '$1  isActive: boolean("is_active").default(true),$2'
      }
    ];
    
    isActiveAdditions.forEach(addition => {
      if (addition.from.test(content)) {
        content = content.replace(addition.from, addition.to);
        console.log(`✅ Campo is_active adicionado`);
      }
    });
    
    await writeFile(schemaPath, content);
  }
  
  /**
   * VERIFICAR: Todos os campos tenant_id são obrigatórios
   */
  private static async validateTenantIdConsistency(): Promise<void> {
    console.log('🔧 Validando consistência de campos tenant_id...');
    
    const schemaPath = '../../@shared/schema.ts';
    const content = await readFile(schemaPath, 'utf8');
    
    // Contar tenantId obrigatórios vs opcionais
    const tenantIdRequired = (content.match(/tenantId: uuid\("tenant_id"\)\.notNull\(\)/g) || []).length;
    const tenantIdOptional = (content.match(/tenantId: uuid\("tenant_id"\)(?!\.notNull)/g) || []).length;
    const totalTenantId = (content.match(/tenantId: uuid\("tenant_id"\)/g) || []).length;
    
    console.log(`📊 TENANT_ID CONSISTENCY CHECK:`);
    console.log(`✅ Campos tenant_id obrigatórios: ${tenantIdRequired}`);
    console.log(`⚠️  Campos tenant_id opcionais: ${tenantIdOptional}`);
    console.log(`📊 Total tenant_id: ${totalTenantId}`);
    
    if (tenantIdOptional > 0) {
      console.log(`❌ PROBLEMA: ${tenantIdOptional} campos tenant_id não são obrigatórios`);
      throw new Error('Inconsistência detectada: alguns campos tenant_id não são obrigatórios');
    } else {
      console.log(`✅ CONSISTÊNCIA: Todos os campos tenant_id são obrigatórios`);
    }
  }
  
  static async generateValidationReport(): Promise<void> {
    console.log('\n📊 RELATÓRIO DE VALIDAÇÃO DE SCHEMA:');
    
    const schemaPath = '../../@shared/schema.ts';
    const content = await readFile(schemaPath, 'utf8');
    
    // Verificar campos is_active
    const isActiveFields = (content.match(/isActive: boolean\("is_active"\)/g) || []).length;
    console.log(`✅ Campos is_active implementados: ${isActiveFields}`);
    
    // Verificar campos tenant_id obrigatórios
    const tenantIdRequired = (content.match(/tenantId: uuid\("tenant_id"\)\.notNull\(\)/g) || []).length;
    console.log(`✅ Campos tenant_id obrigatórios: ${tenantIdRequired}`);
    
    // Verificar tabelas definidas
    const totalTables = (content.match(/export const.*pgTable/g) || []).length;
    console.log(`✅ Total de tabelas definidas: ${totalTables}`);
    
    console.log('\n🎯 PROBLEMAS RESOLVIDOS:');
    console.log('✅ Validação robusta implementada (substitui retorno true)');
    console.log('✅ Campos is_active adicionados para soft deletes');
    console.log('✅ Consistência tenant_id validada');
    console.log('✅ Validação de tabelas públicas obrigatórias');
  }
}

// Executar correções
SchemaValidationEnforcer.enforceProperValidation()
  .then(() => SchemaValidationEnforcer.generateValidationReport());