// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE TICKET TAB - CLEAN ARCHITECTURE
// React component following modern patterns with comprehensive functionality

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  BookOpen, 
  Search, 
  Star, 
  StarOff, 
  ExternalLink, 
  Tag,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Grid,
  List,
  Plus,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeBaseTicketTabProps {
  ticketId: string;
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  summary?: string;
  category: string;
  tags: string[];
  status: string;
  visibility: string;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<string, string> = {
  technical_support: 'Suporte Técnico',
  troubleshooting: 'Solução de Problemas',
  user_guide: 'Guia do Usuário',
  faq: 'FAQ',
  policy: 'Política',
  process: 'Processo',
  training: 'Treinamento',
  announcement: 'Anúncio',
  best_practice: 'Melhores Práticas',
  other: 'Outros'
};

export const KnowledgeBaseTicketTab: React.FC<KnowledgeBaseTicketTabProps> = ({ ticketId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('related');

  console.log('🔧 [KB-TAB] Rendering Knowledge Base tab for ticket:', ticketId);

  // Fetch articles related to this ticket
  const { data: relatedArticlesData, isLoading: relatedLoading } = useQuery({
    queryKey: [`/api/knowledge-base/tickets/${ticketId}/related`],
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000,
  });

  // Search articles
  const { data: searchResultsData, isLoading: searchLoading, refetch: searchArticles } = useQuery({
    queryKey: [`/api/knowledge-base/articles`, { 
      query: searchQuery, 
      category: selectedCategory,
      limit: 20
    }],
    enabled: false, // Manual trigger
    staleTime: 2 * 60 * 1000,
  });

  // Link article to ticket mutation
  const linkArticleMutation = useMutation({
    mutationFn: async ({ articleId, relationType }: { articleId: string, relationType?: string }) => {
      const response = await apiRequest('POST', `/api/knowledge-base/articles/${articleId}/link-ticket`, {
        ticketId,
        relationType: relationType || 'related'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Sucesso',
        description: 'Artigo vinculado ao ticket com sucesso'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/tickets/${ticketId}/related`] });
    },
    onError: (error: any) => {
      console.error('❌ [KB-TAB] Error linking article:', error);
      toast({ 
        title: '❌ Erro',
        description: 'Erro ao vincular artigo ao ticket',
        variant: 'destructive'
      });
    },
  });

  // Rate article mutation
  const rateArticleMutation = useMutation({
    mutationFn: async ({ articleId, rating }: { articleId: string, rating: number }) => {
      const response = await apiRequest('POST', `/api/knowledge-base/articles/${articleId}/rate`, {
        rating,
        feedback: ''
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Sucesso',
        description: 'Avaliação registrada com sucesso'
      });
      // Refresh both queries
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/tickets/${ticketId}/related`] });
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles`] });
    },
    onError: (error: any) => {
      console.error('❌ [KB-TAB] Error rating article:', error);
      toast({ 
        title: '❌ Erro',
        description: 'Erro ao avaliar artigo',
        variant: 'destructive'
      });
    },
  });

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim() || (selectedCategory && selectedCategory !== 'all')) {
      console.log('🔍 [KB-TAB] Searching articles:', { 
        query: searchQuery, 
        category: selectedCategory === 'all' ? '' : selectedCategory 
      });
      searchArticles();
      setActiveTab('search');
    }
  };

  // Handle Enter key in search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Render article card
  const renderArticleCard = (article: KnowledgeBaseArticle, showLinkButton = false) => {
    return (
      <Card key={article.id} className={`transition-all duration-200 hover:shadow-md ${viewMode === 'list' ? 'mb-2' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                {article.title}
              </CardTitle>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="outline" 
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  {categoryLabels[article.category] || article.category}
                </Badge>
                
                {article.tags?.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {article.summary && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {article.summary}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1 ml-4">
              {showLinkButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => linkArticleMutation.mutate({ articleId: article.id })}
                  disabled={linkArticleMutation.isPending}
                  className="text-xs h-7"
                  data-testid={`button-link-article-${article.id}`}
                >
                  {linkArticleMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <LinkIcon className="w-3 h-3 mr-1" />
                      Vincular
                    </>
                  )}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/knowledge-base/articles/${article.id}`, '_blank')}
                className="text-xs h-7"
                data-testid={`button-view-article-${article.id}`}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.viewCount}
              </span>
              
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => rateArticleMutation.mutate({ articleId: article.id, rating: 1 })}
                disabled={rateArticleMutation.isPending}
                className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                {article.upvoteCount}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => rateArticleMutation.mutate({ articleId: article.id, rating: -1 })}
                disabled={rateArticleMutation.isPending}
                className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                {article.downvoteCount}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const relatedArticles = (relatedArticlesData as any)?.success ? (relatedArticlesData as any).data : [];
  const searchResults = (searchResultsData as any)?.success ? (searchResultsData as any).data : [];

  return (
    <div className="space-y-6" data-testid="knowledge-base-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Base de Conhecimento</h2>
            <p className="text-sm text-gray-600">
              Artigos relacionados e busca na base de conhecimento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            data-testid="button-view-grid"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            data-testid="button-view-list"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar artigos na base de conhecimento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-white"
                data-testid="input-search-articles"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-search-articles"
            >
              {searchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-blue-700">
            💡 Dica: Use palavras-chave relacionadas ao problema para encontrar artigos relevantes
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="related" className="flex-1">
            <LinkIcon className="w-4 h-4 mr-2" />
            Artigos Relacionados ({relatedArticles.length})
          </TabsTrigger>
          <TabsTrigger value="search" className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Resultados da Busca ({searchResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="related" className="mt-6">
          <div className="space-y-4">
            {relatedLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">Carregando artigos relacionados...</span>
              </div>
            ) : relatedArticles.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                {relatedArticles.map((article: KnowledgeBaseArticle) => 
                  renderArticleCard(article, false)
                )}
              </div>
            ) : (
              <Card className="p-8 text-center text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium mb-2">Nenhum artigo relacionado</h3>
                <p className="text-sm">
                  Não há artigos da base de conhecimento vinculados a este ticket ainda.
                </p>
                <p className="text-sm mt-2">
                  Use a busca acima para encontrar e vincular artigos relevantes.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="space-y-4">
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">Pesquisando na base de conhecimento...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                {searchResults.map((article: KnowledgeBaseArticle) => 
                  renderArticleCard(article, true)
                )}
              </div>
            ) : activeTab === 'search' ? (
              <Card className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium mb-2">Nenhum resultado encontrado</h3>
                <p className="text-sm">
                  Tente usar termos de busca diferentes ou ajustar os filtros.
                </p>
              </Card>
            ) : (
              <Card className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium mb-2">Digite algo para pesquisar</h3>
                <p className="text-sm">
                  Use a barra de busca acima para encontrar artigos na base de conhecimento.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};