/**
 * ✅ UX IMPROVEMENT: TICKET TEMPLATES PAGE
 * Seguindo user preferences: Text-based hierarchical menus com dropdowns
 * Design system: Gradient-focused com Shadcn UI
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, Edit, Trash2, Copy, Search, Filter, BarChart3, 
  Users, Clock, Building2, Settings, ChevronDown, ChevronRight,
  FolderOpen, FileText, Star, TrendingUp, Activity
} from 'lucide-react';

// Import new components
import CompanyTemplateSelector from '@/components/templates/CompanyTemplateSelector';
import CustomFieldsEditor, { CustomField } from '@/components/templates/CustomFieldsEditor';
import TemplateAnalytics from '@/components/templates/TemplateAnalytics';
import TemplateEditor from '@/components/templates/TemplateEditor';
import TemplateCanvasEditor from '@/components/templates/TemplateCanvasEditor';
import { TemplateHierarchyManager } from '@/components/template-builder/hierarchy/TemplateHierarchyManager';
import { ApprovalWorkflow } from '@/components/template-builder/workflow/ApprovalWorkflow';
import { AuditTrail } from '@/components/template-builder/audit/AuditTrail';

// Schema para validação do formulário
const templateSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  category: z.string().min(1, "Categoria é obrigatória"),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  defaultTitle: z.string().min(5, "Título padrão deve ter pelo menos 5 caracteres"),
  defaultDescription: z.string().min(20, "Descrição padrão deve ter pelo menos 20 caracteres"),
  defaultTags: z.string().optional(),
  estimatedHours: z.number().min(0).max(100),
  requiresApproval: z.boolean(),
  autoAssign: z.boolean(),
  defaultAssigneeRole: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

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
  default_tags: string;
  estimated_hours: number;
  requires_approval: boolean;
  auto_assign: boolean;
  default_assignee_role: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  custom_fields?: string;
}

export default function TicketTemplates() {
  // ✅ UX: Hierarchical state management
  const [activeView, setActiveView] = useState<'list' | 'analytics' | 'categories'>('list');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [activeTab, setActiveTab] = useState('templates');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form para criar/editar templates
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
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

  // Query para buscar templates baseado na empresa selecionada
  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: ['/api/ticket-templates/company', selectedCompany],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ticket-templates/company/${selectedCompany}`);
      return response.json();
    },
  });

  const templates = Array.isArray(templatesResponse?.data) ? templatesResponse.data : [];

  // Query para buscar estatísticas baseado na empresa selecionada
  const { data: statsResponse } = useQuery({
    queryKey: ['/api/ticket-templates/company', selectedCompany, 'stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ticket-templates/company/${selectedCompany}/stats`);
      return response.json();
    },
  });

  const stats = statsResponse?.data?.[0] || {};

  // Query para buscar categorias baseado na empresa selecionada
  const { data: categoriesResponse } = useQuery({
    queryKey: ['/api/ticket-templates/company', selectedCompany, 'categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ticket-templates/company/${selectedCompany}/categories`);
      return response.json();
    },
  });

  const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];

  // Mutation para criar template
  const createTemplateMutation = useMutation({
    mutationFn: (data: TemplateFormData & { customFields?: CustomField[] }) => 
      apiRequest('POST', `/api/ticket-templates/company/${selectedCompany}`, {
        ...data,
        // Required fields
        companyId: selectedCompany === 'all' ? null : selectedCompany,
        defaultCategory: data.category, // Use the selected category as default
        // Optional fields with defaults
        defaultTitle: data.defaultTitle,
        defaultDescription: data.defaultDescription,
        defaultTags: data.defaultTags,
        estimatedHours: data.estimatedHours,
        requiresApproval: data.requiresApproval,
        autoAssign: data.autoAssign,
        defaultAssigneeRole: data.defaultAssigneeRole,
        customFields: JSON.stringify(data.customFields || customFields),
        hiddenFields: JSON.stringify(customFields.filter(f => f.hidden).map(f => f.name)),
        requiredFields: JSON.stringify(customFields.filter(f => f.required).map(f => f.name)),
        optionalFields: JSON.stringify(customFields.filter(f => !f.required && !f.hidden).map(f => f.name)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-templates/company', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-templates/company', selectedCompany, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-templates/company', selectedCompany, 'categories'] });
      setIsCreateOpen(false);
      setCustomFields([]);
      form.reset();
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar template",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar template
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateFormData> }) =>
      apiRequest('PUT', `/api/ticket-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-templates/company', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-templates/company', selectedCompany, 'stats'] });
      setIsEditOpen(false);
      setEditingTemplate(null);
      setCustomFields([]);
      form.reset();
      toast({
        title: "Template atualizado",
        description: "O template foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar template
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/ticket-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-templates/company', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-templates/company', selectedCompany, 'stats'] });
      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir template",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateTemplate = (data: TemplateFormData) => {
    createTemplateMutation.mutate({ ...data, customFields });
  };

  const handleEditTemplate = (template: TicketTemplate) => {
    setEditingTemplate(template);

    // Parse custom fields if they exist
    try {
      const parsedCustomFields = template.custom_fields ? JSON.parse(template.custom_fields) : [];
      setCustomFields(parsedCustomFields);
    } catch (e) {
      setCustomFields([]);
    }

    form.reset({
      name: template.name,
      description: template.description,
      category: template.category,
      priority: template.priority as any,
      urgency: template.urgency as any,
      impact: template.impact as any,
      defaultTitle: template.default_title,
      defaultDescription: template.default_description,
      defaultTags: template.default_tags || '',
      estimatedHours: template.estimated_hours,
      requiresApproval: template.requires_approval,
      autoAssign: template.auto_assign,
      defaultAssigneeRole: template.default_assignee_role || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdateTemplate = (data: TemplateFormData) => {
    if (!editingTemplate) return;
    updateTemplateMutation.mutate({ id: editingTemplate.id, data });
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  // Filtrar templates
  const filteredTemplates = (templates || []).filter((template: TicketTemplate) => {
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Templates de Tickets</h1>
          <p className="text-muted-foreground">
            Sistema completo de templates com campos customizáveis e análise inteligente
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Company Selector */}
      <CompanyTemplateSelector 
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        showStats={false}
      />

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

        {/* Stats Cards */}
        {stats && Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total_templates || 0}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                    <p className="text-2xl font-bold">{stats.active_templates || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Uso médio</p>
                    <p className="text-2xl font-bold">{Math.round(stats.avg_usage || 0)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mais usado</p>
                    <p className="text-2xl font-bold">{stats.max_usage || 0}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
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
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' ? 
              'Nenhum template encontrado com os filtros aplicados.' :
              'Nenhum template encontrado. Crie o primeiro!'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template: TicketTemplate) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge className={getPriorityColor(template.priority)}>
                      {getPriorityLabel(template.priority)}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Estimativa: {template.estimated_hours}h</p>
                    <p>Usado: {template.usage_count || 0} vezes</p>
                    {template.requires_approval && (
                      <p className="text-orange-600">Requer aprovação</p>
                    )}
                    {template.auto_assign && (
                      <p className="text-blue-600">Atribuição automática</p>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editor Visual de Templates</CardTitle>
              <p className="text-muted-foreground">
                Crie templates de abertura e atribuição usando drag-and-drop. Inclui campos do sistema e campos customizados.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[800px]">
                <TemplateCanvasEditor
                  onSave={(template) => {
                    console.log('Template salvo:', template);
                    // Aqui você pode implementar a lógica de salvamento
                    createTemplateMutation.mutate({
                      name: template.name,
                      description: template.description,
                      category: template.category,
                      defaultTitle: template.name,
                      defaultDescription: template.description,
                      priority: 'medium',
                      urgency: 'medium',
                      impact: 'medium',
                      estimatedHours: 2,
                      requiresApproval: false,
                      autoAssign: false,
                      defaultAssigneeRole: '',
                      customFields: template.fields
                    });
                  }}
                  onPreview={(template) => {
                    console.log('Preview do template:', template);
                    toast({
                      title: "Preview do Template",
                      description: `Template "${template.name}" carregado para preview.`,
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TemplateAnalytics companyId={selectedCompany} />
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <CompanyTemplateSelector 
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
            showStats={true}
          />

          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Configure templates específicos para esta empresa, definindo terminologias 
                e fluxos personalizados que atendem às necessidades específicas do cliente.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Templates Personalizados</h4>
                  <p className="text-sm text-muted-foreground">
                    Crie templates específicos para esta empresa com campos customizados.
                  </p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Aprovações Automáticas</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure regras de aprovação baseadas no perfil da empresa.
                  </p>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Template - {selectedCompany === 'all' ? 'Global' : 'Específico da Empresa'}</DialogTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade Padrão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgência Padrão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impacto Padrão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                        <SelectItem value="critical">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              >
                {createTemplateMutation.isPending ? 'Criando...' : 'Criar Template'}
              </Button>
            </div>
          </form>
        </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure with populated fields */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              if (editingTemplate) {
                updateTemplateMutation.mutate({ id: editingTemplate.id, data });
              }
            })} className="space-y-4">
              {/* Similar form structure as create, but populated with current values */}
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
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}