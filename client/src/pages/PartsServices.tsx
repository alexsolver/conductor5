import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Package, Settings, Wrench, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type Item = {
  id: string;
  tenantId: string;
  active: boolean;
  type: 'Material' | 'Serviço';
  name: string;
  integrationCode?: string;
  description?: string;
  unitOfMeasure?: string;
  defaultMaintenancePlan?: string;
  group?: string;
  defaultChecklist?: string;
  createdAt: string;
  updatedAt: string;
};

type Supplier = {
  id: string;
  tenantId: string;
  name: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactPerson?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type DashboardStats = {
  totalItems: number;
  materials: number;
  services: number;
  totalSuppliers: number;
  activeSuppliers: number;
  stockAlerts: number;
  pendingOrders: number;
};

export default function PartsServices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'Material' as 'Material' | 'Serviço',
    integrationCode: '',
    description: '',
    unitOfMeasure: '',
    defaultMaintenancePlan: '',
    group: '',
    defaultChecklist: '',
    active: true,
  });
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    documentNumber: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contactPerson: '',
    active: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consultas
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/parts-services/dashboard/stats'],
  });

  const { data: itemsData, isLoading: itemsLoading } = useQuery<{ items: Item[] }>({
    queryKey: ['/api/parts-services/items', searchTerm, typeFilter],
    queryFn: () => apiRequest('GET', `/api/parts-services/items?search=${searchTerm}&type=${typeFilter === 'all' ? '' : typeFilter}`),
  });

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery<{ suppliers: Supplier[] }>({
    queryKey: ['/api/parts-services/suppliers'],
  });

  // Mutações
  const createItemMutation = useMutation({
    mutationFn: (data: typeof newItem) => apiRequest('POST', '/api/parts-services/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setIsCreateItemOpen(false);
      setNewItem({
        name: '',
        type: 'Material',
        integrationCode: '',
        description: '',
        unitOfMeasure: '',
        defaultMaintenancePlan: '',
        group: '',
        defaultChecklist: '',
        active: true,
      });
      toast({
        title: 'Item criado com sucesso',
        description: 'O item foi adicionado ao catálogo.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao criar item',
        description: 'Não foi possível criar o item. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: typeof newSupplier) => apiRequest('POST', '/api/parts-services/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setIsCreateSupplierOpen(false);
      setNewSupplier({
        name: '',
        documentNumber: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        contactPerson: '',
        active: true,
      });
      toast({
        title: 'Fornecedor criado com sucesso',
        description: 'O fornecedor foi adicionado ao sistema.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao criar fornecedor',
        description: 'Não foi possível criar o fornecedor. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateItem = () => {
    if (!newItem.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do item.',
        variant: 'destructive',
      });
      return;
    }
    createItemMutation.mutate(newItem);
  };

  const handleCreateSupplier = () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do fornecedor.',
        variant: 'destructive',
      });
      return;
    }
    createSupplierMutation.mutate(newSupplier);
  };

  const filteredItems = itemsData?.items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.integrationCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Peças e Serviços</h1>
          <p className="text-muted-foreground">
            Gestão completa de itens, fornecedores e controle de estoque
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Item</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do item"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={newItem.type}
                    onValueChange={(value: 'Material' | 'Serviço') => setNewItem(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Material">Material</SelectItem>
                      <SelectItem value="Serviço">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="integrationCode">Código de Integração</Label>
                  <Input
                    id="integrationCode"
                    value={newItem.integrationCode}
                    onChange={(e) => setNewItem(prev => ({ ...prev, integrationCode: e.target.value }))}
                    placeholder="Ex: MT-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unidade de Medida</Label>
                  <Input
                    id="unitOfMeasure"
                    value={newItem.unitOfMeasure}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitOfMeasure: e.target.value }))}
                    placeholder="Ex: UN, M, KG"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group">Grupo</Label>
                  <Input
                    id="group"
                    value={newItem.group}
                    onChange={(e) => setNewItem(prev => ({ ...prev, group: e.target.value }))}
                    placeholder="Ex: Componentes Elétricos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenancePlan">Plano de Manutenção Padrão</Label>
                  <Input
                    id="maintenancePlan"
                    value={newItem.defaultMaintenancePlan}
                    onChange={(e) => setNewItem(prev => ({ ...prev, defaultMaintenancePlan: e.target.value }))}
                    placeholder="Ex: Inspeção Trimestral"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada do item"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="checklist">Checklist Padrão</Label>
                  <Textarea
                    id="checklist"
                    value={newItem.defaultChecklist}
                    onChange={(e) => setNewItem(prev => ({ ...prev, defaultChecklist: e.target.value }))}
                    placeholder="Lista de verificações padrão"
                  />
                </div>
                <div className="flex items-center space-x-2 col-span-2">
                  <Switch
                    id="active"
                    checked={newItem.active}
                    onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateItemOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateItem} disabled={createItemMutation.isPending}>
                  {createItemMutation.isPending ? 'Criando...' : 'Criar Item'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Fornecedor</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Nome *</Label>
                  <Input
                    id="supplierName"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">CNPJ</Label>
                  <Input
                    id="documentNumber"
                    value={newSupplier.documentNumber}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, documentNumber: e.target.value }))}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 9999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                  <Input
                    id="contactPerson"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={newSupplier.zipCode}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Nome da cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={newSupplier.state}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, complemento"
                  />
                </div>
                <div className="flex items-center space-x-2 col-span-2">
                  <Switch
                    id="supplierActive"
                    checked={newSupplier.active}
                    onCheckedChange={(checked) => setNewSupplier(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="supplierActive">Ativo</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateSupplierOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSupplier} disabled={createSupplierMutation.isPending}>
                  {createSupplierMutation.isPending ? 'Criando...' : 'Criar Fornecedor'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : dashboardStats?.totalItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.materials || 0} materiais, {dashboardStats?.services || 0} serviços
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : dashboardStats?.totalSuppliers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.activeSuppliers || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {statsLoading ? '...' : dashboardStats?.stockAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Itens abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : dashboardStats?.pendingOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Material">Material</SelectItem>
                <SelectItem value="Serviço">Serviço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Itens */}
          <div className="grid gap-4">
            {itemsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando itens...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum item encontrado
              </div>
            ) : (
              filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{item.name}</h3>
                          <Badge variant={item.type === 'Material' ? 'default' : 'secondary'}>
                            {item.type}
                          </Badge>
                          {!item.active && (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                        </div>
                        {item.integrationCode && (
                          <p className="text-sm text-muted-foreground">
                            Código: {item.integrationCode}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {item.unitOfMeasure && (
                            <span>Unidade: {item.unitOfMeasure}</span>
                          )}
                          {item.group && (
                            <span>Grupo: {item.group}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Editar
                        </Button>
                        <Button size="sm" variant="outline">
                          Vínculos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          {/* Lista de Fornecedores */}
          <div className="grid gap-4">
            {suppliersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando fornecedores...
              </div>
            ) : !suppliersData?.suppliers?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum fornecedor encontrado
              </div>
            ) : (
              suppliersData.suppliers.map((supplier) => (
                <Card key={supplier.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{supplier.name}</h3>
                          {!supplier.active && (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                        </div>
                        {supplier.documentNumber && (
                          <p className="text-sm text-muted-foreground">
                            CNPJ: {supplier.documentNumber}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {supplier.email && (
                            <span>Email: {supplier.email}</span>
                          )}
                          {supplier.phone && (
                            <span>Telefone: {supplier.phone}</span>
                          )}
                        </div>
                        {supplier.contactPerson && (
                          <p className="text-sm text-muted-foreground">
                            Contato: {supplier.contactPerson}
                          </p>
                        )}
                        {(supplier.city || supplier.state) && (
                          <p className="text-sm text-muted-foreground">
                            {supplier.city}{supplier.city && supplier.state ? ', ' : ''}{supplier.state}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Editar
                        </Button>
                        <Button size="sm" variant="outline">
                          Catálogo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Funcionalidade de controle de estoque será implementada em breve
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Funcionalidade de movimentações será implementada em breve
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}