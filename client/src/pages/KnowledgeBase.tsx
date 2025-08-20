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
import { TemplateCreateDialog } from "@/components/knowledge-base/TemplateCreateDialog";
import { MediaUploadDialog } from "@/components/knowledge-base/MediaUploadDialog";
import { WorkflowConfigurationDialog } from "@/components/knowledge-base/WorkflowConfigurationDialog";

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
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [semanticSearch, setSemanticSearch] = useState(false);

  // Fetch articles
  const { data: articlesData, isLoading, error } = useQuery({
    queryKey: [`/api/knowledge-base/articles`, searchQuery, selectedCategory, selectedAccess],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedAccess && selectedAccess !== 'all') params.append('access_level', selectedAccess);
      
      const url = "
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
    <div className=""
      <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className=""
        Nenhum artigo disponível
      </h3>
      <p className=""
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
    <div className="container mx-auto px-4 py-8" data-testid="knowledge-base-page>
      {/* Header */}
      <div className=""
        <div className=""
          <div>
            <h1 className=""
              <BookOpen className="h-8 w-8 text-blue-600" />
              Base de Conhecimento Avançada
            </h1>
            <p className=""
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
      <Card className=""
        <CardContent className=""
          <div className=""
            <div className=""
              <div className=""
                <div className=""
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
                variant={semanticSearch ? "default" : "outline"
                onClick={() => setSemanticSearch(!semanticSearch)}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                {semanticSearch ? "Busca Semântica ON" : "Busca Tradicional"
              </Button>
            </div>

            <div className=""
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 bg-white" data-testid="select-category>
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
                <SelectTrigger className="w-full sm:w-48 bg-white" data-testid="select-access>
                  <SelectValue placeholder="Acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="restricted">Restrito</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700" data-testid="button-search>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>

            {semanticSearch && (
              <div className=""
                <div className=""
                  <Layers className="h-4 w-4 text-blue-600" />
                  <Label className="font-medium text-blue-900">Busca Semântica Ativa</Label>
                </div>
                <p className=""
                  A busca semântica encontra artigos por significado, não apenas palavras-chave exatas.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs para Funcionalidades Avançadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className=""
        <TabsList className=""
          <TabsTrigger value="articles" className=""
            <FileText className="h-4 w-4" />
            Artigos
          </TabsTrigger>
          <TabsTrigger value="templates" className=""
            <Layers className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="approvals" className=""
            <CheckCircle className="h-4 w-4" />
            Aprovações
          </TabsTrigger>
          <TabsTrigger value="versions" className=""
            <Clock className="h-4 w-4" />
            Versões
          </TabsTrigger>
          <TabsTrigger value="media" className=""
            <Upload className="h-4 w-4" />
            Mídia
          </TabsTrigger>
        </TabsList>

        {/* Tab: Artigos */}
        <TabsContent value="articles>
          <div className=""
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
              <div className=""
                {articles.map((article: Article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow" data-testid={"
                    <CardHeader className=""
                      <div className=""
                        <CardTitle className="text-lg line-clamp-2 flex-1">{article.title}</CardTitle>
                        <div className=""
                          <Badge variant={article.published ? "default" : "secondary"} className=""
                            {article.published ? 'Publicado' : 'Rascunho'}
                          </Badge>
                          {article.version && (
                            <Badge variant="outline" className=""
                              v{article.version}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className=""
                        {article.summary || 'Sem descrição disponível'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className=""
                      <div className=""
                        <Tag className="h-3 w-3" />
                        <span>{article.category}</span>
                      </div>

                      {article.tags && article.tags.length > 0 && (
                        <div className=""
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className=""
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="outline" className=""
                              +{article.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className=""
                        <div className=""
                          <span className=""
                            <Eye className="h-3 w-3" />
                            {article.view_count || 0}
                          </span>
                          <span className=""
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpful_count || 0}
                          </span>
                          <span className=""
                            <MessageSquare className="h-3 w-3" />
                            0
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className=""
                        <Button size="sm" variant="outline" className=""
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline>
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
        <TabsContent value="templates>
          <div className=""
            <div className=""
              <div>
                <h3 className="text-xl font-semibold">Templates Disponíveis</h3>
                <p className="text-gray-600">Gerencie templates reutilizáveis para artigos</p>
              </div>
              <TemplateCreateDialog />
            </div>
            
            <div className=""
              <Card className=""
                <CardHeader>
                  <CardTitle className=""
                    <Layers className="h-5 w-5 text-blue-600" />
                    Template FAQ
                  </CardTitle>
                  <CardDescription>
                    Template padrão para artigos de perguntas frequentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className=""
                    <Badge variant="outline">FAQ</Badge>
                    <Button size="sm" variant="outline">Usar Template</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Aprovações */}
        <TabsContent value="approvals>
          <div className=""
            <div className=""
              <div>
                <h3 className="text-xl font-semibold">Workflow de Aprovação</h3>
                <p className="text-gray-600">Gerencie artigos pendentes de aprovação</p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => setIsWorkflowDialogOpen(true)}
                data-testid="button-configure-workflow"
              >
                <Settings className="w-4 h-4" />
                Configurar Workflow
              </Button>
            </div>
            
            <div className=""
              <Card>
                <CardHeader className=""
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">0</div>
                  <p className="text-xs text-muted-foreground">Aguardando revisão</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className=""
                  <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <p className="text-xs text-muted-foreground">Prontos para publicação</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className=""
                  <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <p className="text-xs text-muted-foreground">Precisam de revisão</p>
                </CardContent>
              </Card>
            </div>

            <div className=""
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum artigo pendente de aprovação no momento</p>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Versões */}
        <TabsContent value="versions>
          <div className=""
            <div className=""
              <div>
                <h3 className="text-xl font-semibold">Controle de Versões</h3>
                <p className="text-gray-600">Histórico de alterações dos artigos</p>
              </div>
              <Button variant="outline" className="gap-2" data-testid="button-view-history>
                <Clock className="w-4 h-4" />
                Ver Histórico
              </Button>
            </div>

            <div className=""
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=""
                    <div className=""
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className=""
                        <p className="text-sm font-medium">Sistema inicializado</p>
                        <p className="text-xs text-gray-500">Controle de versões ativo</p>
                      </div>
                      <Badge variant="outline" className="text-xs">v1.0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Mídia */}
        <TabsContent value="media>
          <div className=""
            <div className=""
              <div>
                <h3 className="text-xl font-semibold">Biblioteca de Mídia</h3>
                <p className="text-gray-600">Gerencie imagens, vídeos e documentos</p>
              </div>
              <MediaUploadDialog />
            </div>

            <div className=""
              <Card>
                <CardHeader className=""
                  <CardTitle className="text-sm font-medium">Imagens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className=""
                  <CardTitle className="text-sm font-medium">Vídeos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <p className="text-xs text-muted-foreground">MP4, WebM</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className=""
                  <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <p className="text-xs text-muted-foreground">PDF, DOC</p>
                </CardContent>
              </Card>
            </div>

            <div className=""
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum arquivo de mídia enviado ainda</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Article Dialog */}
      <CreateArticleDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {/* Workflow Configuration Dialog */}
      <WorkflowConfigurationDialog
        isOpen={isWorkflowDialogOpen}
        onClose={() => setIsWorkflowDialogOpen(false)}
      />
    </div>
  );
}