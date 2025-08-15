import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Plus, 
  Calendar, 
  User, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Calculator,
  Trash2,
  Wrench,
  Box
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TicketMaterial {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  itemType: string;
  measurementUnit?: string;
  plannedQuantity: string;
  actualQuantity?: string;
  unitPriceAtPlanning: string;
  unitPriceAtConsumption?: string;
  estimatedCost: string;
  totalCost?: string;
  status: string;
  priority: string;
  notes?: string;
  plannedById?: string;
  technicianId?: string;
  consumedAt?: string;
  createdAt: string;
}

interface CostsSummary {
  totalPlannedCost: string;
  totalActualCost: string;
  costVariance: string;
  costVariancePercentage: string;
  materialsCount: number;
  servicesCount: number;
  totalItemsCount: number;
}

export default function TicketMaterials() {
  const { id: ticketId } = useParams();
  const [activeTab, setActiveTab] = useState('planned');
  const [plannedSubTab, setPlannedSubTab] = useState('all'); // all, material, service
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch planned items with cache busting
  const { data: plannedItems, isLoading: loadingPlanned } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'planned-items', Date.now()],
    queryFn: async () => {
      console.log('🔍 [PLANNED-ITEMS] Fetching planned items for ticket:', ticketId);
      const response = await fetch(`/api/materials-services/tickets/${ticketId}/planned-items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch planned items: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [PLANNED-ITEMS] Data received:', data);
      return data;
    },
    enabled: !!ticketId,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Fetch consumed items with cache busting
  const { data: consumedItems, isLoading: loadingConsumed } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'consumed-items', Date.now()],
    queryFn: async () => {
      const response = await fetch(`/api/materials-services/tickets/${ticketId}/consumed-items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch consumed items: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!ticketId,
    refetchOnMount: true
  });

  // Fetch costs summary with cache busting
  const { data: costsSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'costs-summary', Date.now()],
    queryFn: async () => {
      const response = await fetch(`/api/materials-services/tickets/${ticketId}/costs-summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch costs summary: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!ticketId,
    refetchOnMount: true
  });

  // Fetch available items with cache busting
  const { data: availableItems } = useQuery({
    queryKey: ['/api/materials-services/items', Date.now()],
    queryFn: async () => {
      const response = await fetch('/api/materials-services/items', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status}`);
      }
      
      return response.json();
    },
    refetchOnMount: true
  });

  // Add planned item mutation
  const addPlannedItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/materials-services/tickets/${ticketId}/planned-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to add planned item: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      queryClient.refetchQueries({ queryKey: ['/api/materials-services/tickets', ticketId, 'planned-items'] });
      toast({ title: 'Material planejado adicionado com sucesso' });
      setSelectedItem('');
      setQuantity('');
      setNotes('');
    },
    onError: (error) => {
      console.error('❌ Add planned item error:', error);
      toast({ title: 'Erro ao adicionar material', variant: 'destructive' });
    }
  });

  // Add consumed item mutation
  const addConsumedItemMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(`/api/materials-services/tickets/${ticketId}/consumed-items`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      toast({ title: 'Consumo de material registrado com sucesso' });
      setSelectedItem('');
      setQuantity('');
      setNotes('');
    },
    onError: () => {
      toast({ title: 'Erro ao registrar consumo', variant: 'destructive' });
    }
  });

  // Delete planned item mutation
  const deletePlannedItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/materials-services/tickets/${ticketId}/planned-items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete planned item: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      queryClient.refetchQueries({ queryKey: ['/api/materials-services/tickets', ticketId, 'planned-items'] });
      toast({ title: 'Item planejado excluído com sucesso' });
    },
    onError: (error) => {
      console.error('❌ Delete planned item error:', error);
      toast({ title: 'Erro ao excluir item planejado', variant: 'destructive' });
    }
  });

  const handleAddPlannedItem = () => {
    if (!selectedItem || !quantity) {
      toast({ title: 'Selecione um item e informe a quantidade', variant: 'destructive' });
      return;
    }

    const item = (availableItems as any)?.data?.items?.find((i: any) => i.id === selectedItem);
    if (!item) return;

    addPlannedItemMutation.mutate({
      itemId: selectedItem,
      plannedQuantity: quantity,
      lpuId: 'default-lpu', // TODO: Get from LPU selection
      unitPriceAtPlanning: item.salePrice || '0',
      priority: 'medium',
      notes
    });
  };

  const handleAddConsumedItem = () => {
    if (!selectedItem || !quantity) {
      toast({ title: 'Selecione um item e informe a quantidade', variant: 'destructive' });
      return;
    }

    const item = (availableItems as any)?.data?.items?.find((i: any) => i.id === selectedItem);
    if (!item) return;

    addConsumedItemMutation.mutate({
      itemId: selectedItem,
      actualQuantity: quantity,
      lpuId: 'default-lpu', // TODO: Get from LPU selection
      unitPriceAtConsumption: item.salePrice || '0',
      consumptionType: 'used',
      notes
    });
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value) || 0);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      planned: 'secondary',
      consumed: 'default',
      completed: 'default'
    };
    
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      consumed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status === 'planned' ? 'Planejado' : 
         status === 'consumed' ? 'Consumido' : 
         status === 'completed' ? 'Concluído' : status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900'
    };

    return (
      <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {priority === 'low' ? 'Baixa' : 
         priority === 'medium' ? 'Média' : 
         priority === 'high' ? 'Alta' : 
         priority === 'critical' ? 'Crítica' : priority}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-blue-600" />
              Materiais e Serviços
            </h1>
            <p className="text-gray-600 mt-1">Ticket #{ticketId?.slice(0, 8)}</p>
          </div>
        </div>

        {/* Cost Summary Cards */}
        {(costsSummary as any)?.data?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custo Planejado</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency((costsSummary as any).data.summary.totalPlannedCost)}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custo Real</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency((costsSummary as any).data.summary.totalActualCost)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Variação</h3>
                    <p className={`text-2xl font-bold ${
                      parseFloat((costsSummary as any).data.summary.costVariance) >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency((costsSummary as any).data.summary.costVariance)}
                    </p>
                  </div>
                  <Calculator className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total de Itens</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {(costsSummary as any).data.summary.totalItemsCount}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="planned" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Planejados
                </TabsTrigger>
                <TabsTrigger value="consumed" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Consumidos
                </TabsTrigger>
                <TabsTrigger value="add" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Planned Items Tab */}
              <TabsContent value="planned" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Itens Planejados</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {(plannedItems as any)?.data?.plannedItems?.length || 0} itens
                  </Badge>
                </div>

                {/* Sub-tabs for Material/Service */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPlannedSubTab('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      plannedSubTab === 'all'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Todos
                  </button>
                  <button
                    onClick={() => setPlannedSubTab('material')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      plannedSubTab === 'material'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Box className="w-4 h-4" />
                    Materiais
                  </button>
                  <button
                    onClick={() => setPlannedSubTab('service')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      plannedSubTab === 'service'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    Serviços
                  </button>
                </div>

                {loadingPlanned ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    <p>Carregando itens planejados...</p>
                  </div>
                ) : (
                  (() => {
                    console.log('🔍 [RENDER] Planned items data:', plannedItems);
                    const items = (plannedItems as any)?.data?.plannedItems || [];
                    const filteredItems = items.filter((item: TicketMaterial) => {
                      if (plannedSubTab === 'all') return true;
                      return item.itemType === plannedSubTab;
                    });
                    
                    console.log('🔍 [RENDER] Filtered items:', filteredItems.length, 'items');
                    
                    if (filteredItems.length > 0) {
                      return (
                        <div className="space-y-3">
                          {filteredItems.map((item: TicketMaterial) => (
                      <Card key={item.id} className={`border-l-4 ${item.itemType === 'material' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                {item.itemType === 'material' ? (
                                  <Box className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Wrench className="w-4 h-4 text-green-600" />
                                )}
                                <h4 className="font-semibold">{item.itemName || 'Item não encontrado'}</h4>
                                <Badge variant="outline">{item.itemCode || 'N/A'}</Badge>
                                <Badge className={`${item.itemType === 'material' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                  {item.itemType === 'material' ? 'Material' : 'Serviço'}
                                </Badge>
                                {getStatusBadge(item.status)}
                                {getPriorityBadge(item.priority)}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Quantidade:</strong> {item.plannedQuantity} {item.measurementUnit || 'UN'}</p>
                                <p><strong>Preço Unitário:</strong> {formatCurrency(item.unitPriceAtPlanning)}</p>
                                <p><strong>Custo Estimado:</strong> {formatCurrency(item.estimatedCost)}</p>
                                {item.notes && <p><strong>Observações:</strong> {item.notes}</p>}
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="text-right text-sm text-gray-500">
                                <p>Planejado em</p>
                                <p>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir este item planejado?')) {
                                    deletePlannedItemMutation.mutate(item.id);
                                  }
                                }}
                                disabled={deletePlannedItemMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>
                            {plannedSubTab === 'all' ? 'Nenhum item planejado' :
                             plannedSubTab === 'material' ? 'Nenhum material planejado' :
                             'Nenhum serviço planejado'}
                          </p>
                        </div>
                      );
                    }
                  })()
                )}
              </TabsContent>

              {/* Consumed Items Tab */}
              <TabsContent value="consumed" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Itens Consumidos</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {(consumedItems as any)?.data?.consumedItems?.length || 0} itens
                  </Badge>
                </div>

                {loadingConsumed ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-green-500" />
                    <p>Carregando consumos...</p>
                  </div>
                ) : (consumedItems as any)?.data?.consumedItems?.length > 0 ? (
                  <div className="space-y-3">
                    {(consumedItems as any).data.consumedItems.map((item: TicketMaterial) => (
                      <Card key={item.id} className={`border-l-4 ${item.itemType === 'material' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {item.itemType === 'material' ? (
                                  <Box className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Wrench className="w-4 h-4 text-green-600" />
                                )}
                                <h4 className="font-semibold">{item.itemName || 'Item não encontrado'}</h4>
                                <Badge variant="outline">{item.itemCode || 'N/A'}</Badge>
                                <Badge className={`${item.itemType === 'material' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                  {item.itemType === 'material' ? 'Material' : 'Serviço'}
                                </Badge>
                                {getStatusBadge('consumed')}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Quantidade Consumida:</strong> {item.actualQuantity} {item.measurementUnit || 'UN'}</p>
                                <p><strong>Preço Unitário:</strong> {formatCurrency(item.unitPriceAtConsumption || '0')}</p>
                                <p><strong>Custo Total:</strong> {formatCurrency(item.totalCost || '0')}</p>
                                {item.notes && <p><strong>Observações:</strong> {item.notes}</p>}
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>Consumido em</p>
                              <p>{item.consumedAt ? new Date(item.consumedAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum consumo registrado</p>
                  </div>
                )}
              </TabsContent>

              {/* Add Items Tab */}
              <TabsContent value="add" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add Planned Item */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Adicionar Item Planejado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Item</Label>
                        <Select value={selectedItem} onValueChange={setSelectedItem}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(availableItems as any)?.data?.items?.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.title} ({item.internalCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label>Observações</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Observações sobre o planejamento..."
                        />
                      </div>

                      <Button 
                        onClick={handleAddPlannedItem}
                        disabled={addPlannedItemMutation.isPending}
                        className="w-full"
                      >
                        {addPlannedItemMutation.isPending ? 'Adicionando...' : 'Adicionar Planejamento'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Add Consumed Item */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Registrar Consumo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Item</Label>
                        <Select value={selectedItem} onValueChange={setSelectedItem}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(availableItems as any)?.data?.items?.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.title} ({item.internalCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Quantidade Consumida</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label>Observações</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Observações sobre o consumo..."
                        />
                      </div>

                      <Button 
                        onClick={handleAddConsumedItem}
                        disabled={addConsumedItemMutation.isPending}
                        className="w-full"
                      >
                        {addConsumedItemMutation.isPending ? 'Registrando...' : 'Registrar Consumo'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}