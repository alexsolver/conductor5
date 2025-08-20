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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
// import useLocalization from '@/hooks/useLocalization';
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
  ExternalLink,
  MapPin,
  Users,
  BarChart3
} from "lucide-react";
// Types
interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  status: 'ok' | 'low' | 'critical' | 'overstock';
  totalValue: number;
  lastMovement: string;
  warehouse: string;
  location: string;
  unit: string;
  category: string;
  createdAt: string;
}
// Helper functions
const getStatusColor = (status: string) => {
  // Localization temporarily disabled
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
// New Movement Form Component
function NewMovementForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [movementType, setMovementType] = useState("entry");
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const { data: itemsResponse } = useQuery({
    queryKey: ["/api/materials-services/items"],
    enabled: true
  });
  const items = (itemsResponse as any)?.data || [];
  const { data: warehousesResponse } = useQuery({
    queryKey: ["/api/materials-services/warehouses"],
    enabled: true
  });
  const warehouses = (warehousesResponse as any)?.data || [];
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      movementType,
      itemId,
      warehouseId,
      quantity: parseInt(quantity),
      unitCost: unitCost ? parseFloat(unitCost) : undefined,
      reason
    });
  };
  return (
    <form onSubmit={handleSubmit} className="p-4"
      <div className="p-4"
        <div className="p-4"
          <Label htmlFor="movementType">Tipo de Movimentação *</Label>
          <Select value={movementType} onValueChange={setMovementType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entrada</SelectItem>
              <SelectItem value="exit">Saída</SelectItem>
              <SelectItem value="transfer">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="p-4"
          <Label htmlFor="itemId">Item *</Label>
          <Select value={itemId} onValueChange={setItemId}>
            <SelectTrigger>
              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
            </SelectTrigger>
            <SelectContent>
              {items.map((item: any) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title} ({item.internalCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-4"
          <Label htmlFor="warehouseId">Armazém *</Label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger>
              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse: any) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-4"
          <Label htmlFor="quantity">Quantidade *</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="Ex: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="p-4"
          <Label htmlFor="unitCost">Custo Unitário (opcional)</Label>
          <Input
            id="unitCost"
            type="number"
            step="0.01"
            placeholder="Ex: 15.99"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>
      </div>
      <div className="p-4"
        <Label htmlFor="reason">Motivo *</Label>
        <Textarea
          id="reason"
          placeholder="Descreva o motivo da movimentação..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>
      <div className="p-4"
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Registrando..." : "Registrar Movimentação"
        </Button>
      </div>
    </form>
  );
}
// Adjustment Form Component
function AdjustmentForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const { data: itemsResponse } = useQuery({
    queryKey: ["/api/materials-services/items"],
    enabled: true
  });
  const items = (itemsResponse as any)?.data || [];
  const { data: warehousesResponse } = useQuery({
    queryKey: ["/api/materials-services/warehouses"],
    enabled: true
  });
  const warehouses = (warehousesResponse as any)?.data || [];
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      itemId,
      warehouseId,
      newQuantity: parseInt(newQuantity),
      reason: adjustmentReason
    });
  };
  return (
    <form onSubmit={handleSubmit} className="p-4"
      <div className="p-4"
        <div className="p-4"
          <Label htmlFor="itemId">Item *</Label>
          <Select value={itemId} onValueChange={setItemId}>
            <SelectTrigger>
              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
            </SelectTrigger>
            <SelectContent>
              {items.map((item: any) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title} ({item.internalCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-4"
          <Label htmlFor="warehouseId">Armazém *</Label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger>
              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse: any) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-4"
          <Label htmlFor="newQuantity">Nova Quantidade *</Label>
          <Input
            id="newQuantity"
            type="number"
            placeholder="Ex: 50"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="p-4"
        <Label htmlFor="adjustmentReason">Motivo do Ajuste *</Label>
        <Textarea
          id="adjustmentReason"
          placeholder="Descreva o motivo do ajuste (contagem física, avaria, etc.)..."
          value={adjustmentReason}
          onChange={(e) => setAdjustmentReason(e.target.value)}
          required
        />
      </div>
      <div className="p-4"
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Ajustando..." : "Realizar Ajuste"
        </Button>
      </div>
    </form>
  );
}
// Inventory Modal Component
function InventoryModal() {
  const { data: stockResponse } = useQuery({
    queryKey: ["/api/materials-services/stock/items"],
    enabled: true
  });
  const stockItems: StockItem[] = (stockResponse as any)?.data || [];
  return (
    <div className="p-4"
      <div className="p-4"
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{stockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4"
              R$ {stockItems.reduce((acc, item) => acc + item.totalValue, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Itens Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {stockItems.filter(item => item.status === 'critical').length}
            </div>
          </CardContent>
        </Card>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Última Movimentação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <div className="text-lg">"{item.itemName}</div>
                  <div className="text-lg">"{item.itemCode}</div>
                </div>
              </TableCell>
              <TableCell>{item.currentStock}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </TableCell>
              <TableCell>R$ {item.totalValue.toLocaleString()}</TableCell>
              <TableCell>{new Date(item.lastMovement).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
// Warehouses Tab Component
function WarehousesTab({ warehouses, onCreateWarehouse }: { 
  warehouses: any[]; 
  onCreateWarehouse: () => void; 
}) {
  return (
    <div className="p-4"
      <div className="p-4"
        <div>
          <h3 className="text-lg">"Gestão de Armazéns</h3>
          <p className="p-4"
            Gerencie seus armazéns e localizações de estoque
          </p>
        </div>
        <Button onClick={onCreateWarehouse}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Armazém
        </Button>
      </div>
      <div className="p-4"
        {warehouses.length === 0 ? (
          <Card className="p-4"
            <CardContent className="p-4"
              <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg">"Nenhum armazém cadastrado</h3>
              <p className="p-4"
                Comece criando seu primeiro armazém para organizar o estoque
              </p>
              <Button onClick={onCreateWarehouse}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Armazém
              </Button>
            </CardContent>
          </Card>
        ) : (
          warehouses.map((warehouse: any) => (
            <Card key={warehouse.id}>
              <CardHeader className="p-4"
                <CardTitle className="text-lg">"{warehouse.name}</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="p-4"
                  <div className="p-4"
                    <MapPin className="h-4 w-4 mr-1" />
                    {warehouse.location || 'Localização não informada'}
                  </div>
                  <div className="p-4"
                    <Package className="h-4 w-4 mr-1" />
                    {warehouse.itemCount || 0} itens
                  </div>
                  <div className="p-4"
                    <Users className="h-4 w-4 mr-1" />
                    {warehouse.manager || 'Sem responsável'}
                  </div>
                </div>
                <div className="p-4"
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedWarehouse(warehouse);
                      setIsViewWarehouseOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedWarehouse(warehouse);
                      setIsEditWarehouseOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {warehouses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas dos Armazéns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4"
              <div className="p-4"
                <div className="text-lg">"{warehouses.length}</div>
                <p className="text-lg">"Total de Armazéns</p>
              </div>
              <div className="p-4"
                <div className="p-4"
                  {warehouses.reduce((acc, w) => acc + (w.itemCount || 0), 0)}
                </div>
                <p className="text-lg">"Itens Totais</p>
              </div>
              <div className="p-4"
                <div className="p-4"
                  R$ {warehouses.reduce((acc, w) => acc + (w.totalValue || 0), 0).toLocaleString()}
                </div>
                <p className="text-lg">"Valor Total</p>
              </div>
              <div className="p-4"
                <div className="p-4"
                  {warehouses.filter(w => w.status === 'active').length}
                </div>
                <p className="text-lg">"Armazéns Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  warehouse: string;
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
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isNewWarehouseOpen, setIsNewWarehouseOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isViewItemOpen, setIsViewItemOpen] = useState(false);
  const [isEditWarehouseOpen, setIsEditWarehouseOpen] = useState(false);
  const [isViewWarehouseOpen, setIsViewWarehouseOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
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
  const movements: StockMovement[] = (movementsResponse as any)?.data || [];
  // Fetch warehouses
  const { data: warehousesResponse } = useQuery({
    queryKey: ["/api/materials-services/warehouses"],
    enabled: true
  });
  const warehouses = (warehousesResponse as any)?.data || [];
  // Mutation for creating stock movement
  const createMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/materials-services/stock/movements', data);
    },
    onSuccess: () => {
      toast({ title: "Movimentação registrada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/stock/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/stock/stats"] });
      setIsNewMovementOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" });
    }
  });
  // Mutation for stock adjustment
  const adjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/materials-services/stock/adjustments', data);
    },
    onSuccess: () => {
      toast({ title: "Ajuste de estoque realizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/stock/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/stock/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/stock/stats"] });
      setIsAdjustmentOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao realizar ajuste de estoque", variant: "destructive" });
    }
  });
  // Handlers
  const handleCreateMovement = (data: any) => {
    createMovementMutation.mutate(data);
  };
  const handleStockAdjustment = (data: any) => {
    adjustmentMutation.mutate(data);
  };
  // Filter stock items
  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesWarehouse = warehouseFilter === "all" || item.warehouse === warehouseFilter;
    
    return matchesSearch && matchesStatus && matchesWarehouse;
  });
  return (
    <div className="p-4"
      <div className="p-4"
        <div>
          <h1 className="text-lg">"Gestão de Estoque</h1>
          <p className="p-4"
            Controle completo do seu inventário e movimentações
          </p>
        </div>
        <div className="p-4"
          <Button onClick={() => setIsNewMovementOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
          <Button variant="outline" onClick={() => setIsAdjustmentOpen(true)}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ajuste de Estoque
          </Button>
          <Button variant="outline" onClick={() => setIsInventoryOpen(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Inventário
          </Button>
        </div>
      </div>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="p-4"
        <TabsList className="p-4"
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="items">Itens em Estoque</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="warehouses">Armazéns</TabsTrigger>
        </TabsList>
        {/* Overview Tab */}
        <TabsContent value="overview" className="p-4"
          {/* Statistics Cards */}
          <div className="p-4"
            <Card>
              <CardHeader className="p-4"
                <CardTitle className="text-lg">"Itens em Estoque</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg">"{stockStats.totalItems || stockItems.length}</div>
                <p className="p-4"
                  {stockStats.activeItems || stockItems.filter(item => item.status !== 'critical').length} ativos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4"
                <CardTitle className="text-lg">"Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="p-4"
                  {stockStats.lowStockItems || stockItems.filter(item => item.status === 'low').length}
                </div>
                <p className="text-lg">"Necessitam reposição</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4"
                <CardTitle className="text-lg">"Valor Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="p-4"
                  R$ {(stockStats.totalValue || stockItems.reduce((acc, item) => acc + item.totalValue, 0)).toLocaleString()}
                </div>
                <p className="text-lg">"Inventário completo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4"
                <CardTitle className="text-lg">"Movimentações Hoje</CardTitle>
                <ArrowUpDown className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg">"{stockStats.todayMovements || movements.length}</div>
                <p className="text-lg">"Entradas e saídas</p>
              </CardContent>
            </Card>
          </div>
          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
              <CardDescription>
                Últimas movimentações de estoque registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="p-4"
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg">"Nenhuma movimentação registrada</h3>
                  <p>As movimentações de estoque aparecerão aqui</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Armazém</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.slice(0, 5).map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div>
                            <div className="text-lg">"{movement.itemName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={movement.movementType === 'entry' ? 'default' : 'secondary'}>
                            {movement.movementType === 'entry' ? 'Entrada' : 
                             movement.movementType === 'exit' ? 'Saída' : 
                             movement.movementType === 'transfer' ? 'Transferência' : 'Ajuste'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={movement.movementType === 'entry' ? 'text-green-600' : 'text-red-600'}>
                            {movement.movementType === 'entry' ? '+' : '-'}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{movement.warehouse}</TableCell>
                        <TableCell>{new Date(movement.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Items Tab */}
        <TabsContent value="items" className="p-4"
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4"
                <div className="p-4"
                  <Label htmlFor="search">Buscar Item</Label>
                  <div className="p-4"
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome ou código do item..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="p-4"
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="ok">Normal</SelectItem>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                      <SelectItem value="overstock">Excesso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4"
                  <Label htmlFor="warehouse">Armazém</Label>
                  <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os armazéns</SelectItem>
                      {warehouses.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.name}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Itens em Estoque</CardTitle>
              <CardDescription>
                Lista de todos os itens cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStock ? (
                <div className="p-4"
                  <p>Carregando itens...</p>
                </div>
              ) : filteredStockItems.length === 0 ? (
                <div className="p-4"
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg">"Nenhum item encontrado</h3>
                  <p>Verifique os filtros aplicados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Min/Max</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Armazém</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="text-lg">"{item.itemName}</div>
                            <div className="text-lg">"{item.itemCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="p-4"
                            <span className="text-lg">"{item.currentStock}</span>
                            <div className="text-lg">"unidades</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="p-4"
                            <div>Min: {item.minimumStock}</div>
                            <div>Max: {item.maximumStock}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {item.totalValue.toLocaleString()}</TableCell>
                        <TableCell>{item.warehouse}</TableCell>
                        <TableCell>
                          <div className="p-4"
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedItem(item);
                                setIsViewItemOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsEditItemOpen(true);
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
        </TabsContent>
        {/* Movements Tab */}
        <TabsContent value="movements" className="p-4"
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>
                Todas as movimentações de estoque registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="p-4"
                  <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg">"Nenhuma movimentação registrada</h3>
                  <p>As movimentações de estoque aparecerão aqui</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Custo Total</TableHead>
                      <TableHead>Armazém</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div>
                            <div className="text-lg">"{movement.itemName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={movement.movementType === 'entry' ? 'default' : 'secondary'}>
                            {movement.movementType === 'entry' ? 'Entrada' : 
                             movement.movementType === 'exit' ? 'Saída' : 
                             movement.movementType === 'transfer' ? 'Transferência' : 'Ajuste'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={movement.movementType === 'entry' ? 'text-green-600' : 'text-red-600'}>
                            {movement.movementType === 'entry' ? '+' : '-'}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {movement.totalCost ? "
                        </TableCell>
                        <TableCell>{movement.warehouse}</TableCell>
                        <TableCell>{movement.createdBy}</TableCell>
                        <TableCell>{new Date(movement.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="p-4"
          <WarehousesTab 
            warehouses={warehouses} 
            onCreateWarehouse={() => setIsNewWarehouseOpen(true)}
          />
        </TabsContent>
      </Tabs>
      {/* Modals */}
      <Dialog open={isNewMovementOpen} onOpenChange={setIsNewMovementOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              Registre entrada, saída ou transferência de estoque
            </DialogDescription>
          </DialogHeader>
          <NewMovementForm 
            onSubmit={handleCreateMovement} 
            isLoading={createMovementMutation.isPending} 
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Ajuste de Estoque</DialogTitle>
            <DialogDescription>
              Corrija a quantidade em estoque de um item
            </DialogDescription>
          </DialogHeader>
          <AdjustmentForm 
            onSubmit={handleStockAdjustment} 
            isLoading={adjustmentMutation.isPending} 
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Inventário de Estoque</DialogTitle>
            <DialogDescription>
              Visualização completa do inventário atual
            </DialogDescription>
          </DialogHeader>
          <InventoryModal />
        </DialogContent>
      </Dialog>
      <Dialog open={isNewWarehouseOpen} onOpenChange={setIsNewWarehouseOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Novo Armazém</DialogTitle>
            <DialogDescription>
              Cadastre um novo armazém para organizar o estoque
            </DialogDescription>
          </DialogHeader>
          <NewWarehouseForm 
            onSubmit={(data) => {
              console.log('Criando armazém:', data);
              toast({ title: "Armazém criado com sucesso!" });
              setIsNewWarehouseOpen(false);
            }}
            isLoading={false}
            onCancel={() => setIsNewWarehouseOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {/* View Item Modal */}
      <Dialog open={isViewItemOpen} onOpenChange={setIsViewItemOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Visualizar Item</DialogTitle>
            <DialogDescription>
              Informações detalhadas do item em estoque
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="p-4"
              <div className="p-4"
                <div>
                  <Label className="text-lg">"Nome do Item</Label>
                  <p className="text-lg">"{selectedItem.itemName}</p>
                </div>
                <div>
                  <Label className="text-lg">"Código</Label>
                  <p className="text-lg">"{selectedItem.itemCode}</p>
                </div>
                <div>
                  <Label className="text-lg">"Estoque Atual</Label>
                  <p className="text-lg">"{selectedItem.currentStock} unidades</p>
                </div>
                <div>
                  <Label className="text-lg">"Status</Label>
                  <Badge className={getStatusColor(selectedItem.status)}>
                    {getStatusLabel(selectedItem.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-lg">"Estoque Mínimo</Label>
                  <p className="text-lg">"{selectedItem.minimumStock}</p>
                </div>
                <div>
                  <Label className="text-lg">"Estoque Máximo</Label>
                  <p className="text-lg">"{selectedItem.maximumStock}</p>
                </div>
                <div>
                  <Label className="text-lg">"Valor Total</Label>
                  <p className="text-lg">"R$ {selectedItem.totalValue.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-lg">"Armazém</Label>
                  <p className="text-lg">"{selectedItem.warehouse}</p>
                </div>
              </div>
              <div className="p-4"
                <Button onClick={() => setIsViewItemOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Item Modal */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Atualize as informações do item em estoque
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <EditItemForm 
              item={selectedItem}
              onSubmit={(data) => {
                console.log('[TRANSLATION_NEEDED]', data);
                toast({ title: "Item atualizado com sucesso!" });
                setIsEditItemOpen(false);
              }}
              onCancel={() => setIsEditItemOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      {/* View Warehouse Modal */}
      <Dialog open={isViewWarehouseOpen} onOpenChange={setIsViewWarehouseOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Visualizar Armazém</DialogTitle>
            <DialogDescription>
              Informações detalhadas do armazém
            </DialogDescription>
          </DialogHeader>
          {selectedWarehouse && (
            <div className="p-4"
              <div className="p-4"
                <div>
                  <Label className="text-lg">"Nome</Label>
                  <p className="text-lg">"{selectedWarehouse.name}</p>
                </div>
                <div>
                  <Label className="text-lg">"Localização</Label>
                  <p className="text-lg">"{selectedWarehouse.location || 'Não informada'}</p>
                </div>
                <div>
                  <Label className="text-lg">"Responsável</Label>
                  <p className="text-lg">"{selectedWarehouse.manager || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-lg">"Total de Itens</Label>
                  <p className="text-lg">"{selectedWarehouse.itemCount || 0} itens</p>
                </div>
                <div>
                  <Label className="text-lg">"Valor Total</Label>
                  <p className="text-lg">"R$ {(selectedWarehouse.totalValue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-lg">"Status</Label>
                  <Badge variant={selectedWarehouse.status === 'active' ? 'default' : 'secondary'}>
                    {selectedWarehouse.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <div className="p-4"
                <Button onClick={() => setIsViewWarehouseOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Warehouse Modal */}
      <Dialog open={isEditWarehouseOpen} onOpenChange={setIsEditWarehouseOpen}>
        <DialogContent className="p-4"
          <DialogHeader>
            <DialogTitle>Editar Armazém</DialogTitle>
            <DialogDescription>
              Atualize as informações do armazém
            </DialogDescription>
          </DialogHeader>
          {selectedWarehouse && (
            <EditWarehouseForm 
              warehouse={selectedWarehouse}
              onSubmit={(data) => {
                console.log('[TRANSLATION_NEEDED]', data);
                toast({ title: "Armazém atualizado com sucesso!" });
                setIsEditWarehouseOpen(false);
              }}
              onCancel={() => setIsEditWarehouseOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
// Formulário para novo armazém
function NewWarehouseForm({ onSubmit, isLoading, onCancel }: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [manager, setManager] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) {
      toast({ 
        title: '[TRANSLATION_NEEDED]', 
        description: "Nome e localização são obrigatórios",
        variant: "destructive" 
      });
      return;
    }
    onSubmit({
      name,
      location,
      manager: manager || 'Não informado',
      capacity: capacity ? parseInt(capacity) : null,
      description: description || '',
      status: 'active'
    });
  };
  return (
    <form onSubmit={handleSubmit} className="p-4"
      <div className="p-4"
        <div className="p-4"
          <Label htmlFor="name">Nome do Armazém *</Label>
          <Input
            id="name"
            placeholder="Ex: Armazém Central"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="p-4"
          <Label htmlFor="location">Localização *</Label>
          <Input
            id="location"
            placeholder="Ex: São Paulo - Centro"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="p-4"
          <Label htmlFor="manager">Responsável</Label>
          <Input
            id="manager"
            placeholder="Ex: João Silva"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
          />
        </div>
        <div className="p-4"
          <Label htmlFor="capacity">Capacidade (m²)</Label>
          <Input
            id="capacity"
            type="number"
            placeholder="Ex: 1000"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
      </div>
      <div className="p-4"
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder="Descrição adicional do armazém"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="p-4"
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Criando...' : '[TRANSLATION_NEEDED]'}
        </Button>
      </div>
    </form>
  );
}
// Formulário para editar item
function EditItemForm({ item, onSubmit, onCancel }: { 
  item: StockItem; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [minimumStock, setMinimumStock] = useState(item.minimumStock.toString());
  const [maximumStock, setMaximumStock] = useState(item.maximumStock.toString());
  const [warehouse, setWarehouse] = useState(item.warehouse);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      id: item.id,
      minimumStock: parseInt(minimumStock),
      maximumStock: parseInt(maximumStock),
      warehouse
    });
  };
  return (
    <form onSubmit={handleSubmit} className="p-4"
      <div className="p-4"
        <div className="p-4"
          <Label>Nome do Item</Label>
          <Input value={item.itemName} disabled />
        </div>
        
        <div className="p-4"
          <Label>Código</Label>
          <Input value={item.itemCode} disabled />
        </div>
        <div className="p-4"
          <Label htmlFor="minimumStock">Estoque Mínimo *</Label>
          <Input
            id="minimumStock"
            type="number"
            value={minimumStock}
            onChange={(e) => setMinimumStock(e.target.value)}
            required
          />
        </div>
        <div className="p-4"
          <Label htmlFor="maximumStock">Estoque Máximo *</Label>
          <Input
            id="maximumStock"
            type="number"
            value={maximumStock}
            onChange={(e) => setMaximumStock(e.target.value)}
            required
          />
        </div>
        <div className="p-4"
          <Label htmlFor="warehouse">Armazém</Label>
          <Input
            id="warehouse"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
          />
        </div>
        <div className="p-4"
          <Label>Estoque Atual</Label>
          <Input value={" unidades" disabled />
        </div>
      </div>
      <div className="p-4"
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit>
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
// Formulário para editar armazém
function EditWarehouseForm({ warehouse, onSubmit, onCancel }: { 
  warehouse: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(warehouse.name || '');
  const [location, setLocation] = useState(warehouse.location || '');
  const [manager, setManager] = useState(warehouse.manager || '');
  const [status, setStatus] = useState(warehouse.status || 'active');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) {
      toast({ 
        title: '[TRANSLATION_NEEDED]', 
        description: "Nome e localização são obrigatórios",
        variant: "destructive" 
      });
      return;
    }
    onSubmit({
      id: warehouse.id,
      name,
      location,
      manager,
      status
    });
  };
  return (
    <form onSubmit={handleSubmit} className="p-4"
      <div className="p-4"
        <div className="p-4"
          <Label htmlFor="name">Nome do Armazém *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="p-4"
          <Label htmlFor="location">Localização *</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="p-4"
          <Label htmlFor="manager">Responsável</Label>
          <Input
            id="manager"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
          />
        </div>
        <div className="p-4"
          <Label htmlFor="status">Status</Label>
          <select 
            id="status"
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            className="w-full p-2 border rounded"
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>
      <div className="p-4"
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit>
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
