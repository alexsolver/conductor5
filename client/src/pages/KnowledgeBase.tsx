import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Star, 
  MessageCircle, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock,
  Filter,
  Tag,
  Heart,
  Share2,
  ThumbsUp,
  Calendar,
  User,
  AlertTriangle,
  HelpCircle,
  Wrench,
  Shield,
  Folder,
  PenTool
} from "lucide-react";

// Importar componentes avançados (lazy loading para melhor performance)
const RichTextEditor = ({ content, onChange, placeholder }: { content: string; onChange: (content: string) => void; placeholder: string }) => {
  const [editorContent, setEditorContent] = useState(content);
  
  return (
    <div className="min-h-[200px] p-4 border rounded-md bg-white">
      <div className="mb-4 border-b pb-2">
        <div className="flex gap-2 flex-wrap">
          <Button type="button" size="sm" variant="outline">
            <strong>B</strong>
          </Button>
          <Button type="button" size="sm" variant="outline">
            <em>I</em>
          </Button>
          <Button type="button" size="sm" variant="outline">
            <u>U</u>
          </Button>
          <Button type="button" size="sm" variant="outline">
            H1
          </Button>
          <Button type="button" size="sm" variant="outline">
            H2
          </Button>
          <Button type="button" size="sm" variant="outline">
            Lista
          </Button>
          <Button type="button" size="sm" variant="outline">
            Link
          </Button>
        </div>
      </div>
      <Textarea 
        value={editorContent}
        onChange={(e) => {
          setEditorContent(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="min-h-[150px] border-0 resize-none focus:ring-0"
      />
    </div>
  );
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  isActive: boolean;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: string;
  type: string;
  difficulty: string;
  estimatedReadTime: number;
  viewCount: number;
  likeCount: number;
  averageRating: string;
  ratingCount: number;
  tags: string[];
  publishedAt: string;
  createdAt: string;
  categoryId: string;
}

interface ArticleWithCategory extends Article {
  category: Category;
}

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithCategory | null>(null);
  const [isViewArticleOpen, setIsViewArticleOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar categorias
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/knowledge-base/categories"],
    retry: 1
  });

  // Buscar artigos
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ["/api/knowledge-base/articles", { 
      search: searchQuery,
      categoryId: selectedCategory,
      type: selectedType
    }],
    retry: 1
  });

  // Buscar analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/knowledge-base/analytics"],
    retry: 1
  });

  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  const articles = Array.isArray(articlesData?.data) ? articlesData.data : [];
  const analytics = analyticsData?.data || {};

  // Ícones por categoria
  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'Wrench': Wrench,
      'AlertTriangle': AlertTriangle,
      'HelpCircle': HelpCircle,
      'BookOpen': BookOpen,
      'Shield': Shield,
      'Folder': Folder
    };
    const Icon = icons[iconName] || BookOpen;
    return <Icon className="h-5 w-5" />;
  };

  // Cores por dificuldade
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mutation para criar artigo
  const createArticleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/knowledge-base/articles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/articles"] });
      setIsCreateArticleOpen(false);
      toast({ title: "Artigo criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar artigo", variant: "destructive" });
    }
  });

  // Mutation para criar categoria
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/knowledge-base/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/categories"] });
      setIsCreateCategoryOpen(false);
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar categoria", variant: "destructive" });
    }
  });

  const handleCreateArticle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const articleData = {
      title: formData.get('title'),
      summary: formData.get('summary'),
      content: formData.get('content'),
      categoryId: formData.get('categoryId'),
      type: formData.get('type'),
      difficulty: formData.get('difficulty'),
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()) || [],
      status: 'published',
      estimatedReadTime: parseInt(formData.get('estimatedReadTime') as string) || 5
    };

    createArticleMutation.mutate(articleData);
  };

  const handleCreateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const categoryData = {
      name: formData.get('name'),
      description: formData.get('description'),
      icon: formData.get('icon'),
      color: formData.get('color') || '#3B82F6',
      level: 0,
      sortOrder: 0
    };

    createCategoryMutation.mutate(categoryData);
  };

  const handleViewArticle = (article: ArticleWithCategory) => {
    setSelectedArticle(article);
    setIsViewArticleOpen(true);
  };

  // Dashboard com estatísticas
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Artigos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.stats?.totalArticles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.stats?.publishedArticles || 0} publicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.stats?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground">Em todos os artigos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.stats?.averageRating ? Number(analytics.stats.averageRating).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">De 5.0 estrelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Categorias ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Artigos mais visualizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Artigos Mais Visualizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.mostViewed?.slice(0, 5).map((article: any, index: number) => (
              <div key={article.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{article.title}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.viewCount} visualizações
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {Number(article.averageRating).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Lista de categorias
  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Categorias</h2>
        <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Categoria</DialogTitle>
              <DialogDescription>Adicione uma nova categoria para organizar o conhecimento</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Ícone</Label>
                  <Select name="icon">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar ícone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wrench">Wrench</SelectItem>
                      <SelectItem value="AlertTriangle">AlertTriangle</SelectItem>
                      <SelectItem value="HelpCircle">HelpCircle</SelectItem>
                      <SelectItem value="BookOpen">BookOpen</SelectItem>
                      <SelectItem value="Shield">Shield</SelectItem>
                      <SelectItem value="Folder">Folder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <Input id="color" name="color" type="color" defaultValue="#3B82F6" />
                </div>
              </div>
              <Button type="submit" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category: Category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: category.color + '20' }}>
                  {getCategoryIcon(category.icon)}
                </div>
                {category.name}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Nível {category.level}</span>
                <Badge variant={category.isActive ? "default" : "secondary"}>
                  {category.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Lista de artigos
  const renderArticles = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Artigos</h2>
        <div className="flex gap-3">
          <Dialog open={isCreateArticleOpen} onOpenChange={setIsCreateArticleOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <PenTool className="h-5 w-5 mr-2" />
                Editor de Artigos Completo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Editor de Artigos Completo
                </DialogTitle>
                <DialogDescription>
                  Crie artigos ricos com formatação avançada, anexos e configurações personalizadas
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="summary">Resumo</Label>
                  <Textarea id="summary" name="summary" rows={2} />
                </div>
                <div>
                  <Label htmlFor="content">Conteúdo *</Label>
                  <div className="border rounded-md">
                    <RichTextEditor 
                      content=""
                      onChange={(content) => {
                        const hiddenInput = document.getElementById('hidden-content') as HTMLInputElement;
                        if (hiddenInput) hiddenInput.value = content;
                      }}
                      placeholder="Digite o conteúdo do artigo..."
                    />
                    <input type="hidden" id="hidden-content" name="content" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoryId">Categoria *</Label>
                    <Select name="categoryId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type">
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo do artigo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="procedure">Procedimento</SelectItem>
                        <SelectItem value="troubleshooting">Solução de Problemas</SelectItem>
                        <SelectItem value="faq">FAQ</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="policy">Política</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Dificuldade</Label>
                    <Select name="difficulty">
                      <SelectTrigger>
                        <SelectValue placeholder="Nível de dificuldade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Iniciante</SelectItem>
                        <SelectItem value="intermediate">Intermediário</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estimatedReadTime">Tempo de Leitura (min)</Label>
                    <Input id="estimatedReadTime" name="estimatedReadTime" type="number" min="1" defaultValue="5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input id="tags" name="tags" placeholder="tag1, tag2, tag3" />
                </div>
                
                <div className="space-y-2">
                  <Label>Anexos</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input type="file" multiple className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Clique para fazer upload ou arraste arquivos aqui</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, PNG, JPG (máx. 10MB cada)</p>
                    </label>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-900">Configurações Avançadas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="featured" name="featured" />
                      <Label htmlFor="featured">Artigo em destaque</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="allowComments" name="allowComments" defaultChecked />
                      <Label htmlFor="allowComments">Permitir comentários</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="sendNotification" name="sendNotification" defaultChecked />
                      <Label htmlFor="sendNotification">Notificar assinantes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="indexable" name="indexable" defaultChecked />
                      <Label htmlFor="indexable">Indexável na busca</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t">
                  <Button type="submit" disabled={createArticleMutation.isPending} className="flex-1">
                    <PenTool className="h-4 w-4 mr-2" />
                    {createArticleMutation.isPending ? "Criando..." : "Criar e Publicar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateArticleOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar artigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category: Category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="procedure">Procedimento</SelectItem>
            <SelectItem value="troubleshooting">Solução de Problemas</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="policy">Política</SelectItem>
            <SelectItem value="tutorial">Tutorial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de artigos */}
      <div className="grid grid-cols-1 gap-4">
        {articles.map((article: ArticleWithCategory) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2">
                    {article.category && (
                      <div className="p-1 rounded" style={{ backgroundColor: article.category.color + '20' }}>
                        {getCategoryIcon(article.category.icon)}
                      </div>
                    )}
                    {article.title}
                  </CardTitle>
                  <CardDescription>{article.summary}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewArticle(article)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Badge variant="outline">{article.category?.name}</Badge>
                <Badge className={getDifficultyColor(article.difficulty)}>
                  {article.difficulty === 'beginner' && 'Iniciante'}
                  {article.difficulty === 'intermediate' && 'Intermediário'}
                  {article.difficulty === 'advanced' && 'Avançado'}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.estimatedReadTime}min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {Number(article.averageRating).toFixed(1)} ({article.ratingCount})
                </span>
              </div>
              {article.tags && article.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {article.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Base de Conhecimento
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema centralizado de documentação e conhecimento técnico
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="articles">Artigos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="articles" className="mt-6">
          {renderArticles()}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          {renderCategories()}
        </TabsContent>
      </Tabs>

      {/* Modal de visualização de artigo */}
      <Dialog open={isViewArticleOpen} onOpenChange={setIsViewArticleOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedArticle.category && (
                    <div className="p-1 rounded" style={{ backgroundColor: selectedArticle.category.color + '20' }}>
                      {getCategoryIcon(selectedArticle.category.icon)}
                    </div>
                  )}
                  {selectedArticle.title}
                </DialogTitle>
                <DialogDescription>{selectedArticle.summary}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <Badge variant="outline">{selectedArticle.category?.name}</Badge>
                  <Badge className={getDifficultyColor(selectedArticle.difficulty)}>
                    {selectedArticle.difficulty === 'beginner' && 'Iniciante'}
                    {selectedArticle.difficulty === 'intermediate' && 'Intermediário'}
                    {selectedArticle.difficulty === 'advanced' && 'Avançado'}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedArticle.estimatedReadTime}min de leitura
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {selectedArticle.viewCount} visualizações
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {Number(selectedArticle.averageRating).toFixed(1)} ({selectedArticle.ratingCount} avaliações)
                  </span>
                </div>

                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {selectedArticle.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap border rounded-lg p-4 bg-gray-50">
                    {selectedArticle.content}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    Publicado em {new Date(selectedArticle.publishedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBase;