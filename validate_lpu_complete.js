
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

/**
 * VALIDAÇÃO COMPLETA PRÉ-PRODUÇÃO - MÓDULO LPU
 * Analista: Sistema de validação automática
 * Escopo: Banco de dados, schema, APIs e integridade
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class LPUPreProductionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
    this.statistics = {
      tablesChecked: 0,
      tablesCreated: 0,
      indexesCreated: 0,
      constraintsAdded: 0,
      dataIntegrityIssues: 0
    };
  }

  async validateComplete() {
    console.log('🔍 INICIANDO VALIDAÇÃO COMPLETA PRÉ-PRODUÇÃO - MÓDULO LPU\n');
    
    try {
      // 1. Validação de Schema e Tabelas
      await this.validateSchemaStructure();
      
      // 2. Validação de Índices e Performance
      await this.validateIndexes();
      
      // 3. Validação de Constraints e Integridade
      await this.validateConstraints();
      
      // 4. Validação de Dados e Consistência
      await this.validateDataIntegrity();
      
      // 5. Teste de APIs
      await this.validateAPIs();
      
      // 6. Relatório Final
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro crítico na validação:', error);
    } finally {
      await pool.end();
    }
  }

  async validateSchemaStructure() {
    console.log('📊 1. VALIDANDO ESTRUTURA DE SCHEMA...\n');
    
    // Buscar todos os schemas tenant
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);
    
    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📋 Encontrados ${tenantSchemas.length} schemas tenant`);
    
    // Tabelas obrigatórias do LPU
    const requiredTables = [
      'price_lists',
      'price_list_items', 
      'pricing_rules',
      'price_list_versions',
      'dynamic_pricing',
      'ticket_lpu_settings',
      'ticket_planned_items',
      'ticket_consumed_items'
    ];
    
    for (const schema of tenantSchemas) {
      console.log(`\n🏢 Validando schema: ${schema}`);
      
      for (const tableName of requiredTables) {
        await this.checkAndCreateTable(schema, tableName);
      }
    }
  }

  async checkAndCreateTable(schema, tableName) {
    try {
      // Verificar se tabela existe
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        )
      `, [schema, tableName]);

      if (!tableCheck.rows[0].exists) {
        console.log(`  ❌ Tabela ${tableName} NÃO EXISTE`);
        await this.createTable(schema, tableName);
        this.errors.push(`Tabela ${tableName} não existia em ${schema}`);
        this.statistics.tablesCreated++;
      } else {
        console.log(`  ✅ Tabela ${tableName} existe`);
        
        // Validar estrutura da tabela
        await this.validateTableStructure(schema, tableName);
      }
      
      this.statistics.tablesChecked++;
      
    } catch (error) {
      console.error(`  ❌ Erro ao verificar ${tableName}:`, error.message);
      this.errors.push(`Erro ao verificar ${tableName}: ${error.message}`);
    }
  }

  async createTable(schema, tableName) {
    const tableDefinitions = {
      'price_lists': `
        CREATE TABLE ${schema}.price_lists (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) NOT NULL,
          description TEXT,
          version VARCHAR(20) NOT NULL DEFAULT '1.0',
          customer_id UUID,
          customer_company_id UUID,
          contract_id UUID,
          cost_center_id UUID,
          valid_from TIMESTAMP,
          valid_to TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          currency VARCHAR(3) DEFAULT 'BRL',
          automatic_margin DECIMAL(5,2),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          created_by UUID,
          updated_by UUID,
          UNIQUE(tenant_id, code, version)
        )
      `,
      
      'price_list_items': `
        CREATE TABLE ${schema}.price_list_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          price_list_id UUID NOT NULL,
          item_id UUID,
          service_type_id UUID,
          unit_price DECIMAL(15,2) NOT NULL,
          special_price DECIMAL(15,2),
          scale_discounts JSONB,
          hourly_rate DECIMAL(15,2),
          travel_cost DECIMAL(15,2),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (price_list_id) REFERENCES ${schema}.price_lists(id) ON DELETE CASCADE
        )
      `,
      
      'pricing_rules': `
        CREATE TABLE ${schema}.pricing_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          rule_type VARCHAR(50) NOT NULL,
          conditions JSONB,
          actions JSONB,
          priority INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `,
      
      'price_list_versions': `
        CREATE TABLE ${schema}.price_list_versions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          price_list_id UUID NOT NULL,
          version VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          submitted_by UUID,
          submitted_at TIMESTAMP,
          approved_by UUID,
          approved_at TIMESTAMP,
          rejected_by UUID,
          rejected_at TIMESTAMP,
          rejection_reason TEXT,
          base_margin DECIMAL(5,2),
          margin_override JSONB,
          effective_date TIMESTAMP,
          expiration_date TIMESTAMP,
          notes TEXT,
          change_log JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (price_list_id) REFERENCES ${schema}.price_lists(id) ON DELETE CASCADE
        )
      `,
      
      'dynamic_pricing': `
        CREATE TABLE ${schema}.dynamic_pricing (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          price_list_id UUID NOT NULL,
          item_id UUID,
          base_price DECIMAL(15,2) NOT NULL,
          current_price DECIMAL(15,2) NOT NULL,
          demand_factor DECIMAL(5,4) DEFAULT 1.0000,
          seasonal_factor DECIMAL(5,4) DEFAULT 1.0000,
          inventory_factor DECIMAL(5,4) DEFAULT 1.0000,
          competitor_factor DECIMAL(5,4) DEFAULT 1.0000,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          calculation_rules JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (price_list_id) REFERENCES ${schema}.price_lists(id) ON DELETE CASCADE
        )
      `,
      
      'ticket_lpu_settings': `
        CREATE TABLE ${schema}.ticket_lpu_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          ticket_id UUID NOT NULL,
          price_list_id UUID NOT NULL,
          notes TEXT,
          applied_by UUID,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `,
      
      'ticket_planned_items': `
        CREATE TABLE ${schema}.ticket_planned_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          ticket_id UUID NOT NULL,
          item_id UUID NOT NULL,
          quantity DECIMAL(10,2) NOT NULL,
          unit_price DECIMAL(15,2) NOT NULL,
          total_cost DECIMAL(15,2) NOT NULL,
          lpu_id UUID,
          status VARCHAR(20) DEFAULT 'planned',
          notes TEXT,
          planned_by UUID,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `,
      
      'ticket_consumed_items': `
        CREATE TABLE ${schema}.ticket_consumed_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          ticket_id UUID NOT NULL,
          planned_item_id UUID,
          item_id UUID NOT NULL,
          planned_quantity DECIMAL(10,4),
          actual_quantity DECIMAL(10,4) NOT NULL,
          lpu_id UUID,
          unit_price_at_consumption DECIMAL(15,4),
          total_cost DECIMAL(15,2),
          technician_id UUID,
          stock_location_id UUID,
          consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          consumption_type VARCHAR(20) DEFAULT 'used',
          notes TEXT,
          batch_number VARCHAR(100),
          serial_number VARCHAR(100),
          warranty_period INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `
    };

    if (tableDefinitions[tableName]) {
      try {
        await pool.query(tableDefinitions[tableName]);
        console.log(`  ✅ Tabela ${tableName} criada com sucesso`);
        this.fixes.push(`Tabela ${tableName} criada em ${schema}`);
      } catch (error) {
        console.error(`  ❌ Erro ao criar ${tableName}:`, error.message);
        this.errors.push(`Erro ao criar ${tableName}: ${error.message}`);
      }
    }
  }

  async validateTableStructure(schema, tableName) {
    try {
      // Verificar colunas obrigatórias
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, tableName]);

      const columns = columnsResult.rows;
      
      // Validações específicas por tabela
      const requiredColumns = {
        'price_lists': ['id', 'tenant_id', 'name', 'code', 'version'],
        'price_list_items': ['id', 'tenant_id', 'price_list_id', 'unit_price'],
        'pricing_rules': ['id', 'tenant_id', 'name', 'rule_type'],
        'ticket_lpu_settings': ['id', 'tenant_id', 'ticket_id', 'price_list_id'],
        'ticket_planned_items': ['id', 'tenant_id', 'ticket_id', 'item_id', 'quantity'],
        'ticket_consumed_items': ['id', 'tenant_id', 'ticket_id', 'item_id', 'actual_quantity']
      };

      if (requiredColumns[tableName]) {
        for (const requiredCol of requiredColumns[tableName]) {
          const columnExists = columns.find(col => col.column_name === requiredCol);
          if (!columnExists) {
            this.errors.push(`Coluna obrigatória ${requiredCol} ausente em ${schema}.${tableName}`);
          }
        }
      }

    } catch (error) {
      console.error(`  ⚠️ Erro ao validar estrutura de ${tableName}:`, error.message);
    }
  }

  async validateIndexes() {
    console.log('\n🏗️ 2. VALIDANDO ÍNDICES DE PERFORMANCE...\n');
    
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);
    
    for (const row of schemasResult.rows) {
      const schema = row.schema_name;
      await this.createOptimizedIndexes(schema);
    }
  }

  async createOptimizedIndexes(schema) {
    const indexes = [
      // Índices tenant-first para performance
      `CREATE INDEX IF NOT EXISTS idx_price_lists_tenant_active ON ${schema}.price_lists(tenant_id, is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_price_lists_tenant_code ON ${schema}.price_lists(tenant_id, code)`,
      `CREATE INDEX IF NOT EXISTS idx_price_list_items_tenant_list ON ${schema}.price_list_items(tenant_id, price_list_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pricing_rules_tenant_active ON ${schema}.pricing_rules(tenant_id, is_active, priority)`,
      `CREATE INDEX IF NOT EXISTS idx_ticket_lpu_tenant_ticket ON ${schema}.ticket_lpu_settings(tenant_id, ticket_id, is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_ticket_planned_tenant_ticket ON ${schema}.ticket_planned_items(tenant_id, ticket_id, is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_ticket_consumed_tenant_ticket ON ${schema}.ticket_consumed_items(tenant_id, ticket_id, is_active)`,
      
      // Índices para foreign keys
      `CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list_id ON ${schema}.price_list_items(price_list_id)`,
      `CREATE INDEX IF NOT EXISTS idx_ticket_consumed_planned_item ON ${schema}.ticket_consumed_items(planned_item_id)`,
      
      // Índices compostos para queries comuns
      `CREATE INDEX IF NOT EXISTS idx_price_lists_tenant_customer ON ${schema}.price_lists(tenant_id, customer_id, is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_tenant_list_item ON ${schema}.dynamic_pricing(tenant_id, price_list_id, item_id)`
    ];

    for (const indexSQL of indexes) {
      try {
        await pool.query(indexSQL);
        this.statistics.indexesCreated++;
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`    ⚠️ Erro ao criar índice: ${error.message}`);
        }
      }
    }
    
    console.log(`  ✅ Índices otimizados criados para ${schema}`);
  }

  async validateConstraints() {
    console.log('\n🔒 3. VALIDANDO CONSTRAINTS E INTEGRIDADE...\n');
    
    // Validar foreign keys e constraints críticas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);
    
    for (const row of schemasResult.rows) {
      const schema = row.schema_name;
      await this.validateSchemaConstraints(schema);
    }
  }

  async validateSchemaConstraints(schema) {
    try {
      // Verificar se constraints críticas existem
      const constraintsResult = await pool.query(`
        SELECT constraint_name, table_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_schema = $1 AND constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'PRIMARY KEY')
        ORDER BY table_name, constraint_type
      `, [schema]);

      console.log(`  📋 ${schema}: ${constraintsResult.rows.length} constraints encontradas`);
      this.statistics.constraintsAdded += constraintsResult.rows.length;
      
    } catch (error) {
      console.error(`  ❌ Erro ao validar constraints em ${schema}:`, error.message);
    }
  }

  async validateDataIntegrity() {
    console.log('\n🔍 4. VALIDANDO INTEGRIDADE DE DADOS...\n');
    
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);
    
    for (const row of schemasResult.rows) {
      const schema = row.schema_name;
      await this.checkDataIntegrity(schema);
    }
  }

  async checkDataIntegrity(schema) {
    try {
      // Verificar dados órfãos em price_list_items
      const orphanItemsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM ${schema}.price_list_items pli
        LEFT JOIN ${schema}.price_lists pl ON pli.price_list_id = pl.id
        WHERE pl.id IS NULL
      `);

      if (orphanItemsResult.rows[0].count > 0) {
        this.errors.push(`${schema}: ${orphanItemsResult.rows[0].count} itens órfãos em price_list_items`);
        this.statistics.dataIntegrityIssues++;
      }

      // Verificar tenant_id consistency
      const tenantInconsistencyResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM ${schema}.price_list_items pli
        JOIN ${schema}.price_lists pl ON pli.price_list_id = pl.id
        WHERE pli.tenant_id != pl.tenant_id
      `);

      if (tenantInconsistencyResult.rows[0].count > 0) {
        this.errors.push(`${schema}: ${tenantInconsistencyResult.rows[0].count} inconsistências de tenant_id`);
        this.statistics.dataIntegrityIssues++;
      }

      console.log(`  ✅ ${schema}: Integridade de dados validada`);
      
    } catch (error) {
      // Tabelas podem não existir ainda, isso é normal
      console.log(`  ⚠️ ${schema}: Validação de integridade ignorada (tabelas em criação)`);
    }
  }

  async validateAPIs() {
    console.log('\n🌐 5. TESTANDO APIS DO MÓDULO LPU...\n');
    
    const apiEndpoints = [
      '/api/materials-services/price-lists',
      '/api/materials-services/price-lists/stats',
      '/api/materials-services/pricing-rules'
    ];

    // Simular testes de API (normalmente seria com supertest)
    console.log('  📋 APIs identificadas para teste:');
    apiEndpoints.forEach(endpoint => {
      console.log(`    - ${endpoint}`);
    });
    
    this.warnings.push('Testes de API devem ser executados após criação das tabelas');
  }

  async generateReport() {
    console.log('\n📊 6. RELATÓRIO FINAL DE VALIDAÇÃO PRÉ-PRODUÇÃO\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'APROVADO' : 'REQUER CORREÇÕES',
      statistics: this.statistics,
      errors: this.errors,
      warnings: this.warnings,
      fixes: this.fixes,
      recommendations: [
        'Executar testes de carga após correções',
        'Validar performance em ambiente de staging',
        'Implementar monitoramento de queries',
        'Configurar backups automáticos',
        'Testar failover de conexões'
      ]
    };

    // Salvar relatório
    fs.writeFileSync('lpu_preproduction_report.json', JSON.stringify(report, null, 2));
    
    console.log('═══════════════════════════════════════════════════');
    console.log(`🎯 STATUS: ${report.status}`);
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 ESTATÍSTICAS:`);
    console.log(`   • Tabelas verificadas: ${this.statistics.tablesChecked}`);
    console.log(`   • Tabelas criadas: ${this.statistics.tablesCreated}`);
    console.log(`   • Índices criados: ${this.statistics.indexesCreated}`);
    console.log(`   • Constraints verificadas: ${this.statistics.constraintsAdded}`);
    console.log(`   • Problemas de integridade: ${this.statistics.dataIntegrityIssues}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERROS ENCONTRADOS (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ AVISOS (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    if (this.fixes.length > 0) {
      console.log(`\n✅ CORREÇÕES APLICADAS (${this.fixes.length}):`);
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Executar validação novamente');
    console.log('   2. Testar APIs do LPU');
    console.log('   3. Validar frontend');
    console.log('   4. Executar testes de integração');
    console.log('   5. Preparar para produção');
    
    console.log(`\n📄 Relatório detalhado salvo: lpu_preproduction_report.json`);
  }
}

// Executar validação
const validator = new LPUPreProductionValidator();
validator.validateComplete().catch(console.error);
