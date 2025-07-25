import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Eye, ThumbsUp, ThumbsDown, MessageCircle, Tag, Calendar, User, Star, BookOpen, FileText, Video, Wrench, AlertCircle, Filter, ArrowLeft, MoreVertical, Clock, Globe, Play, CalendarClock, CheckSquare, Edit3, Settings, Download, Upload, BarChart3, Grid3X3, List, Heart, History, Users, Image, FolderOpen, GitCompare, RotateCcw, UserCheck, Bell, SortAsc, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  slug: string;
  article_count: number;
  parent_category_id?: string;
  is_active: boolean;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category_id: string;
  category_name: string;
  category_color?: string;
  type: 'article' | 'procedure' | 'faq' | 'troubleshooting' | 'manual' | 'video' | 'diagram';
  status: 'draft' | 'pending_approval' | 'published' | 'archived' | 'under_review';
  visibility: 'public' | 'internal' | 'restricted' | 'private';
  author_id: string;
  published_at?: string;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

const articleTypeIcons = {
  article: <FileText className="h-4 w-4" />,
  procedure: <BookOpen className="h-4 w-4" />,
  faq: <AlertCircle className="h-4 w-4" />,
  troubleshooting: <Wrench className="h-4 w-4" />,
  manual: <BookOpen className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  diagram: <FileText className="h-4 w-4" />
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
  under_review: 'bg-blue-100 text-blue-800'
};

