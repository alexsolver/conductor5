
// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE TAGS INTELLIGENCE SERVICE - CLEAN ARCHITECTURE
// Domain service for intelligent tag suggestions and management

import { Logger } from 'winston';

export interface TagSuggestion {
  tag: string;
  confidence: number;
  source: 'content_analysis' | 'category_pattern' | 'user_history' | 'trending';
  reason: string;
}

export interface TagAnalytics {
  tag: string;
  usageCount: number;
  articlesCount: number;
  categories: string[];
  trend: 'rising' | 'stable' | 'declining';
  relatedTags: string[];
}

export interface SmartTaggingResult {
  suggestedTags: TagSuggestion[];
  autoTags: string[];
  similarArticles: Array<{
    id: string;
    title: string;
    similarity: number;
    commonTags: string[];
  }>;
}

export class TagsIntelligenceService {
  constructor(
    private logger: Logger
  ) {}

  async suggestTags(
    content: string, 
    title: string, 
    category: string,
    tenantId: string
  ): Promise<SmartTaggingResult> {
    try {
      this.logger.info(`🏷️ [TAGS-AI] Analyzing content for intelligent tag suggestions`);

      const suggestions: TagSuggestion[] = [];
      const autoTags: string[] = [];

      // 1. Content-based analysis
      const contentTags = await this.analyzeContentForTags(content, title);
      suggestions.push(...contentTags);

      // 2. Category-based patterns
      const categoryTags = await this.getCategoryBasedTags(category, tenantId);
      suggestions.push(...categoryTags);

      // 3. Historical user patterns
      const historicalTags = await this.getUserHistoricalTags(tenantId);
      suggestions.push(...historicalTags);

      // 4. Trending tags
      const trendingTags = await this.getTrendingTags(tenantId);
      suggestions.push(...trendingTags);

      // 5. Auto-tag high confidence suggestions
      autoTags.push(...suggestions
        .filter(s => s.confidence > 0.8)
        .map(s => s.tag)
      );

      // 6. Find similar articles
      const similarArticles = await this.findSimilarArticles(content, title, tenantId);

      return {
        suggestedTags: this.rankAndDeduplicateTags(suggestions),
        autoTags: [...new Set(autoTags)],
        similarArticles
      };

    } catch (error) {
      this.logger.error(`❌ [TAGS-AI] Tag suggestion failed: ${error}`);
      throw error;
    }
  }

  async getTagAnalytics(tenantId: string): Promise<TagAnalytics[]> {
    try {
      this.logger.info(`📊 [TAGS-AI] Generating tag analytics for tenant: ${tenantId}`);

      // Mock analytics - in real implementation, query database
      const mockAnalytics: TagAnalytics[] = [
        {
          tag: 'troubleshooting',
          usageCount: 45,
          articlesCount: 28,
          categories: ['technical_support', 'troubleshooting'],
          trend: 'rising',
          relatedTags: ['problem-solving', 'debugging', 'technical-issues']
        },
        {
          tag: 'user-guide',
          usageCount: 38,
          articlesCount: 22,
          categories: ['user_guide', 'faq'],
          trend: 'stable',
          relatedTags: ['tutorial', 'instructions', 'how-to']
        },
        {
          tag: 'api',
          usageCount: 32,
          articlesCount: 18,
          categories: ['technical_support', 'best_practice'],
          trend: 'rising',
          relatedTags: ['integration', 'development', 'technical']
        }
      ];

      return mockAnalytics;

    } catch (error) {
      this.logger.error(`❌ [TAGS-AI] Analytics generation failed: ${error}`);
      throw error;
    }
  }

  async optimizeTagStructure(tenantId: string): Promise<{
    duplicates: Array<{ original: string; suggested: string; reason: string }>;
    orphaned: string[];
    suggestions: Array<{ action: string; description: string }>;
  }> {
    try {
      this.logger.info(`🔧 [TAGS-AI] Optimizing tag structure for tenant: ${tenantId}`);

      // Find duplicate/similar tags
      const duplicates = await this.findDuplicateTags(tenantId);
      
      // Find orphaned tags (unused)
      const orphaned = await this.findOrphanedTags(tenantId);
      
      // Generate optimization suggestions
      const suggestions = [
        {
          action: 'merge_similar',
          description: `Merge ${duplicates.length} similar tag pairs to improve consistency`
        },
        {
          action: 'remove_orphaned',
          description: `Remove ${orphaned.length} unused tags to clean up tag list`
        },
        {
          action: 'create_hierarchy',
          description: 'Create tag hierarchies for better organization'
        }
      ];

      return { duplicates, orphaned, suggestions };

    } catch (error) {
      this.logger.error(`❌ [TAGS-AI] Tag optimization failed: ${error}`);
      throw error;
    }
  }

