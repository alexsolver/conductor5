
import { db } from './db.js';

async function checkSkills() {
  try {
    console.log('🔍 Verificando habilidades técnicas...');
    
    // Primeiro, vamos verificar se conseguimos conectar ao banco
    await db.execute('SELECT 1');
    console.log('✅ Conexão com o banco estabelecida');
    
    // Verificar se a tabela skills existe
    const tableCheck = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'skills'
    `);
    
    if (tableCheck.length === 0) {
      console.log('❌ Tabela "skills" não encontrada');
      return;
    }
    
    console.log('✅ Tabela "skills" encontrada');
    
    // Verificar dados na tabela
    const skillsCount = await db.execute('SELECT COUNT(*) as count FROM skills');
    console.log(`📊 Total de skills: ${skillsCount[0].count}`);
    
    if (skillsCount[0].count > 0) {
      const skillsData = await db.execute('SELECT * FROM skills LIMIT 10');
      console.log('📝 Amostra de skills:');
      skillsData.forEach((skill, index) => {
        console.log(`  ${index + 1}. ${skill.name} (${skill.category}) - Nível: ${skill.level || 'N/A'}`);
      });
    } else {
      console.log('⚠️ Nenhuma habilidade encontrada na base de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar skills:', error.message);
  } finally {
    process.exit(0);
  }
}

checkSkills();
