An admin interface for managing ticket metadata and configurations with a new "Advanced Settings" button added.
```
```replit_final_file
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
          <Button 
            onClick={() => window.location.href = '/ticket-configuration/advanced'}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Configurações Avançadas</span>
          </Button>
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
                          <form onSubmit={hierarchyCategoryForm.handleSubmit((data) => createHierarchy