  private async analyzeContentForTags(content: string, title: string): Promise<TagSuggestion[]> {
    const suggestions: TagSuggestion[] = [];
    const text = `${title} ${content}`.toLowerCase();

    // Technical keywords
    const technicalKeywords = [
      { words: ['api', 'rest', 'endpoint'], tag: 'api', confidence: 0.9 },
      { words: ['database', 'sql', 'query'], tag: 'database', confidence: 0.85 },
      { words: ['error', 'bug', 'issue'], tag: 'troubleshooting', confidence: 0.8 },
      { words: ['install', 'setup', 'configure'], tag: 'installation', confidence: 0.75 },
      { words: ['tutorial', 'guide', 'how-to'], tag: 'tutorial', confidence: 0.9 }
    ];

    for (const keyword of technicalKeywords) {
      if (keyword.words.some(word => text.includes(word))) {
        suggestions.push({
          tag: keyword.tag,
          confidence: keyword.confidence,
          source: 'content_analysis',
          reason: `Detected relevant keywords: ${keyword.words.join(', ')}`
        });
      }
    }

    return suggestions;
  }

  private async getCategoryBasedTags(category: string, tenantId: string): Promise<TagSuggestion[]> {
    const categoryMappings: Record<string, string[]> = {
      'technical_support': ['support', 'technical', 'help'],
      'troubleshooting': ['problem-solving', 'debugging', 'fix'],
      'user_guide': ['guide', 'tutorial', 'instructions'],
      'faq': ['frequently-asked', 'common-questions'],
      'policy': ['guidelines', 'rules', 'compliance'],
      'process': ['workflow', 'procedure', 'steps']
    };

    const tags = categoryMappings[category] || [];
    return tags.map(tag => ({
      tag,
      confidence: 0.7,
      source: 'category_pattern' as const,
      reason: `Common tag for ${category} category`
    }));
  }

  private async getUserHistoricalTags(tenantId: string): Promise<TagSuggestion[]> {
    // Mock user historical patterns
    return [
      {
        tag: 'internal-process',
        confidence: 0.6,
        source: 'user_history',
        reason: 'Frequently used by this tenant'
      }
    ];
  }

  private async getTrendingTags(tenantId: string): Promise<TagSuggestion[]> {
    // Mock trending tags
    return [
      {
        tag: 'remote-work',
        confidence: 0.5,
        source: 'trending',
        reason: 'Rising in popularity across articles'
      }
    ];
  }

  private async findSimilarArticles(content: string, title: string, tenantId: string) {
    // Mock similar articles - in real implementation, use vector similarity or full-text search
    return [
      {
        id: '1',
        title: 'Similar Article Example',
        similarity: 0.75,
        commonTags: ['tutorial', 'guide']
      }
    ];
  }

  private rankAndDeduplicateTags(suggestions: TagSuggestion[]): TagSuggestion[] {
    const tagMap = new Map<string, TagSuggestion>();

    // Deduplicate and keep highest confidence
    for (const suggestion of suggestions) {
      const existing = tagMap.get(suggestion.tag);
      if (!existing || suggestion.confidence > existing.confidence) {
        tagMap.set(suggestion.tag, suggestion);
      }
    }

    // Sort by confidence
    return Array.from(tagMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Top 10 suggestions
  }

  private async findDuplicateTags(tenantId: string) {
    // Mock duplicate detection
    return [
      {
        original: 'how-to',
        suggested: 'tutorial',
        reason: 'Similar meaning and usage pattern'
      }
    ];
  }

  private async findOrphanedTags(tenantId: string): Promise<string[]> {
    // Mock orphaned tags
    return ['unused-tag-1', 'old-category'];
  }
}
