
import { db } from '../db';
import { knowledgeBaseArticles } from '../../shared/schema-knowledge-base';

async function checkKnowledgeBaseData() {
  try {
    console.log('🔍 Verificando dados da base de conhecimento...');
    
    // Buscar todos os artigos
    const allArticles = await db
      .select()
      .from(knowledgeBaseArticles)
      .limit(10);
    
    console.log('📊 Total de artigos encontrados:', allArticles.length);
    
    if (allArticles.length > 0) {
      console.log('📝 Amostra de artigos:');
      allArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (Tenant: ${article.tenantId})`);
      });
    } else {
      console.log('⚠️ Nenhum artigo encontrado no banco de dados');
      
      // Criar um artigo de teste
      console.log('🔧 Criando artigo de teste...');
      
      const testArticle = await db
        .insert(knowledgeBaseArticles)
        .values({
          tenantId: '3f99462f-3621-4b1b-bea8-782acc50d62e',
          title: 'Artigo de Teste',
          content: 'Este é um artigo de teste para verificar o funcionamento da base de conhecimento.',
          category: 'faq',
          authorId: '550e8400-e29b-41d4-a716-446655440001',
          status: 'published',
          visibility: 'internal'
        })
        .returning();
      
      console.log('✅ Artigo de teste criado:', testArticle[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  }
}

checkKnowledgeBaseData();
