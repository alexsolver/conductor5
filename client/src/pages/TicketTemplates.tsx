import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Edit, Trash2, FileText, Settings, BarChart3, Building2, 
  Clock, Activity, Search, Filter
} from 'lucide-react';
import CompanyTemplateSelector from '@/components/templates/CompanyTemplateSelector';

// Schema de validação
const templateFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  impact: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  defaultTitle: z.string(),
  defaultDescription: z.string(),
  defaultTags: z.string(),
  estimatedHours: z.number().min(0),
  requiresApproval: z.boolean(),
  autoAssign: z.boolean(),
  defaultAssigneeRole: z.string(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TicketTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  urgency: string;
  impact: string;
  default_title: string;
  default_description: string;
  default_tags?: string;
  estimated_hours: number;
  usage_count?: number;
  requires_approval: boolean;
  auto_assign: boolean;
  default_assignee_role?: string;
  is_active: boolean;
  custom_fields?: string;
  created_at: string;
  updated_at?: string;
}

// API helper
const apiRequest = async (method: string, url: string, data?: any) => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response;
};

export default function TicketTemplates() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      priority: 'medium',
      urgency: 'medium',
      impact: 'medium',
      defaultTitle: '',
      defaultDescription: '',
      defaultTags: '',
      estimatedHours: 2,
      requiresApproval: false,
      autoAssign: false,
      defaultAssigneeRole: '',
    },
  });

  // Fetch templates based on selected company
  const { data: templatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ['ticket-templates', selectedCompany],
    queryFn: async () => {
      console.log('🔍 [TEMPLATES-QUERY] Fetching templates for company:', selectedCompany);
      const endpoint = selectedCompany === 'all' 
        ? '/api/ticket-templates' 
        : `/api/ticket-templates/company/${selectedCompany}`;
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      console.log('✅ [TEMPLATES-QUERY] Response:', data);
      return data;
    },
    enabled: !!selectedCompany,
  });

  // Query para buscar estatísticas
  const { data: statsResponse } = useQuery({
    queryKey: ['ticket-templates-stats', selectedCompany],
    queryFn: async () => {
      const endpoint = selectedCompany === 'all' 
        ? '/api/ticket-templates/analytics' 
        : `/api/ticket-templates/company/${selectedCompany}/stats`;
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
  });

  // Query para buscar categorias
  const { data: categoriesResponse } = useQuery({
    queryKey: ['ticket-templates-categories', selectedCompany],
    queryFn: async () => {
      const endpoint = selectedCompany === 'all' 
        ? '/api/ticket-templates/categories' 
        : `/api/ticket-templates/categories?companyId=${selectedCompany}`;
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
  });

  const templates = React.useMemo(() => {
    console.log('🔄 [TEMPLATES-PROCESSING] Processing templates response:', {
      hasResponse: !!templatesResponse,
      responseType: typeof templatesResponse,
      isSuccess: templatesResponse?.success,
      hasData: !!templatesResponse?.data
    });

    if (!templatesResponse) {
      console.log('❌ [TEMPLATES-PROCESSING] No response data');
      return [];
    }

    // ✅ 1QA.MD: Robust response handling
    if (templatesResponse.success && templatesResponse.data?.templates) {
      console.log('✅ [TEMPLATES-PROCESSING] Found templates:', templatesResponse.data.templates.length);
      return Array.isArray(templatesResponse.data.templates) ? templatesResponse.data.templates : [];
    }

    // Fallback: check if response is directly an array
    if (Array.isArray(templatesResponse)) {
      console.log('✅ [TEMPLATES-PROCESSING] Direct array response:', templatesResponse.length);
      return templatesResponse;
    }

    // Additional fallback: check if data is at root level
    if (templatesResponse.data && Array.isArray(templatesResponse.data)) {
      console.log('✅ [TEMPLATES-PROCESSING] Root data array:', templatesResponse.data.length);
      return templatesResponse.data;
    }

    // Handle error responses
    if (templatesResponse.success === false) {
      console.log('❌ [TEMPLATES-PROCESSING] API error response:', templatesResponse.errors);
      return [];
    }

    console.log('❌ [TEMPLATES-PROCESSING] Unexpected response structure:', templatesResponse);
    return [];
  }, [templatesResponse]);
  const stats = statsResponse?.data || {};
  const categories = categoriesResponse?.data || [];

  // Mutation para criar template
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      console.log('🚀 [CREATE-TEMPLATE] Creating template:', {
        name: data.name,
        category: data.category,
        companyId: selectedCompany === 'all' ? null : selectedCompany
      });

      const endpoint = '/api/ticket-templates';

      // ✅ 1QA.MD: Consistent payload structure
      const payload = {
        ...data,
        companyId: selectedCompany === 'all' ? null : selectedCompany,
        defaultTags: data.defaultTags || '',
        customFields: null,
        isActive: true,
        usageCount: 0,
        tags: data.defaultTags ? data.defaultTags.split(',').map(t => t.trim()) : [],
        templateType: 'standard',
        status: 'active',
        fields: [],
        automation: {
          enabled: false,
          autoAssign: { enabled: false, rules: [] },
          autoTags: { enabled: false, tags: [] },
          sla: { enabled: false }
        },
        workflow: {
          enabled: false,
          stages: []
        },
        permissions: []
      };

      console.log('📤 [CREATE-TEMPLATE] Payload:', payload);
      const response = await apiRequest('POST', endpoint, payload);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CREATE-TEMPLATE] API Error:', response.status, errorText);
        throw new Error(`Failed to create template: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [CREATE-TEMPLATE] Response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-templates', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['ticket-templates-stats', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['ticket-templates-categories', selectedCompany] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('❌ [CREATE-TEMPLATE] Error:', error);
      toast({
        title: "Erro ao criar template",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar template
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/ticket-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-templates', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['ticket-templates-stats', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['ticket-templates-categories', selectedCompany] });
      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
      });
    },
  });

  const handleCreateTemplate = (data: TemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  // Filtrar templates
  const filteredTemplates = templates.filter((template: TicketTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return priority;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="p-6 space-y-6">
        {/* Header com Gradiente */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Templates de Tickets
              </h1>
              <p className="text-blue-100 mt-2">
                Sistema completo de templates com Clean Architecture e análise inteligente
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </div>

        {/* Company Selector - Integrated with Companies Module */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <CompanyTemplateSelector 
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
            showStats={true}
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Gerenciar Templates
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Editor Visual
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics e Relatórios
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Configurações da Empresa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            {/* Painel de Controle Hierárquico */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50 p-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Painel de Controle de Templates
                </h2>
              </div>

              <div className="p-4 space-y-4">
                {/* Filtros Hierárquicos */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔍 Buscar Templates
                    </label>
                    <Input
                      placeholder="Digite o nome ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📁 Categoria
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-400">
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categories.map((category: string) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Estatísticas em Formato Lista */}
                {stats && Object.keys(stats).length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      Estatísticas Resumidas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.total || 0}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.active || 0}</div>
                        <div className="text-sm text-gray-600">Ativos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-600">{stats.popular || 0}</div>
                        <div className="text-sm text-gray-600">Populares</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.categories || 0}</div>
                        <div className="text-sm text-gray-600">Categorias</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista Hierárquica de Templates */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50 p-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Templates Disponíveis ({filteredTemplates.length})
                </h2>
              </div>

              <div className="divide-y">
                {templatesLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Carregando templates...</p>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
                    <p className="text-gray-500 mb-4">
                      {selectedCompany === 'all' 
                        ? 'Não há templates globais disponíveis no momento.'
                        : 'Não há templates disponíveis para a empresa selecionada.'
                      }
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Template
                    </Button>
                  </div>
                ) : (
                  filteredTemplates.map((template: TicketTemplate) => (
                    <div key={template.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between w-full text-left">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-gray-900">{template.name}</h3>
                              <Badge 
                                variant="outline" 
                                className="border-purple-200 text-purple-700 bg-purple-50"
                              >
                                {template.category}
                              </Badge>
                              <Badge className={`${getPriorityColor(template.priority)} border-0`}>
                                {getPriorityLabel(template.priority)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {template.estimated_hours}h
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              {template.usage_count || 0} usos
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50 p-4">
                <h2 className="text-lg font-semibold text-gray-800">Editor Visual de Templates</h2>
                <p className="text-gray-600 mt-1">
                  Crie templates usando drag-and-drop com campos do sistema e customizados.
                </p>
              </div>
              <div className="p-6">
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-3" />
                    <p>Editor visual será carregado aqui</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50 p-4">
                <h2 className="text-lg font-semibold text-gray-800">Analytics e Relatórios</h2>
                <p className="text-gray-600 mt-1">
                  Análises detalhadas de uso e performance dos templates.
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.total || 0}</div>
                    <div className="text-sm text-purple-700">Templates Totais</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.active || 0}</div>
                    <div className="text-sm text-blue-700">Templates Ativos</div>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-600">{stats.categories || 0}</div>
                    <div className="text-sm text-cyan-700">Categorias</div>
                  </div>
                </div>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3" />
                    <p>Gráficos de analytics serão exibidos aqui</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50 p-4">
                <h2 className="text-lg font-semibold text-gray-800">Configurações da Empresa</h2>
                <p className="text-gray-600 mt-1">
                  Personalize templates específicos para esta empresa.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-purple-700">Templates Personalizados</h4>
                    <p className="text-sm text-gray-600">
                      Crie templates específicos com campos customizados para esta empresa.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-blue-700">Aprovações Automáticas</h4>
                    <p className="text-sm text-gray-600">
                      Configure regras de aprovação baseadas no perfil da empresa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateTemplate)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Template *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Problema de Hardware" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Suporte Técnico" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva quando este template deve ser usado..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTemplateMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {createTemplateMutation.isPending ? 'Criando...' : 'Criar Template'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}