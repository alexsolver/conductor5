/**
 * Ticket Configuration Management System
 * Comprehensive admin interface for managing ticket metadata and configurations
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  FolderTree,
  CircleDot,
  AlertTriangle,
  Server,
  CheckCircle2,
  ArrowUpDown,
  Palette,
  Eye,
  EyeOff,
  Building2,
  Layers
} from "lucide-react";

// Schema definitions
const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  color: z.string().default("#3b82f6"),
  icon: z.string().optional(),
  active: z.boolean().default(true)
});

const statusSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']),
  color: z.string().default("#3b82f6"),
  order: z.number().default(0),
  active: z.boolean().default(true)
});

const prioritySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  level: z.number().min(1).max(5),
  slaHours: z.number().min(0),
  color: z.string().default("#3b82f6"),
  active: z.boolean().default(true)
});

// Schema for internal hierarchy (Category → Subcategory → Action)
const hierarchyCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  code: z.string().min(1, "Código é obrigatório"),
  color: z.string().default("#3b82f6"),
  icon: z.string().default("Monitor"),
  sort_order: z.number().default(1)
});

const hierarchySubcategorySchema = z.object({
  category_id: z.string().min(1, "Categoria é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  code: z.string().min(1, "Código é obrigatório"),
  color: z.string().default("#3b82f6"),
  sla_hours: z.number().default(24),
  sort_order: z.number().default(1)
});

const hierarchyActionSchema = z.object({
  subcategory_id: z.string().min(1, "Subcategoria é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  code: z.string().min(1, "Código é obrigatório"),
  action_type: z.enum(['investigation', 'repair', 'maintenance', 'communication', 'documentation', 'escalation', 'resolution', 'analysis', 'forward', 'administrative', 'correction', 'verification', 'negotiation', 'financial', 'report', 'custom']),
  estimated_hours: z.number().default(1),
  sort_order: z.number().default(1)
});

// Schema for hierarchical configuration
const hierarchicalConfigSchema = z.object({
  customerId: z.string().min(1, "Empresa cliente é obrigatória"),
  fieldName: z.string().min(1, "Campo é obrigatório"),
  displayName: z.string().min(1, "Nome de exibição é obrigatório"),
  options: z.array(z.object({
    value: z.string().min(1, "Valor é obrigatório"),
    label: z.string().min(1, "Rótulo é obrigatório"),
    color: z.string().default("#3b82f6"),
    isDefault: z.boolean().default(false)
  })).min(1, "Pelo menos uma opção é necessária")
});

interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color: string;
  icon?: string;
  active: boolean;
  children?: TicketCategory[];
}

interface TicketStatus {
  id: string;
  name: string;
  type: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  color: string;
  order: number;
  active: boolean;
}

interface TicketPriority {
  id: string;
  name: string;
  level: number;
  slaHours: number;
  color: string;
  active: boolean;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  size: string | null;
  subscriptionTier: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface HierarchicalConfiguration {
  id: string;
  customerId: string;
  fieldName: string;
  displayName: string;
  options: {
    value: string;
    label: string;
    color: string;
    isDefault: boolean;
  }[];
}

function TicketConfiguration() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("categories");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isHierarchicalDialogOpen, setIsHierarchicalDialogOpen] = useState(false);

  // Form setups
  const categoryForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: "",
      color: "#3b82f6",
      icon: "",
      active: true
    }
  });

  const statusForm = useForm({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      name: "",
      type: "open" as const,
      color: "#3b82f6",
      order: 0,
      active: true
    }
  });

  const priorityForm = useForm({
    resolver: zodResolver(prioritySchema),
    defaultValues: {
      name: "",
      level: 1,
      slaHours: 24,
      color: "#3b82f6",
      active: true
    }
  });

  const hierarchicalForm = useForm({
    resolver: zodResolver(hierarchicalConfigSchema),
    defaultValues: {
      customerId: "",
      fieldName: "priority",
      displayName: "",
      options: [
        { value: "", label: "", color: "#3b82f6", isDefault: false }
      ]
    }
  });

  // Field array for hierarchical options
  const { fields: hierarchicalOptions, append: addHierarchicalOption, remove: removeHierarchicalOption } = useFieldArray({
    control: hierarchicalForm.control,
    name: "options"
  });

  // Internal hierarchy forms
  const hierarchyCategoryForm = useForm({
    resolver: zodResolver(hierarchyCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      code: "",
      color: "#3b82f6",
      icon: "Monitor",
      sort_order: 1
    }
  });

  const hierarchySubcategoryForm = useForm({
    resolver: zodResolver(hierarchySubcategorySchema),
    defaultValues: {
      category_id: "",
      name: "",
      description: "",
      code: "",
      color: "#3b82f6",
      sla_hours: 24,
      sort_order: 1
    }
  });

  const hierarchyActionForm = useForm({
    resolver: zodResolver(hierarchyActionSchema),
    defaultValues: {
      subcategory_id: "",
      name: "",
      description: "",
      code: "",
      action_type: "investigation" as const,
      estimated_hours: 1,
      sort_order: 1
    }
  });

  // Sync selectedCustomer with hierarchical form whenever it changes
  React.useEffect(() => {
    if (selectedCustomer) {
      console.log('UseEffect: Syncing selectedCustomer with form:', selectedCustomer);
      hierarchicalForm.setValue('customerId', selectedCustomer);
    }
  }, [selectedCustomer]);

  // Data queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/ticket-config/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-config/categories');
      return response.json();
    }
  });

  const { data: statuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ['/api/ticket-config/statuses'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-config/statuses');
      return response.json();
    }
  });

  const { data: priorities = [], isLoading: prioritiesLoading } = useQuery({
    queryKey: ['/api/ticket-config/priorities'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-config/priorities');
      return response.json();
    }
  });

  // Queries for hierarchical configurations
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/customers/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers/companies');
      return response.json();
    }
  });

  // Extract companies from the response structure
  const companies: Company[] = companiesData?.success ? companiesData.data : (companiesData || []);

  const { data: hierarchicalConfig, isLoading: hierarchicalLoading } = useQuery({
    queryKey: ['/api/ticket-metadata-hierarchical/customer', selectedCustomer, 'configuration'],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      const response = await apiRequest('GET', `/api/ticket-metadata-hierarchical/customer/${selectedCustomer}/configuration`);
      return response.json();
    },
    enabled: !!selectedCustomer
  });

  // Internal hierarchy queries
  const { data: hierarchyCategories = [], isLoading: hierarchyCategoriesLoading } = useQuery({
    queryKey: ['/api/ticket-hierarchy/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-hierarchy/categories');
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  const { data: hierarchySubcategories = [], isLoading: hierarchySubcategoriesLoading } = useQuery({
    queryKey: ['/api/ticket-hierarchy/subcategories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-hierarchy/full');
      const result = await response.json();
      if (result.success) {
        const subcategories = [];
        result.data.forEach(category => {
          if (category.subcategories) {
            subcategories.push(...category.subcategories);
          }
        });
        return subcategories;
      }
      return [];
    }
  });

  const { data: fullHierarchy = [], isLoading: fullHierarchyLoading } = useQuery({
    queryKey: ['/api/ticket-hierarchy/full'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-hierarchy/full');
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ticket-config/categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/categories'] });
      setIsDialogOpen(false);
      categoryForm.reset();
      toast({ title: "Categoria criada com sucesso" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/ticket-config/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/categories'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Categoria atualizada com sucesso" });
    }
  });

  const createStatusMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ticket-config/statuses', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/statuses'] });
      setIsDialogOpen(false);
      statusForm.reset();
      toast({ title: "Status criado com sucesso" });
    }
  });

  const createPriorityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ticket-config/priorities', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/priorities'] });
      setIsDialogOpen(false);
      priorityForm.reset();
      toast({ title: "Prioridade criada com sucesso" });
    }
  });

  // Internal hierarchy mutations
  const createHierarchyCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof hierarchyCategorySchema>) => {
      const response = await apiRequest('POST', '/api/ticket-hierarchy/categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-hierarchy/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-hierarchy/full'] });
      setIsDialogOpen(false);
      hierarchyCategoryForm.reset();
      toast({ title: "Categoria criada com sucesso" });
    }
  });

  const createHierarchySubcategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof hierarchySubcategorySchema>) => {
      const response = await apiRequest('POST', '/api/ticket-hierarchy/subcategories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-hierarchy/subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-hierarchy/full'] });
      setIsDialogOpen(false);
      hierarchySubcategoryForm.reset();
      toast({ title: "Subcategoria criada com sucesso" });
    }
  });

  const createHierarchyActionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof hierarchyActionSchema>) => {
      const response = await apiRequest('POST', '/api/ticket-hierarchy/actions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-hierarchy/full'] });
      setIsDialogOpen(false);
      hierarchyActionForm.reset();
      toast({ title: "Ação criada com sucesso" });
    }
  });

  // Hierarchical configuration mutations
  const createHierarchicalConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof hierarchicalConfigSchema>) => {
      console.log('API call with data:', data);
      const response = await apiRequest('POST', `/api/ticket-metadata-hierarchical/customer/${data.customerId}/configuration`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both the hierarchical config and customers list
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-metadata-hierarchical/customer', selectedCustomer, 'configuration'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers/companies'] });
      setIsHierarchicalDialogOpen(false);
      hierarchicalForm.reset({
        customerId: "",
        fieldName: "priority",
        displayName: "",
        options: [
          { value: "", label: "", color: "#3b82f6", isDefault: false }
        ]
      });
      toast({ title: "Configuração hierárquica criada com sucesso" });
    },
    onError: (error) => {
      console.error('Error creating hierarchical config:', error);
      toast({ 
        title: "Erro ao criar configuração", 
        description: "Verifique os dados e tente novamente",
        variant: "destructive"
      });
    }
  });

  // Form handlers
  const onCategorySubmit = (data: z.infer<typeof categorySchema>) => {
    if (editingItem) {
      updateCategoryMutation.mutate({ id: editingItem.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const onStatusSubmit = (data: z.infer<typeof statusSchema>) => {
    createStatusMutation.mutate(data);
  };

  const onPrioritySubmit = (data: z.infer<typeof prioritySchema>) => {
    createPriorityMutation.mutate(data);
  };

  const onHierarchicalSubmit = (data: z.infer<typeof hierarchicalConfigSchema>) => {
    console.log('Form submission triggered');
    console.log('Raw form data:', data);
    console.log('Selected customer:', selectedCustomer);
    console.log('Form values:', hierarchicalForm.getValues());
    console.log('Form state errors:', hierarchicalForm.formState.errors);
    
    // Force customerId sync before submission
    hierarchicalForm.setValue('customerId', selectedCustomer);
    
    // Ensure customerId is set from selectedCustomer
    const submissionData = {
      ...data,
      customerId: selectedCustomer
    };
    
    console.log('Final submission data:', submissionData);
    
    // Validate that we have required fields
    if (!submissionData.customerId || !submissionData.fieldName || !submissionData.displayName) {
      console.error('Missing required fields:', {
        customerId: submissionData.customerId,
        fieldName: submissionData.fieldName,
        displayName: submissionData.displayName
      });
      toast({
        title: "Erro de validação",
        description: "Verifique se todos os campos obrigatórios estão preenchidos",
        variant: "destructive"
      });
      return;
    }
    
    if (!submissionData.options || submissionData.options.length === 0) {
      console.error('No options provided');
      toast({
        title: "Erro de validação", 
        description: "Pelo menos uma opção é necessária",
        variant: "destructive"
      });
      return;
    }
    
    // Filter out empty options
    submissionData.options = submissionData.options.filter(option => 
      option.value && option.label
    );
    
    if (submissionData.options.length === 0) {
      console.error('All options are empty after filtering');
      toast({
        title: "Erro de validação",
        description: "Pelo menos uma opção completa (valor e rótulo) é necessária",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Submitting with filtered options:', submissionData.options);
    createHierarchicalConfigMutation.mutate(submissionData);
  };

  const openEditDialog = (item: any, type: string) => {
    setEditingItem(item);
    if (type === 'category') {
      categoryForm.reset(item);
    } else if (type === 'status') {
      statusForm.reset(item);
    } else if (type === 'priority') {
      priorityForm.reset(item);
    }
    setIsDialogOpen(true);
  };

  const openCreateDialog = (type: string) => {
    setEditingItem(null);
    if (type === 'category') {
      categoryForm.reset();
    } else if (type === 'status') {
      statusForm.reset();
    } else if (type === 'priority') {
      priorityForm.reset();
    }
    setIsDialogOpen(true);
  };

  // Category Tree Component
  const CategoryTree = ({ categories, level = 0 }: { categories: TicketCategory[]; level?: number }) => {
    return (
      <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
        {categories.map((category) => (
          <div key={category.id} className="mb-2">
            <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
                {category.description && (
                  <span className="text-sm text-gray-500">- {category.description}</span>
                )}
                {!category.active && (
                  <Badge variant="outline" className="text-red-600">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(category, 'category')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateDialog('category')}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {category.children && category.children.length > 0 && (
              <CategoryTree categories={category.children} level={level + 1} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Configurações de Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie categorias, status, prioridades e outros metadados do sistema de tickets
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <FolderTree className="w-4 h-4" />
            <span>Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="statuses" className="flex items-center space-x-2">
            <CircleDot className="w-4 h-4" />
            <span>Status</span>
          </TabsTrigger>
          <TabsTrigger value="priorities" className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Prioridades</span>
          </TabsTrigger>
          <TabsTrigger value="hierarchy-internal" className="flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Hierarquia Interna</span>
          </TabsTrigger>
          <TabsTrigger value="hierarchical" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Por Cliente</span>
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FolderTree className="w-5 h-5" />
                    <span>Categorias de Tickets</span>
                  </CardTitle>
                  <CardDescription>
                    Organize tickets em categorias hierárquicas para melhor classificação
                  </CardDescription>
                </div>
                <Button onClick={() => openCreateDialog('category')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="text-center py-8">Carregando categorias...</div>
              ) : categories.length > 0 ? (
                <CategoryTree categories={categories} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma categoria configurada. Crie a primeira categoria.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statuses Tab */}
        <TabsContent value="statuses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CircleDot className="w-5 h-5" />
                    <span>Status de Tickets</span>
                  </CardTitle>
                  <CardDescription>
                    Configure os possíveis estados dos tickets e fluxo de trabalho
                  </CardDescription>
                </div>
                <Button onClick={() => openCreateDialog('status')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Status
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((status: TicketStatus) => (
                    <TableRow key={status.id}>
                      <TableCell className="font-medium">{status.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{status.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="text-sm">{status.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>{status.order}</TableCell>
                      <TableCell>
                        {status.active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(status, 'status')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Priorities Tab */}
        <TabsContent value="priorities" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Prioridades</span>
                  </CardTitle>
                  <CardDescription>
                    Defina níveis de prioridade e SLAs associados
                  </CardDescription>
                </div>
                <Button onClick={() => openCreateDialog('priority')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Prioridade
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>SLA (horas)</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priorities.map((priority: TicketPriority) => (
                    <TableRow key={priority.id}>
                      <TableCell className="font-medium">{priority.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Nível {priority.level}</Badge>
                      </TableCell>
                      <TableCell>{priority.slaHours}h</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: priority.color }}
                          />
                          <span className="text-sm">{priority.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {priority.active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(priority, 'priority')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Internal Hierarchy Tab */}
        <TabsContent value="hierarchy-internal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hierarchy Visualization */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Layers className="w-5 h-5" />
                      <span>Hierarquia Interna: Categoria → Subcategoria → Ação</span>
                    </CardTitle>
                    <CardDescription>
                      Sistema de 3 níveis para classificação estruturada de tickets
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Categoria
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Categoria</DialogTitle>
                          <DialogDescription>Criar categoria de nível 1</DialogDescription>
                        </DialogHeader>
                        <Form {...hierarchyCategoryForm}>
                          <form onSubmit={hierarchyCategoryForm.handleSubmit((data) => createHierarchyCategoryMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={hierarchyCategoryForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome da Categoria</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Ex: Suporte Técnico" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={hierarchyCategoryForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Descrição da categoria" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={hierarchyCategoryForm.control}
                              name="code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Código</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Ex: TECH" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={hierarchyCategoryForm.control}
                              name="color"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cor</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="color" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end space-x-2">
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline">Cancelar</Button>
                              </DialogTrigger>
                              <Button type="submit" disabled={createHierarchyCategoryMutation.isPending}>
                                Criar Categoria
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fullHierarchyLoading ? (
                  <div className="text-center py-8">Carregando hierarquia...</div>
                ) : (
                  <div className="space-y-4">
                    {fullHierarchy.map((category) => (
                      <div key={category.id} className="border rounded-lg p-4">
                        {/* Category Level */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <span className="font-semibold text-lg">{category.name}</span>
                              <Badge variant="outline" className="ml-2">{category.code}</Badge>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                              )}
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                Subcategoria
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Nova Subcategoria</DialogTitle>
                                <DialogDescription>Adicionar subcategoria para: {category.name}</DialogDescription>
                              </DialogHeader>
                              <Form {...hierarchySubcategoryForm}>
                                <form onSubmit={hierarchySubcategoryForm.handleSubmit((data) => {
                                  data.category_id = category.id;
                                  createHierarchySubcategoryMutation.mutate(data);
                                })} className="space-y-4">
                                  <FormField
                                    control={hierarchySubcategoryForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nome da Subcategoria</FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="Ex: Hardware" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={hierarchySubcategoryForm.control}
                                    name="code"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Código</FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="Ex: HW" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={hierarchySubcategoryForm.control}
                                    name="sla_hours"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>SLA (horas)</FormLabel>
                                        <FormControl>
                                          <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <DialogTrigger asChild>
                                      <Button type="button" variant="outline">Cancelar</Button>
                                    </DialogTrigger>
                                    <Button type="submit" disabled={createHierarchySubcategoryMutation.isPending}>
                                      Criar Subcategoria
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Subcategories */}
                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className="ml-6 space-y-3">
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory.id} className="border-l-2 border-gray-200 pl-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{subcategory.name}</span>
                                    <Badge variant="secondary">{subcategory.code}</Badge>
                                    <Badge variant="outline">{subcategory.sla_hours}h SLA</Badge>
                                  </div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Plus className="w-3 h-3 mr-1" />
                                        Ação
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Nova Ação</DialogTitle>
                                        <DialogDescription>Adicionar ação para: {subcategory.name}</DialogDescription>
                                      </DialogHeader>
                                      <Form {...hierarchyActionForm}>
                                        <form onSubmit={hierarchyActionForm.handleSubmit((data) => {
                                          data.subcategory_id = subcategory.id;
                                          createHierarchyActionMutation.mutate(data);
                                        })} className="space-y-4">
                                          <FormField
                                            control={hierarchyActionForm.control}
                                            name="name"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Nome da Ação</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="Ex: Diagnóstico de Hardware" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={hierarchyActionForm.control}
                                            name="code"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Código</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="Ex: DIAG" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={hierarchyActionForm.control}
                                            name="action_type"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Tipo de Ação</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                  <FormControl>
                                                    <SelectTrigger>
                                                      <SelectValue placeholder="Selecione o tipo" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent>
                                                    <SelectItem value="investigation">Investigação</SelectItem>
                                                    <SelectItem value="repair">Reparo</SelectItem>
                                                    <SelectItem value="maintenance">Manutenção</SelectItem>
                                                    <SelectItem value="communication">Comunicação</SelectItem>
                                                    <SelectItem value="documentation">Documentação</SelectItem>
                                                    <SelectItem value="escalation">Escalação</SelectItem>
                                                    <SelectItem value="resolution">Resolução</SelectItem>
                                                    <SelectItem value="analysis">Análise</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={hierarchyActionForm.control}
                                            name="estimated_hours"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Horas Estimadas</FormLabel>
                                                <FormControl>
                                                  <Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <div className="flex justify-end space-x-2">
                                            <DialogTrigger asChild>
                                              <Button type="button" variant="outline">Cancelar</Button>
                                            </DialogTrigger>
                                            <Button type="submit" disabled={createHierarchyActionMutation.isPending}>
                                              Criar Ação
                                            </Button>
                                          </div>
                                        </form>
                                      </Form>
                                    </DialogContent>
                                  </Dialog>
                                </div>

                                {/* Actions */}
                                {subcategory.actions && subcategory.actions.length > 0 && (
                                  <div className="ml-4 space-y-1">
                                    {subcategory.actions.map((action) => (
                                      <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm">{action.name}</span>
                                          <Badge variant="outline" className="text-xs">{action.code}</Badge>
                                          <Badge variant="secondary" className="text-xs">{action.action_type}</Badge>
                                          <span className="text-xs text-gray-500">{action.estimated_hours}h</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hierarchical Configuration Tab - Enhanced UX */}
        <TabsContent value="hierarchical" className="space-y-6">
          {/* Client Selection Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Configurações Personalizadas por Cliente</span>
                  </CardTitle>
                  <CardDescription>
                    Configure terminologias e campos específicos para cada empresa cliente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Label htmlFor="customer-select" className="text-sm font-medium">
                  Empresa Cliente:
                </Label>
                <Select 
                  value={selectedCustomer} 
                  onValueChange={setSelectedCustomer}
                >
                  <SelectTrigger className="w-[300px]" id="customer-select">
                    <SelectValue placeholder="Selecione uma empresa cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.company_name || company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedCustomer("")}
                  >
                    Limpar Seleção
                  </Button>
                )}
              </div>

              {/* Configuration Overview */}
              {selectedCustomer ? (
                <div className="space-y-6">
                  {/* Current Configurations Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Prioridades</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {hierarchicalConfig?.priority ? 
                          `${hierarchicalConfig.priority.options?.length || 0} opções personalizadas` : 
                          'Usando configuração padrão'
                        }
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 w-full"
                        onClick={() => {
                          hierarchicalForm.setValue('fieldName', 'priority');
                          hierarchicalForm.setValue('displayName', 'Prioridade Personalizada');
                          setIsHierarchicalDialogOpen(true);
                        }}
                      >
                        Configurar
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <CircleDot className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Status</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {hierarchicalConfig?.status ? 
                          `${hierarchicalConfig.status.options?.length || 0} opções personalizadas` : 
                          'Usando configuração padrão'
                        }
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 w-full"
                        onClick={() => {
                          hierarchicalForm.setValue('fieldName', 'status');
                          hierarchicalForm.setValue('displayName', 'Status Personalizado');
                          setIsHierarchicalDialogOpen(true);
                        }}
                      >
                        Configurar
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <FolderTree className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Categorias</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {hierarchicalConfig?.category ? 
                          `${hierarchicalConfig.category.options?.length || 0} opções personalizadas` : 
                          'Usando configuração padrão'
                        }
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 w-full"
                        onClick={() => {
                          hierarchicalForm.setValue('fieldName', 'category');
                          hierarchicalForm.setValue('displayName', 'Categoria Personalizada');
                          setIsHierarchicalDialogOpen(true);
                        }}
                      >
                        Configurar
                      </Button>
                    </Card>
                  </div>

                  {/* Detailed Configurations */}
                  {hierarchicalConfig && Object.keys(hierarchicalConfig).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Configurações Ativas</CardTitle>
                        <CardDescription>
                          Terminologias e opções personalizadas para esta empresa
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {Object.entries(hierarchicalConfig).map(([fieldName, config]: [string, any]) => (
                            <div key={fieldName} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold capitalize">{config.displayName || fieldName}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {config.source === 'customer' ? 'Personalizado' : 
                                     config.source === 'tenant' ? 'Padrão Tenant' : 'Sistema'}
                                  </Badge>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    hierarchicalForm.setValue('fieldName', fieldName);
                                    hierarchicalForm.setValue('displayName', config.displayName || fieldName);
                                    if (config.options) {
                                      hierarchicalForm.setValue('options', config.options);
                                    }
                                    setIsHierarchicalDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                              </div>
                              
                              {config.options && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {config.options.map((option: any, index: number) => (
                                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: option.color }}
                                      />
                                      <span className="text-sm font-medium">{option.label}</span>
                                      {option.isDefault && (
                                        <Badge variant="secondary" className="text-xs">Padrão</Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                      <CardDescription>
                        Configure rapidamente campos comuns para esta empresa
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            hierarchicalForm.setValue('fieldName', 'urgency');
                            hierarchicalForm.setValue('displayName', 'Urgência');
                            setIsHierarchicalDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Urgência
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            hierarchicalForm.setValue('fieldName', 'impact');
                            hierarchicalForm.setValue('displayName', 'Impacto');
                            setIsHierarchicalDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Impacto
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            hierarchicalForm.setValue('fieldName', 'severity');
                            hierarchicalForm.setValue('displayName', 'Severidade');
                            setIsHierarchicalDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Severidade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione uma Empresa Cliente
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Escolha uma empresa cliente no menu acima para visualizar e configurar 
                    suas terminologias personalizadas de tickets.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Creation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Criar'} {
                activeTab === 'categories' ? 'Categoria' :
                activeTab === 'statuses' ? 'Status' :
                activeTab === 'priorities' ? 'Prioridade' : 'Item'
              }
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {editingItem ? 'Edite as informações' : 'Preencha as informações'} do item
            </DialogDescription>
          </DialogHeader>

          {/* Categories Form */}
          {activeTab === 'categories' && (
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da categoria" />
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
                        <Textarea {...field} placeholder="Descrição da categoria" />
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
                        <Input {...field} type="color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCategoryMutation.isPending}>
                    Criar
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {activeTab === 'statuses' && (
            <Form {...statusForm}>
              <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
                <FormField
                  control={statusForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome do status" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={statusForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Aberto</SelectItem>
                          <SelectItem value="in_progress">Em Progresso</SelectItem>
                          <SelectItem value="waiting">Aguardando</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={statusForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={statusForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <Input {...field} type="color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createStatusMutation.isPending}>
                    Criar
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {activeTab === 'priorities' && (
            <Form {...priorityForm}>
              <form onSubmit={priorityForm.handleSubmit(onPrioritySubmit)} className="space-y-4">
                <FormField
                  control={priorityForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da prioridade" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={priorityForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível (1-5)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" max="5" onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={priorityForm.control}
                  name="slaHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLA (horas)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={priorityForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <Input {...field} type="color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPriorityMutation.isPending}>
                    Criar
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Hierarchical Configuration Dialog */}
      <Dialog open={isHierarchicalDialogOpen} onOpenChange={setIsHierarchicalDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Nova Configuração Hierárquica
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Crie configurações específicas para a empresa cliente selecionada
            </DialogDescription>
          </DialogHeader>

          <Form {...hierarchicalForm}>
            <form onSubmit={hierarchicalForm.handleSubmit(onHierarchicalSubmit)} className="space-y-6">
              {/* Customer Field - Hidden as it's pre-selected */}
              <FormField
                control={hierarchicalForm.control}
                name="customerId"
                render={({ field }) => {
                  // Sync field value with selectedCustomer whenever it changes
                  if (field.value !== selectedCustomer && selectedCustomer) {
                    field.onChange(selectedCustomer);
                  }
                  return <input type="hidden" {...field} value={selectedCustomer} />;
                }}
              />
              
              {/* Field Selection */}
              <FormField
                control={hierarchicalForm.control}
                name="fieldName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campo de Configuração</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o campo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="priority">Prioridade</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="category">Categoria</SelectItem>
                        <SelectItem value="urgency">Urgência</SelectItem>
                        <SelectItem value="impact">Impacto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display Name */}
              <FormField
                control={hierarchicalForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Exibição</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Prioridade Personalizada, Severidade Médica" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Options Configuration */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Opções de Configuração</Label>
                <p className="text-sm text-gray-600">
                  Configure as opções que ficarão disponíveis para esta empresa
                </p>
                
                {hierarchicalOptions.map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Opção {index + 1}</Label>
                      {hierarchicalOptions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeHierarchicalOption(index)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={hierarchicalForm.control}
                        name={`options.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ex: high" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={hierarchicalForm.control}
                        name={`options.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rótulo</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ex: Alta" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={hierarchicalForm.control}
                        name={`options.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor</FormLabel>
                            <FormControl>
                              <Input {...field} type="color" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={hierarchicalForm.control}
                        name={`options.${index}.isDefault`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Padrão</FormLabel>
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
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addHierarchicalOption({ value: "", label: "", color: "#3b82f6", isDefault: false })}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsHierarchicalDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createHierarchicalConfigMutation.isPending}>
                  {createHierarchicalConfigMutation.isPending ? 'Criando...' : 'Criar Configuração'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TicketConfiguration;
