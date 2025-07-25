import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Truck, 
  Building2, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Types baseados nos dados reais da API
type ItemFromAPI = {
  id: string;
  tenantId: string;
  active: boolean;
  type: 'Material' | 'Serviço';
  name: string;
  integrationCode: string;
  description: string;
  unitOfMeasure: string;
  defaultMaintenancePlan?: string;
  group: string;
  defaultChecklist?: string;
  createdAt: string;
  updatedAt: string;
};

type CreateItemData = {
  active: boolean;
  type: 'Material' | 'Serviço';
  name: string;
  integrationCode: string;
  description: string;
  unitOfMeasure: string;
  group: string;
  defaultMaintenancePlan?: string;
  defaultChecklist?: string;
};

export default function PartsServicesWorking() {
  const [activeTab, setActiveTab] = useState('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemFromAPI | null>(null);
  
  const queryClient = useQueryClient();

  // Query para buscar os itens reais da API
  const { data: itemsResponse, isLoading } = useQuery<{ items: ItemFromAPI[]; total: number }>({
    queryKey: ['/api/parts-services/items'],
  });

  // Mutation para criar item
  const createItemMutation = useMutation({
    mutationFn: async (data: CreateItemData) => {
      return await apiRequest('POST', '/api/parts-services/items', data);
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Item criado com sucesso!" });
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/items'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao criar item",
        variant: "destructive" 
      });
    }
  });

  // Mutation para atualizar item
  const updateItemMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<CreateItemData>) => {
      const { id, ...updateData } = data;
      return await apiRequest('PUT', `/api/parts-services/items/${id}`, updateData);
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Item atualizado com sucesso!" });
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/items'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao atualizar item",
        variant: "destructive" 
      });
    }
  });

  // Mutation para deletar item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/parts-services/items/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Item removido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/items'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao remover item",
        variant: "destructive" 
      });
    }
  });

  const items = itemsResponse?.items || [];
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.integrationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateItem = (formData: FormData) => {
    const data: CreateItemData = {
      active: formData.get('active') === 'true',
      type: formData.get('type') as 'Material' | 'Serviço',
      name: formData.get('name') as string,
      integrationCode: formData.get('integrationCode') as string,
      description: formData.get('description') as string,
      unitOfMeasure: formData.get('unitOfMeasure') as string,
      group: formData.get('group') as string,
      defaultMaintenancePlan: formData.get('defaultMaintenancePlan') as string || undefined,
      defaultChecklist: formData.get('defaultChecklist') as string || undefined,
    };
    createItemMutation.mutate(data);
  };

  const handleUpdateItem = (formData: FormData) => {
    if (!editingItem) return;
    
    const data = {
      id: editingItem.id,
      active: formData.get('active') === 'true',
      type: formData.get('type') as 'Material' | 'Serviço',
      name: formData.get('name') as string,
      integrationCode: formData.get('integrationCode') as string,
      description: formData.get('description') as string,
      unitOfMeasure: formData.get('unitOfMeasure') as string,
      group: formData.get('group') as string,
      defaultMaintenancePlan: formData.get('defaultMaintenancePlan') as string || undefined,
      defaultChecklist: formData.get('defaultChecklist') as string || undefined,
    };
    updateItemMutation.mutate(data);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o item "${name}"?`)) {
      deleteItemMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Peças e Serviços</h1>
          <p className="text-muted-foreground">
            Gestão completa de materiais e serviços
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Item</DialogTitle>
              <DialogDescription>
                Adicione um novo material ou serviço ao sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateItem(formData);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="active">Status</Label>
                  <Select name="active" defaultValue="true">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Material">Material</SelectItem>
                      <SelectItem value="Serviço">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input 
                  name="name" 
                  placeholder="Ex: Resistor 220 Ohm"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="integrationCode">Código de Integração *</Label>
                  <Input 
                    name="integrationCode" 
                    placeholder="Ex: R220"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unitOfMeasure">Unidade de Medida *</Label>
                  <Input 
                    name="unitOfMeasure" 
                    placeholder="Ex: UN, M, KG"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="group">Grupo *</Label>
                <Input 
                  name="group" 
                  placeholder="Ex: Componentes Eletrônicos"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  name="description" 
                  placeholder="Descrição detalhada do item"
                />
              </div>

              <div>
                <Label htmlFor="defaultMaintenancePlan">Plano de Manutenção Padrão</Label>
                <Textarea 
                  name="defaultMaintenancePlan" 
                  placeholder="Plano de manutenção padrão para este item"
                />
              </div>

              <div>
                <Label htmlFor="defaultChecklist">Checklist Padrão</Label>
                <Textarea 
                  name="defaultChecklist" 
                  placeholder="Checklist padrão para este item"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
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
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Itens ({items.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="inventory">Controle de Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    <Badge variant="outline" className="mr-2">
                      {item.type}
                    </Badge>
                    {item.integrationCode}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Grupo:</strong> {item.group}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Unidade:</strong> {item.unitOfMeasure}
                    </p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      disabled={deleteItemMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhum item encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro item.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Fornecedores</CardTitle>
              <CardDescription>Em desenvolvimento</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Estoque</CardTitle>
              <CardDescription>Em desenvolvimento</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Item</DialogTitle>
              <DialogDescription>
                Edite as informações do item
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateItem(formData);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="active">Status</Label>
                  <Select name="active" defaultValue={editingItem.active.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select name="type" defaultValue={editingItem.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Material">Material</SelectItem>
                      <SelectItem value="Serviço">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input 
                  name="name" 
                  defaultValue={editingItem.name}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="integrationCode">Código de Integração</Label>
                  <Input 
                    name="integrationCode" 
                    defaultValue={editingItem.integrationCode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unitOfMeasure">Unidade de Medida</Label>
                  <Input 
                    name="unitOfMeasure" 
                    defaultValue={editingItem.unitOfMeasure}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="group">Grupo</Label>
                <Input 
                  name="group" 
                  defaultValue={editingItem.group}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  name="description" 
                  defaultValue={editingItem.description}
                />
              </div>

              <div>
                <Label htmlFor="defaultMaintenancePlan">Plano de Manutenção Padrão</Label>
                <Textarea 
                  name="defaultMaintenancePlan" 
                  defaultValue={editingItem.defaultMaintenancePlan || ''}
                />
              </div>

              <div>
                <Label htmlFor="defaultChecklist">Checklist Padrão</Label>
                <Textarea 
                  name="defaultChecklist" 
                  defaultValue={editingItem.defaultChecklist || ''}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingItem(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateItemMutation.isPending}
                >
                  {updateItemMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}