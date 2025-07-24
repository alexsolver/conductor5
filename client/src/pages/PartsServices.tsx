import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Truck, 
  Building2, 
  Wrench, 
  DollarSign, 
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Paperclip,
  Link,
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Import dos modais de funcionalidades avançadas
import { ItemAttachmentsModal } from '@/components/parts-services/ItemAttachmentsModal';
import { ItemLinksModal } from '@/components/parts-services/ItemLinksModal';
import { StockMovementsModal } from '@/components/parts-services/StockMovementsModal';
import { ServiceKitsModal } from '@/components/parts-services/ServiceKitsModal';

// Types para as funcionalidades avançadas
type DashboardStats = {
  totalItems: number;
  materials: number;
  services: number;
  totalSuppliers: number;
  activeSuppliers: number;
  stockAlerts: number;
  totalAssets: number;
  pendingOrders: number;
};

type Item = {
  id: string;
  name: string;
  code: string;
  type: 'Material' | 'Serviço';
  category: string;
  description?: string;
  unitCost: number;
  unitPrice: number;
  isActive: boolean;
  supplier?: string;
  stockLevel?: number;
};

type Supplier = {
  id: string;
  name: string;
  code: string;
  documentNumber?: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  city?: string;
  state?: string;
};

type StockLocation = {
  id: string;
  name: string;
  code: string;
  type: 'fixed' | 'mobile';
  description?: string;
  responsiblePerson?: string;
};

type ServiceKit = {
  id: string;
  name: string;
  description?: string;
  maintenanceType?: string;
  equipmentModel?: string;
  equipmentBrand?: string;
  totalItems?: number;
};

type PriceList = {
  id: string;
  name: string;
  version: string;
  description?: string;
  validFrom: string;
  validTo: string;
  currency: string;
  isActive: boolean;
};

type Asset = {
  id: string;
  name: string;
  assetNumber: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: 'active' | 'maintenance' | 'inactive';
  acquisitionValue?: number;
  currentValue?: number;
  operationalHours?: number;
};