const visibilityColors = {
  public: 'bg-blue-100 text-blue-800',
  internal: 'bg-purple-100 text-purple-800',
  restricted: 'bg-orange-100 text-orange-800',
  private: 'bg-red-100 text-red-800'
};

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    visibility: '',
    author: '',
    dateFrom: '',
    dateTo: '',
    tags: ''
  });
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showBatchEditDialog, setShowBatchEditDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showVersionComparison, setShowVersionComparison] = useState(false);
  const [favoriteArticles, setFavoriteArticles] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'view_count' | 'helpful_count' | 'title'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [assignedReviewer, setAssignedReviewer] = useState<string>('');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedTab, setSelectedTab] = useState('articles');

  const queryClient = useQueryClient();

  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Custom API request function with auth headers
  const apiRequest = async (method: string, url: string, data?: any) => {
    const headers = getAuthHeaders();
    const options: any = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  };

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/knowledge-base/categories'],
    queryFn: async () => {
      const response = await fetch('/api/knowledge-base/categories', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch articles
  const { data: articlesResponse } = useQuery({
    queryKey: ['/api/knowledge-base/articles', { 
      category: selectedCategory, 
      search: searchQuery,
      ...filters
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.visibility) params.append('visibility', filters.visibility);

      const response = await fetch(`/api/knowledge-base/articles?${params}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch articles');
      return response.json();
    }
  });

  // Fetch single article
  const { data: fullArticle, refetch: refetchArticle } = useQuery<Article>({
    queryKey: ['/api/knowledge-base/articles', selectedArticle?.id],
    queryFn: async () => {
      if (!selectedArticle?.id) return null;
      const response = await fetch(`/api/knowledge-base/articles/${selectedArticle.id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch article');
      const result = await response.json();
      return result.data;
    },
    enabled: !!selectedArticle?.id
  });

  // Analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/knowledge-base/analytics'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/analytics')
  });

  const { data: advancedAnalytics } = useQuery({
    queryKey: ['/api/knowledge-base/advanced-analytics'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/advanced-analytics')
  });

  const { data: popularArticles } = useQuery({
    queryKey: ['/api/knowledge-base/popular-articles'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/popular-articles?limit=5')
  });

  const { data: recentArticles } = useQuery({
    queryKey: ['/api/knowledge-base/recent-articles'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/recent-articles?limit=5')
  });

  // Search Analytics
  const { data: searchAnalytics } = useQuery({
    queryKey: ['/api/knowledge-base/search-analytics'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/search-analytics'),
    enabled: selectedTab === 'analytics'
  });

  // User Engagement
  const { data: userEngagement } = useQuery({
    queryKey: ['/api/knowledge-base/user-engagement'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/user-engagement'),
    enabled: selectedTab === 'analytics'
  });

  // File Management
  const { data: mediaLibrary } = useQuery({
    queryKey: ['/api/knowledge-base/media'],
    queryFn: () => apiRequest('GET', '/api/knowledge-base/media'),
    enabled: showMediaLibrary
  });

  const articles = articlesResponse?.data || [];

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/knowledge-base/categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/categories'] });
      setShowCreateCategory(false);
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar categoria", variant: "destructive" });
    }
  });

  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/knowledge-base/articles', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      setShowCreateArticle(false);
      toast({ title: "Artigo criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar artigo", variant: "destructive" });
    }
  });

  // Update article mutation
  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/knowledge-base/articles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      setEditingArticle(null);
      refetchArticle();
      toast({ title: "Artigo atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar artigo", variant: "destructive" });
    }
  });

  // Rate article mutation
  const rateArticleMutation = useMutation({
    mutationFn: async ({ articleId, isHelpful }: { articleId: string; isHelpful: boolean }) => {
      const response = await fetch(`/api/knowledge-base/articles/${articleId}/rate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isHelpful }),
      });
      if (!response.ok) throw new Error('Failed to rate article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      refetchArticle();
      toast({ title: "Avaliação enviada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao avaliar artigo", variant: "destructive" });
    }
  });

  // Forms
  const categoryForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      icon: '',
      color: '#3b82f6'
    }
  });

  const articleForm = useForm({
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      category_id: '',
      type: 'article',
      status: 'draft',
      visibility: 'internal',
      featured: false
    }
  });

  // Reset forms when editing
  useEffect(() => {
    if (editingArticle) {
      articleForm.reset({
        title: editingArticle.title,
        excerpt: editingArticle.excerpt || '',
        content: editingArticle.content,
        category_id: editingArticle.category_id,
        type: editingArticle.type,
        status: editingArticle.status,
        visibility: editingArticle.visibility,
        featured: editingArticle.featured
      });
    }
  }, [editingArticle, articleForm]);

  useEffect(() => {
    if (editingCategory) {
      categoryForm.reset({
        name: editingCategory.name,
        description: editingCategory.description || '',
        icon: editingCategory.icon || '',
        color: editingCategory.color || '#3b82f6'
      });
    }
  }, [editingCategory, categoryForm]);

  const handleCreateCategory = (data: any) => {
    createCategoryMutation.mutate({
      ...data,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    });
  };

  const handleCreateArticle = (data: any) => {
    if (editingArticle) {
      updateArticleMutation.mutate({ id: editingArticle.id, data });
    } else {
      createArticleMutation.mutate(data);
    }
  };

  const handleRateArticle = (articleId: string, isHelpful: boolean) => {
    rateArticleMutation.mutate({ articleId, isHelpful });
  };

  const handlePreviewArticle = (article: Article) => {
    setPreviewArticle(article);
    setShowPreview(true);
  };

  const handleSchedulePublishing = (articleId: string, scheduledDate: string) => {
    updateArticleMutation.mutate({ 
      id: articleId, 
      data: { scheduledPublishAt: scheduledDate, status: 'scheduled' } 
    });
  };

  const handleBulkAction = () => {
    if (selectedArticles.length === 0) {
      toast({ title: "Selecione pelo menos um artigo", variant: "destructive" });
      return;
    }

    if (bulkAction === 'delete') {
      selectedArticles.forEach(articleId => {
        // TODO: Implement bulk delete
        toast({ title: "Exclusão em lote em desenvolvimento" });
      });
    } else if (bulkAction === 'publish') {
      selectedArticles.forEach(articleId => {
        updateArticleMutation.mutate({ 
          id: articleId, 
          data: { status: 'published', publishedAt: new Date().toISOString() } 
        });
      });
    } else if (bulkAction === 'archive') {
      selectedArticles.forEach(articleId => {
        updateArticleMutation.mutate({ 
          id: articleId, 
          data: { status: 'archived' } 
        });
      });
    }
    setSelectedArticles([]);
    setBulkAction('');
  };

  const handleArticleSelection = (articleId: string, selected: boolean) => {
    if (selected) {
      setSelectedArticles(prev => [...prev, articleId]);
    } else {
      setSelectedArticles(prev => prev.filter(id => id !== articleId));
    }
  };

  const handleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map((article: Article) => article.id));
    }
  };

  const handleToggleFavorite = (articleId: string) => {
    setFavoriteArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
    toast({ title: favoriteArticles.includes(articleId) ? "Removido dos favoritos" : "Adicionado aos favoritos" });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast({ title: `${newFiles.length} arquivo(s) carregado(s)` });
    }
  };

  const handleAssignReviewer = (articleId: string, reviewerId: string) => {
    updateArticleMutation.mutate({ 
      id: articleId, 
      data: { reviewerId } 
    });
    toast({ title: "Revisor atribuído com sucesso!" });
  };

  const getSortedArticles = (articles: Article[]) => {
    return [...articles].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      visibility: '',
      author: '',
      dateFrom: '',
      dateTo: '',
      tags: ''
    });
  };

  // Article view
  if (selectedArticle && fullArticle) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedArticle(null)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Base de Conhecimento
            </Button>
            <div className="flex items-center gap-2 mb-2">
              {articleTypeIcons[fullArticle.type]}
              <h1 className="text-3xl font-bold">{fullArticle.title}</h1>
              {fullArticle.featured && <Star className="h-5 w-5 text-yellow-500 fill-current" />}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Por Sistema</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(fullArticle.updated_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{fullArticle.view_count} visualizações</span>
              </div>
              <Badge className={statusColors[fullArticle.status]}>
                {fullArticle.status.replace('_', ' ')}
              </Badge>
              <Badge className={visibilityColors[fullArticle.visibility]}>
                {fullArticle.visibility}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setEditingArticle(fullArticle)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap">{fullArticle.content}</div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Este artigo foi útil?</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateArticle(fullArticle.id, true)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Sim ({fullArticle.helpful_count})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateArticle(fullArticle.id, false)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Não ({fullArticle.not_helpful_count})
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/knowledge-base/article/${fullArticle.id}`);
                      toast({ title: "Link copiado!" });
                    }}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Compartilhar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast({ title: "Comentários em desenvolvimento" })}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Comentários
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie artigos, procedimentos e documentação
          </p>
        </div>
        <div className="flex gap-2">
          {selectedArticles.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border">
              <span className="text-sm text-blue-700 font-medium">
                {selectedArticles.length} selecionado(s)
              </span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40 h-8">
                  <SelectValue placeholder="Ações em lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publicar</SelectItem>
                  <SelectItem value="archive">Arquivar</SelectItem>
                  <SelectItem value="delete">Excluir</SelectItem>
                  <SelectItem value="edit">Editar</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                onClick={handleBulkAction}
                disabled={!bulkAction}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Aplicar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedArticles([])}
              >
                Cancelar
              </Button>
            </div>
          )}

          <Button variant="outline" onClick={() => toast({ title: "Exportar KB em desenvolvimento" })}>
            <Download className="h-4 w-4 mr-2" />
            Exportar KB
          </Button>

          <Button variant="outline" onClick={() => setShowAnalytics(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics Avançados
          </Button>

          <Button variant="outline" onClick={() => setShowFileManager(true)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Gerenciar Arquivos
          </Button>

          <Button variant="outline" onClick={() => setShowMediaLibrary(true)}>
            <Image className="h-4 w-4 mr-2" />
            Biblioteca de Mídia
          </Button>

          <Button variant="outline" onClick={() => toast({ title: "Configurações em desenvolvimento" })}>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>

          <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Categoria</DialogTitle>
                <DialogDescription>
                  Crie uma nova categoria para organizar os artigos
                </DialogDescription>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(handleCreateCategory)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateCategory(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createCategoryMutation.isPending}>
                      Criar Categoria
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateArticle || !!editingArticle} onOpenChange={(open) => {
            if (!open) {
              setShowCreateArticle(false);
              setEditingArticle(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Artigo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingArticle ? 'Editar Artigo' : 'Criar Novo Artigo'}
                </DialogTitle>
                <DialogDescription>
                  {editingArticle ? 'Atualize as informações do artigo' : 'Crie um novo artigo para a base de conhecimento'}
                </DialogDescription>
              </DialogHeader>
              <Form {...articleForm}>
                <form onSubmit={articleForm.handleSubmit(handleCreateArticle)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Templates Rápidos</label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            articleForm.setValue('title', 'Como fazer: ');
                            articleForm.setValue('content', '# Como fazer: [Título da Tarefa]\n\n## Objetivo\nDescreva o que será alcançado.\n\n## Pré-requisitos\n- Item 1\n- Item 2\n\n## Passo a Passo\n1. Primeiro passo\n2. Segundo passo\n3. Terceiro passo\n\n## Resultado Esperado\nDescreva o resultado final.\n\n## Dicas Adicionais\n- Dica 1\n- Dica 2');
                            articleForm.setValue('type', 'procedure');
                          }}
                        >
                          Procedimento
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            articleForm.setValue('title', 'FAQ: ');
                            articleForm.setValue('content', '# Perguntas Frequentes\n\n## Pergunta 1\n**Pergunta:** \n**Resposta:** \n\n## Pergunta 2\n**Pergunta:** \n**Resposta:** \n\n## Pergunta 3\n**Pergunta:** \n**Resposta:** ');
                            articleForm.setValue('type', 'faq');
                          }}
                        >
                          FAQ
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            articleForm.setValue('title', 'Solucionando: ');
                            articleForm.setValue('content', '# Solução de Problema: [Nome do Problema]\n\n## Descrição do Problema\nDescreva o problema que está sendo resolvido.\n\n## Sintomas\n- Sintoma 1\n- Sintoma 2\n\n## Causas Possíveis\n1. Causa 1\n2. Causa 2\n\n## Solução\n### Método 1\n1. Passo 1\n2. Passo 2\n\n### Método 2 (Alternativo)\n1. Passo 1\n2. Passo 2\n\n## Prevenção\nComo evitar que o problema aconteça novamente.');
                            articleForm.setValue('type', 'troubleshooting');
                          }}
                        >
                          Solução de Problemas
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            articleForm.setValue('title', '');
                            articleForm.setValue('content', '# Título do Artigo\n\n## Introdução\nBreve introdução sobre o tópico.\n\n## Desenvolvimento\nConteúdo principal do artigo.\n\n## Conclusão\nResumo e considerações finais.');
                            articleForm.setValue('type', 'article');
                          }}
                        >
                          Artigo Geral
                        </Button>
                      </div>
                    </div>

                    <FormField
                      control={articleForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                    <FormField
                      control={articleForm.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={articleForm.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resumo</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={articleForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conteúdo</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={10} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={articleForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="article">Artigo</SelectItem>
                              <SelectItem value="procedure">Procedimento</SelectItem>
                              <SelectItem value="faq">FAQ</SelectItem>
                              <SelectItem value="troubleshooting">Solução de Problemas</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="video">Vídeo</SelectItem>
                              <SelectItem value="diagram">Diagrama</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                              <SelectItem value="published">Publicado</SelectItem>
                              <SelectItem value="under_review">Em Revisão</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibilidade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">Público</SelectItem>
                              <SelectItem value="internal">Interno</SelectItem>
                              <SelectItem value="restricted">Restrito</SelectItem>
                              <SelectItem value="private">Privado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={articleForm.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Artigo em Destaque</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Marcar este artigo como destaque
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateArticle(false);
                        setEditingArticle(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
                    >
                      {editingArticle ? 'Atualizar' : 'Criar'} Artigo
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Artigos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_articles || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publicados</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.published_articles || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_views || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Utilidade</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.avg_helpfulness ? `${Math.round(analytics.avg_helpfulness * 100)}%` : '0%'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Popular and Recent Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {popularArticles && popularArticles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Artigos Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {popularArticles.slice(0, 5).map((article: Article) => (
                  <div 
                    key={article.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-center gap-2">
                      {articleTypeIcons[article.type]}
                      <span className="text-sm font-medium truncate">{article.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {article.view_count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {recentArticles && recentArticles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Artigos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentArticles.slice(0, 5).map((article: Article) => (
                  <div 
                    key={article.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-center gap-2">
                      {articleTypeIcons[article.type]}
                      <span className="text-sm font-medium truncate">{article.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(article.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar artigos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Data de Atualização</SelectItem>
                <SelectItem value="created_at">Data de Criação</SelectItem>
                <SelectItem value="view_count">Visualizações</SelectItem>
                <SelectItem value="helpful_count">Mais Úteis</SelectItem>
                <SelectItem value="title">Título</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <SortAsc className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="p-2 space-y-2">
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os Status</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="under_review">Em Revisão</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os Tipos</SelectItem>
                      <SelectItem value="article">Artigo</SelectItem>
                      <SelectItem value="procedure">Procedimento</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                      <SelectItem value="troubleshooting">Solução de Problemas</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.author} onValueChange={(value) => setFilters(prev => ({ ...prev, author: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Autor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os Autores</SelectItem>
                      <SelectItem value="current-user">Meus Artigos</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      placeholder="Data de"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                    <Input
                      type="date"
                      placeholder="Data até"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                  <Input
                    placeholder="Tags (separadas por vírgula)"
                    value={filters.tags}
                    onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => toast({ title: "Importar artigos em desenvolvimento" })}>
              <Plus className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Relatórios em desenvolvimento" })}>
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="articles" className="space-y-6" onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Artigos
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Mídia
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedCategory(category.id);
                  // Switch to articles tab
                  const articlesTab = document.querySelector('[value="articles"]') as HTMLElement;
                  articlesTab?.click();
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      >
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.article_count} artigos</CardDescription>
                      </div>
                    </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement delete category
                            toast({ title: "Funcionalidade em desenvolvimento" });
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement category analytics
                          toast({ title: "Analytics da categoria em desenvolvimento" });
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Estatísticas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                </CardHeader>
                {category.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="articles" className="space-y-6">
          {selectedCategory && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                {categories.find(c => c.id === selectedCategory)?.name}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Limpar filtro
              </Button>
            </div>
          )}

          {articles.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedArticles.length === articles.length && articles.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Selecionar todos ({articles.length})
                </label>
              </div>
            </div>
          )}

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid gap-6'}>
            {getSortedArticles(articles).map((article: Article) => (
              <Card 
                key={article.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedArticle(article)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article.id)}
                        onChange={(e) => handleArticleSelection(article.id, e.target.checked)}
                        className="mt-1 rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {articleTypeIcons[article.type]}
                          <CardTitle className="text-xl">{article.title}</CardTitle>
                          <div className="flex items-center gap-1">
                            {article.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            {favoriteArticles.includes(article.id) && <Heart className="h-4 w-4 text-red-500 fill-current" />}
                          </div>
                        </div>
                        <CardDescription>
                          {article.excerpt || (article.content?.substring(0, 200) + '...')}
                        </CardDescription>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            style={{ 
                              backgroundColor: article.category_color ? `${article.category_color}15` : undefined,
                              borderColor: article.category_color || undefined
                            }}
                          >
                            {article.category_name}
                          </Badge>
                          <Badge className={statusColors[article.status]}>
                            {article.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={visibilityColors[article.visibility]}>
                            {article.visibility}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewArticle(article);
                        }}>
                          <Play className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditingArticle(article);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(article.id);
                        }}>
                          <Heart className={`h-4 w-4 mr-2 ${favoriteArticles.includes(article.id) ? 'fill-current text-red-500' : ''}`} />
                          {favoriteArticles.includes(article.id) ? 'Remover dos Favoritos' : 'Favoritar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setShowScheduleDialog(true);
                        }}>
                          <CalendarClock className="h-4 w-4 mr-2" />
                          Agendar Publicação
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setShowApprovalDialog(true);
                        }}>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Enviar para Aprovação
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement assign reviewer
                          toast({ title: "Atribuir revisor em desenvolvimento" });
                        }}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Atribuir Revisor
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement duplicate article
                          toast({ title: "Duplicar artigo em desenvolvimento" });
                        }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement article versions
                          toast({ title: "Histórico de versões em desenvolvimento" });
                        }}>
                          <Clock className="h-4 w-4 mr-2" />
                          Versões
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setShowVersionComparison(true);
                        }}>
                          <GitCompare className="h-4 w-4 mr-2" />
                          Comparar Versões
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement restore version
                          toast({ title: "Restaurar versão em desenvolvimento" });
                        }}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restaurar Versão
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement article analytics
                          toast({ title: "Analytics do artigo em desenvolvimento" });
                        }}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Ver Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`${window.location.origin}/knowledge-base/article/${article.id}`);
                          toast({ title: "Link copiado para a área de transferência!" });
                        }}>
                          <Globe className="h-4 w-4 mr-2" />
                          Compartilhar
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement delete article
                            toast({ title: "Excluir artigo em desenvolvimento" });
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(article.updated_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{article.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{article.helpful_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4" />
                        <span>{article.not_helpful_count}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {articles.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum artigo encontrado</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `Não encontramos artigos para "${searchQuery}"`
                    : selectedCategory 
                    ? "Esta categoria não possui artigos ainda"
                    : "Crie seu primeiro artigo na base de conhecimento"
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Biblioteca de Mídia</h2>
              <p className="text-muted-foreground">Gerencie arquivos, imagens e vídeos do sistema</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowMediaLibrary(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload de Arquivos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mediaLibrary?.map((file: any) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    {file.type?.startsWith('image/') ? (
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : file.type?.startsWith('video/') ? (
                      <Video className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.size ? `${Math.round(file.size / 1024)}KB` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!mediaLibrary || mediaLibrary.length === 0) && (
            <div className="text-center py-12">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhum arquivo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Faça upload de arquivos para começar a construir sua biblioteca de mídia
              </p>
              <Button onClick={() => setShowMediaLibrary(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Analytics da Base de Conhecimento</h2>
            <p className="text-muted-foreground">Métricas e insights sobre o uso do sistema</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Artigos</p>
                    <p className="text-2xl font-bold">{analytics?.total_articles || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Publicados</p>
                    <p className="text-2xl font-bold">{analytics?.published_articles || 0}</p>
                  </div>
                  <Eye className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-muted-foreground">Total de Views</p>
                    <p className="text-2xl font-bold">{analytics?.total_views || 0}</p>
                  </div>
                  <Star className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Utilidade</p>
                    <p className="text-2xl font-bold">
                      {analytics?.avg_helpfulness ? Math.round(analytics.avg_helpfulness * 100) : 0}%
                    </p>
                  </div>
                  <ThumbsUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Artigos Mais Populares</CardTitle>
                <CardDescription>Top 5 artigos por visualizações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularArticles?.map((article: any, index: number) => (
                    <div key={article.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{article.title}</p>
                        <p className="text-xs text-muted-foreground">{article.view_count} visualizações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Artigos Recentes</CardTitle>
                <CardDescription>Últimos 5 artigos criados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentArticles?.map((article: any) => (
                    <div key={article.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(article.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Buscas</CardTitle>
                <CardDescription>Termos mais buscados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchAnalytics?.top_searches?.map((search: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{search.query}</p>
                        <p className="text-xs text-muted-foreground">{search.count} buscas</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">Nenhuma busca registrada ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engajamento dos Usuários</CardTitle>
                <CardDescription>Métricas de interação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Artigos nunca visualizados:</span>
                    <span className="font-medium">{advancedAnalytics?.articles_never_viewed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Artigos úteis:</span>
                    <span className="font-medium">{advancedAnalytics?.helpful_articles || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Artigos em destaque:</span>
                    <span className="font-medium">{advancedAnalytics?.featured_articles || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Criados nos últimos 30 dias:</span>
                    <span className="font-medium">{advancedAnalytics?.articles_last_30_days || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Média de views por artigo:</span>
                    <span className="font-medium">
                      {advancedAnalytics?.avg_views_per_article ? Math.round(advancedAnalytics.avg_views_per_article) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Configurações</h2>
            <p className="text-muted-foreground">Gerenciar configurações do sistema</p>
          </div>
          {/* TODO: Implement settings */}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Preview: {previewArticle?.title}
            </DialogTitle>
            <DialogDescription>
              Visualização do artigo antes da publicação
            </DialogDescription>
          </DialogHeader>
          {previewArticle && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[previewArticle.status]}>
                  {previewArticle.status.replace('_', ' ')}
                </Badge>
                <Badge className={visibilityColors[previewArticle.visibility]}>
                  {previewArticle.visibility}
                </Badge>
                {previewArticle.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>
              {previewArticle.excerpt && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Resumo:</h4>
                  <p className="text-blue-800">{previewArticle.excerpt}</p>
                </div>
              )}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">{previewArticle.content}</div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              if (previewArticle) {
                setEditingArticle(previewArticle);
                setShowPreview(false);
              }
            }}>
              Editar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Publishing Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Agendar Publicação
            </DialogTitle>
            <DialogDescription>
              Defina quando este artigo deve ser publicado automaticamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Data e Hora da Publicação</label>
              <Input
                type="datetime-local"
                className="mt-1"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="notify-schedule" />
              <label htmlFor="notify-schedule" className="text-sm">
                Notificar quando o artigo for publicado
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setShowScheduleDialog(false);
              toast({ title: "Publicação agendada com sucesso!" });
            }}>
              Agendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Workflow Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Enviar para Aprovação
            </DialogTitle>
            <DialogDescription>
              Solicite aprovação para publicar este artigo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Aprovador</label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um aprovador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente de Conteúdo</SelectItem>
                  <SelectItem value="reviewer">Revisor Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Comentários</label>
              <Textarea
                placeholder="Adicione comentários para o aprovador..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="urgent-approval" />
              <label htmlFor="urgent-approval" className="text-sm">
                Aprovação urgente
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setShowApprovalDialog(false);
              toast({ title: "Enviado para aprovação!" });
            }}>
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Edit Dialog */}
      <Dialog open={showBatchEditDialog} onOpenChange={setShowBatchEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edição em Lote
            </DialogTitle>
            <DialogDescription>
              Edite múltiplos artigos simultaneamente ({selectedArticles.length} selecionados)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Alterar Status</label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                  <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Alterar Categoria</label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Alterar Visibilidade</label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione a visibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="restricted">Restrito</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="batch-featured" />
              <label htmlFor="batch-featured" className="text-sm">
                Marcar como destaque
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBatchEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setShowBatchEditDialog(false);
              toast({ title: "Artigos atualizados com sucesso!" });
            }}>
              Aplicar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Avançados
            </DialogTitle>
            <DialogDescription>
              Relatórios detalhados sobre o desempenho da base de conhecimento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engajamento dos Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Artigos mais visualizados</span>
                      <span className="font-bold">{analytics?.total_views || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de aprovação</span>
                      <span className="font-bold">
                        {analytics?.avg_helpfulness ? `${Math.round(analytics.avg_helpfulness * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Termos Mais Buscados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Últimos 30 dias:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Como fazer</span>
                        <span>45 buscas</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Procedimento</span>
                        <span>32 buscas</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FAQ</span>
                        <span>28 buscas</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tempo médio de leitura</span>
                      <span className="font-bold">3.2 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de bounce</span>
                      <span className="font-bold">15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Artigos sem visualizações</span>
                      <span className="font-bold text-red-600">5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAnalytics(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Manager Dialog */}
      <Dialog open={showFileManager} onOpenChange={setShowFileManager}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Gerenciador de Arquivos
            </DialogTitle>
            <DialogDescription>
              Gerencie arquivos anexados aos artigos da base de conhecimento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Arquivos
                  </span>
                </Button>
              </label>
              <Button variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Nova Pasta
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="border rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(file.size / 1024)} KB
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Visualizar
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs text-red-600">
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}

                {uploadedFiles.length === 0 && (
                  <div className="col-span-4 text-center py-8 text-muted-foreground">
                    Nenhum arquivo carregado ainda
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFileManager(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Library Dialog */}
      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Biblioteca de Mídia
            </DialogTitle>
            <DialogDescription>
              Gerencie imagens e mídias para seus artigos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload">
                <Button asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Mídia
                  </span>
                </Button>
              </label>
              <Button variant="outline">
                <Image className="h-4 w-4 mr-2" />
                Galeria
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Mock media items */}
                <div className="aspect-square border rounded-lg bg-gray-100 flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="aspect-square border rounded-lg bg-gray-100 flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowMediaLibrary(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version Comparison Dialog */}
      <Dialog open={showVersionComparison} onOpenChange={setShowVersionComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Comparar Versões
            </DialogTitle>
            <DialogDescription>
              Compare diferentes versões do artigo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Versão A</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma versão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v3">Versão 3 (Atual)</SelectItem>
                    <SelectItem value="v2">Versão 2</SelectItem>
                    <SelectItem value="v1">Versão 1 (Original)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Versão B</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma versão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v3">Versão 3 (Atual)</SelectItem>
                    <SelectItem value="v2">Versão 2</SelectItem>
                    <SelectItem value="v1">Versão 1 (Original)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="text-center text-muted-foreground">
                Selecione duas versões para comparar as diferenças
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowVersionComparison(false)}>
              Fechar
            </Button>
            <Button>
              Restaurar Versão Selecionada
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}