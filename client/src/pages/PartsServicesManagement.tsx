import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Warehouse, 
  Users, 
  ShoppingCart, 
  Wrench, 
  Truck, 
  Shield, 
  DollarSign,
  TrendingUp,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Part {
  id: string;
  internal_code: string;
  manufacturer_code: string;
  title: string;
  description: string;
  category_id: string;
  cost_price: number;
  sale_price: number;
  abc_classification: string;
  is_active: boolean;
  technical_specs: any;
  dimensions: string;
  weight_kg: number;
  material: string;
  voltage: string;
  power_watts: number;
}

interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  email: string;
  phone: string;
  quality_rating: number;
  delivery_rating: number;
  price_rating: number;
  overall_rating: number;
  is_active: boolean;
}

interface Inventory {
  id: string;
  part_id: string;
  location_id: string;
  current_quantity: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  unit_cost: number;
  part?: Part;
  location?: any;
}

interface ServiceKit {
  id: string;
  kit_code: string;
  name: string;
  description: string;
  equipment_model: string;
  service_type: string;
  total_cost: number;
  total_price: number;
  is_active: boolean;
}

interface ActivityType {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

const PartsServicesManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { toast } = useToast();

  // Queries para buscar dados
  const { data: partsData = [], isLoading: partsLoading } = useQuery({
    queryKey: ['/api/parts-services/parts'],
    enabled: activeTab === 'parts' || activeTab === 'overview'
  });

