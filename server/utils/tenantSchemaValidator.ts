/**
 * CRITICAL TENANT SCHEMA VALIDATOR
 * Sistema abrangente para garantir que todas as operações usem o schema tenant correto
 * Previne vazamentos de dados entre tenants e uso incorreto do schema público
 */

import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

export interface TenantSchemaValidationResult {
  isValid: boolean;
  tenantId: string;
  schemaName: string;
  issues: TenantSchemaIssue[];
  tableCount: number;
  missingTables: string[];
}

export interface TenantSchemaIssue {
  type: 'missing_table' | 'wrong_schema' | 'missing_constraint' | 'invalid_connection';
  description: string;
  severity: 'critical' | 'warning' | 'info';
  table?: string;
  suggestion?: string;
}

export interface DatabaseConnection {
  pool: Pool;
  db: any;
  schemaName: string;
  tenantId: string;
}

/**
 * CENTRAL TENANT SCHEMA MANAGER
 * Gerencia todas as conexões de banco com schema tenant correto
 */
export class TenantSchemaManager {
  private static instance: TenantSchemaManager;
  private connections: Map<string, DatabaseConnection> = new Map();
  private mainPool: Pool;

  constructor() {
    this.mainPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl: false,
      keepAlive: true,
    });
  }

  static getInstance(): TenantSchemaManager {
    if (!TenantSchemaManager.instance) {
      TenantSchemaManager.instance = new TenantSchemaManager();
    }
    return TenantSchemaManager.instance;
  }

  /**
   * MÉTODO PRINCIPAL: Obtém conexão garantindo schema tenant correto
   */
  async getTenantConnection(tenantId: string): Promise<DatabaseConnection> {
    // Validar formato do tenantId
    const tenantIdRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!tenantIdRegex.test(tenantId)) {
      throw new Error(`❌ [TENANT-SCHEMA] Invalid tenant ID format: ${tenantId}`);
    }

    const connectionKey = `tenant_${tenantId}`;
    
    // Reutilizar conexão existente se disponível
    if (this.connections.has(connectionKey)) {
      const existing = this.connections.get(connectionKey)!;
      
      // Verificar se a conexão ainda é válida
      try {
        await existing.pool.query('SELECT 1');
        return existing;
      } catch (error) {
        console.warn(`🔄 [TENANT-SCHEMA] Recreating stale connection for ${tenantId}`);
        this.connections.delete(connectionKey);
      }
    }

    // Criar nova conexão com schema tenant
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    // Verificar se schema existe
    const schemaExists = await this.validateSchemaExists(schemaName);
    if (!schemaExists) {
      throw new Error(`❌ [TENANT-SCHEMA] Schema ${schemaName} does not exist`);
    }

    // Criar pool com search_path forçado para o schema tenant
    const tenantPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schemaName}`,
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000,
      ssl: false,
    });

    // Criar instância do Drizzle com schema específico
    const tenantDb = drizzle({ client: tenantPool, schema });

    const connection: DatabaseConnection = {
      pool: tenantPool,
      db: tenantDb,
      schemaName,
      tenantId
    };

    // Armazenar conexão para reutilização
    this.connections.set(connectionKey, connection);

    console.log(`✅ [TENANT-SCHEMA] Created connection for ${tenantId} using schema ${schemaName}`);
    return connection;
  }

  /**
   * AUDITORIA: Verificar se schema tenant existe
   */
  private async validateSchemaExists(schemaName: string): Promise<boolean> {
    try {
      const result = await this.mainPool.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name = $1
      `, [schemaName]);

      return result.rows.length > 0;
    } catch (error) {
      console.error(`❌ [TENANT-SCHEMA] Error validating schema ${schemaName}:`, error);
      return false;
    }
  }

  /**
   * AUDITORIA COMPLETA: Validar estrutura do schema tenant
   */
  async validateTenantSchema(tenantId: string): Promise<TenantSchemaValidationResult> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const issues: TenantSchemaIssue[] = [];
    let tableCount = 0;
    const missingTables: string[] = [];

    try {
      // 1. Verificar se schema existe
      const schemaExists = await this.validateSchemaExists(schemaName);
      if (!schemaExists) {
        issues.push({
          type: 'wrong_schema',
          description: `Schema ${schemaName} não existe`,
          severity: 'critical',
          suggestion: 'Executar migração para criar o schema tenant'
        });
        
        return {
          isValid: false,
          tenantId,
          schemaName,
          issues,
          tableCount: 0,
          missingTables: []
        };
      }

      // 2. Contar tabelas no schema
      const tableCountResult = await this.mainPool.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      `, [schemaName]);

      tableCount = parseInt(tableCountResult.rows[0]?.table_count || '0');

      // 3. Verificar tabelas essenciais
      const essentialTables = [
        'users', 'customers', 'beneficiaries', 'companies', 'tickets',
        'locations', 'user_groups', 'activity_logs', 'notifications',
        'dashboards', 'custom_fields', 'timecard_entries'
      ];

      const existingTablesResult = await this.mainPool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        AND table_name = ANY($2)
      `, [schemaName, essentialTables]);

      const existingTables = existingTablesResult.rows.map(row => row.table_name);
      
      for (const table of essentialTables) {
        if (!existingTables.includes(table)) {
          missingTables.push(table);
          issues.push({
            type: 'missing_table',
            description: `Tabela essencial '${table}' não encontrada no schema ${schemaName}`,
            severity: 'critical',
            table,
            suggestion: 'Executar migração para criar tabelas faltantes'
          });
        }
      }

      // 4. Verificar constraints de tenant_id
      const tenantConstraintsResult = await this.mainPool.query(`
        SELECT 
          tc.table_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_schema = $1 
        AND tc.constraint_type = 'CHECK'
        AND cc.check_clause LIKE '%tenant_id%'
      `, [schemaName]);

      if (tenantConstraintsResult.rows.length < existingTables.length / 2) {
        issues.push({
          type: 'missing_constraint',
          description: 'Muitas tabelas sem constraints de tenant_id',
          severity: 'warning',
          suggestion: 'Adicionar constraints de validação de tenant_id'
        });
      }

      // 5. Validar se não há referências ao schema público
      const publicSchemaUsageResult = await this.mainPool.query(`
        SELECT DISTINCT referenced_table_schema, referenced_table_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
        WHERE kcu.table_schema = $1
        AND referenced_table_schema = 'public'
      `, [schemaName]);

      if (publicSchemaUsageResult.rows.length > 0) {
        issues.push({
          type: 'wrong_schema',
          description: 'Encontradas referências incorretas ao schema público',
          severity: 'critical',
          suggestion: 'Corrigir foreign keys para referenciar apenas o schema tenant'
        });
      }

      const isValid = issues.filter(i => i.severity === 'critical').length === 0 && tableCount >= 25;

      return {
        isValid,
        tenantId,
        schemaName,
        issues,
        tableCount,
        missingTables
      };

    } catch (error) {
      console.error(`❌ [TENANT-SCHEMA] Validation error for ${tenantId}:`, error);
      
      issues.push({
        type: 'invalid_connection',
        description: `Erro ao validar schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      });

      return {
        isValid: false,
        tenantId,
        schemaName,
        issues,
        tableCount: 0,
        missingTables
      };
    }
  }

  /**
   * LIMPEZA: Fechar conexões não utilizadas
   */
  async cleanup(tenantId?: string) {
    if (tenantId) {
      const connectionKey = `tenant_${tenantId}`;
      const connection = this.connections.get(connectionKey);
      if (connection) {
        await connection.pool.end();
        this.connections.delete(connectionKey);
        console.log(`🧹 [TENANT-SCHEMA] Cleaned up connection for ${tenantId}`);
      }
    } else {
      // Limpar todas as conexões
      for (const [key, connection] of this.connections.entries()) {
        await connection.pool.end();
      }
      this.connections.clear();
      console.log(`🧹 [TENANT-SCHEMA] Cleaned up all tenant connections`);
    }
  }

  /**
   * HEALTH CHECK: Verificar saúde das conexões
   */
  async healthCheck(): Promise<{tenantId: string, isHealthy: boolean, lastCheck: Date}[]> {
    const results = [];
    
    for (const [key, connection] of this.connections.entries()) {
      let isHealthy = false;
      try {
        await connection.pool.query('SELECT 1');
        isHealthy = true;
      } catch (error) {
        console.warn(`❌ [TENANT-SCHEMA] Unhealthy connection for ${connection.tenantId}:`, error);
      }
      
      results.push({
        tenantId: connection.tenantId,
        isHealthy,
        lastCheck: new Date()
      });
    }
    
    return results;
  }
}

/**
 * FUNÇÃO UTILITÁRIA: Detectar uso incorreto de schema
 */
export async function auditSchemaUsage(tenantId: string): Promise<{
  correctUsage: number;
  incorrectUsage: number;
  violations: Array<{query: string, schema: string, timestamp: Date}>;
}> {
  // Esta função seria integrada com logs de query para detectar
  // operações que deveriam usar schema tenant mas estão usando público
  
  return {
    correctUsage: 0,
    incorrectUsage: 0,
    violations: []
  };
}

/**
 * HELPER: Garantir que uma query use o schema correto
 */
export function enforceSchemaInQuery(query: string, schemaName: string): string {
  // Adicionar SET search_path se a query não tiver
  if (!query.includes('SET search_path') && !query.includes('search_path')) {
    return `SET search_path TO ${schemaName}; ${query}`;
  }
  return query;
}

// Export singleton instance
export const tenantSchemaManager = TenantSchemaManager.getInstance();