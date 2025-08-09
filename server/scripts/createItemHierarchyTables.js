
import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createItemHierarchyTables() {
  console.log('🔧 [HIERARCHY] Iniciando criação das tabelas item_hierarchy...');
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '../database/migrations/create_item_hierarchy_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL
    await pool.query(sql);
    
    console.log('✅ [HIERARCHY] Tabelas item_hierarchy criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const verification = await pool.query(`
      SELECT schema_name, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'item_hierarchy' 
      AND schema_name LIKE 'tenant_%'
      ORDER BY schema_name;
    `);
    
    console.log(`✅ [HIERARCHY] Verificação: ${verification.rows.length} tabelas item_hierarchy encontradas`);
    verification.rows.forEach(row => {
      console.log(`   - ${row.schema_name}.${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ [HIERARCHY] Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createItemHierarchyTables()
    .then(() => {
      console.log('🎉 [HIERARCHY] Processo concluído com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 [HIERARCHY] Falha no processo:', error);
      process.exit(1);
    });
}

export { createItemHierarchyTables };
