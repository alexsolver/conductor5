import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Wrench, 
  Eye, 
  Edit, 
  Trash2, 
  Link as LinkIcon,
  Upload,
  Users,
  Building2,
  BarChart3,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface Item {
  id: string;
  tenantId: string;
  isActive: boolean;
  type: 'material' | 'service';
  name: string;
  integrationCode?: string;
  description?: string;
  unitOfMeasure?: string;
  defaultMaintenancePlan?: string;
  group?: string;
  defaultChecklist?: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemsStats {
  total: number;
  active: number;
  materials: number;
  services: number;
}

// Form Schema
const itemFormSchema = z.object({
  isActive: z.boolean(),
  type: z.enum(['material', 'service']),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  integrationCode: z.string().max(100).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  unitOfMeasure: z.string().max(50).optional().or(z.literal("")),
  defaultMaintenancePlan: z.string().max(255).optional().or(z.literal("")),
  group: z.string().max(100).optional().or(z.literal("")),
  defaultChecklist: z.string().optional().or(z.literal("")),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

export default function ItemsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items', { 
      search: searchTerm, 
      type: typeFilter === 'all' ? undefined : typeFilter,
      group: groupFilter === 'all' ? undefined : groupFilter,
      isActive: activeFilter === 'all' ? undefined : activeFilter === 'active'
    }],
  });

  // Fetch stats
  const { data: stats = { total: 0, active: 0, materials: 0, services: 0 } } = useQuery<ItemsStats>({
    queryKey: ['/api/items/stats'],
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: (data: ItemFormData) => apiRequest('POST', '/api/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items/stats'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Item criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar item",
        variant: "destructive",
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemFormData> }) =>
      apiRequest('PUT', `/api/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items/stats'] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar item",
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items/stats'] });
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir item",
        variant: "destructive",
      });
    },
  });

  // Create form
  const createForm = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      isActive: true,
      type: 'material',
      name: '',
      integrationCode: '',
      description: '',
      unitOfMeasure: '',
      defaultMaintenancePlan: '',
      group: '',
      defaultChecklist: '',
    },
  });

  // Edit form
  const editForm = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
  });

  // Handlers
  const handleCreateItem = (data: ItemFormData) => {
    // Convert empty strings to undefined
    const cleanData = {
      ...data,
      integrationCode: data.integrationCode || undefined,
      description: data.description || undefined,
      unitOfMeasure: data.unitOfMeasure || undefined,
      defaultMaintenancePlan: data.defaultMaintenancePlan || undefined,
      group: data.group || undefined,
      defaultChecklist: data.defaultChecklist || undefined,
    };
    createItemMutation.mutate(cleanData);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    editForm.reset({
      isActive: item.isActive,
      type: item.type,
      name: item.name,
      integrationCode: item.integrationCode || '',
      description: item.description || '',
      unitOfMeasure: item.unitOfMeasure || '',
      defaultMaintenancePlan: item.defaultMaintenancePlan || '',
      group: item.group || '',
      defaultChecklist: item.defaultChecklist || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = (data: ItemFormData) => {
    if (!editingItem) return;
    
    // Convert empty strings to undefined
    const cleanData = {
      ...data,
      integrationCode: data.integrationCode || undefined,
      description: data.description || undefined,
      unitOfMeasure: data.unitOfMeasure || undefined,
      defaultMaintenancePlan: data.defaultMaintenancePlan || undefined,
      group: data.group || undefined,
      defaultChecklist: data.defaultChecklist || undefined,
    };
    updateItemMutation.mutate({ id: editingItem.id, data: cleanData });
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  // Get unique groups for filter
  const uniqueGroups = [...new Set(items.map((item: Item) => item.group).filter(Boolean))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Itens</h1>
          <p className="text-muted-foreground">
            Gerencie materiais e serviços do sistema
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Ativos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiais</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.materials}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.services}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grupo</label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueGroups.map((group) => (
                    <SelectItem key={group} value={group!}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Itens</CardTitle>
          <CardDescription>
            {items.length} item(ns) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum item encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item: Item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <Badge variant={item.type === 'material' ? 'default' : 'secondary'}>
                        {item.type === 'material' ? 'Material' : 'Serviço'}
                      </Badge>
                      <Badge variant={item.isActive ? 'default' : 'destructive'}>
                        {item.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {item.group && (
                        <Badge variant="outline">{item.group}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.integrationCode && `Código: ${item.integrationCode} • `}
                      {item.unitOfMeasure && `Unidade: ${item.unitOfMeasure} • `}
                      Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Item</DialogTitle>
            <DialogDescription>
              Preencha os dados do item (material ou serviço)
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateItem)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
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
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="service">Serviço</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="integrationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Integração</FormLabel>
                      <FormControl>
                        <Input placeholder="Código único do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do item"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <FormControl>
                        <Input placeholder="un, kg, m, l, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo</FormLabel>
                      <FormControl>
                        <Input placeholder="Categoria ou grupo do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="defaultMaintenancePlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano de Manutenção Padrão</FormLabel>
                    <FormControl>
                      <Input placeholder="Plano de manutenção recomendado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="defaultChecklist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Checklist Padrão</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Checklist padrão para este item"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? 'Criando...' : 'Criar Item'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Altere os dados do item
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateItem)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
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
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="service">Serviço</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="integrationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Integração</FormLabel>
                      <FormControl>
                        <Input placeholder="Código único do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do item"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <FormControl>
                        <Input placeholder="un, kg, m, l, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo</FormLabel>
                      <FormControl>
                        <Input placeholder="Categoria ou grupo do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="defaultMaintenancePlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano de Manutenção Padrão</FormLabel>
                    <FormControl>
                      <Input placeholder="Plano de manutenção recomendado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="defaultChecklist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Checklist Padrão</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Checklist padrão para este item"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateItemMutation.isPending}
                >
                  {updateItemMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}