import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Search, 
  Plus, 
  Package, 
  Warehouse, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  BarChart3,
  Edit,
  Eye,
  Filter
} from "lucide-react";

// Types
type StockLevel = {
  id: string;
  itemId: string;
  locationId: string;
  currentQuantity: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  itemTitle: string;
  itemCode: string;
  locationName: string;
  locationCode: string;
};

type InventoryStats = {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  totalLocations: number;
  recentMovements: number;
};

type StockMovement = {
  id: string;
  itemId: string;
  locationId: string;
  movementType: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  unitCost: number;
  reasonCode: string;
  notes: string;
  createdAt: string;
  itemTitle: string;
  locationName: string;
};

// Form schemas
const stockMovementSchema = z.object({
  itemId: z.string().min(1, "Item é obrigatório"),
  locationId: z.string().min(1, "Localização é obrigatória"),
  movementType: z.enum(['in', 'out', 'transfer', 'adjustment']),
  quantity: z.string().min(1, "Quantidade é obrigatória"),
  unitCost: z.string().optional(),
  reasonCode: z.string().min(1, "Código do motivo é obrigatório"),
  notes: z.string().optional(),
});

const stockAdjustmentSchema = z.object({
  itemId: z.string().min(1, "Item é obrigatório"),
  locationId: z.string().min(1, "Localização é obrigatória"),
  newQuantity: z.string().min(1, "Nova quantidade é obrigatória"),
  reason: z.string().min(1, "Motivo é obrigatório"),
  notes: z.string().optional(),
});

