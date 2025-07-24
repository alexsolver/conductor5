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
  PieChart,
  List,
  Award,
  History,
  Calculator,
  FileCheck,
  Boxes
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
                    <TableCell>R$ {typeof part.cost_price === 'number' ? part.cost_price.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>R$ {typeof part.sale_price === 'number' ? part.sale_price.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>
                      <Badge variant={part.is_active ? "default" : "secondary"}>
                        {part.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            alert(`Visualizando peça: ${part.title}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            alert(`Editando peça: ${part.title}`);
                          }}
                        >
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
                          <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Editando item` });
                          }}
                        >
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avaliação Geral:</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{(supplier.overall_rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Editando item` });
                          }}
                        >
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

  // ===== MÓDULO 4: PLANEJAMENTO E COMPRAS =====
  const PlanningModule = () => {
    const { data: purchaseOrders, isLoading: isLoadingPO } = useQuery({
      queryKey: ['/api/parts-services/purchase-orders']
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo 4: Planejamento e Compras</h2>
            <p className="text-gray-600">Ordens de compra e planejamento de demanda</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem de Compra
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordens Ativas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseOrders?.filter(po => po.status === 'active').length || 0}</div>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {purchaseOrders?.reduce((sum, po) => sum + (po.total_amount || 0), 0).toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Valor em ordens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente Aprovação</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {purchaseOrders?.filter(po => po.approval_status === 'pending').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergenciais</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {purchaseOrders?.filter(po => po.priority === 'urgent').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Urgentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Ordens de Compra */}
        <Card>
          <CardHeader>
            <CardTitle>Ordens de Compra ({purchaseOrders?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPO ? (
              <div className="text-center py-8">Carregando ordens de compra...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número PO</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders?.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.supplier_name || po.supplier_id}</TableCell>
                      <TableCell>R$ {po.total_amount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === 'active' ? "default" : "secondary"}>
                          {po.status === 'active' ? 'Ativo' : po.status === 'draft' ? 'Rascunho' : 'Concluído'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={po.approval_status === 'approved' ? "default" : po.approval_status === 'pending' ? "secondary" : "destructive"}>
                          {po.approval_status === 'approved' ? 'Aprovado' : po.approval_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Editando item` });
                          }}
                        >
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
  };

  // ===== MÓDULO 5: INTEGRAÇÃO COM SERVIÇOS =====
  const ServicesModule = () => {
    const { data: serviceIntegrations, isLoading: isLoadingServices } = useQuery({
      queryKey: ['/api/parts-services/service-integrations']
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo 5: Integração com Serviços</h2>
            <p className="text-gray-600">Aplicação em ordens de serviço e integrações</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Integração
            </Button>
          </div>
        </div>

        {/* Cards de Integrações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integrações Ativas</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serviceIntegrations?.filter(si => si.status === 'active').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Sistemas conectados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Work Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sincronizadas hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kits Aplicados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Kits de manutenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Integrações */}
        <Card>
        <CardHeader>
            <CardTitle>Integrações de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingServices ? (
              <div className="text-center py-8">Carregando integrações...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceIntegrations?.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell className="font-medium">{integration.name}</TableCell>
                      <TableCell>{integration.type}</TableCell>
                      <TableCell>{integration.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant={integration.status === 'active' ? "default" : "secondary"}>
                          {integration.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Editando item` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
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
  };

  // ===== MÓDULO 6: LOGÍSTICA =====
  const LogisticsModule = () => {
    const { data: transfers, isLoading: isLoadingTransfers } = useQuery({
      queryKey: ['/api/parts-services/transfers']
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo 6: Logística e Distribuição</h2>
            <p className="text-gray-600">Transferências, expedição e controle de envios</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transferência
            </Button>
          </div>
        </div>

        {/* Cards de Logística */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transferências</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transfers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total de transferências</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {transfers?.filter(t => t.status === 'in_transit').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Movimentações ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devoluções</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Itens devolvidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cross-Docking</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Direto fornecedor</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Transferências */}
        <Card>
          <CardHeader>
            <CardTitle>Controle de Transferências</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransfers ? (
              <div className="text-center py-8">Carregando transferências...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers?.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.transfer_code}</TableCell>
                      <TableCell>{transfer.from_location}</TableCell>
                      <TableCell>{transfer.to_location}</TableCell>
                      <TableCell>{transfer.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={transfer.status === 'completed' ? "default" : transfer.status === 'in_transit' ? "secondary" : "outline"}>
                          {transfer.status === 'completed' ? 'Concluído' : 
                           transfer.status === 'in_transit' ? 'Em Trânsito' : 
                           transfer.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
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
  };

  // ===== MÓDULO 7: CONTROLE DE ATIVOS =====
  const AssetsModule = () => {
    const { data: assets, isLoading: isLoadingAssets } = useQuery({
      queryKey: ['/api/parts-services/assets-complete']
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo 7: Controle de Ativos</h2>
            <p className="text-gray-600">Cadastro e rastreamento de ativos com hierarquia</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ativo
            </Button>
          </div>
        </div>

        {/* Cards de Ativos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ativos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assets?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Ativos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Operação</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {assets?.filter(a => a.status === 'operational').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Funcionando</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {assets?.filter(a => a.status === 'maintenance').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Em manutenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com QR Code</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assets?.filter(a => a.qr_code).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Com etiqueta</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Ativos */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAssets ? (
              <div className="text-center py-8">Carregando ativos...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Manutenção</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets?.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.asset_code}</TableCell>
                      <TableCell>{asset.asset_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          {asset.current_location || 'Não definido'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={asset.status === 'operational' ? "default" : asset.status === 'maintenance' ? "secondary" : "destructive"}>
                          {asset.status === 'operational' ? 'Operacional' : 
                           asset.status === 'maintenance' ? 'Manutenção' : 
                           asset.status === 'inactive' ? 'Inativo' : 'Outros'}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.last_maintenance ? new Date(asset.last_maintenance).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Editando item` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
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
  };

  // ===== MÓDULO 8: LISTA DE PREÇOS UNITÁRIOS (LPU) =====
  const LPUModule = () => {
    const { data: priceLists, isLoading: isLoadingPriceLists } = useQuery({
      queryKey: ['/api/parts-services/price-lists-complete']
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo 8: Lista de Preços Unitários (LPU)</h2>
            <p className="text-gray-600">Múltiplas LPUs por cliente, contrato e centro de custo</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova LPU
            </Button>
          </div>
        </div>

        {/* Cards de LPU */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listas Ativas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {priceLists?.filter(pl => pl.status === 'active').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Em vigência</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Itens</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {priceLists?.reduce((sum, pl) => sum + (pl.total_items || 0), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">Itens cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {priceLists?.filter(pl => {
                  const endDate = new Date(pl.end_date);
                  const now = new Date();
                  const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                  return diffDays <= 30 && diffDays > 0;
                }).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Próximo mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {priceLists?.filter(pl => pl.contract_id).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Vinculadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de LPUs */}
        <Card>
          <CardHeader>
            <CardTitle>Listas de Preços Unitários</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPriceLists ? (
              <div className="text-center py-8">Carregando listas de preços...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Cliente/Contrato</TableHead>
                    <TableHead>Total Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceLists?.map((priceList) => (
                    <TableRow key={priceList.id}>
                      <TableCell className="font-medium">{priceList.name}</TableCell>
                      <TableCell>v{priceList.version}</TableCell>
                      <TableCell>
                        {new Date(priceList.start_date).toLocaleDateString()} - {new Date(priceList.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{priceList.client_name || priceList.contract_name || 'Geral'}</TableCell>
                      <TableCell>{priceList.total_items || 0}</TableCell>
                      <TableCell>
                        <Badge variant={priceList.status === 'active' ? "default" : "secondary"}>
                          {priceList.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Editando item` });
                          }}
                        >
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
  };

  // ===== MÓDULO 9: PREÇOS AVANÇADOS =====
  const AdvancedPricingModule = () => {
    const { data: pricingTables, isLoading: isLoadingPricing } = useQuery({
      queryKey: ['/api/parts-services/pricing-tables']
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo 9: Funcionalidades Avançadas de Preço</h2>
            <p className="text-gray-600">Tabelas com versionamento, margens automáticas e preços especiais</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tabela
            </Button>
          </div>
        </div>

        {/* Cards de Preços Avançados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tabelas Ativas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pricingTables?.filter(pt => pt.status === 'active').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Em operação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regras Dinâmicas</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Configuradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Histórico</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Alterações hoje</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Preços */}
        <Card>
          <CardHeader>
            <CardTitle>Tabelas de Preços Avançadas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPricing ? (
              <div className="text-center py-8">Carregando tabelas de preços...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Segmentação</TableHead>
                    <TableHead>Margem Base</TableHead>
                    <TableHead>Desconto Máx.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingTables?.map((table) => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.segmentation_type || 'Geral'}</TableCell>
                      <TableCell>{table.base_margin}%</TableCell>
                      <TableCell>{table.max_discount}%</TableCell>
                      <TableCell>
                        <Badge variant={table.status === 'active' ? "default" : "secondary"}>
                          {table.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Editando item` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
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
  };

  // ===== MÓDULO 10: COMPLIANCE E AUDITORIA =====
  const ComplianceModule = () => {
    const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
      queryKey: ['/api/parts-services/audit-logs-complete']
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo 10: Compliance e Auditoria</h2>
            <p className="text-gray-600">Rastreabilidade, controle de acesso e relatórios regulatórios</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Log
            </Button>
          </div>
        </div>

        {/* Cards de Compliance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logs Auditoria</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Registros totais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificações</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Válidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">0</div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conformidade</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">98%</div>
              <p className="text-xs text-muted-foreground">Score médio</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Auditoria */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAudit ? (
              <div className="text-center py-8">Carregando logs de auditoria...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell>{log.user_name || log.user_id}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell>
                        <Badge variant={log.compliance_status === 'compliant' ? "default" : "destructive"}>
                          {log.compliance_status === 'compliant' ? 'Conforme' : 'Não conforme'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast({ title: `Visualizando detalhes` });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
  };

  // ===== MÓDULO 11: DIFERENCIAIS AVANÇADOS =====
  const AdvancedFeaturesModule = () => {
    const { data: budgetSimulations, isLoading: isLoadingSimulations } = useQuery({
      queryKey: ['/api/parts-services/budget-simulations']
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo 11: Diferenciais Avançados</h2>
            <p className="text-gray-600">Simulador de orçamento, dashboards e APIs de integração</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Simulação
            </Button>
          </div>
        </div>

        {/* Cards de Funcionalidades Avançadas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Simulações</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetSimulations?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Orçamentos simulados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dashboards</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Configurados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">APIs Integradas</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Conectadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sync Offline</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">100%</div>
              <p className="text-xs text-muted-foreground">Disponível</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Simulações */}
        <Card>
          <CardHeader>
            <CardTitle>Simulações de Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSimulations ? (
```text
Analysis: The code will replace the hardcoded 4.2 supplier rating with the dynamic supplier.overall_rating, formatted to one decimal place, in the SuppliersModule component, table cell.