// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE TAB FOR TICKETS - CLEAN ARCHITECTURE
// Presentation layer - integrates Knowledge Base with Ticket system

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Link, Eye, ThumbsUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SuggestedArticle {
  id: string;
  title: string;
  summary?: string;
  relevanceScore: number;
  category: string;
  viewCount: number;
}

interface KnowledgeBaseTabProps {
  ticketId: string;
  category?: string;
  description?: string;
}

export function KnowledgeBaseTab({ ticketId, category, description }: KnowledgeBaseTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [linkedArticles, setLinkedArticles] = useState<string[]>([]);

  console.log('🔧 [KB-TAB] Rendering Knowledge Base tab for ticket:', ticketId);

  // Get suggested articles based on ticket content
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['/api/knowledge-base/ticket-suggestions', ticketId, category, description],
    queryFn: async () => {
      if (!ticketId || !category) return { relevantArticles: [] };
      
      const params = new URLSearchParams({
        ticketId,
        category: category || '',
        description: description || ''
      });
      
      const response = await apiRequest('GET', `/api/knowledge-base/ticket-suggestions?${params");
      const result = await response.json();
      return result.success ? result.data : { relevantArticles: [] };
    },
    enabled: !!ticketId && !!category
  });

  // Search articles manually
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/knowledge-base/articles', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { articles: [] };
      
      const params = new URLSearchParams({ q: searchQuery.trim() });
      const response = await apiRequest('GET', `/api/knowledge-base/articles?${params");
      const result = await response.json();
      return result.success ? result.data : { articles: [] };
    },
    enabled: searchQuery.trim().length > 2
  });

  const handleLinkArticle = async (articleId: string) => {
    try {
      const response = await apiRequest('POST', `/api/knowledge-base/articles/${articleId}/link-ticket`, {
        ticketId
      });
      
      const result = await response.json();
      if (result.success) {
        setLinkedArticles(prev => [...prev, articleId]);
      }
    } catch (error) {
      console.error('Failed to link article:', error);
    }
  };

  const renderArticleCard = (article: SuggestedArticle, isLinked = false) => (
    <Card key={article.id} className="mb-3" data-testid={`article-${article.id"}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            {article.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {'relevanceScore' in article && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(article.relevanceScore * 100)}% relevante
              </Badge>
            )}
          </div>
        </div>
        {article.summary && (
          <CardDescription className="text-xs">
            {article.summary}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.viewCount || 0} views
            </span>
            <Badge variant="outline" className="text-xs">
              {article.category}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/knowledge-base/${article.id", '_blank')}
              data-testid={`view-article-${article.id"}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
            {!isLinked && !linkedArticles.includes(article.id) && (
              <Button
                size="sm"
                onClick={() => handleLinkArticle(article.id)}
                data-testid={`link-article-${article.id"}
              >
                <Link className="h-3 w-3 mr-1" />
                Vincular
              </Button>
            )}
            {(isLinked || linkedArticles.includes(article.id)) && (
              <Badge variant="default" className="text-xs">
                <Link className="h-3 w-3 mr-1" />
                Vinculado
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4" data-testid="knowledge-base-tab">
      {/* Search Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar Artigos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Pesquisar na base de conhecimento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="kb-search-input"
            />
            <Button disabled={searchQuery.trim().length < 3} data-testid="kb-search-button">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Articles */}
      {suggestions?.relevantArticles?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            Artigos Sugeridos para este Ticket
          </h3>
          {suggestionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.relevantArticles.map((article: SuggestedArticle) => 
                renderArticleCard(article)
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchQuery.trim().length > 2 && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            Resultados da Busca: "{searchQuery}"
          </h3>
          {searchLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchResults?.articles?.length > 0 ? (
            <div className="space-y-2">
              {searchResults.articles.map((article: any) => 
                renderArticleCard({
                  ...article,
                  relevanceScore: 0
                })
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                Nenhum artigo encontrado para "{searchQuery}"
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!suggestions?.relevantArticles?.length && !searchQuery.trim() && (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">Base de Conhecimento</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Pesquise artigos relacionados ou veja sugestões automáticas baseadas no ticket
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}