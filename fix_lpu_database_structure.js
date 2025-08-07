
import pkg from 'pg';
const { Pool } = pkg;

async function fixLPUDatabaseStructure() {
  console.log('🔧 Corrigindo estrutura do banco LPU...');
  
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
    console.log(`📋 Corrigindo schema: tenant_${tenantSchema}`);
    
    try {
      // 1. Check current structure
      const currentColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'tenant_${tenantSchema}' 
        AND table_name = 'price_lists'
        ORDER BY ordinal_position;
      `);
      
      console.log(`📊 Colunas atuais da price_lists:`, currentColumns.rows.map(r => r.column_name));
      
      // 2. Check if we need to rename company_id to customer_company_id
      const hasCompanyId = currentColumns.rows.find(r => r.column_name === 'company_id');
      const hasCustomerCompanyId = currentColumns.rows.find(r => r.column_name === 'customer_company_id');
      
      if (hasCompanyId && !hasCustomerCompanyId) {
        console.log(`🔄 Renomeando company_id para customer_company_id...`);
        await pool.query(`
          ALTER TABLE "tenant_${tenantSchema}".price_lists 
          RENAME COLUMN company_id TO customer_company_id;
        `);
      }
      
      // 3. Check if we need to rename date columns
      const hasEffectiveDate = currentColumns.rows.find(r => r.column_name === 'effective_date');
      const hasValidFrom = currentColumns.rows.find(r => r.column_name === 'valid_from');
      
      if (hasEffectiveDate && !hasValidFrom) {
        console.log(`🔄 Renomeando effective_date para valid_from...`);
        await pool.query(`
          ALTER TABLE "tenant_${tenantSchema}".price_lists 
          RENAME COLUMN effective_date TO valid_from;
        `);
      }
      
      const hasExpirationDate = currentColumns.rows.find(r => r.column_name === 'expiration_date');
      const hasValidTo = currentColumns.rows.find(r => r.column_name === 'valid_to');
      
      if (hasExpirationDate && !hasValidTo) {
        console.log(`🔄 Renomeando expiration_date para valid_to...`);
        await pool.query(`
          ALTER TABLE "tenant_${tenantSchema}".price_lists 
          RENAME COLUMN expiration_date TO valid_to;
        `);
      }
      
      // 4. Add missing columns if needed
      const requiredColumns = [
        { name: 'list_code', type: 'VARCHAR(50)', default: 'DEFAULT' },
        { name: 'version', type: 'VARCHAR(20)', default: '1.0' },
        { name: 'currency', type: 'VARCHAR(3)', default: 'BRL' },
        { name: 'automatic_margin', type: 'DECIMAL(5,2)', default: null },
        { name: 'notes', type: 'TEXT', default: null },
        { name: 'created_by_id', type: 'UUID', default: null },
        { name: 'updated_by', type: 'UUID', default: null }
      ];
      
      for (const col of requiredColumns) {
        const hasColumn = currentColumns.rows.find(r => r.column_name === col.name);
        if (!hasColumn) {
          console.log(`➕ Adicionando coluna ${col.name}...`);
          const defaultValue = col.default ? `DEFAULT ${col.default === 'DEFAULT' ? `'${col.default}'` : col.default}` : '';
          await pool.query(`
            ALTER TABLE "tenant_${tenantSchema}".price_lists 
            ADD COLUMN ${col.name} ${col.type} ${defaultValue};
          `);
        }
      }
      
      console.log(`✅ Schema tenant_${tenantSchema} corrigido com sucesso!`);
      
    } catch (error) {
      console.error(`❌ Erro ao corrigir tenant_${tenantSchema}:`, error.message);
    }
  }
  
  await pool.end();
  console.log('🎯 Correção da estrutura LPU concluída!');
  process.exit(0);
}

fixLPUDatabaseStructure().catch(console.error);
