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
  DollarSign,
  List,
  Plus,
  Search,
  Eye,
  Edit,
  Copy,
  Calendar,
  Percent,
  Tag,
  Clock,
  AlertTriangle,
  Activity,
  BarChart3
} from "lucide-react";

interface PriceList {
  id: string;
  name: string;
  code: string;
  description: string;
  type: 'customer' | 'supplier' | 'product' | 'service' | 'regional';
  status: 'active' | 'inactive' | 'draft' | 'expired';
  priority: number;
  validFrom: string;
  validTo: string;
  validTo?: string;
  currency: string;
  defaultDiscount: number;
  baseMarkup: number;
  customerSegments: string[];
  regions: string[];
  autoUpdate: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface LPUStats {
  totalLists: number;
  activeLists: number;
  draftLists: number;
  pendingApproval: number;
  approvedVersions: number;
  activeRules: number;
  approvalRate: number;
}

interface PricingRule {
  id: string;
  name: string;
  type: 'markup' | 'discount' | 'fixed' | 'competitive';
  value: number;
  isPercentage: boolean;
  conditions: any[];
  priority: number;
  active: boolean;
}

export default function LpuManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);

  // Mock data para desenvolvimento - será substituído por dados reais da API
  const mockStats: LPUStats = {
    totalLists: 24,
    activeLists: 18,
    draftLists: 4,
    pendingApproval: 3,
    approvedVersions: 15,
    activeRules: 8,
    approvalRate: 85.2
  };

  const mockPriceLists: PriceList[] = [
    {
      id: "1",
      name: "Lista Varejo Premium",
      code: "LVP001",
      description: "Lista de preços para clientes premium do varejo",
      type: "customer",
      status: "active",
      priority: 1,
      validFrom: "2024-01-01T00:00:00Z",
      validTo: "2024-12-31T23:59:59Z",
      currency: "BRL",
      defaultDiscount: 5.0,
      baseMarkup: 45.0,
      customerSegments: ["Premium", "VIP"],
      regions: ["Sudeste", "Sul"],
      autoUpdate: true,
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-12-15T14:30:00Z",
      createdBy: "admin@empresa.com",
      approvedBy: "diretor@empresa.com",
      approvedAt: "2024-01-02T09:00:00Z"
    },
    {
      id: "2", 
      name: "Lista Atacado Geral",
      code: "LAG002",
      description: "Preços para vendas em atacado com desconto por volume",
      type: "customer",
      status: "active",
      priority: 2,
      validFrom: "2024-01-01T00:00:00Z",
      currency: "BRL",
      defaultDiscount: 15.0,
      baseMarkup: 25.0,
      customerSegments: ["Atacado", "Distribuidores"],
      regions: ["Nacional"],
      autoUpdate: false,
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-11-20T16:45:00Z",
      createdBy: "admin@empresa.com",
      approvedBy: "gerente@empresa.com",
      approvedAt: "2024-01-02T14:30:00Z"
    },
    {
      id: "3",
      name: "Lista Fornecedores",
      code: "LF003",
      description: "Tabela de preços de compra dos fornecedores",
      type: "supplier",
      status: "active",
      priority: 3,
      validFrom: "2024-06-01T00:00:00Z",
      validTo: "2025-05-31T23:59:59Z",
      currency: "BRL",
      defaultDiscount: 0.0,
      baseMarkup: 0.0,
      customerSegments: [],
      regions: ["Nacional"],
      autoUpdate: true,
      createdAt: "2024-05-15T09:30:00Z",
      updatedAt: "2024-12-01T11:20:00Z",
      createdBy: "compras@empresa.com"
    },
    {
      id: "4",
      name: "Lista Serviços",
      code: "LS004",
      description: "Tabela de preços para serviços técnicos e consultoria",
      type: "service",
      status: "draft",
      priority: 4,
      validFrom: "2025-01-01T00:00:00Z",
      currency: "BRL",
      defaultDiscount: 10.0,
      baseMarkup: 60.0,
      customerSegments: ["Empresarial"],
      regions: ["Sudeste"],
      autoUpdate: false,
      createdAt: "2024-12-01T15:00:00Z",
      updatedAt: "2024-12-20T10:15:00Z",
      createdBy: "servicos@empresa.com"
    }
  ];

  // Fetch price lists (mockado por enquanto)
  const { data: priceLists = mockPriceLists, isLoading: listsLoading } = useQuery({
    queryKey: ['/api/materials-services/price-lists'],
    queryFn: () => apiRequest('GET', '/api/materials-services/price-lists'),
    initialData: mockPriceLists
  });

  // Fetch LPU stats (mockado por enquanto)
  const { data: stats = mockStats } = useQuery<LPUStats>({
    queryKey: ['/api/materials-services/price-lists/stats'],
    queryFn: () => apiRequest('GET', '/api/materials-services/price-lists/stats'),
    initialData: mockStats
  });

  // Create price list mutation
  const createPriceListMutation = useMutation({
    mutationFn: async (data: Partial<PriceList>) => {
      return apiRequest('POST', '/api/materials-services/price-lists', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      toast({ title: "Sucesso", description: "Lista de preços criada com sucesso!" });
      setIsCreateListOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lista de preços",
        variant: "destructive"
      });
    }
  });

  // Filter price lists
  const filteredPriceLists = priceLists.filter((priceList: PriceList) => {
    const matchesSearch = priceList.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         priceList.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         priceList.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || priceList.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'draft': return 'Rascunho';
      case 'expired': return 'Expirada';
      default: return 'Indefinido';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'supplier': return 'bg-purple-100 text-purple-800';
      case 'product': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-orange-100 text-orange-800';
      case 'regional': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'Cliente';
      case 'supplier': return 'Fornecedor';
      case 'product': return 'Produto';
      case 'service': return 'Serviço';
      case 'regional': return 'Regional';
      default: return 'Indefinido';
    }
  };

  const handleCreatePriceList = (formData: FormData) => {
    const priceListData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as PriceList['type'],
      currency: formData.get('currency') as string,
      defaultDiscount: parseFloat(formData.get('defaultDiscount') as string) || 0,
      baseMarkup: parseFloat(formData.get('baseMarkup') as string) || 0,
      status: 'draft' as const,
      priority: 999,
      customerSegments: [],
      regions: [],
      autoUpdate: false
    };

    createPriceListMutation.mutate(priceListData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isExpiringSoon = (validTo?: string) => {
    if (!validTo) return false;
    const expiryDate = new Date(validTo);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (listsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando listas de preços...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">LPU - Lista de Preços Unificada</h1>
          <p className="text-muted-foreground">
            Gerencie preços, margens e condições comerciais
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateRuleOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
          <Button onClick={() => setIsCreateListOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Lista
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Listas Ativas</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLists}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalLists} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versões Aprovadas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedVersions}</div>
            <p className="text-xs text-muted-foreground">
              este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente Aprovação</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground">
              {stats.draftLists} rascunhos
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
              placeholder="Buscar listas de preços..."
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
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="inactive">Inativa</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="expired">Expirada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Lists Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listas de Preços</CardTitle>
          <CardDescription>
            {filteredPriceLists.length} lista(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPriceLists.map((priceList) => {
              const expiringSoon = isExpiringSoon(priceList.validTo);

              return (
                <div
                  key={priceList.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{priceList.name}</h3>
                        <Badge variant="outline">{priceList.code}</Badge>
                        {expiringSoon && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Expirando
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{priceList.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Markup: {priceList.baseMarkup}%
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Desconto: {priceList.defaultDiscount}%
                        </span>
                        {priceList.validTo && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Válida até: {new Date(priceList.validTo).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex gap-2 mb-1">
                        <Badge className={getStatusColor(priceList.status)}>
                          {getStatusLabel(priceList.status)}
                        </Badge>
                        <Badge className={getTypeColor(priceList.type)}>
                          {getTypeLabel(priceList.type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Prioridade: {priceList.priority}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPriceLists.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma lista de preços encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Price List Dialog */}
      <Dialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Lista de Preços</DialogTitle>
            <DialogDescription>
              Crie uma nova lista de preços para gestão comercial
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreatePriceList(formData);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Lista *</Label>
                <Input id="name" name="name" placeholder="Ex: Lista Varejo Premium" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input id="code" name="code" placeholder="Ex: LVP001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="supplier">Fornecedor</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda *</Label>
                <Select name="currency" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseMarkup">Markup Base (%)</Label>
                <Input id="baseMarkup" name="baseMarkup" type="number" step="0.01" placeholder="45.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDiscount">Desconto Padrão (%)</Label>
                <Input id="defaultDiscount" name="defaultDiscount" type="number" step="0.01" placeholder="5.00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea id="description" name="description" rows={3} required />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateListOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPriceListMutation.isPending}>
                {createPriceListMutation.isPending ? 'Criando...' : 'Criar Lista'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}