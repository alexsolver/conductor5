import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Eye, ThumbsUp, ThumbsDown, MessageCircle, Tag, Calendar, User, Star, BookOpen, FileText, Video, Wrench, AlertCircle, Filter, ArrowLeft, MoreVertical, Clock, Globe } from "lucide-react";

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
    visibility: ''
  });

  const queryClient = useQueryClient();

  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
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
    queryFn: async () => {
      const response = await fetch('/api/knowledge-base/analytics', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      return result.data;
    }
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
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="articles">Artigos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
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
This code adds article templates to the article creation form, enhancing the user experience.                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.article_count} artigos</CardDescription>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

          <div className="grid gap-6">
            {articles.map((article: Article) => (
              <Card 
                key={article.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedArticle(article)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {articleTypeIcons[article.type]}
                        <CardTitle className="text-xl">{article.title}</CardTitle>
                        {article.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditingArticle(article);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
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
      </Tabs>
    </div>
  );
}