export default function PartsServices() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // Estados dos modais avançados
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [isServiceKitsModalOpen, setIsServiceKitsModalOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Dashboard Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['parts-services', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parts-services/dashboard/stats');
      return response as DashboardStats;
    }
  });

  // Items Query
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['parts-services', 'items'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parts-services/items');
      return response as { items: Item[] };
    }
  });

  // Suppliers Query
  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['parts-services', 'suppliers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parts-services/suppliers');
      return response as { suppliers: Supplier[] };
    }
  });

  // Stock Locations Query
  const { data: locationsData } = useQuery({
    queryKey: ['parts-services', 'stock-locations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parts-services/stock-locations');
      return response as { locations: StockLocation[] };
    }
  });

  // Service Kits Query
  const { data: kitsData } = useQuery({
    queryKey: ['parts-services', 'service-kits'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parts-services/service-kits');
      return response as { kits: ServiceKit[] };
    }
  });

  // Price Lists Query
  const { data: priceListsData } = useQuery({
    queryKey: ['parts-services', 'price-lists'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parts-services/price-lists');
      return response as { priceLists: PriceList[] };
    }
  });

  // Assets Query
  const { data: assetsData } = useQuery({
    queryKey: ['parts-services', 'assets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parts-services/assets');
      return response as { assets: Asset[] };
    }
  });

  if (statsLoading || itemsLoading || suppliersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.materials || 0} materiais, {stats?.services || 0} serviços
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeSuppliers || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.stockAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Itens abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos Monitorados</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Equipamentos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Acesso Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('items')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gestão de Itens
            </CardTitle>
            <CardDescription>
              Cadastro e controle de materiais e serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {itemsData?.items?.length || 0} itens cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('inventory')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Controle de Estoque
            </CardTitle>
            <CardDescription>
              Movimentações e níveis de estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {locationsData?.locations?.length || 0} localizações
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('suppliers')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fornecedores
            </CardTitle>
            <CardDescription>
              Gestão da rede de fornecedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {suppliersData?.suppliers?.length || 0} fornecedores
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('service-kits')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Kits de Serviço
            </CardTitle>
            <CardDescription>
              Conjuntos para manutenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {kitsData?.kits?.length || 0} kits configurados
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('pricing')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Listas de Preços
            </CardTitle>
            <CardDescription>
              Tabelas de preços e margens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {priceListsData?.priceLists?.length || 0} listas ativas
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('assets')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Controle de Ativos
            </CardTitle>
            <CardDescription>
              Gestão de equipamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {assetsData?.assets?.length || 0} ativos monitorados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ItemsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Itens</h3>
          <p className="text-sm text-muted-foreground">Cadastro e controle de materiais e serviços</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="grid gap-4">
        {itemsData?.items?.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.code}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={item.type === 'Material' ? 'default' : 'secondary'}>
                      {item.type}
                    </Badge>
                    <Badge variant={item.isActive ? 'outline' : 'destructive'}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">R$ {item.unitPrice.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Custo: R$ {item.unitCost.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsAttachmentsModalOpen(true);
                      }}
                      className="flex items-center gap-1 h-8"
                    >
                      <Paperclip className="h-3 w-3" />
                      Anexos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsLinksModalOpen(true);
                      }}
                      className="flex items-center gap-1 h-8"
                    >
                      <Link className="h-3 w-3" />
                      Vínculos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsMovementsModalOpen(true);
                      }}
                      className="flex items-center gap-1 h-8"
                    >
                      <TrendingUp className="h-3 w-3" />
                      Estoque
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const SuppliersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Fornecedores</h3>
          <p className="text-sm text-muted-foreground">Gestão da rede de fornecedores</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="grid gap-4">
        {suppliersData?.suppliers?.map((supplier) => (
          <Card key={supplier.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{supplier.name}</h4>
                  <p className="text-sm text-muted-foreground">{supplier.code}</p>
                  {supplier.tradeName && (
                    <p className="text-sm">{supplier.tradeName}</p>
                  )}
                  <Badge variant={supplier.isActive ? 'outline' : 'destructive'} className="mt-2">
                    {supplier.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="text-right">
                  {supplier.email && <p className="text-sm">{supplier.email}</p>}
                  {supplier.phone && <p className="text-sm">{supplier.phone}</p>}
                  {supplier.city && supplier.state && (
                    <p className="text-sm text-muted-foreground">{supplier.city}/{supplier.state}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const InventoryTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Controle de Estoque</h3>
          <p className="text-sm text-muted-foreground">Movimentações e níveis de estoque</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nova Localização
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Movimentação
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {locationsData?.locations?.map((location) => (
          <Card key={location.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{location.name}</h4>
                  <p className="text-sm text-muted-foreground">{location.code}</p>
                  {location.description && (
                    <p className="text-sm">{location.description}</p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    {location.type === 'fixed' ? 'Fixo' : 'Móvel'}
                  </Badge>
                </div>
                <div className="text-right">
                  {location.responsiblePerson && (
                    <p className="text-sm">Responsável: {location.responsiblePerson}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ServiceKitsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Kits de Serviço</h3>
          <p className="text-sm text-muted-foreground">Conjuntos pré-definidos para manutenção</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Kit
        </Button>
      </div>

      <div className="grid gap-4">
        {kitsData?.kits?.map((kit) => (
          <Card key={kit.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{kit.name}</h4>
                  {kit.description && (
                    <p className="text-sm text-muted-foreground">{kit.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {kit.maintenanceType && (
                      <Badge variant="outline">{kit.maintenanceType}</Badge>
                    )}
                    {kit.equipmentBrand && (
                      <Badge variant="secondary">{kit.equipmentBrand}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {kit.equipmentModel && (
                    <p className="text-sm">Modelo: {kit.equipmentModel}</p>
                  )}
                  {kit.totalItems && (
                    <p className="text-sm text-muted-foreground">{kit.totalItems} itens</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const PricingTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Listas de Preços</h3>
          <p className="text-sm text-muted-foreground">Tabelas de preços e margens de lucro</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Lista
        </Button>
      </div>

      <div className="grid gap-4">
        {priceListsData?.priceLists?.map((priceList) => (
          <Card key={priceList.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{priceList.name}</h4>
                  <p className="text-sm text-muted-foreground">Versão {priceList.version}</p>
                  {priceList.description && (
                    <p className="text-sm">{priceList.description}</p>
                  )}
                  <Badge variant={priceList.isActive ? 'outline' : 'destructive'} className="mt-2">
                    {priceList.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm">Moeda: {priceList.currency}</p>
                  <p className="text-sm text-muted-foreground">
                    Válida: {new Date(priceList.validFrom).toLocaleDateString()} - {new Date(priceList.validTo).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const AssetsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Controle de Ativos</h3>
          <p className="text-sm text-muted-foreground">Gestão de equipamentos e ativos</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ativo
        </Button>
      </div>

      <div className="grid gap-4">
        {assetsData?.assets?.map((asset) => (
          <Card key={asset.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{asset.name}</h4>
                  <p className="text-sm text-muted-foreground">{asset.assetNumber}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{asset.category}</Badge>
                    <Badge variant={
                      asset.status === 'active' ? 'default' : 
                      asset.status === 'maintenance' ? 'secondary' : 'destructive'
                    }>
                      {asset.status === 'active' ? 'Ativo' : 
                       asset.status === 'maintenance' ? 'Manutenção' : 'Inativo'}
                    </Badge>
                  </div>
                  {asset.brand && asset.model && (
                    <p className="text-sm mt-1">{asset.brand} - {asset.model}</p>
                  )}
                </div>
                <div className="text-right">
                  {asset.currentValue && (
                    <p className="font-medium">R$ {asset.currentValue.toFixed(2)}</p>
                  )}
                  {asset.operationalHours && (
                    <p className="text-sm text-muted-foreground">{asset.operationalHours}h operação</p>
                  )}
                  {asset.serialNumber && (
                    <p className="text-sm">S/N: {asset.serialNumber}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Peças e Serviços</h1>
          <p className="text-muted-foreground">
            Sistema completo de gestão de peças, serviços e ativos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            <TabsTrigger value="inventory">Estoque</TabsTrigger>
            <TabsTrigger value="service-kits">Kits</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
            <TabsTrigger value="assets">Ativos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <ItemsTab />
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <SuppliersTab />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventoryTab />
          </TabsContent>

          <TabsContent value="service-kits" className="space-y-4">
            <ServiceKitsTab />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <PricingTab />
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <AssetsTab />
          </TabsContent>
        </Tabs>

        {/* Modais Avançados */}
        {selectedItem && (
          <>
            <ItemAttachmentsModal
              isOpen={isAttachmentsModalOpen}
              onClose={() => {
                setIsAttachmentsModalOpen(false);
                setSelectedItem(null);
              }}
              itemId={selectedItem.id}
              itemName={selectedItem.name}
            />
            
            <ItemLinksModal
              isOpen={isLinksModalOpen}
              onClose={() => {
                setIsLinksModalOpen(false);
                setSelectedItem(null);
              }}
              itemId={selectedItem.id}
              itemName={selectedItem.name}
            />
            
            <StockMovementsModal
              isOpen={isMovementsModalOpen}
              onClose={() => {
                setIsMovementsModalOpen(false);
                setSelectedItem(null);
              }}
              itemId={selectedItem.id}
              itemName={selectedItem.name}
            />
          </>
        )}

        <ServiceKitsModal
          isOpen={isServiceKitsModalOpen}
          onClose={() => setIsServiceKitsModalOpen(false)}
        />
      </div>
    </div>
  );
}