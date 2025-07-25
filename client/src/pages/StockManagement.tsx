import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Warehouse, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";

interface StockItem {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reservedStock: number;
  availableStock: number;
  unitCost: number;
  totalValue: number;
  lastMovement: string;
  status: 'ok' | 'low' | 'critical' | 'overstock';
}

interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  movementType: 'entry' | 'exit' | 'transfer' | 'adjustment';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export function StockManagement() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stock data
  const { data: stockResponse, isLoading: isLoadingStock } = useQuery({
    queryKey: ["/api/materials-services/stock/items"],
    enabled: true
  });
  const stockItems: StockItem[] = (stockResponse as any)?.data || [];

  // Fetch stock statistics
  const { data: statsResponse } = useQuery({
    queryKey: ["/api/materials-services/stock/stats"],
    enabled: true
  });
  const stockStats = (statsResponse as any)?.data || {};

  // Fetch recent movements
  const { data: movementsResponse } = useQuery({
    queryKey: ["/api/materials-services/stock/movements"],
    enabled: true
  });
  const recentMovements: StockMovement[] = (movementsResponse as any)?.data || [];

  // Fetch warehouses for filters
  const { data: warehousesResponse } = useQuery({
    queryKey: ["/api/materials-services/warehouses"],
    enabled: true
  });
  const warehouses = (warehousesResponse as any)?.data || [];

  // Stock movement mutation
  const stockMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/materials-services/stock/movements', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/stock"] });
      toast({ title: "Sucesso", description: "Movimentação registrada com sucesso!" });
      setIsNewMovementOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar movimentação",
        variant: "destructive"
      });
    }
  });

  // Stock adjustment mutation
  const stockAdjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/materials-services/stock/adjustments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/stock"] });
      toast({ title: "Sucesso", description: "Ajuste de estoque realizado com sucesso!" });
      setIsAdjustmentOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao realizar ajuste",
        variant: "destructive"
      });
    }
  });

  // Filter stock items
  const filteredStockItems = stockItems.filter((item: StockItem) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesWarehouse = warehouseFilter === "all" || item.warehouseId === warehouseFilter;
    
    return matchesSearch && matchesStatus && matchesWarehouse;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'overstock': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ok': return 'Normal';
      case 'low': return 'Baixo';
      case 'critical': return 'Crítico';
      case 'overstock': return 'Excesso';
      default: return 'Indefinido';
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'entry': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'exit': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'transfer': return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
      case 'adjustment': return <Edit className="h-4 w-4 text-orange-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'entry': return 'Entrada';
      case 'exit': return 'Saída';
      case 'transfer': return 'Transferência';
      case 'adjustment': return 'Ajuste';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Gestão de Estoque
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Controle completo de estoque multi-local com movimentações em tempo real
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stockStats.activeWarehouses || 0} armazéns ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stockStats.lowStock || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Requer atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(stockStats.totalValue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Inventário total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações Hoje</CardTitle>
            <Warehouse className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.todayMovements || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Dialog open={isNewMovementOpen} onOpenChange={setIsNewMovementOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
              <DialogDescription>
                Registre uma nova movimentação de entrada, saída ou transferência.
              </DialogDescription>
            </DialogHeader>
            <NewMovementForm 
              onSubmit={(data) => stockMovementMutation.mutate(data)}
              isLoading={stockMovementMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Ajuste de Estoque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajuste de Estoque</DialogTitle>
              <DialogDescription>
                Corrija quantidades de estoque com motivo para auditoria.
              </DialogDescription>
            </DialogHeader>
            <AdjustmentForm 
              onSubmit={(data) => stockAdjustmentMutation.mutate(data)}
              isLoading={stockAdjustmentMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Button variant="outline">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Inventário
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="items">Itens em Estoque</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="warehouses">Armazéns</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar Item</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome ou código do item..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status do Estoque</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="ok">Normal</SelectItem>
                      <SelectItem value="low">Estoque Baixo</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                      <SelectItem value="overstock">Excesso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Armazém</Label>
                  <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os armazéns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os armazéns</SelectItem>
                      {warehouses.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Itens em Estoque ({filteredStockItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Armazém</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Disponível</TableHead>
                    <TableHead>Min/Max</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingStock ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Carregando itens...
                      </TableCell>
                    </TableRow>
                  ) : filteredStockItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhum item encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStockItems.map((item: StockItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.itemName}</div>
                            <div className="text-sm text-muted-foreground">{item.itemCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.currentStock}</div>
                          {item.reservedStock > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {item.reservedStock} reservado
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{item.availableStock}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Min: {item.minimumStock}</div>
                            <div>Max: {item.maximumStock}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          R$ {item.totalValue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
              <CardDescription>
                Histórico das últimas movimentações de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Armazém</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Nenhuma movimentação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentMovements.map((movement: StockMovement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getMovementTypeIcon(movement.movementType)}
                            <span>{getMovementTypeLabel(movement.movementType)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.itemName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{movement.warehouseName}</TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell>{movement.createdBy}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>Alertas de Estoque Baixo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredStockItems
                    .filter((item: StockItem) => item.status === 'low' || item.status === 'critical')
                    .slice(0, 5)
                    .map((item: StockItem) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.currentStock} / {item.minimumStock} mín.
                          </div>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                    ))}
                  {filteredStockItems.filter((item: StockItem) => 
                    item.status === 'low' || item.status === 'critical'
                  ).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum alerta de estoque baixo
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMovements.slice(0, 5).map((movement: StockMovement) => (
                    <div key={movement.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      {getMovementTypeIcon(movement.movementType)}
                      <div className="flex-1">
                        <div className="font-medium">
                          {getMovementTypeLabel(movement.movementType)} - {movement.itemName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.quantity} unidades - {movement.reason}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {recentMovements.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma atividade recente
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Armazéns</CardTitle>
              <CardDescription>
                Configuração e status dos armazéns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Warehouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Gestão de Armazéns</h3>
                <p>Funcionalidade em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Form components would be implemented separately
function NewMovementForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    itemId: '',
    warehouseId: '',
    movementType: 'entry',
    quantity: '',
    reason: '',
    unitCost: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center py-8 text-muted-foreground">
        <p>Formulário de movimentação em desenvolvimento</p>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function AdjustmentForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    itemId: '',
    warehouseId: '',
    newQuantity: '',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center py-8 text-muted-foreground">
        <p>Formulário de ajuste em desenvolvimento</p>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}