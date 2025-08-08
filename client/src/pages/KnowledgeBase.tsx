import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MediaLibrary from "@/components/knowledge-base/MediaLibrary";
import InteractiveDiagrams from "@/components/knowledge-base/InteractiveDiagrams";
import Model3DViewer from "@/components/knowledge-base/Model3DViewer";
import VideoStreaming from "@/components/knowledge-base/VideoStreaming";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  Users,
  Clock,
  Star,
  Eye,
  ThumbsUp,
  Folder,
  FileText,
  Video,
  Image,
  Play,
  Settings,
  AlertTriangle,
  Shield,
  GraduationCap,
  Wrench,
  ChevronRight,
  MessageCircle,
  Download,
  Share2,
  Bookmark,
  Tag,
  Calendar,
  BarChart3,
  Camera,
  Palette,
  Layers
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";


const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  // Queries
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['/api/knowledge-base/categories'],
    queryFn: () => fetch('/api/knowledge-base/categories').then(res => res.json()).then(data => data.data || [])
  });

  const { data: articles = [], refetch: refetchArticles } = useQuery({
    queryKey: ['/api/knowledge-base/articles', selectedCategory, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      return fetch(`/api/knowledge-base/articles?${params.toString()}`).then(res => res.json()).then(data => data.data || []);
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/knowledge-base/analytics'],
    queryFn: () => fetch('/api/knowledge-base/analytics').then(res => res.json()).then(data => data.data)
  });

  const { data: mediaStats } = useQuery({
    queryKey: ['/api/knowledge-base/media/stats'],
    queryFn: () => fetch('/api/knowledge-base/media/stats').then(res => res.json()).then(data => data.data)
  });

  // Get category icon
  const getCategoryIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Settings,
      AlertTriangle,
      Shield,
      GraduationCap,
      Wrench,
      Folder,
      FileText,
      Video,
      Image,
      MessageCircle
    };
    const IconComponent = icons[iconName] || Folder;
    return <IconComponent className="h-5 w-5" />;
  };

  // Format numbers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Handle Create Article Form Submission
  const handleCreateArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const categoryId = formData.get('category') as string;
    const content = formData.get('content') as string;
    const tags = (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(tag => tag);

    if (!title || !categoryId || !content) {
      alert("Título, Categoria e Conteúdo são obrigatórios.");
      return;
    }

    try {
      const response = await fetch('/api/knowledge-base/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header if needed
        },
        body: JSON.stringify({ title, summary, categoryId, content, tags })
      });

      if (response.ok) {
        setIsCreateArticleOpen(false);
        refetchArticles(); // Refetch articles after creation
        alert("Artigo criado com sucesso!");
      } else {
        alert("Erro ao criar artigo.");
      }
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Erro ao criar artigo.");
    }
  };

  // Handle Create Category Form Submission
  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('categoryName') as string;
    const description = formData.get('categoryDescription') as string;
    const color = formData.get('categoryColor') as string;
    const icon = formData.get('categoryIcon') as string;

    if (!name) {
      alert("Nome da categoria é obrigatório.");
      return;
    }

    try {
      const response = await fetch('/api/knowledge-base/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header if needed
        },
        body: JSON.stringify({ name, description, color, icon })
      });

      if (response.ok) {
        setIsCreateCategoryOpen(false);
        refetchCategories(); // Refetch categories after creation
        alert("Categoria criada com sucesso!");
      } else {
        alert("Erro ao criar categoria.");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Erro ao criar categoria.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Base de Conhecimento
          </h1>
          <p className="text-gray-600 mt-2">
            Centro de conhecimento inteligente com recursos avançados de mídia e organização
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Folder className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Categoria</DialogTitle>
                <DialogDescription>
                  Organize o conhecimento criando uma nova categoria
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Nome *</Label>
                  <Input id="categoryName" name="categoryName" placeholder="Nome da categoria" required />
                </div>
                <div>
                  <Label htmlFor="categoryDescription">Descrição</Label>
                  <Textarea id="categoryDescription" name="categoryDescription" placeholder="Descrição da categoria" rows={3} />
                </div>
                <div>
                  <Label htmlFor="categoryColor">Cor</Label>
                  <input 
                    type="color" 
                    id="categoryColor" 
                    name="categoryColor"
                    defaultValue="#3B82F6"
                    className="w-full h-10 rounded border px-1"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryIcon">Ícone</Label>
                  <Select name="categoryIcon" defaultValue="Folder">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ícone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(getCategoryIcon("")).map(key => (
                        <SelectItem key={key} value={key}>
                          {getCategoryIcon(key)} {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit">Criar Categoria</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateArticleOpen} onOpenChange={setIsCreateArticleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Artigo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Artigo</DialogTitle>
                <DialogDescription>
                  Adicione um novo artigo à base de conhecimento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" name="title" placeholder="Digite o título do artigo" required />
                </div>
                <div>
                  <Label htmlFor="summary">Resumo</Label>
                  <Input id="summary" name="summary" placeholder="Breve descrição do artigo" />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select name="category" defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Conteúdo *</Label>
                  <Textarea 
                    id="content" 
                    name="content"
                    placeholder="Escreva o conteúdo do artigo em Markdown..."
                    rows={10}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" name="tags" placeholder="tutorial, procedimento, técnico (separado por vírgulas)" />
                </div>
                <div className="flex gap-2 pt-4 justify-end">
                  <Button type="submit">Criar Artigo</Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateArticleOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Total de Artigos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics?.stats?.totalArticles)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% este mês
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics?.stats?.totalViews)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +18% esta semana
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-purple-500" />
              Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              {analytics?.stats?.averageRating || 'N/A'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              {formatNumber(analytics?.stats?.totalRatings)} avaliações
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Image className="h-4 w-4 text-orange-500" />
              Recursos de Mídia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(mediaStats?.totalFiles)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Camera className="h-3 w-3 mr-1" />
              {mediaStats?.totalSize ? `${(mediaStats.totalSize / (1024 * 1024)).toFixed(0)}MB` : 'N/A'} utilizados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="articles">Artigos</TabsTrigger>
          <TabsTrigger value="media">Biblioteca de Mídia</TabsTrigger>
          <TabsTrigger value="diagrams">Diagramas</TabsTrigger>
          <TabsTrigger value="3d-models">Modelos 3D</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Acesso rápido às principais funcionalidades da base de conhecimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab("articles")}
                >
                  <FileText className="h-6 w-6" />
                  <span>Explorar Artigos</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab("media")}
                >
                  <Image className="h-6 w-6" />
                  <span>Biblioteca de Mídia</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setIsCreateArticleOpen(true)}
                >
                  <Plus className="h-6 w-6" />
                  <span>Criar Conteúdo</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Categorias
              </CardTitle>
              <CardDescription>
                Navegue pelas categorias de conhecimento organizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category: any) => (
                  <Card 
                    key={category.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setActiveTab("articles");
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          {getCategoryIcon(category.icon || 'Folder')}
                        </div>
                        {category.name}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {category.articleCount || 0} artigos
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    action: "Artigo criado",
                    title: "Como Resolver Problemas de Conectividade",
                    user: "Carlos Oliveira",
                    time: "2 horas atrás",
                    type: "create"
                  },
                  {
                    action: "Vídeo adicionado",
                    title: "Treinamento de Segurança Operacional",
                    user: "Maria Santos",
                    time: "4 horas atrás",
                    type: "upload"
                  },
                  {
                    action: "Categoria atualizada",
                    title: "Procedimentos Operacionais",
                    user: "João Silva",
                    time: "1 dia atrás",
                    type: "update"
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'create' ? 'bg-green-100 text-green-600' :
                      activity.type === 'upload' ? 'bg-blue-100 text-blue-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {activity.type === 'create' ? <Plus className="h-4 w-4" /> :
                       activity.type === 'upload' ? <Video className="h-4 w-4" /> :
                       <Settings className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todas as categorias
            </Button>
            {categories.map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                style={{ 
                  borderColor: selectedCategory === category.id ? category.color : undefined,
                  backgroundColor: selectedCategory === category.id ? category.color + '20' : undefined,
                  color: selectedCategory === category.id ? category.color : undefined
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Articles Grid/List */}
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {articles.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchQuery || selectedCategory ? 'Nenhum artigo encontrado com os filtros aplicados.' : 'Nenhum artigo ainda. Crie o primeiro artigo!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              articles.map((article: any) => (
                <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('article-detail-' + article.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge 
                        variant="secondary" 
                        style={{ backgroundColor: article.category?.color + '20', color: article.category?.color }}
                      >
                        {article.category?.name || 'Sem Categoria'}
                      </Badge>
                      <Badge variant="outline">
                        {article.difficulty || 'Médio'}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {article.summary || article.content}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {article.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.estimatedReadTime || 'N/A'}min
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {article.averageRating || 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Media Library Tab */}
        <TabsContent value="media">
          <MediaLibrary />
        </TabsContent>

        {/* Interactive Diagrams Tab */}
        <TabsContent value="diagrams">
          <InteractiveDiagrams />
        </TabsContent>

        {/* 3D Models Tab */}
        <TabsContent value="3d-models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Modelos 3D Disponíveis
              </CardTitle>
              <CardDescription>
                Visualize e interaja com modelos tridimensionais para treinamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Model3DViewer 
                model={{
                  id: '3d_model_1',
                  name: 'Equipamento Industrial',
                  description: 'Modelo 3D de equipamento para treinamento técnico',
                  fileUrl: '/api/media/3d/equipment_industrial.obj',
                  thumbnailUrl: '/api/media/thumbnails/equipment_thumb.jpg',
                  type: 'obj',
                  size: 2480000,
                  vertexCount: 12540,
                  faceCount: 8320,
                  animations: ['idle', 'operation', 'maintenance'],
                  materials: ['metal_base', 'plastic_cover', 'rubber_seal'],
                  tags: ['equipamento', 'industrial', 'treinamento'],
                  createdAt: new Date().toISOString()
                }}
                autoRotate={true}
                showControls={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Biblioteca de Vídeos Educacionais
              </CardTitle>
              <CardDescription>
                Conteúdo audiovisual interativo para treinamento e capacitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VideoStreaming 
                videoId="video_1"
                title="Treinamento Técnico Avançado"
                description="Vídeo educacional sobre procedimentos técnicos essenciais"
                duration={480}
                chapters={[
                  {
                    id: 'ch1',
                    title: 'Introdução',
                    startTime: 0,
                    endTime: 60
                  },
                  {
                    id: 'ch2',
                    title: 'Procedimentos Básicos',
                    startTime: 60,
                    endTime: 180
                  },
                  {
                    id: 'ch3',
                    title: 'Procedimentos Avançados',
                    startTime: 180,
                    endTime: 360
                  },
                  {
                    id: 'ch4',
                    title: 'Conclusão',
                    startTime: 360,
                    endTime: 480
                  }
                ]}
                interactive={true}
                controls={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeBase;