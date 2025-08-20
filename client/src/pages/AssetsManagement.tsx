import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
import { useLocalization } from '@/hooks/useLocalization';
  Monitor,
  Laptop,
  Smartphone,
  Printer,
  HardDrive,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
  Activity,
  Settings,
  FileText,
  BarChart3
} from "lucide-react";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  description: string;
  category: 'computer' | 'mobile' | 'printer' | 'furniture' | 'vehicle' | 'equipment' | 'software';
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  warranty: {
    startDate: string;
    endDate: string;
    provider: string;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'disposed';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: {
    id: string;
    name: string;
    address: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  department: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetCategory {
  id: string;
  name: string;
  code: string;
  icon: string;
  depreciationRate: number; // annual percentage
  maintenanceInterval: number; // days
  active: boolean;
}

interface AssetStats {
  totalAssets: number;
  activeAssets: number;
  underMaintenance: number;
  retiredAssets: number;
  totalValue: number;
  depreciatedValue: number;
  upcomingMaintenance: number;
  expiredWarranties: number;
}

interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective' | 'warranty' | 'upgrade';
  description: string;
  performedBy: string;
  performedDate: string;
  cost: number;
  notes?: string;
  nextMaintenanceDate?: string;
}

export function AssetsManagement() {
  const { t } = useLocalization();

  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for development - would be replaced with real API calls
  const mockAssetStats: AssetStats = {
    totalAssets: 247,
    activeAssets: 198,
    underMaintenance: 12,
    retiredAssets: 37,
    totalValue: 485600,
    depreciatedValue: 342890,
    upcomingMaintenance: 15,
    expiredWarranties: 8
  };

  const mockAssets: Asset[] = [
    {
      id: "1",
      assetTag: "PC001",
      name: "Dell OptiPlex 7090",
      description: "Desktop computer for administrative work",
      category: "computer",
      brand: "Dell",
      model: "OptiPlex 7090",
      serialNumber: "DELL7090-001",
      purchaseDate: "2024-03-15T00:00:00Z",
      purchasePrice: 2500.00,
      currentValue: 2000.00,
      warranty: {
        startDate: "2024-03-15T00:00:00Z",
        endDate: "2027-03-15T00:00:00Z",
        provider: "Dell Technologies"
      },
      status: "active",
      condition: "excellent",
      location: {
        id: "loc1",
        name: "Escritório Central",
        address: "São Paulo - SP, Av. Paulista, 1000"
      },
      assignedTo: {
        id: "user1",
        name: "João Silva",
        email: "joao.silva@empresa.com"
      },
      department: "Administrativo",
      lastMaintenanceDate: "2024-12-01T00:00:00Z",
      nextMaintenanceDate: "2025-06-01T00:00:00Z",
      createdAt: "2024-03-15T10:00:00Z",
      updatedAt: "2024-12-01T14:30:00Z"
    },
    {
      id: "2",
      assetTag: "LAP002",
      name: "MacBook Pro 14",
      description: "Laptop for development team",
      category: "computer",
      brand: "Apple",
      model: "MacBook Pro 14",
      serialNumber: "MBP14-2024-002",
      purchaseDate: "2024-06-10T00:00:00Z",
      purchasePrice: 8500.00,
      currentValue: 7200.00,
      warranty: {
        startDate: "2024-06-10T00:00:00Z",
        endDate: "2025-06-10T00:00:00Z",
        provider: "Apple Inc."
      },
      status: "active",
      condition: "excellent",
      location: {
        id: "loc2",
        name: "Centro de Desenvolvimento",
        address: "São Paulo - SP, Rua dos Desenvolvedores, 500"
      },
      assignedTo: {
        id: "user2",
        name: "Maria Santos",
        email: "maria.santos@empresa.com"
      },
      department: "Tecnologia",
      createdAt: "2024-06-10T09:15:00Z",
      updatedAt: "2024-06-10T09:15:00Z"
    },
    {
      id: "3",
      assetTag: "PRT003",
      name: "HP LaserJet Pro M404n",
      description: "Network printer for office use",
      category: "printer",
      brand: "HP",
      model: "LaserJet Pro M404n",
      serialNumber: "HP404N-003",
      purchaseDate: "2023-08-20T00:00:00Z",
      purchasePrice: 650.00,
      currentValue: 450.00,
      warranty: {
        startDate: "2023-08-20T00:00:00Z",
        endDate: "2024-08-20T00:00:00Z",
        provider: "HP Inc."
      },
      status: "maintenance",
      condition: "good",
      location: {
        id: "loc1",
        name: "Escritório Central",
        address: "São Paulo - SP, Av. Paulista, 1000"
      },
      department: "Compartilhado",
      lastMaintenanceDate: "2025-01-20T00:00:00Z",
      maintenanceNotes: "Substituição de toner e limpeza interna",
      createdAt: "2023-08-20T11:00:00Z",
      updatedAt: "2025-01-20T16:45:00Z"
    }
  ];

  const mockAssetCategories: AssetCategory[] = [
    {
      id: "cat1",
      name: "Computadores",
      code: "COMP",
      icon: "Monitor",
      depreciationRate: 25,
      maintenanceInterval: 180,
      active: true
    },
    {
      id: "cat2",
      name: "Impressoras",
      code: "PRINT",
      icon: "Printer",
      depreciationRate: 20,
      maintenanceInterval: 90,
      active: true
    },
    {
      id: "cat3",
      name: "Dispositivos Móveis",
      code: "MOBILE",
      icon: "Smartphone",
      depreciationRate: 30,
      maintenanceInterval: 365,
      active: true
    },
    {
      id: "cat4",
      name: "Equipamentos",
      code: "EQUIP",
      icon: "HardDrive",
      depreciationRate: 15,
      maintenanceInterval: 60,
      active: true
    }
  ];

  // Simulated queries - would use real API endpoints
  const { data: assets = mockAssets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ["/api/materials-services/assets"],
    queryFn: () => Promise.resolve(mockAssets),
    enabled: true
  });

  const { data: assetCategories = mockAssetCategories } = useQuery({
    queryKey: ["/api/materials-services/asset-categories"],
    queryFn: () => Promise.resolve(mockAssetCategories),
    enabled: true
  });

  const { data: assetStats = mockAssetStats } = useQuery({
    queryKey: ["/api/materials-services/assets/stats"],
    queryFn: () => Promise.resolve(mockAssetStats),
    enabled: true
  });

  // Mutations for asset management
  const createAssetMutation = useMutation({
    mutationFn: async (data: Partial<Asset>) => {
      // Simulate API call
      return Promise.resolve({ success: true, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/assets"] });
      toast({ title: "Sucesso", description: "Ativo criado com sucesso!" });
      setIsCreateAssetOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('AssetsManagement.erro'),
        description: error.message || t('AssetsManagement.erroAoCriarAtivo'),
        variant: "destructive"
      });
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Asset> & { id: string }) => {
      // Simulate API call
      return Promise.resolve({ success: true, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/assets"] });
      toast({ title: "Sucesso", description: "Ativo atualizado com sucesso!" });
      setIsEditOpen(false);
      setSelectedAsset(null);
    },
    onError: (error: any) => {
      toast({
        title: t('AssetsManagement.erro'),
        description: error.message || t('AssetsManagement.erroAoAtualizarAtivo'),
        variant: "destructive"
      });
    }
  });

  // Filter assets
  const filteredAssets = assets.filter((asset: Asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-blue-100 text-blue-800';
      case 'disposed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'maintenance': return 'Manutenção';
      case 'retired': return 'Aposentado';
      case 'disposed': return 'Descartado';
      default: return 'Indefinido';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'fair': return 'Regular';
      case 'poor': return 'Ruim';
      default: return 'Indefinido';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'computer': return Monitor;
      case 'mobile': return Smartphone;
      case 'printer': return Printer;
      case 'equipment': return HardDrive;
      default: return Monitor;
    }
  };

  const handleCreateAsset = (formData: FormData) => {
    const assetData = {
      assetTag: formData.get('assetTag') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as Asset['category'],
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      serialNumber: formData.get('serialNumber') as string,
      purchasePrice: parseFloat(formData.get('purchasePrice') as string),
      department: formData.get('department') as string,
      status: 'active' as const,
      condition: 'excellent' as const
    };

    createAssetMutation.mutate(assetData);
  };

  const calculateDepreciation = (asset: Asset) => {
    const category = assetCategories.find(cat => cat.code.toLowerCase() === asset.category);
    if (!category) return asset.purchasePrice;

    const ageInYears = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const depreciationAmount = asset.purchasePrice * (category.depreciationRate / 100) * ageInYears;
    return Math.max(asset.purchasePrice - depreciationAmount, asset.purchasePrice * 0.1); // Min 10% of original value
  };

  if (isLoadingAssets) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando ativos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Ativos</h1>
          <p className="text-muted-foreground">
            Gerencie equipamentos, computadores e ativos da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateCategoryOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
          <Button onClick={() => setIsCreateAssetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Ativo
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetStats.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              {assetStats.activeAssets} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {assetStats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              R$ {assetStats.depreciatedValue.toLocaleString()} depreciado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetStats.underMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              {assetStats.upcomingMaintenance} programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Garantias</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetStats.expiredWarranties}</div>
            <p className="text-xs text-muted-foreground">
              garantias expiradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('AssetsManagement.buscarAtivos')
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
            <SelectItem value="retired">Aposentado</SelectItem>
            <SelectItem value="disposed">Descartado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            <SelectItem value="computer">Computadores</SelectItem>
            <SelectItem value="mobile">Dispositivos Móveis</SelectItem>
            <SelectItem value="printer">Impressoras</SelectItem>
            <SelectItem value="equipment">Equipamentos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ativos</CardTitle>
          <CardDescription>
            {filteredAssets.length} ativo(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAssets.map((asset) => {
              const IconComponent = getCategoryIcon(asset.category);
              const depreciatedValue = calculateDepreciation(asset);
              
              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{asset.name}</h3>
                        <Badge variant="outline">{asset.assetTag}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{asset.brand} {asset.model}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {asset.location.name}
                        </span>
                        {asset.assignedTo && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {asset.assignedTo.name}
                          </span>
                        )}
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {depreciatedValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex gap-2 mb-1">
                        <Badge className={getStatusColor(asset.status)}>
                          {getStatusLabel(asset.status)}
                        </Badge>
                        <Badge className={getConditionColor(asset.condition)}>
                          {getConditionLabel(asset.condition)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        SN: {asset.serialNumber}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset);
                          // View asset details logic
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsMaintenanceOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum ativo encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Asset Dialog */}
      <Dialog open={isCreateAssetOpen} onOpenChange={setIsCreateAssetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Ativo</DialogTitle>
            <DialogDescription>
              Cadastre um novo ativo para controle patrimonial
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateAsset(formData);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetTag">Tag do Ativo *</Label>
                <Input id="assetTag" name="assetTag" placeholder="Ex: PC001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Ativo *</Label>
                <Input id="name" name="name" placeholder="Ex: Dell OptiPlex 7090" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('AssetsManagement.selecioneACategoria') />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="computer">Computadores</SelectItem>
                    <SelectItem value="mobile">Dispositivos Móveis</SelectItem>
                    <SelectItem value="printer">Impressoras</SelectItem>
                    <SelectItem value="equipment">Equipamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input id="brand" name="brand" placeholder="Ex: Dell" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input id="model" name="model" placeholder="Ex: OptiPlex 7090" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Série *</Label>
                <Input id="serialNumber" name="serialNumber" placeholder="Ex: DELL7090-001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Preço de Compra *</Label>
                <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento *</Label>
                <Input id="department" name="department" placeholder="Ex: Administrativo" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea id="description" name="description" rows={3} required />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateAssetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAssetMutation.isPending}>
                {createAssetMutation.isPending ? 'Criando...' : t('AssetsManagement.criarAtivo')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}