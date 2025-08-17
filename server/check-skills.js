
const { createPool } = await import('pg');

// Configuração da conexão PostgreSQL
const pool = createPool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: false
});

async function checkSkills() {
  try {
    console.log('🔍 Verificando habilidades técnicas...');
    
    // Primeiro, vamos verificar se conseguimos conectar ao banco
    await pool.query('SELECT 1');
    console.log('✅ Conexão com o banco estabelecida');
    
    // Verificar se a tabela skills existe
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'skills'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Tabela "skills" não encontrada');
      return;
    }
    
    console.log('✅ Tabela "skills" encontrada');
    
    // Verificar dados na tabela
    const skillsCount = await pool.query('SELECT COUNT(*) as count FROM skills');
    console.log(`📊 Total de skills: ${skillsCount.rows[0].count}`);
    
    if (skillsCount.rows[0].count > 0) {
      const skillsData = await pool.query('SELECT * FROM skills LIMIT 10');
      console.log('📝 Amostra de skills:');
      skillsData.rows.forEach((skill, index) => {
        console.log(`  ${index + 1}. ${skill.name} (${skill.category || 'N/A'}) - Nível: ${skill.level || 'N/A'}`);
      });
    } else {
      console.log('⚠️ Nenhuma habilidade encontrada na base de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar skills:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkSkills();
