import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Eye, Upload, Link2, Package, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Item schema validation
const itemSchema = z.object({
  active: z.boolean().default(true),
  type: z.enum(['material', 'service', 'asset']),
  name: z.string().min(1, 'Nome é obrigatório'),
  integrationCode: z.string().optional(),
  description: z.string().optional(),
  measurementUnit: z.enum(['UN', 'M', 'M2', 'M3', 'KG', 'L', 'H', 'PC', 'CX', 'GL', 'SET']).default('UN'),
  maintenancePlan: z.string().optional(),
  category: z.string().optional(),
  defaultChecklist: z.string().optional(),
  status: z.enum(['active', 'under_review', 'discontinued']).default('active')
});

type ItemFormData = z.infer<typeof itemSchema>;

interface Item {
  id: string;
  active: boolean;
  type: 'material' | 'service' | 'asset';
  name: string;
  integrationCode?: string;
  description?: string;
  measurementUnit: string;
  maintenancePlan?: string;
  category?: string;
  defaultChecklist?: any;
  status: 'active' | 'under_review' | 'discontinued';
  createdAt: string;
  updatedAt: string;
  attachments?: any[];
  links?: any[];
}

const measurementUnits = [
  { value: 'UN', label: 'Unidade' },
  { value: 'M', label: 'Metro' },
  { value: 'M2', label: 'Metro²' },
  { value: 'M3', label: 'Metro³' },
  { value: 'KG', label: 'Quilograma' },
  { value: 'L', label: 'Litro' },
  { value: 'H', label: 'Hora' },
  { value: 'PC', label: 'Peça' },
  { value: 'CX', label: 'Caixa' },
  { value: 'GL', label: 'Galão' },
  { value: 'SET', label: 'Conjunto' }
];

export default function ItemCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for create/edit
  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      active: true,
      type: 'material',
      measurementUnit: 'UN',
      status: 'active'
    }
  });

  // Get items query
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['/api/materials-services/items', searchTerm, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const response = await apiRequest('GET', `/api/materials-services/items?${params.toString()}`);
      return response.data || [];
    }
  });

  // Get stats query
  const { data: stats } = useQuery({
    queryKey: ['/api/materials-services/items/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/materials-services/items/stats');
      return response.data;
    }
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      return await apiRequest('POST', '/api/materials-services/items', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/items/stats'] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: 'Sucesso',
        description: 'Item criado com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar item',
        variant: 'destructive'
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ItemFormData> }) => {
      return await apiRequest('PUT', `/api/materials-services/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/items/stats'] });
      setIsEditOpen(false);
      setSelectedItem(null);
      form.reset();
      toast({
        title: 'Sucesso',
        description: 'Item atualizado com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar item',
        variant: 'destructive'
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/materials-services/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/items/stats'] });
      toast({
        title: 'Sucesso',
        description: 'Item excluído com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir item',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: ItemFormData) => {
    if (selectedItem) {
      updateItemMutation.mutate({ id: selectedItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    form.reset({
      active: item.active,
      type: item.type,
      name: item.name,
      integrationCode: item.integrationCode || '',
      description: item.description || '',
      measurementUnit: item.measurementUnit as any,
      maintenancePlan: item.maintenancePlan || '',
      category: item.category || '',
      defaultChecklist: JSON.stringify(item.defaultChecklist) || '',
      status: item.status
    });
    setIsEditOpen(true);
  };

  const handleDelete = (item: Item) => {
    if (window.confirm(`Tem certeza que deseja excluir o item "${item.name}"?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const getStatusBadge = (status: string, active: boolean) => {
    if (!active) return <Badge variant="secondary">Inativo</Badge>;
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'under_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Em Análise</Badge>;
      case 'discontinued':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Descontinuado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      material: { label: 'Material', className: 'bg-blue-100 text-blue-800' },
      service: { label: 'Serviço', className: 'bg-purple-100 text-purple-800' },
      asset: { label: 'Ativo', className: 'bg-orange-100 text-orange-800' }
    };
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, className: '' };
    return <Badge variant="secondary" className={typeInfo.className}>{typeInfo.label}</Badge>;
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Itens</h1>
          <p className="text-muted-foreground">
            Gerencie materiais, serviços e ativos do sistema
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Item</DialogTitle>
            </DialogHeader>
            <ItemForm 
              form={form} 
              onSubmit={onSubmit} 
              isLoading={createItemMutation.isPending}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens Ativos</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materiais</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.materials || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.services || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
                <SelectItem value="asset">Ativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="under_review">Em Análise</SelectItem>
                <SelectItem value="discontinued">Descontinuado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Itens</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Nenhum item encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando um novo item no catálogo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item: Item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.integrationCode && (
                          <p className="text-sm text-muted-foreground">
                            Código: {item.integrationCode}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTypeBadge(item.type)}
                    {getStatusBadge(item.status, item.active)}
                    <Badge variant="outline">
                      {measurementUnits.find(u => u.value === item.measurementUnit)?.label || item.measurementUnit}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      disabled={deleteItemMutation.isPending}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          <ItemForm 
            form={form} 
            onSubmit={onSubmit} 
            isLoading={updateItemMutation.isPending}
            onCancel={() => {
              setIsEditOpen(false);
              setSelectedItem(null);
              form.reset();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Item Form Component
function ItemForm({ 
  form, 
  onSubmit, 
  isLoading, 
  onCancel 
}: { 
  form: any; 
  onSubmit: (data: ItemFormData) => void; 
  isLoading: boolean;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
            <TabsTrigger value="links">Vínculos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Item Ativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Define se o item está ativo no sistema
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
              
              <FormField
                control={form.control}
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
                        <SelectItem value="asset">Ativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Item *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="integrationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Integração</FormLabel>
                    <FormControl>
                      <Input placeholder="Código único de integração" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição detalhada do item"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="measurementUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {measurementUnits.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="under_review">Em Análise</SelectItem>
                        <SelectItem value="discontinued">Descontinuado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo / Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Categoria ou grupo do item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maintenancePlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Manutenção Padrão</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o plano de manutenção padrão (quando aplicável)"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultChecklist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Checklist Padrão</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite o checklist padrão em formato JSON ou texto (quando aplicável)"
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Upload de Anexos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Funcionalidade será implementada em breve
              </p>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Link2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Vínculos com Itens</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Funcionalidade de vínculos será implementada em breve
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}