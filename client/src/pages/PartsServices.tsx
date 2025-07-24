import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Warehouse, 
  Truck, 
  Users, 
  ShoppingCart,
  DollarSign,
  FileCheck,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Types for the Parts & Services module
interface Item {
  id: string;
  name: string;
  internalCode: string;
  manufacturerCode: string;
  type: 'material' | 'service';
  group: string;
  costPrice: number;
  salePrice: number;
  isActive: boolean;
  stockQuantity?: number;
  minimumStock?: number;
  maximumStock?: number;
}

interface Supplier {
  id: string;
  name: string;
  supplierCode: string;
  documentNumber: string;
  tradeName: string;
  email: string;
  phone: string;
  isActive: boolean;
  isApproved: boolean;
}

interface StockLocation {
  id: string;
  name: string;
  description: string;
  locationType: string;
  isActive: boolean;
}

interface StockMovement {
  id: string;
  itemId: string;
  locationId: string;
  movementType: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

interface DashboardStats {
  totalItems: number;
  activeItems: number;
  totalSuppliers: number;
  lowStockItems: number;
  totalStockValue: number;
  monthlyMovements: number;
}

export default function PartsServices() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');

  // Dashboard Stats Query
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/parts-services/dashboard-stats'],
    enabled: activeTab === 'overview'
  });

  // Items Query
  const { data: items = [], isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: ['/api/parts-services/items'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterGroup !== 'all') params.append('group', filterGroup);
      
      const response = await fetch(`/api/parts-services/items?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },
    enabled: activeTab === 'items'
  });

  // Suppliers Query
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ['/api/parts-services/suppliers'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/parts-services/suppliers?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    },
    enabled: activeTab === 'suppliers'
  });

  // Stock Locations Query
  const { data: stockLocations = [], isLoading: isLoadingLocations } = useQuery<StockLocation[]>({
    queryKey: ['/api/parts-services/stock-locations'],
    enabled: activeTab === 'stock-control'
  });

  // Stock Movements Query
  const { data: stockMovements = [], isLoading: isLoadingMovements } = useQuery<StockMovement[]>({
    queryKey: ['/api/parts-services/stock-movements'],
    enabled: activeTab === 'stock-control'
  });

  // Render Overview Dashboard
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.activeItems || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardStats?.lowStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              Itens abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(dashboardStats?.totalStockValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor atualizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.monthlyMovements || 0}</div>
            <p className="text-xs text-muted-foreground">
              Entradas e saídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operacional</div>
            <p className="text-xs text-muted-foreground">
              Sistema funcionando
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulos Disponíveis</CardTitle>
          <CardDescription>
            Acesse os diferentes módulos do sistema de Peças e Serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveTab('items')}
            >
              <Package className="h-6 w-6" />
              <span>Gestão de Peças</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveTab('stock-control')}
            >
              <Warehouse className="h-6 w-6" />
              <span>Controle de Estoque</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveTab('suppliers')}
            >
              <Users className="h-6 w-6" />
              <span>Fornecedores</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveTab('logistics')}
            >
              <Truck className="h-6 w-6" />
              <span>Logística</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Items Management
  const renderItems = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Peças</h2>
          <p className="text-muted-foreground">Gerencie itens, materiais e serviços</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="material">Material</SelectItem>
            <SelectItem value="service">Serviço</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os grupos</SelectItem>
            <SelectItem value="mechanical">Mecânico</SelectItem>
            <SelectItem value="electrical">Elétrico</SelectItem>
            <SelectItem value="consumable">Consumível</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent>
          {isLoadingItems ? (
            <div className="text-center py-8">Carregando itens...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4">Código Interno</th>
                    <th className="text-left p-4">Tipo</th>
                    <th className="text-left p-4">Grupo</th>
                    <th className="text-left p-4">Preço de Venda</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4">{item.internalCode}</td>
                      <td className="p-4">
                        <Badge variant={item.type === 'material' ? 'default' : 'secondary'}>
                          {item.type === 'material' ? 'Material' : 'Serviço'}
                        </Badge>
                      </td>
                      <td className="p-4">{item.group}</td>
                      <td className="p-4">
                        R$ {item.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum item encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render Stock Control
  const renderStockControl = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Controle de Estoque</h2>
          <p className="text-muted-foreground">Gerencie locais de estoque e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Novo Local
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Locais de Estoque</CardTitle>
            <CardDescription>Gerencie os locais onde os itens são armazenados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLocations ? (
              <div className="text-center py-4">Carregando locais...</div>
            ) : (
              <div className="space-y-2">
                {stockLocations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{location.name}</h4>
                      <p className="text-sm text-muted-foreground">{location.description}</p>
                    </div>
                    <Badge variant={location.isActive ? 'default' : 'secondary'}>
                      {location.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
                {stockLocations.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum local cadastrado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimentações Recentes</CardTitle>
            <CardDescription>Últimas entradas e saídas de estoque</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMovements ? (
              <div className="text-center py-4">Carregando movimentações...</div>
            ) : (
              <div className="space-y-2">
                {stockMovements.slice(0, 5).map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {movement.movementType === 'in' ? 'Entrada' : 
                         movement.movementType === 'out' ? 'Saída' : 
                         movement.movementType === 'transfer' ? 'Transferência' : 'Ajuste'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {movement.quantity} - {movement.reason}
                      </p>
                    </div>
                    <Badge variant={
                      movement.movementType === 'in' ? 'default' : 
                      movement.movementType === 'out' ? 'destructive' : 'secondary'
                    }>
                      {movement.movementType === 'in' ? '+' : movement.movementType === 'out' ? '-' : '~'}{movement.quantity}
                    </Badge>
                  </div>
                ))}
                {stockMovements.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhuma movimentação registrada
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render Suppliers
  const renderSuppliers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Fornecedores</h2>
          <p className="text-muted-foreground">Gerencie fornecedores e parceiros comerciais</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fornecedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent>
          {isLoadingSuppliers ? (
            <div className="text-center py-8">Carregando fornecedores...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4">Código</th>
                    <th className="text-left p-4">Documento</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Aprovado</th>
                    <th className="text-left p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.tradeName}</div>
                        </div>
                      </td>
                      <td className="p-4">{supplier.supplierCode}</td>
                      <td className="p-4">{supplier.documentNumber}</td>
                      <td className="p-4">{supplier.email}</td>
                      <td className="p-4">
                        <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                          {supplier.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={supplier.isApproved ? 'default' : 'destructive'}>
                          {supplier.isApproved ? 'Aprovado' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {suppliers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum fornecedor encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Peças e Serviços</h1>
        <p className="text-muted-foreground mt-2">
          Sistema completo de gestão de peças, estoque, fornecedores e logística
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="items">Peças</TabsTrigger>
          <TabsTrigger value="stock-control">Estoque</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="logistics">Logística</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          {renderItems()}
        </TabsContent>

        <TabsContent value="stock-control" className="space-y-6">
          {renderStockControl()}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          {renderSuppliers()}
        </TabsContent>

        <TabsContent value="logistics" className="space-y-6">
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Módulo de Logística</h3>
            <p className="text-muted-foreground">
              Funcionalidades de transferência, devoluções e controle de ativos em desenvolvimento
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}