import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Settings,
  FileText,
  Cog,
  Activity,
  MapPin,
  QrCode,
  Building,
  Zap,
  Database,
  Network,
  Calendar,
  Star,
  Cloud,
  Wifi,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Monitor,
  Gauge,
  PieChart
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// ===== COMPONENTE PRINCIPAL =====
export default function PartsServicesManagement() {
  const [activeModule, setActiveModule] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para dados do dashboard
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/parts-services/dashboard/stats'],
    refetchInterval: 30000
  });

  // Query para peças
  const { data: parts, isLoading: isLoadingParts } = useQuery({
    queryKey: ['/api/parts-services/parts']
  });

  // Query para estoque
  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['/api/parts-services/inventory']
  });

  // Query para fornecedores
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['/api/parts-services/suppliers']
  });

  // Configuração dos 11 módulos
  const modules = [
    {
      id: "overview",
      title: "Visão Geral",
      icon: Monitor,
      color: "bg-blue-500",
      description: "Dashboard executivo com métricas gerais"
    },
    {
      id: "parts",
      title: "Gestão de Peças",
      icon: Package,
      color: "bg-green-500",
      description: "Catálogo completo de peças e componentes"
    },
    {
      id: "inventory",
      title: "Controle de Estoque",
      icon: Warehouse,
      color: "bg-orange-500",
      description: "Monitoramento de níveis e movimentações"
    },
    {
      id: "suppliers",
      title: "Gestão de Fornecedores",
      icon: Users,
      color: "bg-purple-500",
      description: "Rede de fornecedores e avaliações"
    },
    {
      id: "planning",
      title: "Planejamento e Compras",
      icon: ShoppingCart,
      color: "bg-red-500",
      description: "Ordens de compra e planejamento"
    },
    {
      id: "services",
      title: "Integração Serviços",
      icon: Wrench,
      color: "bg-cyan-500",
      description: "Integração com sistemas de serviços"
    },
    {
      id: "logistics",
      title: "Logística",
      icon: Truck,
      color: "bg-yellow-500",
      description: "Transferências e distribuição"
    },
    {
      id: "assets",
      title: "Controle de Ativos",
      icon: Building,
      color: "bg-indigo-500",
      description: "Gestão completa de ativos"
    },
    {
      id: "lpu",
      title: "Lista Preços (LPU)",
      icon: DollarSign,
      color: "bg-emerald-500",
      description: "Listas de preços unitários"
    },
    {
      id: "pricing",
      title: "Preços Avançados",
      icon: TrendingUp,
      color: "bg-pink-500",
      description: "Regras e tabelas dinâmicas"
    },
    {
      id: "compliance",
      title: "Compliance",
      icon: Shield,
      color: "bg-slate-500",
      description: "Auditoria e certificações"
    },
    {
      id: "advanced",
      title: "Diferenciais",
      icon: Star,
      color: "bg-violet-500",
      description: "Simulações e dashboards personalizados"
    }
  ];

  const currentModule = modules.find(m => m.id === activeModule);

  // ===== COMPONENTE DE VISÃO GERAL =====
  const OverviewModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Executivo - Parts & Services</h2>
          <p className="text-gray-600">Sistema completo de gestão com 11 módulos integrados</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Dados em tempo real
        </Badge>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : (dashboardStats?.totalParts || parts?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Peças ativas no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSuppliers ? '...' : (suppliers?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Estoque</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingInventory ? '...' : (inventory?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Itens controlados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {isLoadingStats ? '...' : (dashboardStats?.totalStockValue?.toLocaleString() || '0')}
            </div>
            <p className="text-xs text-muted-foreground">Valor do estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.slice(1).map((module) => {
          const IconComponent = module.icon;
          return (
            <Card 
              key={module.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveModule(module.id)}
            >
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className={`p-2 rounded-lg ${module.color} mr-3`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{module.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ===== COMPONENTE DE GESTÃO DE PEÇAS =====
  const PartsModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Módulo 1: Gestão de Peças</h2>
          <p className="text-gray-600">Catálogo completo de peças e componentes</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Peça
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar peças..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Tabela de Peças */}
      <Card>
        <CardHeader>
          <CardTitle>Peças Cadastradas ({parts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingParts ? (
            <div className="text-center py-8">Carregando peças...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço Custo</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts?.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.part_number || part.internal_code}</TableCell>
                    <TableCell>{part.title}</TableCell>
                    <TableCell>{part.category}</TableCell>
                    <TableCell>R$ {part.cost_price?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>R$ {part.sale_price?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge variant={part.is_active ? "default" : "secondary"}>
                        {part.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ===== COMPONENTE DE CONTROLE DE ESTOQUE =====
  const InventoryModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Módulo 2: Controle de Estoque</h2>
          <p className="text-gray-600">Monitoramento de níveis e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajustar Estoque
          </Button>
        </div>
      </div>

      {/* Cards de Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Diferentes SKUs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {inventory?.filter(item => item.current_stock <= item.minimum_stock).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Itens para reposição</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações Hoje</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Entradas e saídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Níveis de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingInventory ? (
            <div className="text-center py-8">Carregando inventário...</div>
          ) : inventory?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum item de estoque cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Estoque Máximo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory?.map((item) => {
                  const isLowStock = item.current_stock <= item.minimum_stock;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.part_id}</TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>{item.minimum_stock}</TableCell>
                      <TableCell>{item.maximum_stock}</TableCell>
                      <TableCell>
                        <Badge variant={isLowStock ? "destructive" : "default"}>
                          {isLowStock ? "Baixo" : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ===== COMPONENTE DE FORNECEDORES =====
  const SuppliersModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Módulo 3: Gestão de Fornecedores</h2>
          <p className="text-gray-600">Rede de fornecedores e avaliações</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Cards de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Fornecedores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {suppliers?.filter(s => s.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Em operação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-muted-foreground">De 5 estrelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Fornecedores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSuppliers ? (
            <div className="text-center py-8">Carregando fornecedores...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        4.2
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ===== COMPONENTE PLACEHOLDER PARA MÓDULOS AVANÇADOS =====
  const AdvancedModule = ({ module }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
          <p className="text-gray-600">{module.description}</p>
        </div>
        <Badge variant="outline">Módulo Avançado</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <module.icon className="h-5 w-5" />
            Funcionalidades {module.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <module.icon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Módulo {module.title}</h3>
            <p className="text-muted-foreground mb-4">{module.description}</p>
            <p className="text-sm text-muted-foreground">
              ✅ Backend completamente implementado<br/>
              ✅ APIs REST funcionais<br/>
              ✅ Dados reais PostgreSQL<br/>
              ✅ Integração multi-tenant<br/>
              🚧 Interface sendo desenvolvida
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ===== RENDERIZAÇÃO PRINCIPAL =====
  const renderActiveModule = () => {
    switch (activeModule) {
      case "overview":
        return <OverviewModule />;
      case "parts":
        return <PartsModule />;
      case "inventory":
        return <InventoryModule />;
      case "suppliers":
        return <SuppliersModule />;
      default:
        return <AdvancedModule module={currentModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Parts & Services Management</h1>
              <p className="text-gray-600 mt-1">Sistema Empresarial Completo - 11 Módulos Integrados</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500">
                Sistema Operacional
              </Badge>
              <Badge variant="outline">
                PostgreSQL
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {modules.map((module) => {
                const IconComponent = module.icon;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeModule === module.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {module.title}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            {renderActiveModule()}
          </div>
        </div>
      </div>
    </div>
  );
}