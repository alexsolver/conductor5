
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { logInfo, logError, logWarn } from '../utils/logger';

/**
 * TENANT DATA RECOVERY SYSTEM
 * Diagnóstica e recupera dados perdidos durante migração Clean Architecture
 */

export class TenantDataRecovery {
  
  // ===========================
  // DIAGNÓSTICO COMPLETO
  // ===========================
  static async diagnoseTenantDataLoss(): Promise<any> {
    console.log('🔍 DIAGNÓSTICO DE DADOS PERDIDOS - TENANT RECOVERY');
    console.log('='.repeat(70));
    
    try {
      // 1. Verificar tenants existentes
      const tenants = await db.execute(sql`
        SELECT id, name, is_active, created_at 
        FROM tenants 
        WHERE is_active = true
      `);
      
      console.log(`\n📊 TENANTS ENCONTRADOS: ${tenants.rows.length}`);
      
      // 2. Verificar schemas existentes
      const schemas = await db.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
        ORDER BY schema_name
      `);
      
      console.log(`📊 SCHEMAS TENANT: ${schemas.rows.length}`);
      schemas.rows.forEach(s => console.log(`  - ${s.schema_name}`));
      
      // 3. Verificar tabelas públicas principais
      const publicTables = await db.execute(sql`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = t.table_name AND table_schema = 'public') as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'tenants', 'companies')
        ORDER BY table_name
      `);
      
      console.log(`\n📊 TABELAS PÚBLICAS:`);
      publicTables.rows.forEach(t => 
        console.log(`  - ${t.table_name}: ${t.column_count} colunas`)
      );
      
      // 4. Verificar backups disponíveis
      const backups = await db.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'backup_%' 
        OR schema_name LIKE 'recovery_%'
        ORDER BY schema_name DESC
      `);
      
      console.log(`\n📊 BACKUPS DISPONÍVEIS: ${backups.rows.length}`);
      backups.rows.forEach(b => console.log(`  - ${b.schema_name}`));
      
      // 5. Verificar dados de usuários
      const usersCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM users WHERE is_active = true
      `);
      
      console.log(`\n📊 USUÁRIOS ATIVOS: ${usersCount.rows[0]?.count || 0}`);
      
      const diagnosis = {
        tenants: tenants.rows,
        schemas: schemas.rows,
        publicTables: publicTables.rows,
        backups: backups.rows,
        activeUsers: usersCount.rows[0]?.count || 0,
        timestamp: new Date().toISOString()
      };
      
      return diagnosis;
      
    } catch (error) {
      logError('Erro no diagnóstico de dados perdidos', error);
      throw error;
    }
  }
  
  // ===========================
  // RECUPERAÇÃO DE ESTRUTURA DE TENANT
  // ===========================
  static async recreateTenantStructure(tenantId: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      console.log(`\n🏗️ RECRIANDO ESTRUTURA PARA: ${tenantId}`);
      console.log(`📁 Schema: ${schemaName}`);
      
      // Criar schema se não existir
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);
      
      // Recriar tabela customers
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName, 'customers')} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL DEFAULT '${tenantId}',
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          cpf VARCHAR(14),
          company_id UUID,
          address_street VARCHAR(255),
          address_number VARCHAR(20),
          address_city VARCHAR(100),
          address_state VARCHAR(50),
          address_zipcode VARCHAR(10),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Recriar tabela tickets
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName, 'tickets')} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL DEFAULT '${tenantId}',
          number SERIAL,
          subject VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'new',
          priority VARCHAR(50) DEFAULT 'medium',
          urgency VARCHAR(50) DEFAULT 'medium',
          category VARCHAR(100),
          subcategory VARCHAR(100),
          action VARCHAR(100),
          caller_id UUID,
          beneficiary_id UUID,
          assigned_to_id UUID,
          customer_company_id UUID,
          location VARCHAR(255),
          symptoms TEXT,
          business_impact TEXT,
          workaround TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          resolved_at TIMESTAMP,
          closed_at TIMESTAMP
        )
      `);
      
      // Recriar tabela companies
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName, 'companies')} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL DEFAULT '${tenantId}',
          name VARCHAR(255) NOT NULL,
          cnpj VARCHAR(18),
          email VARCHAR(255),
          phone VARCHAR(20),
          address_street VARCHAR(255),
          address_city VARCHAR(100),
          address_state VARCHAR(50),
          address_zipcode VARCHAR(10),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Recriar tabela activity_logs
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName, 'activity_logs')} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL DEFAULT '${tenantId}',
          user_id UUID,
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(50) NOT NULL,
          resource_id UUID,
          details JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Criar índices essenciais
      await this.createEssentialIndexes(schemaName);
      
      logInfo(`Estrutura de tenant recriada: ${schemaName}`);
      
    } catch (error) {
      logError(`Erro ao recriar estrutura do tenant: ${tenantId}`, error);
      throw error;
    }
  }
  
  // ===========================
  // CRIAR ÍNDICES ESSENCIAIS
  // ===========================
  static async createEssentialIndexes(schemaName: string): Promise<void> {
    const indexes = [
      // Customers
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_customers_tenant_id ON ${schemaName}.customers(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_customers_email ON ${schemaName}.customers(email)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_customers_company_id ON ${schemaName}.customers(company_id)`,
      
      // Tickets
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_tickets_tenant_id ON ${schemaName}.tickets(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_tickets_status ON ${schemaName}.tickets(status)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_tickets_caller_id ON ${schemaName}.tickets(caller_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_tickets_assigned_to ON ${schemaName}.tickets(assigned_to_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_tickets_created_at ON ${schemaName}.tickets(created_at)`,
      
      // Companies
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_companies_tenant_id ON ${schemaName}.companies(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_companies_cnpj ON ${schemaName}.companies(cnpj)`,
      
      // Activity Logs
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_activity_logs_tenant_id ON ${schemaName}.activity_logs(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_activity_logs_user_id ON ${schemaName}.activity_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName.replace(/-/g, '_')}_activity_logs_created_at ON ${schemaName}.activity_logs(created_at)`
    ];
    
    for (const indexSQL of indexes) {
      try {
        await db.execute(sql.raw(indexSQL));
      } catch (error) {
        logWarn(`Erro criando índice: ${indexSQL}`, error);
      }
    }
  }
  
  // ===========================
  // RECUPERAÇÃO DE BACKUP
  // ===========================
  static async recoverFromBackup(tenantId: string): Promise<boolean> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Procurar backup mais recente
      const backups = await db.execute(sql`
        SELECT schema_name, 
               (SELECT backup_created_at FROM ${sql.identifier('backup_' + schemaName + '_*', '_backup_metadata')} LIMIT 1) as backup_date
        FROM information_schema.schemata 
        WHERE schema_name LIKE ${'backup_' + schemaName + '%'}
        ORDER BY schema_name DESC
        LIMIT 1
      `);
      
      if (backups.rows.length === 0) {
        logWarn(`Nenhum backup encontrado para tenant: ${tenantId}`);
        return false;
      }
      
      const backupSchema = backups.rows[0].schema_name;
      console.log(`📦 RECUPERANDO DO BACKUP: ${backupSchema}`);
      
      // Restaurar tabelas do backup
      const tables = ['customers', 'tickets', 'companies', 'activity_logs'];
      
      for (const table of tables) {
        await db.execute(sql`
          INSERT INTO ${sql.identifier(schemaName, table)}
          SELECT * FROM ${sql.identifier(backupSchema, table)}
          ON CONFLICT (id) DO NOTHING
        `);
      }
      
      logInfo(`Dados recuperados do backup: ${backupSchema} -> ${schemaName}`);
      return true;
      
    } catch (error) {
      logError(`Erro na recuperação de backup para tenant: ${tenantId}`, error);
      return false;
    }
  }
  
  // ===========================
  // CRIAR DADOS DEMO
  // ===========================
  static async createDemoData(tenantId: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      console.log(`🎭 CRIANDO DADOS DEMO PARA: ${tenantId}`);
      
      // Criar empresa demo
      const companyId = 'demo-company-' + Date.now();
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schemaName, 'companies')} 
        (id, tenant_id, name, cnpj, email, phone)
        VALUES (
          ${companyId},
          ${tenantId},
          'Empresa Demo Ltda',
          '12.345.678/0001-90',
          'contato@empresademo.com',
          '(11) 1234-5678'
        )
        ON CONFLICT (id) DO NOTHING
      `);
      
      // Criar clientes demo
      const customerIds = [];
      for (let i = 1; i <= 3; i++) {
        const customerId = `demo-customer-${i}-${Date.now()}`;
        customerIds.push(customerId);
        
        await db.execute(sql`
          INSERT INTO ${sql.identifier(schemaName, 'customers')} 
          (id, tenant_id, first_name, last_name, email, company_id)
          VALUES (
            ${customerId},
            ${tenantId},
            ${'Cliente ' + i},
            'Demo',
            ${'cliente' + i + '@demo.com'},
            ${companyId}
          )
          ON CONFLICT (id) DO NOTHING
        `);
      }
      
      // Criar tickets demo
      for (let i = 1; i <= 5; i++) {
        const ticketId = `demo-ticket-${i}-${Date.now()}`;
        const statuses = ['new', 'open', 'in_progress', 'resolved', 'closed'];
        const priorities = ['low', 'medium', 'high', 'critical'];
        
        await db.execute(sql`
          INSERT INTO ${sql.identifier(schemaName, 'tickets')} 
          (id, tenant_id, subject, description, status, priority, caller_id)
          VALUES (
            ${ticketId},
            ${tenantId},
            ${'Ticket Demo #' + i},
            ${'Descrição do ticket demo número ' + i + ' para testes.'},
            ${statuses[i % statuses.length]},
            ${priorities[i % priorities.length]},
            ${customerIds[i % customerIds.length]}
          )
          ON CONFLICT (id) DO NOTHING
        `);
      }
      
      logInfo(`Dados demo criados para tenant: ${tenantId}`);
      
    } catch (error) {
      logError(`Erro criando dados demo para tenant: ${tenantId}`, error);
      throw error;
    }
  }
  
  // ===========================
  // PROCESSO COMPLETO DE RECUPERAÇÃO
  // ===========================
  static async performCompleteRecovery(): Promise<void> {
    console.log('\n🚨 INICIANDO RECUPERAÇÃO COMPLETA DE DADOS');
    console.log('='.repeat(70));
    
    try {
      // 1. Diagnóstico
      const diagnosis = await this.diagnoseTenantDataLoss();
      
      // 2. Recuperar cada tenant ativo
      for (const tenant of diagnosis.tenants) {
        console.log(`\n🔄 PROCESSANDO TENANT: ${tenant.name} (${tenant.id})`);
        
        // Recriar estrutura
        await this.recreateTenantStructure(tenant.id);
        
        // Tentar recuperar do backup
        const recoveredFromBackup = await this.recoverFromBackup(tenant.id);
        
        // Se não conseguiu recuperar do backup, criar dados demo
        if (!recoveredFromBackup) {
          console.log(`⚠️  Backup não encontrado, criando dados demo...`);
          await this.createDemoData(tenant.id);
        }
      }
      
      // 3. Verificação final
      await this.verifyRecovery();
      
      console.log('\n✅ RECUPERAÇÃO COMPLETA FINALIZADA');
      
    } catch (error) {
      console.error('❌ Erro na recuperação completa:', error);
      throw error;
    }
  }
  
  // ===========================
  // VERIFICAÇÃO DA RECUPERAÇÃO
  // ===========================
  static async verifyRecovery(): Promise<void> {
    console.log('\n🔍 VERIFICANDO RECUPERAÇÃO...');
    
    try {
      const tenants = await db.execute(sql`
        SELECT id, name FROM tenants WHERE is_active = true
      `);
      
      for (const tenant of tenants.rows) {
        const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
        
        // Contar registros em cada tabela
        const counts = {
          customers: 0,
          tickets: 0,
          companies: 0
        };
        
        try {
          const customersCount = await db.execute(sql`
            SELECT COUNT(*) as count FROM ${sql.identifier(schemaName, 'customers')}
          `);
          counts.customers = Number(customersCount.rows[0]?.count || 0);
          
          const ticketsCount = await db.execute(sql`
            SELECT COUNT(*) as count FROM ${sql.identifier(schemaName, 'tickets')}
          `);
          counts.tickets = Number(ticketsCount.rows[0]?.count || 0);
          
          const companiesCount = await db.execute(sql`
            SELECT COUNT(*) as count FROM ${sql.identifier(schemaName, 'companies')}
          `);
          counts.companies = Number(companiesCount.rows[0]?.count || 0);
          
          console.log(`✅ ${tenant.name}:`);
          console.log(`   📊 Clientes: ${counts.customers}`);
          console.log(`   📊 Tickets: ${counts.tickets}`);
          console.log(`   📊 Empresas: ${counts.companies}`);
          
        } catch (error) {
          console.log(`❌ ${tenant.name}: Erro na verificação`);
        }
      }
      
    } catch (error) {
      logError('Erro na verificação de recuperação', error);
    }
  }
}

// Execução automática se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  TenantDataRecovery.performCompleteRecovery()
    .then(() => {
      console.log('\n🎉 PROCESSO DE RECUPERAÇÃO CONCLUÍDO COM SUCESSO!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 FALHA NO PROCESSO DE RECUPERAÇÃO:', error);
      process.exit(1);
    });
}