export function InventoryModule() {
  const [searchStock, setSearchStock] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const movementForm = useForm({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      movementType: 'in' as const,
      reasonCode: '',
    }
  });

  const adjustmentForm = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      reason: '',
    }
  });

  // Queries
  const { data: stats } = useQuery<InventoryStats>({
    queryKey: ['/api/parts-services/inventory/stats'],
  });

  const { data: stockLevels, isLoading: stockLoading } = useQuery<StockLevel[]>({
    queryKey: ['/api/parts-services/inventory/stock-levels', searchStock, filterLocation],
    queryFn: () => apiRequest('GET', `/api/parts-services/inventory/stock-levels?search=${searchStock}&location=${filterLocation === 'all' ? '' : filterLocation}`),
  });

  const { data: stockMovements } = useQuery<StockMovement[]>({
    queryKey: ['/api/parts-services/inventory/movements'],
  });

  const { data: items } = useQuery({
    queryKey: ['/api/parts-services/items'],
  });

  const { data: locations } = useQuery({
    queryKey: ['/api/parts-services/stock-locations'],
  });

  // Mutations
  const createMovementMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/inventory/movements', data),
    onSuccess: () => {
      toast({ title: "Movimentação criada com sucesso!" });
      setIsNewMovementOpen(false);
      movementForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/inventory/stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/inventory/movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/inventory/stats'] });
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: (data: any) => {
      const { itemId, locationId, newQuantity, reason, notes } = data;
      return apiRequest('PUT', `/api/parts-services/inventory/stock-levels/${itemId}/${locationId}`, {
        currentQuantity: parseInt(newQuantity),
        reason,
        notes,
      });
    },
    onSuccess: () => {
      toast({ title: "Estoque ajustado com sucesso!" });
      setIsAdjustmentOpen(false);
      adjustmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/inventory/stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/inventory/stats'] });
    },
  });

  // Helper functions
  const getStockStatus = (level: StockLevel) => {
    if (level.currentQuantity <= 0) {
      return { status: 'out', label: 'Esgotado', color: 'bg-red-100 text-red-800' };
    } else if (level.currentQuantity <= level.reorderPoint) {
      return { status: 'critical', label: 'Crítico', color: 'bg-red-100 text-red-800' };
    } else if (level.currentQuantity <= level.minimumStock) {
      return { status: 'low', label: 'Baixo', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'ok', label: 'OK', color: 'bg-green-100 text-green-800' };
    }
  };

  const onSubmitMovement = (data: any) => {
    createMovementMutation.mutate({
      ...data,
      quantity: parseInt(data.quantity),
      unitCost: data.unitCost ? parseFloat(data.unitCost) : undefined,
    });
  };

  const onSubmitAdjustment = (data: any) => {
    adjustStockMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.lowStockItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats?.totalValue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localizações</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLocations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.recentMovements || 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estoque..."
              value={searchStock}
              onChange={(e) => setSearchStock(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Localizações</SelectItem>
              {Array.isArray(locations) && locations.map((location: any) => (
                <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isNewMovementOpen} onOpenChange={setIsNewMovementOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
                <DialogDescription>
                  Registre entrada, saída ou transferência de itens
                </DialogDescription>
              </DialogHeader>
              <Form {...movementForm}>
                <form onSubmit={movementForm.handleSubmit(onSubmitMovement)} className="space-y-4">
                  <FormField
                    control={movementForm.control}
                    name="itemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(items) && items.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.title} ({item.internalCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={movementForm.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a localização" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(locations) && locations.map((location: any) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name} ({location.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={movementForm.control}
                    name="movementType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Movimentação *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in">Entrada</SelectItem>
                            <SelectItem value="out">Saída</SelectItem>
                            <SelectItem value="transfer">Transferência</SelectItem>
                            <SelectItem value="adjustment">Ajuste</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={movementForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={movementForm.control}
                      name="unitCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Unitário</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="15.50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={movementForm.control}
                    name="reasonCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código do Motivo *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="COMPRA">Compra</SelectItem>
                            <SelectItem value="VENDA">Venda</SelectItem>
                            <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                            <SelectItem value="AJUSTE">Ajuste de Inventário</SelectItem>
                            <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                            <SelectItem value="PERDA">Perda/Avaria</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={movementForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Informações adicionais..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMovementMutation.isPending}>
                      {createMovementMutation.isPending ? "Salvando..." : "Salvar Movimentação"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Ajuste de Estoque
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajuste de Estoque</DialogTitle>
                <DialogDescription>
                  Corrija quantidades em estoque após inventário
                </DialogDescription>
              </DialogHeader>
              <Form {...adjustmentForm}>
                <form onSubmit={adjustmentForm.handleSubmit(onSubmitAdjustment)} className="space-y-4">
                  <FormField
                    control={adjustmentForm.control}
                    name="itemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(items) && items.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.title} ({item.internalCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adjustmentForm.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a localização" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(locations) && locations.map((location: any) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name} ({location.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adjustmentForm.control}
                    name="newQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Quantidade *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="150" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adjustmentForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INVENTARIO">Inventário Físico</SelectItem>
                            <SelectItem value="CORRECAO">Correção de Sistema</SelectItem>
                            <SelectItem value="AVARIA">Avaria/Perda</SelectItem>
                            <SelectItem value="ENCONTRADO">Item Encontrado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adjustmentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Detalhes do ajuste..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={adjustStockMutation.isPending}>
                      {adjustStockMutation.isPending ? "Salvando..." : "Salvar Ajuste"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Inventário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Relatório de Inventário</DialogTitle>
                <DialogDescription>
                  Informações completas do estoque e movimentações recentes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
                      <p className="text-xs text-muted-foreground">Itens únicos em estoque</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(stats?.totalValue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Valor total do estoque</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Movimentações Recentes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Array.isArray(stockMovements) && stockMovements.slice(0, 5).map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{movement.itemTitle}</p>
                          <p className="text-xs text-muted-foreground">{movement.locationName}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={movement.movementType === 'in' ? 'default' : 'secondary'}>
                            {movement.movementType === 'in' ? 'Entrada' : 
                             movement.movementType === 'out' ? 'Saída' : 
                             movement.movementType === 'transfer' ? 'Transferência' : 'Ajuste'}
                          </Badge>
                          <p className="text-xs text-muted-foreground">Qtd: {movement.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stock Levels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Níveis de Estoque</CardTitle>
          <CardDescription>
            Controle de quantidades por item e localização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando níveis de estoque...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(stockLevels) && stockLevels.map((level) => {
                const statusInfo = getStockStatus(level);
                return (
                  <div key={level.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{level.itemTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            {level.itemCode} • {level.locationName} ({level.locationCode})
                          </p>
                        </div>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{level.currentQuantity}</div>
                        <div className="text-xs text-muted-foreground">Atual</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{level.minimumStock}</div>
                        <div className="text-xs text-muted-foreground">Mínimo</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{level.maximumStock}</div>
                        <div className="text-xs text-muted-foreground">Máximo</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {Array.isArray(stockLevels) && stockLevels.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum nível de estoque encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}