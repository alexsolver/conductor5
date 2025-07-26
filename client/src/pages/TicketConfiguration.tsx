/**
 * Ticket Configuration Management System
 * Comprehensive admin interface for managing ticket metadata and configurations
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Clock,
  AlertTriangle,
  Users,
  MapPin,
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

export default function TicketConfiguration() {
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
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers/companies');
      return response.json();
    }
  });

  // Extract customers from the response structure
  const customers = customersData?.success ? customersData.data : (customersData || []);

  const { data: hierarchicalConfig, isLoading: hierarchicalLoading } = useQuery({
    queryKey: ['/api/ticket-metadata-hierarchical/customer', selectedCustomer, 'configuration'],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      const response = await apiRequest('GET', `/api/ticket-metadata-hierarchical/customer/${selectedCustomer}/configuration`);
      return response.json();
    },
    enabled: !!selectedCustomer
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

  // Hierarchical configuration mutations
  const createHierarchicalConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof hierarchicalConfigSchema>) => {
      const response = await apiRequest('POST', `/api/ticket-metadata-hierarchical/customer/${data.customerId}/configuration`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both the hierarchical config and customers list
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-metadata-hierarchical/customer', selectedCustomer, 'configuration'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers/companies'] });
      setIsHierarchicalDialogOpen(false);
      hierarchicalForm.reset();
      toast({ title: "Configuração hierárquica criada com sucesso" });
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
    createHierarchicalConfigMutation.mutate(data);
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
        <TabsList className="grid w-full grid-cols-7">
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
          <TabsTrigger value="hierarchical" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Por Cliente</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Grupos</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Localizações</span>
          </TabsTrigger>
          <TabsTrigger value="slas" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>SLAs</span>
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

        {/* Hierarchical Configuration Tab */}
        <TabsContent value="hierarchical" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Configurações por Cliente</span>
                  </CardTitle>
                  <CardDescription>
                    Configure prioridades, status e categorias específicas para cada empresa cliente
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsHierarchicalDialogOpen(true)}
                  disabled={!selectedCustomer}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Configuração
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Customer Selection */}
              <div className="mb-6">
                <Label htmlFor="customer-select" className="text-base font-medium">
                  Empresa Cliente
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Selecione uma empresa para visualizar ou criar configurações específicas
                </p>
                <Select onValueChange={setSelectedCustomer} value={selectedCustomer}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma empresa cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customersLoading ? (
                      <SelectItem value="loading" disabled>Carregando clientes...</SelectItem>
                    ) : customers.length > 0 ? (
                      customers.map((customer: Customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company || `${customer.firstName} ${customer.lastName}`} 
                          <span className="text-gray-500 ml-2">({customer.email})</span>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>Nenhum cliente encontrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Configuration Display */}
              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Configurações Atuais</h3>
                    {hierarchicalLoading && (
                      <div className="text-sm text-gray-500">Carregando configurações...</div>
                    )}
                  </div>
                  
                  {hierarchicalConfig && hierarchicalConfig.configurations?.length > 0 ? (
                    <div className="grid gap-4">
                      {hierarchicalConfig.configurations.map((config: any) => (
                        <Card key={config.fieldName} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{config.displayName}</h4>
                              <p className="text-sm text-gray-500">Campo: {config.fieldName}</p>
                            </div>
                            <Badge variant="outline">
                              <Layers className="w-3 h-3 mr-1" />
                              Específico do Cliente
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {config.options?.map((option: any) => (
                              <Badge 
                                key={option.value}
                                className="px-3 py-1"
                                style={{ 
                                  backgroundColor: option.color + '20',
                                  borderColor: option.color,
                                  color: option.color
                                }}
                              >
                                {option.label}
                                {option.isDefault && <span className="ml-1 text-xs">(Padrão)</span>}
                              </Badge>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : selectedCustomer && !hierarchicalLoading ? (
                    <Card className="p-8 text-center">
                      <div className="text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Nenhuma configuração específica</h3>
                        <p className="text-sm mb-4">
                          Esta empresa usa as configurações padrão do sistema. 
                          <br />
                          Clique em "Nova Configuração" para criar configurações personalizadas.
                        </p>
                        <Button onClick={() => setIsHierarchicalDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Configuração Personalizada
                        </Button>
                      </div>
                    </Card>
                  ) : null}
                </div>
              )}

              {!selectedCustomer && (
                <Card className="p-8 text-center">
                  <div className="text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Selecione uma Empresa</h3>
                    <p className="text-sm">
                      Escolha uma empresa cliente acima para visualizar ou configurar 
                      suas configurações específicas de tickets.
                    </p>
                  </div>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs - placeholder for now */}
        <TabsContent value="groups">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                Configuração de grupos de atendimento em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                Configuração de localizações em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slas">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                Configuração de SLAs em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for creating/editing items */}
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
          </DialogHeader>

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
                        <Textarea {...field} placeholder="Descrição opcional" />
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
                <FormField
                  control={categoryForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativo</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Categoria disponível para uso
                        </div>
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
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                    {editingItem ? 'Atualizar' : 'Criar'}
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
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
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
                <FormField
                  control={statusForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} />
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
            <p className="text-sm text-gray-600">
              Crie configurações específicas para a empresa cliente selecionada
            </p>
          </DialogHeader>

          <Form {...hierarchicalForm}>
            <form onSubmit={hierarchicalForm.handleSubmit(onHierarchicalSubmit)} className="space-y-6">
              {/* Customer Field - Hidden as it's pre-selected */}
              <input type="hidden" {...hierarchicalForm.register("customerId")} value={selectedCustomer} />
              
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
                
                {hierarchicalForm.watch("options").map((_, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-lg">
                    <div className="col-span-3">
                      <FormField
                        control={hierarchicalForm.control}
                        name={`options.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Valor</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: p1, urgente" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-4">
                      <FormField
                        control={hierarchicalForm.control}
                        name={`options.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Rótulo</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: P1 - Crítico, Urgente" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={hierarchicalForm.control}
                        name={`options.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Cor</FormLabel>
                            <FormControl>
                              <Input {...field} type="color" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={hierarchicalForm.control}
                        name={`options.${index}.isDefault`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center justify-center h-full">
                            <FormLabel className="text-sm">Padrão</FormLabel>
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
                    
                    <div className="col-span-1 flex items-end">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const options = hierarchicalForm.getValues("options");
                            hierarchicalForm.setValue("options", options.filter((_, i) => i !== index));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const options = hierarchicalForm.getValues("options");
                    hierarchicalForm.setValue("options", [
                      ...options,
                      { value: "", label: "", color: "#3b82f6", isDefault: false }
                    ]);
                  }}
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
                  {createHierarchicalConfigMutation.isPending ? "Criando..." : "Criar Configuração"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}