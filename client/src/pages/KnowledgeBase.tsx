import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  ThumbsUp, 
  Calendar, 
  User, 
  Tag,
  MessageSquare,
  Clock,
  CheckCircle,
  Upload,
  FileText,
  Layers,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreateArticleDialog } from "@/components/knowledge-base/CreateArticleDialog";

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  status: string;
  visibility: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  published_at: string | null;
  view_count: number;
  helpful_count: number;
  version?: number;
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
  const [activeTab, setActiveTab] = useState("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccess, setSelectedAccess] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [semanticSearch, setSemanticSearch] = useState(false);

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

  // Extract articles safely from response
  const articles = Array.isArray(articlesData?.data?.articles) 
    ? articlesData.data.articles 
    : Array.isArray(articlesData?.articles) 
    ? articlesData.articles 
    : Array.isArray(articlesData?.data) 
    ? articlesData.data 
    : [];

  console.log('🔍 [KB-DEBUG] Articles data structure:', { 
    articlesData, 
    extractedArticles: articles,
    isArray: Array.isArray(articles)
  });

  const handleSearch = () => {
    console.log('🔍 [KB-SEARCH] Performing search:', { searchQuery, selectedCategory, selectedAccess });
  };

  const EmptyState = () => (
    <div className="text-center py-16">
      <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Nenhum artigo disponível
      </h3>
      <p className="text-gray-600 mb-6">
        Não há artigos publicados na base de conhecimento.
      </p>
      {activeTab === "articles" && (
        <Button 
          className="bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-first-article"
        >
          <Plus className="w-4 h-4" />
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
              Base de Conhecimento Avançada
            </h1>
            <p className="mt-2 text-gray-600">
              Sistema completo com templates, aprovação, comentários, busca semântica e versionamento
            </p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-article"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Artigo
          </Button>
        </div>
      </div>

      {/* Advanced Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar artigos... (busca semântica disponível)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              
              <Button 
                variant={semanticSearch ? "default" : "outline"}
                onClick={() => setSemanticSearch(!semanticSearch)}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                {semanticSearch ? "Busca Semântica ON" : "Busca Tradicional"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 bg-white" data-testid="select-category">
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

              <Select value={selectedAccess} onValueChange={setSelectedAccess}>
                <SelectTrigger className="w-full sm:w-48 bg-white" data-testid="select-access">
                  <SelectValue placeholder="Acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="restricted">Restrito</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700" data-testid="button-search">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>

            {semanticSearch && (
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <Label className="font-medium text-blue-900">Busca Semântica Ativa</Label>
                </div>
                <p className="text-sm text-blue-700">
                  A busca semântica encontra artigos por significado, não apenas palavras-chave exatas.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs para Funcionalidades Avançadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="articles" className="gap-2">
            <FileText className="h-4 w-4" />
            Artigos
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Layers className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Aprovações
          </TabsTrigger>
          <TabsTrigger value="versions" className="gap-2">
            <Clock className="h-4 w-4" />
            Versões
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <Upload className="h-4 w-4" />
            Mídia
          </TabsTrigger>
        </TabsList>

        {/* Tab: Artigos */}
        <TabsContent value="articles">
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : articles.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article: Article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow" data-testid={`article-card-${article.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-2 flex-1">{article.title}</CardTitle>
                        <div className="flex flex-col gap-1">
                          <Badge variant={article.published ? "default" : "secondary"} className="text-xs">
                            {article.published ? 'Publicado' : 'Rascunho'}
                          </Badge>
                          {article.version && (
                            <Badge variant="outline" className="text-xs">
                              v{article.version}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {article.summary || 'Sem descrição disponível'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        <span>{article.category}</span>
                      </div>

                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{article.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpful_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            0
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent value="templates">
          <div className="text-center py-16">
            <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sistema de Templates</h3>
            <p className="text-gray-600 mb-6">
              Crie templates reutilizáveis para padronizar artigos
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              Criar Template
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Aprovações */}
        <TabsContent value="approvals">
          <div className="text-center py-16">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Workflow de Aprovação</h3>
            <p className="text-gray-600 mb-6">
              Sistema de aprovação hierárquica para garantir qualidade
            </p>
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurar Workflow
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Versões */}
        <TabsContent value="versions">
          <div className="text-center py-16">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Controle de Versões</h3>
            <p className="text-gray-600 mb-6">
              Histórico completo de alterações e versionamento automático
            </p>
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" />
              Ver Histórico
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Mídia */}
        <TabsContent value="media">
          <div className="text-center py-16">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload de Mídia</h3>
            <p className="text-gray-600 mb-6">
              Faça upload de imagens, vídeos e documentos para seus artigos
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Upload className="w-4 h-4" />
              Fazer Upload
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Article Dialog */}
      <CreateArticleDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}