  const { data: suppliersData = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['/api/parts-services/suppliers'],
    enabled: activeTab === 'suppliers' || activeTab === 'overview'
  });

  const { data: inventoryData = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/parts-services/inventory'],
    enabled: activeTab === 'inventory' || activeTab === 'overview'
  });

  const { data: serviceKitsData = [], isLoading: serviceKitsLoading } = useQuery({
    queryKey: ['/api/parts-services/service-kits'],
    enabled: activeTab === 'service-kits' || activeTab === 'overview'
  });

  const { data: activityTypesData = [], isLoading: activityTypesLoading } = useQuery({
    queryKey: ['/api/parts-services/activity-types'],
    enabled: activeTab === 'activity-types' || activeTab === 'overview'
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/parts-services/dashboard/stats'],
    enabled: activeTab === 'overview'
  });

  // Filtrar dados baseado na busca
  const filteredParts = partsData.filter((part: Part) =>
    part.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.internal_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = (suppliersData || []).filter((supplier: Supplier) =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventory = inventoryData.filter((item: Inventory) =>
    item.part?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.part?.internal_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServiceKits = serviceKitsData.filter((kit: ServiceKit) =>
    kit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kit.kit_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para criar novo item
  const handleCreateItem = async (data: any) => {
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'parts':
          endpoint = '/api/parts-services/parts';
          break;
        case 'suppliers':
          endpoint = '/api/parts-services/suppliers';
          break;
        case 'service-kits':
          endpoint = '/api/parts-services/service-kits';
          break;
        case 'activity-types':
          endpoint = '/api/parts-services/activity-types';
          break;
        default:
          return;
      }

      await apiRequest('POST', endpoint, data);
      toast({
        title: 'Sucesso',
        description: 'Item criado com sucesso!'
      });
      setIsCreateDialogOpen(false);
      // Invalidar queries para recarregar dados
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar item',
        variant: 'destructive'
      });
    }
  };

  // Cards de estatísticas do dashboard
  const DashboardStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{partsData.length}</div>
          <p className="text-xs text-muted-foreground">
            +{partsData.filter((p: Part) => p.is_active).length} ativas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{suppliersData.length}</div>
          <p className="text-xs text-muted-foreground">
            {suppliersData.filter((s: Supplier) => Number(s.overall_rating) >= 4.0).length} com alta avaliação
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {inventoryData.reduce((acc: number, item: Inventory) => acc + item.current_quantity, 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {inventoryData.filter((i: Inventory) => i.current_quantity <= i.reorder_point).length} em ponto de reposição
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kits de Serviço</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{serviceKitsData.length}</div>
          <p className="text-xs text-muted-foreground">
            +{serviceKitsData.filter((k: ServiceKit) => k.is_active).length} ativos
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Componente de busca e ações
  const SearchAndActions = () => (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
      </div>
      <Button 
        onClick={() => setIsCreateDialogOpen(true)}
        className="flex items-center space-x-2"
      >
        <Plus className="h-4 w-4" />
        <span>Adicionar</span>
      </Button>
    </div>
  );

  // Tabela de peças
  const PartsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Preço Custo</TableHead>
          <TableHead>Preço Venda</TableHead>
          <TableHead>Classificação</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredParts.map((part: Part) => (
          <TableRow key={part.id}>
            <TableCell className="font-medium">{part.internal_code}</TableCell>
            <TableCell>{part.title}</TableCell>
            <TableCell>{part.category_id}</TableCell>
            <TableCell>R$ {part.cost_price?.toFixed(2)}</TableCell>
            <TableCell>R$ {part.sale_price?.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant={part.abc_classification === 'A' ? 'destructive' : 
                              part.abc_classification === 'B' ? 'default' : 'secondary'}>
                {part.abc_classification}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={part.is_active ? 'default' : 'secondary'}>
                {part.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </TableCell>
            <TableCell>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  // Tabela de fornecedores
  const SuppliersTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Avaliação Geral</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredSuppliers.map((supplier: Supplier) => (
          <TableRow key={supplier.id}>
            <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
            <TableCell>{supplier.name}</TableCell>
            <TableCell>{supplier.email}</TableCell>
            <TableCell>{supplier.phone}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <span>{Number(supplier.overall_rating || 0).toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < Math.floor(Number(supplier.overall_rating || 0)) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                {supplier.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </TableCell>
            <TableCell>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  // Tabela de estoque
  const InventoryTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Peça</TableHead>
          <TableHead>Localização</TableHead>
          <TableHead>Qtd Atual</TableHead>
          <TableHead>Estoque Mínimo</TableHead>
          <TableHead>Ponto Reposição</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredInventory.map((item: Inventory) => (
          <TableRow key={item.id}>
            <TableCell>
              <div>
                <div className="font-medium">{item.part?.title}</div>
                <div className="text-sm text-muted-foreground">{item.part?.internal_code}</div>
              </div>
            </TableCell>
            <TableCell>{item.location_id}</TableCell>
            <TableCell className="font-medium">{item.current_quantity}</TableCell>
            <TableCell>{item.minimum_stock}</TableCell>
            <TableCell>{item.reorder_point}</TableCell>
            <TableCell>
              {item.current_quantity <= item.reorder_point ? (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Repor</span>
                </Badge>
              ) : item.current_quantity <= item.minimum_stock ? (
                <Badge variant="default" className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Baixo</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>OK</span>
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Peças e Serviços</h1>
          <p className="text-muted-foreground">
            Sistema completo para gerenciamento de peças, estoque, fornecedores e serviços
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Peças</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center space-x-2">
            <Warehouse className="h-4 w-4" />
            <span>Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="service-kits" className="flex items-center space-x-2">
            <Wrench className="h-4 w-4" />
            <span>Kits Serviço</span>
          </TabsTrigger>
          <TabsTrigger value="activity-types" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Tipos Atividade</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DashboardStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estoque em Ponto de Reposição</CardTitle>
                <CardDescription>Itens que precisam ser repostos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventoryData
                    .filter((item: Inventory) => item.current_quantity <= item.reorder_point)
                    .slice(0, 5)
                    .map((item: Inventory) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">{item.part?.title}</div>
                          <div className="text-sm text-muted-foreground">{item.part?.internal_code}</div>
                        </div>
                        <Badge variant="destructive">{item.current_quantity} un</Badge>
                      </div>
                    ))}
                  {inventoryData.filter((item: Inventory) => item.current_quantity <= item.reorder_point).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Nenhum item em ponto de reposição</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Melhores Fornecedores</CardTitle>
                <CardDescription>Top fornecedores por avaliação geral</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suppliersData
                    .sort((a: Supplier, b: Supplier) => Number(b.overall_rating || 0) - Number(a.overall_rating || 0))
                    .slice(0, 5)
                    .map((supplier: Supplier) => (
                      <div key={supplier.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.supplier_code}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium">{Number(supplier.overall_rating || 0).toFixed(1)}</span>
                          <span className="text-yellow-400">★</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Peças</CardTitle>
              <CardDescription>Cadastro e controle de todas as peças do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchAndActions />
              {partsLoading ? (
                <div className="text-center py-8">Carregando peças...</div>
              ) : (
                <PartsTable />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Estoque</CardTitle>
              <CardDescription>Monitoramento de estoque por localização</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchAndActions />
              {inventoryLoading ? (
                <div className="text-center py-8">Carregando estoque...</div>
              ) : (
                <InventoryTable />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Fornecedores</CardTitle>
              <CardDescription>Cadastro e avaliação de fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchAndActions />
              {suppliersLoading ? (
                <div className="text-center py-8">Carregando fornecedores...</div>
              ) : (
                <SuppliersTable />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-kits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kits de Serviço</CardTitle>
              <CardDescription>Kits pré-montados para tipos específicos de serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchAndActions />
              {serviceKitsLoading ? (
                <div className="text-center py-8">Carregando kits...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo Serviço</TableHead>
                      <TableHead>Custo Total</TableHead>
                      <TableHead>Preço Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServiceKits.map((kit: ServiceKit) => (
                      <TableRow key={kit.id}>
                        <TableCell className="font-medium">{kit.kit_code}</TableCell>
                        <TableCell>{kit.name}</TableCell>
                        <TableCell>{kit.service_type}</TableCell>
                        <TableCell>R$ {kit.total_cost?.toFixed(2)}</TableCell>
                        <TableCell>R$ {kit.total_price?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={kit.is_active ? 'default' : 'secondary'}>
                            {kit.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Atividade</CardTitle>
              <CardDescription>Categorização de tipos de serviços e atividades</CardDescription>
            </CardHeader>
            <CardContent>
              <SearchAndActions />
              {activityTypesLoading ? (
                <div className="text-center py-8">Carregando tipos de atividade...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityTypesData.map((type: ActivityType) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>{type.description}</TableCell>
                        <TableCell>{type.category}</TableCell>
                        <TableCell>
                          <Badge variant={type.is_active ? 'default' : 'secondary'}>
                            {type.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar/editar items */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Item</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar um novo item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Formulário dinâmico baseado no tipo de item */}
            <div className="text-center py-8 text-muted-foreground">
              Formulário de criação será implementado baseado na aba ativa
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleCreateItem({})}>
              Criar Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartsServicesManagement;