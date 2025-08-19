import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  MessageSquare, 
  Star, 
  Upload,
  FileText,
  CheckCircle,
  Clock,
  Layers,
  Tag,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TemplateSelector } from "./TemplateSelector";
import { PublicationScheduler } from "./PublicationScheduler";
import { CommentsSection } from "./CommentsSection";
import { FileUploadZone } from "./FileUploadZone";
import { AdvancedArticleEditor } from "./AdvancedArticleEditor";

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived';
  visibility: 'public' | 'internal' | 'restricted';
  authorId: string;
  reviewerId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  viewCount: number;
  helpfulCount: number;
  upvoteCount: number;
  version: number;
  approvalStatus: string;
  attachments?: any[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: any[];
  defaultTags: string[];
  isActive: boolean;
}

interface SemanticSearchFilters {
  similarity: number;
  contentType: string;
  dateRange: string;
  includeArchived: boolean;
}

export default function AdvancedKnowledgeBaseManager() {
  const [activeTab, setActiveTab] = useState("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [semanticSearch, setSemanticSearch] = useState(false);
  const [semanticFilters, setSemanticFilters] = useState<SemanticSearchFilters>({
    similarity: 0.8,
    contentType: 'all',
    dateRange: 'all',
    includeArchived: false
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const queryClient = useQueryClient();

  // ========================================
  // 1. SISTEMA DE TEMPLATES
  // ========================================
  const { data: templates } = useQuery({
    queryKey: ['/api/knowledge-base/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/knowledge-base/templates');
      return response.json();
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/knowledge-base/templates', templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/templates'] });
      toast({ title: "Template criado com sucesso!" });
    },
  });

  // ========================================
  // 2. BUSCA SEMÂNTICA 
  // ========================================
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/knowledge-base/search', searchQuery, semanticSearch, semanticFilters],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      
      const params = new URLSearchParams({
        q: searchQuery,
        semantic: semanticSearch.toString(),
        similarity: semanticFilters.similarity.toString(),
        contentType: semanticFilters.contentType,
        dateRange: semanticFilters.dateRange,
        includeArchived: semanticFilters.includeArchived.toString()
      });
      
      const response = await apiRequest('GET', `/api/knowledge-base/search?${params}`);
      return response.json();
    },
    enabled: !!searchQuery.trim(),
  });

  // ========================================
  // 3. ARTIGOS COM FUNCIONALIDADES AVANÇADAS
  // ========================================
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['/api/knowledge-base/articles', selectedCategory, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await apiRequest('GET', `/api/knowledge-base/articles?${params}`);
      return response.json();
    },
  });

  // ========================================
  // 4. WORKFLOW DE APROVAÇÃO
  // ========================================
  const approveArticleMutation = useMutation({
    mutationFn: async ({ articleId, comments }: { articleId: string; comments?: string }) => {
      const response = await apiRequest('POST', `/api/knowledge-base/articles/${articleId}/approve`, {
        comments
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      toast({ title: "Artigo aprovado com sucesso!" });
    },
  });

  const rejectArticleMutation = useMutation({
    mutationFn: async ({ articleId, comments }: { articleId: string; comments: string }) => {
      const response = await apiRequest('POST', `/api/knowledge-base/articles/${articleId}/reject`, {
        comments
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      toast({ title: "Artigo rejeitado. Feedback enviado ao autor." });
    },
  });

  // ========================================
  // 5. SISTEMA DE VERSIONAMENTO
  // ========================================
  const { data: articleVersions } = useQuery({
    queryKey: ['/api/knowledge-base/versions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/knowledge-base/versions');
      return response.json();
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: async ({ articleId, changeDescription }: { articleId: string; changeDescription: string }) => {
      const response = await apiRequest('POST', `/api/knowledge-base/articles/${articleId}/versions`, {
        changeDescription
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/versions'] });
      toast({ title: "Nova versão criada com sucesso!" });
    },
  });

  // ========================================
  // RENDER - INTERFACE AVANÇADA
  // ========================================
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header com Controles Avançados */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Base de Conhecimento Avançada
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistema completo com templates, aprovação, comentários, busca semântica e versionamento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4" />
                Novo Artigo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Artigo</DialogTitle>
                <DialogDescription>
                  Use templates, agende publicação e configure aprovação
                </DialogDescription>
              </DialogHeader>
              <AdvancedArticleEditor />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barra de Busca com Busca Semântica */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar artigos... (use busca semântica para resultados mais inteligentes)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant={semanticSearch ? "default" : "outline"}
                onClick={() => setSemanticSearch(!semanticSearch)}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                {semanticSearch ? "Busca Semântica ON" : "Busca Semântica OFF"}
              </Button>
            </div>
            
            {/* Filtros Avançados */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                      <SelectItem value="FAQ">FAQ</SelectItem>
                      <SelectItem value="Procedimentos">Procedimentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {semanticSearch && (
                  <>
                    <div className="space-y-2">
                      <Label>Similaridade Mínima</Label>
                      <Input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.1"
                        value={semanticFilters.similarity}
                        onChange={(e) => setSemanticFilters({
                          ...semanticFilters,
                          similarity: parseFloat(e.target.value)
                        })}
                      />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(semanticFilters.similarity * 100)}%
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Switch
                          checked={semanticFilters.includeArchived}
                          onCheckedChange={(checked) => setSemanticFilters({
                            ...semanticFilters,
                            includeArchived: checked
                          })}
                        />
                        Incluir Arquivados
                      </Label>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
          <TabsTrigger value="analytics" className="gap-2">
            <Settings className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tab: Artigos */}
        <TabsContent value="articles" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Array.isArray(articlesData?.data?.articles) ? articlesData.data.articles : []).map((article: Article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                      <Badge variant={
                        article.status === 'published' ? 'default' :
                        article.status === 'pending_approval' ? 'secondary' :
                        article.status === 'approved' ? 'secondary' : 'outline'
                      }>
                        {article.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {article.summary || 'Sem descrição disponível'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
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
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {article.helpfulCount} úteis
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {article.upvoteCount} votos
                        </span>
                        <span>v{article.version}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Visualizar
                        </Button>
                        {article.status === 'pending_approval' && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => approveArticleMutation.mutate({ articleId: article.id })}
                              className="px-2"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="px-2"
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gerenciar Templates</h2>
            <Button className="gap-2" onClick={() => {}}>
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Array.isArray(templates?.data) ? templates.data : []).map((template: Template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {template.name}
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span className="text-sm">{template.category}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.defaultTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      Usar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Aprovações */}
        <TabsContent value="approvals" className="space-y-4">
          <h2 className="text-xl font-semibold">Workflow de Aprovação</h2>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Funcionalidade de aprovação integrada nos artigos</p>
            <p className="text-sm">Os artigos pendentes aparecem na aba "Artigos" com botões de aprovação</p>
          </div>
        </TabsContent>

        {/* Tab: Versões */}
        <TabsContent value="versions" className="space-y-4">
          <h2 className="text-xl font-semibold">Controle de Versões</h2>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sistema de versionamento automático</p>
            <p className="text-sm">Cada alteração cria uma nova versão automaticamente</p>
          </div>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">Analytics e Relatórios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Artigos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articlesData?.data?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Base de conhecimento</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {(Array.isArray(articlesData?.data?.articles) ? articlesData.data.articles : []).filter((a: Article) => a.status === 'pending_approval').length}
                </div>
                <p className="text-xs text-muted-foreground">Precisam de revisão</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Templates Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(Array.isArray(templates?.data) ? templates.data : []).filter((t: Template) => t.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">Disponíveis para uso</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Visualizações Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(Array.isArray(articlesData?.data?.articles) ? articlesData.data.articles : []).reduce((acc: number, a: Article) => acc + a.viewCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Acessos realizados</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}