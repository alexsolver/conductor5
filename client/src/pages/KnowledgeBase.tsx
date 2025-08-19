import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search, Plus, Filter, Eye, ThumbsUp, Calendar, User, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  access_level: 'public' | 'private' | 'restricted';
  author_id: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  published_at: string | null;
  view_count: number;
  helpful_count: number;
}

const categoryLabels = {
  'Suporte Técnico': 'Suporte Técnico',
  'Configuração': 'Configuração',
  'Troubleshooting': 'Resolução de Problemas', 
  'Políticas': 'Políticas',
  'Procedimentos': 'Procedimentos',
  'FAQ': 'Perguntas Frequentes',
  'Treinamento': 'Treinamento',
  'Integrações': 'Integrações'
};

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccess, setSelectedAccess] = useState("all");

  // Fetch articles
  const { data: articlesData, isLoading, error } = useQuery({
    queryKey: [`/api/knowledge-base/articles`, searchQuery, selectedCategory, selectedAccess],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedAccess && selectedAccess !== 'all') params.append('access_level', selectedAccess);
      
      const url = `/api/knowledge-base/articles${params.toString() ? '?' + params.toString() : ''}`;
      console.log('🔍 [KB-PAGE] Fetching articles:', url);
      
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  const articles = (articlesData as any)?.success ? (articlesData as any).data : [];

  const handleSearch = () => {
    // Query will automatically refetch due to dependency on searchQuery
    console.log('🔍 [KB-PAGE] Searching articles:', { query: searchQuery, category: selectedCategory });
  };

  const renderArticleCard = (article: Article) => {
    const stripHtml = (html: string) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || "";
    };

    return (
      <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`article-card-${article.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                {article.title}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {stripHtml(article.content).substring(0, 120)}...
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className="shrink-0 bg-blue-50 text-blue-700 border-blue-200"
            >
              {categoryLabels[article.category as keyof typeof categoryLabels] || article.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {article.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{article.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Article stats */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.view_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{article.helpful_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <Badge 
                variant={article.access_level === 'public' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {article.access_level === 'public' ? 'Público' : 
                 article.access_level === 'private' ? 'Privado' : 'Restrito'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12" data-testid="empty-state">
      <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {searchQuery || selectedCategory !== 'all' ? 'Nenhum artigo encontrado' : 'Nenhum artigo disponível'}
      </h3>
      <p className="mt-2 text-gray-500">
        {searchQuery || selectedCategory !== 'all' 
          ? 'Tente ajustar os filtros de pesquisa.'
          : 'Não há artigos publicados na base de conhecimento.'
        }
      </p>
      {(!searchQuery && selectedCategory === 'all') && (
        <Button className="mt-4" data-testid="button-create-first-article">
          <Plus className="w-4 h-4 mr-2" />
          Criar primeiro artigo
        </Button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8" data-testid="knowledge-base-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              Base de Conhecimento
            </h1>
            <p className="mt-2 text-gray-600">
              Encontre artigos, guias e documentação para resolver suas dúvidas.
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-article">
            <Plus className="w-4 h-4 mr-2" />
            Novo Artigo
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-white" data-testid="select-category">
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

            {/* Access Level Filter */}
            <Select value={selectedAccess} onValueChange={setSelectedAccess}>
              <SelectTrigger className="w-48 bg-white" data-testid="select-access">
                <SelectValue placeholder="Acesso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
                <SelectItem value="restricted">Restrito</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700" data-testid="button-search">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="text-center py-12" data-testid="error-state">
            <div className="text-red-600 mb-4">❌ Erro ao carregar artigos</div>
            <p className="text-gray-500">Tente novamente mais tarde.</p>
          </div>
        ) : articles.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600" data-testid="results-count">
                {articles.length} {articles.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
              </p>
            </div>
            <div className="space-y-4">
              {articles.map(renderArticleCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}