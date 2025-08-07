
import pkg from 'pg';
const { Pool } = pkg;

async function createLPUTables() {
  console.log('🔧 Criando tabelas LPU ausentes...');
  
  let pool;
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não encontrada');
    }
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error.message);
    process.exit(1);
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
        CREATE TABLE IF NOT EXISTS "tenant_${tenantSchema}".price_lists (
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
        CREATE TABLE IF NOT EXISTS "tenant_${tenantSchema}".price_list_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          price_list_id UUID NOT NULL,
          item_id UUID,
          service_type_id UUID,
          unit_price DECIMAL(15,2) NOT NULL,
          special_price DECIMAL(15,2),
          scale_discounts JSONB DEFAULT '[]',
          hourly_rate DECIMAL(15,2),
          travel_cost DECIMAL(15,2),
          minimum_quantity DECIMAL(10,3) DEFAULT 1,
          discount_percent DECIMAL(5,2) DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log(`✅ Tabela price_list_items criada no tenant_${tenantSchema}`);

      // 3. PRICING_RULES
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "tenant_${tenantSchema}".pricing_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          rule_type VARCHAR(50) NOT NULL,
          conditions JSONB DEFAULT '{}',
          actions JSONB DEFAULT '{}',
          priority INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log(`✅ Tabela pricing_rules criada no tenant_${tenantSchema}`);

      // 4. PRICE_LIST_VERSIONS
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "tenant_${tenantSchema}".price_list_versions (
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
          is_current BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(tenant_id, price_list_id, version)
        )
      `);
      console.log(`✅ Tabela price_list_versions criada no tenant_${tenantSchema}`);

      // 5. DYNAMIC_PRICING
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "tenant_${tenantSchema}".dynamic_pricing (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          item_id UUID NOT NULL,
          base_price DECIMAL(15,2) NOT NULL,
          current_price DECIMAL(15,2) NOT NULL,
          demand_factor DECIMAL(5,4) DEFAULT 1.0000,
          seasonal_factor DECIMAL(5,4) DEFAULT 1.0000,
          inventory_factor DECIMAL(5,4) DEFAULT 1.0000,
          competitor_factor DECIMAL(5,4) DEFAULT 1.0000,
          last_updated TIMESTAMP DEFAULT NOW(),
          factors JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(tenant_id, item_id)
        )
      `);
      console.log(`✅ Tabela dynamic_pricing criada no tenant_${tenantSchema}`);

      // 6. CREATE INDEXES FOR PERFORMANCE
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_price_lists_tenant_active 
        ON "tenant_${tenantSchema}".price_lists(tenant_id, is_active);
        
        CREATE INDEX IF NOT EXISTS idx_price_list_items_list_item 
        ON "tenant_${tenantSchema}".price_list_items(tenant_id, price_list_id, item_id);
        
        CREATE INDEX IF NOT EXISTS idx_pricing_rules_tenant_active 
        ON "tenant_${tenantSchema}".pricing_rules(tenant_id, is_active, priority);
        
        CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_tenant_item 
        ON "tenant_${tenantSchema}".dynamic_pricing(tenant_id, item_id);
      `);
      console.log(`✅ Índices criados no tenant_${tenantSchema}`);

    } catch (error) {
      console.error(`❌ Erro ao criar tabelas LPU no tenant_${tenantSchema}:`, error.message);
    }
  }

  // 7. INSERT DEFAULT LPU DATA
  console.log('📋 Inserindo dados padrão LPU...');
  
  try {
    for (const tenantSchema of tenants) {
      // Insert default price list for each tenant
      await pool.query(`
        INSERT INTO "tenant_${tenantSchema}".price_lists 
        (tenant_id, name, code, description, version, is_active, currency) 
        VALUES 
        ('${tenantSchema.replace(/_/g, '-')}', 'Lista Padrão', 'DEFAULT', 'Lista de preços padrão do sistema', '1.0', true, 'BRL')
        ON CONFLICT (tenant_id, code, version) DO NOTHING
      `);
      
      // Insert default pricing rule
      await pool.query(`
        INSERT INTO "tenant_${tenantSchema}".pricing_rules 
        (tenant_id, name, description, rule_type, conditions, actions, priority) 
        VALUES 
        ('${tenantSchema.replace(/_/g, '-')}', 'Margem Padrão', 'Regra de margem padrão', 'percentage', '{}', '{"margin": 15}', 1)
        ON CONFLICT DO NOTHING
      `);
      
      console.log(`✅ Dados padrão inseridos no tenant_${tenantSchema}`);
    }
  } catch (error) {
    console.error('❌ Erro ao inserir dados padrão:', error.message);
  }
  
  await pool.end();
  console.log('🎯 Criação de tabelas LPU concluída com sucesso!');
  process.exit(0);
}

createLPUTables().catch(console.error);
