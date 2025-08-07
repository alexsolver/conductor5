
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

async function createLPUTables() {
  console.log('🔧 Criando tabelas LPU ausentes...');
  
  // Import the pool using dynamic import and tsx
  let pool;
  try {
    // Try to use tsx to import TypeScript
    const { execSync } = require('child_process');
    const fs = require('fs');
    
    // Create a temporary JS file that uses tsx to import the TypeScript
    const tempScript = `
const { execSync } = require('child_process');
const path = require('path');

// Use tsx to execute TypeScript
const result = execSync('npx tsx -e "import { pool } from \\'./server/db.ts\\'; console.log(\\'POOL_AVAILABLE\\');"', { 
  encoding: 'utf8',
  cwd: process.cwd()
});

console.log('✅ Database connection available');
`;

    fs.writeFileSync('temp_db_test.js', tempScript);
    execSync('node temp_db_test.js');
    fs.unlinkSync('temp_db_test.js');
    
    // Import using tsx
    const dbModule = await import('./server/db.ts');
    pool = dbModule.pool;
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error.message);
    console.log('🔄 Tentando abordagem alternativa...');
    
    // Fallback: use direct SQL connection
    const { Pool } = require('@neondatabase/serverless');
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não encontrada');
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  
  const tenants = [
    'cb9056df_d964_43d7_8fd8_b0cc00a72056',
    '78a4c88e_0e85_4f7c_ad92_f472dad50d7a', 
    '715c510a_3db5_4510_880a_9a1a5c320100',
    '3f99462f_3621_4b1b_bea8_782acc50d62e'
  ];
  
  for (const tenantSchema of tenants) {
    console.log(`📋 Criando tabelas LPU no schema: tenant_${tenantSchema}`);
    
    try {
      // 1. PRICE_LISTS
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_${tenantSchema}.price_lists (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) NOT NULL,
          description TEXT,
          version VARCHAR(20) DEFAULT '1.0',
          customer_id UUID,
          customer_company_id UUID,
          contract_id UUID,
          cost_center_id UUID,
          valid_from TIMESTAMP DEFAULT NOW(),
          valid_to TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          currency VARCHAR(3) DEFAULT 'BRL',
          automatic_margin DECIMAL(5,2),
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          created_by UUID,
          updated_by UUID,
          UNIQUE(tenant_id, code, version)
        )
      `);
      console.log(`✅ Tabela price_lists criada no tenant_${tenantSchema}`);

      // 2. PRICE_LIST_ITEMS
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_${tenantSchema}.price_list_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          price_list_id UUID NOT NULL,
          item_id UUID,
          service_type_id UUID,
          unit_price DECIMAL(10,2) NOT NULL,
          special_price DECIMAL(10,2),
          scale_discounts JSONB,
          hourly_rate DECIMAL(10,2),
          travel_cost DECIMAL(10,2),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log(`✅ Tabela price_list_items criada no tenant_${tenantSchema}`);

      // 3. PRICING_RULES
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_${tenantSchema}.pricing_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          rule_type VARCHAR(50) NOT NULL,
          conditions JSONB NOT NULL,
          actions JSONB NOT NULL,
          priority INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log(`✅ Tabela pricing_rules criada no tenant_${tenantSchema}`);

      // 4. PRICE_LIST_VERSIONS
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_${tenantSchema}.price_list_versions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          price_list_id UUID NOT NULL,
          version VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'draft',
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
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log(`✅ Tabela price_list_versions criada no tenant_${tenantSchema}`);

      // 5. DYNAMIC_PRICING
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenant_${tenantSchema}.dynamic_pricing (
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
          last_updated TIMESTAMP DEFAULT NOW(),
          calculation_rules JSONB,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log(`✅ Tabela dynamic_pricing criada no tenant_${tenantSchema}`);

    } catch (error) {
      console.error(`❌ Erro ao criar tabelas LPU no tenant_${tenantSchema}:`, error.message);
    }
  }
  
  console.log('🎯 Criação de tabelas LPU concluída!');
  process.exit(0);
}

createLPUTables().catch(console.error);
