// ========================================
// KNOWLEDGE BASE SERVICE
// ========================================
// RAG (Retrieval-Augmented Generation) service for knowledge base search

import OpenAI from 'openai';
import { unifiedStorage } from '../storage-master';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// ========================================
// TYPES
// ========================================

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  embedding?: number[];
  similarity?: number;
}

export interface SearchResult {
  articles: KnowledgeArticle[];
  query: string;
  resultCount: number;
}

// ========================================
// KNOWLEDGE BASE CLASS
// ========================================

export class KnowledgeBaseService {
  
  /**
   * Search knowledge base using semantic search with embeddings
   */
  async search(
    tenantId: string,
    query: string,
    limit: number = 5,
    category?: string
  ): Promise<SearchResult> {
    try {
      console.log('[KB-SEARCH] Searching knowledge base:', { query, limit, category });

      // Get query embedding
      const queryEmbedding = await this.getEmbedding(query);

      // Get all knowledge base articles for tenant
      const articles = await unifiedStorage.getAiKnowledgeBase(tenantId, { category });

      if (articles.length === 0) {
        console.log('[KB-SEARCH] No articles found in knowledge base');
        return {
          articles: [],
          query,
          resultCount: 0
        };
      }

      // Calculate similarity scores
      const articlesWithSimilarity = articles.map(article => ({
        ...article,
        similarity: this.cosineSimilarity(
          queryEmbedding,
          article.embedding || []
        )
      }));

      // Sort by similarity and take top results
      const topResults = articlesWithSimilarity
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, limit);

      console.log('[KB-SEARCH] Found results:', {
        total: articles.length,
        returned: topResults.length,
        topScore: topResults[0]?.similarity
      });

      return {
        articles: topResults,
        query,
        resultCount: topResults.length
      };
    } catch (error) {
      console.error('[KB-SEARCH] Search error:', error);
      throw new Error(`Knowledge base search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add article to knowledge base with embedding
   */
  async addArticle(
    tenantId: string,
    article: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
    }
  ): Promise<KnowledgeArticle> {
    try {
      console.log('[KB-ADD] Adding article:', article.title);

      // Generate embedding for content
      const embedding = await this.getEmbedding(`${article.title}\n\n${article.content}`);

      // Save to database
      const savedArticle = await unifiedStorage.createAiKnowledgeBase({
        tenantId,
        title: article.title,
        content: article.content,
        category: article.category || 'general',
        tags: article.tags || [],
        embedding,
        accessCount: 0,
        helpfulCount: 0,
        unhelpfulCount: 0
      });

      console.log('[KB-ADD] Article added successfully:', savedArticle.id);
      return savedArticle;
    } catch (error) {
      console.error('[KB-ADD] Add article error:', error);
      throw new Error(`Failed to add article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update article and regenerate embedding if content changed
   */
  async updateArticle(
    id: string,
    updates: {
      title?: string;
      content?: string;
      category?: string;
      tags?: string[];
    }
  ): Promise<void> {
    try {
      console.log('[KB-UPDATE] Updating article:', id);

      // Get existing article
      const existing = await unifiedStorage.getAiKnowledgeBaseById(id);
      if (!existing) {
        throw new Error('Article not found');
      }

      // Check if we need to regenerate embedding
      const contentChanged = updates.title || updates.content;
      let embedding = existing.embedding;

      if (contentChanged) {
        const newTitle = updates.title || existing.title;
        const newContent = updates.content || existing.content;
        embedding = await this.getEmbedding(`${newTitle}\n\n${newContent}`);
      }

      // Update article
      await unifiedStorage.updateAiKnowledgeBase(id, {
        ...updates,
        embedding: embedding || undefined
      });

      console.log('[KB-UPDATE] Article updated successfully');
    } catch (error) {
      console.error('[KB-UPDATE] Update article error:', error);
      throw new Error(`Failed to update article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get article by ID
   */
  async getArticle(id: string): Promise<KnowledgeArticle | null> {
    try {
      const article = await unifiedStorage.getAiKnowledgeBaseById(id);
      
      if (article) {
        // Increment access count
        await unifiedStorage.updateAiKnowledgeBase(id, {
          accessCount: (article.accessCount || 0) + 1,
          lastAccessedAt: new Date()
        });
      }

      return article;
    } catch (error) {
      console.error('[KB-GET] Get article error:', error);
      return null;
    }
  }

  /**
   * Record feedback on article
   */
  async recordFeedback(
    id: string,
    helpful: boolean
  ): Promise<void> {
    try {
      const article = await unifiedStorage.getAiKnowledgeBaseById(id);
      if (!article) {
        throw new Error('Article not found');
      }

      const updates = helpful
        ? { helpfulCount: (article.helpfulCount || 0) + 1 }
        : { unhelpfulCount: (article.unhelpfulCount || 0) + 1 };

      await unifiedStorage.updateAiKnowledgeBase(id, updates);
    } catch (error) {
      console.error('[KB-FEEDBACK] Record feedback error:', error);
      throw error;
    }
  }

  /**
   * Generate answer using RAG (retrieve relevant articles then generate answer)
   */
  async generateAnswer(
    tenantId: string,
    question: string,
    agentPersonality: any
  ): Promise<{
    answer: string;
    sources: KnowledgeArticle[];
  }> {
    try {
      // Search for relevant articles
      const searchResults = await this.search(tenantId, question, 3);

      if (searchResults.articles.length === 0) {
        return {
          answer: 'Desculpe, não encontrei informações relevantes na base de conhecimento sobre esse assunto.',
          sources: []
        };
      }

      // Build context from top articles
      const context = searchResults.articles
        .map((article, idx) => `[Artigo ${idx + 1}] ${article.title}\n${article.content}`)
        .join('\n\n---\n\n');

      // Generate answer using context
      const systemPrompt = `You are a helpful assistant answering questions based on a knowledge base.
Personality: ${agentPersonality?.tone || 'professional'}
Language: ${agentPersonality?.language || 'pt-BR'}

Use the following articles from the knowledge base to answer the user's question.
If the answer is not in the articles, say so honestly.
Always cite which article(s) you used.

Knowledge Base Context:
${context}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ]
      });

      const answer = response.choices[0].message.content || 'Não foi possível gerar uma resposta.';

      return {
        answer,
        sources: searchResults.articles
      };
    } catch (error) {
      console.error('[KB-RAG] Generate answer error:', error);
      throw new Error(`Failed to generate answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Get embedding vector for text using OpenAI
   */
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('[KB-EMBEDDING] Embedding generation error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length === 0 || vecB.length === 0) {
      return 0;
    }

    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

// Export singleton instance
export const knowledgeBase = new KnowledgeBaseService();
