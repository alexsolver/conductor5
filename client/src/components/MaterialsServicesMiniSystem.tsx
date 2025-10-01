import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2, Calculator, AlertTriangle, Wrench, Clock, AlertCircle, ArrowLeft, Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper function to format currency
function formatCurrency(amount: number | string | undefined): string {
  const numericAmount = parseFloat(String(amount));
  if (isNaN(numericAmount)) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericAmount);
}

interface MaterialsServicesMiniSystemProps {
  ticketId: string;
  ticket?: any; // Add ticket data to get company information
}

export function MaterialsServicesMiniSystem({ ticketId, ticket }: MaterialsServicesMiniSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("planned");
  const [plannedSubTab, setPlannedSubTab] = useState('all'); // all, materials, services
  const [consumedSubTab, setConsumedSubTab] = useState('all'); // all, materials, services
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [consumeSelectedItem, setConsumeSelectedItem] = useState("");
  const [consumeQuantity, setConsumeQuantity] = useState("");
  const [consumedQuantity, setConsumedQuantity] = useState("");

  // Fetch items with customer-specific customizations
  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ['/api/materials-services/companies', ticket?.companyId || ticket?.customer_id, 'items'],
    queryFn: async () => {
      // Get company ID from ticket (use companyId first, then customer_id as fallback)
      const companyId = ticket?.companyId || ticket?.customer_id;
      console.log('🔍 [MaterialsSystem] Fetching items for companyId:', companyId);
      console.log('🔍 [MaterialsSystem] Available ticket fields:', {
        companyId: ticket?.companyId,
        customer_id: ticket?.customer_id,
        ticketKeys: ticket ? Object.keys(ticket) : 'no ticket'
      });

      if (!companyId) {
        // Fallback to regular items if no company ID
        const response = await apiRequest('GET', `/api/materials-services/items`);
        const result = await response.json();
        console.log('📦 [MaterialsSystem] Items fetched (fallback):', result.data?.length || 0, 'items');
        return result;
      }

      // Fetch items with company-specific personalization
      const response = await apiRequest('GET', `/api/materials-services/companies/${companyId}/items`);
      const result = await response.json();
      console.log('📦 [MaterialsSystem] Company items fetched:', result.data?.length || 0, 'items,', result.stats?.itemsWithCustomMappings || 0, 'with custom mappings');
      return result;
    },
    enabled: !!ticket,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch available items for consumption (only planned items)
  const { data: availableItemsData, isLoading: availableItemsLoading, error: availableItemsError } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'available-for-consumption'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/materials-services/tickets/${ticketId}/available-for-consumption`);
      return response.json();
    },
  });

  // Fetch planned materials
  const { data: plannedData, isLoading: plannedLoading, error: plannedError } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'planned-items'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/materials-services/tickets/${ticketId}/planned-items`);
      return response.json();
    },
  });

  // Fetch consumed materials
  const { data: consumedData, isLoading: consumedLoading, error: consumedError } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'consumed-items'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/materials-services/tickets/${ticketId}/consumed-items`);
      return response.json();
    },
  });

  // Fetch cost summary
  const { data: costsData, isLoading: costsLoading, error: costsError } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'costs-summary'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/materials-services/tickets/${ticketId}/costs-summary`);
      return response.json();
    },
  });

  // Add planned material mutation
  const addPlannedMutation = useMutation({
    mutationFn: async (data: any) => {
      const selectedItemData = itemsData?.data?.items?.find((item: any) => item.id === selectedItem);

      console.log('🔍 [ADD-PLANNED-MUTATION] Selected item data:', selectedItemData);

      // Use customer ID from ticket as LPU ID (this should be improved to fetch actual LPU)
      const lpuId = ticket?.companyId || ticket?.customer_id || 'b9389438-63a3-4cf1-8d96-590969de94f6';
      console.log('🔍 [ADD-PLANNED-MUTATION] Using LPU ID:', lpuId, 'for item:', selectedItem);

      // Fetch price from LPU before creating planned item
      let unitPrice = 0;
      try {
        console.log('💰 [PRICE-LOOKUP] Fetching price for item:', selectedItem, 'from LPU:', lpuId);

        // First, get price lists for the tenant
        const priceListsResponse = await apiRequest('GET', '/api/materials-services/price-lists');
        const priceListsData = await priceListsResponse.json();

        console.log('💰 [PRICE-LOOKUP] Available price lists:', priceListsData.length);

        if (priceListsData && priceListsData.length > 0) {
          // Use the first active price list (in a real scenario, you'd match by customer/company)
          const activePriceList = priceListsData.find((pl: any) => pl.isActive) || priceListsData[0];

          if (activePriceList) {
            console.log('💰 [PRICE-LOOKUP] Using price list:', activePriceList.name, 'ID:', activePriceList.id);

            // Get items from this price list
            const priceListItemsResponse = await apiRequest('GET', `/api/materials-services/price-lists/${activePriceList.id}/items`);
            const priceListItems = await priceListItemsResponse.json();

            console.log('💰 [PRICE-LOOKUP] Price list items:', priceListItems.length);

            // Find the item in the price list
            const priceListItem = priceListItems.find((item: any) => item.itemId === selectedItem);

            if (priceListItem) {
              unitPrice = parseFloat(priceListItem.unitPrice) || parseFloat(priceListItem.specialPrice) || 0;
              console.log('💰 [PRICE-LOOKUP] Found price:', unitPrice, 'for item:', selectedItem);
            } else {
              console.log('⚠️ [PRICE-LOOKUP] Item not found in price list, using default price from item catalog');
              // Fallback to item catalog price if available
              unitPrice = parseFloat(selectedItemData?.unitCost || selectedItemData?.price || 0);
            }
          }
        }
      } catch (error) {
        console.error('❌ [PRICE-LOOKUP] Error fetching price:', error);
        // Fallback to item catalog price
        unitPrice = parseFloat(selectedItemData?.unitCost || selectedItemData?.price || 0);
      }

      const requestData = {
        itemId: selectedItem,
        plannedQuantity: parseFloat(quantity),
        lpuId: lpuId,
        unitPriceAtPlanning: unitPrice,
        priority: "medium",
        notes: ""
      };

      console.log('🔍 [ADD-PLANNED-MUTATION] Sending request data with price:', requestData);

      const response = await apiRequest('POST', `/api/materials-services/tickets/${ticketId}/planned-items`, requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      setSelectedItem("");
      setQuantity("");
      toast({ title: "Material planejado adicionado com sucesso!" });
    },
    onError: (error) => {
      console.error('Error adding planned material:', error);
      toast({ title: "Erro ao adicionar material planejado", variant: "destructive" });
    }
  });

  // Add consumed material mutation
  const addConsumedMutation = useMutation({
    mutationFn: async (data: { itemId: string; quantityUsed: number }) => {
      // Get item details for pricing from available items
      const selectedItemData = availableItems.find((item: any) => item.itemId === data.itemId);
      if (!selectedItemData) throw new Error('Item not found in available items');

      console.log('🔍 [CONSUMED] Selected item data:', selectedItemData);

      const requestData = {
        itemId: data.itemId,
        plannedItemId: selectedItemData.plannedItemId || selectedItemData.id, // Include planned item ID
        actualQuantity: data.quantityUsed,
        plannedQuantity: selectedItemData.plannedQuantity || 0,
        lpuId: selectedItemData.lpuId || '00000000-0000-0000-0000-000000000001', // Use LPU from planned item
        unitPriceAtConsumption: parseFloat(selectedItemData.unitPriceAtPlanning || selectedItemData.unitCost || '0'), // Ensure numeric value
        consumptionType: 'used',
        notes: ''
      };

      console.log('🔍 [CONSUMED] Sending request data:', requestData);

      const response = await apiRequest('POST', `/api/materials-services/tickets/${ticketId}/consumed-items`, requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      setSelectedItem("");
      setConsumedQuantity("");
      toast({ title: "Consumo registrado com sucesso!" });
    },
    onError: (error) => {
      console.error('Error adding consumed material:', error);
      toast({ title: "Erro ao registrar consumo", variant: "destructive" });
    }
  });

  // Delete planned material mutation
  const deletePlannedMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/materials-services/tickets/${ticketId}/planned-items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      toast({ title: "Item planejado excluído com sucesso!" });
    },
    onError: (error) => {
      console.error('Error deleting planned item:', error);
      toast({ title: "Erro ao excluir item planejado", variant: "destructive" });
    }
  });

  // Handle delete planned item
  const handleDeletePlannedItem = (itemId: string, itemName: string) => {
    if (confirm(`Tem certeza que deseja excluir o item "${itemName}"?`)) {
      deletePlannedMutation.mutate(itemId);
    }
  };

  // Delete consumed material mutation
  const deleteConsumedMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/materials-services/tickets/${ticketId}/consumed-items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      toast({ title: "Consumo removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover consumo", variant: "destructive" });
    }
  });

  // Get available items
  const availableItems = useMemo(() => {
    return availableItemsData?.data || [];
  }, [availableItemsData]);

  // Get regular items for selection
  const items = useMemo(() => {
    if (!itemsData?.data?.items) {
      console.log('⚠️ [MaterialsSystem] No items data available:', itemsData);
      return [];
    }

    const itemsList = itemsData.data.items;
    console.log('📦 [MaterialsSystem] Items available for selection:', itemsList.length);
    return itemsList;
  }, [itemsData]);

  const plannedMaterials = plannedData?.data?.plannedItems || [];

  // Debug logs for consumption availability
  useEffect(() => {
    console.log('🔍 [CONSUMPTION-DEBUG] Available items raw data:', availableItemsData);
    if (availableItemsData?.data) {
      const items = Array.isArray(availableItemsData.data) ? availableItemsData.data : [];
      console.log('🔍 [CONSUMPTION-DEBUG] Available items data:', {
        processedItems: items,
        itemCount: items.length,
        sampleItem: items[0] || 'No items',
        isSuccess: availableItemsData.success
      });
    }
  }, [availableItemsData]);


  // Process consumed materials data
  const consumedMaterials = useMemo(() => {
    if (!consumedData?.data?.consumedItems) return [];

    console.log('🔍 [CONSUMED-PROCESSING] Raw consumed data:', consumedData.data.consumedItems);

    return consumedData.data.consumedItems.map((item: any, index: number) => {
      // Handle multiple data structure patterns
      let consumedItem, itemData, itemId, itemName, itemType;

      // Pattern 1: Direct structure
      if (item.id && item.itemName) {
        consumedItem = item;
        itemData = item;
        itemId = item.id;
        itemName = item.itemName;
        itemType = item.itemType || 'Material';
      }
      // Pattern 2: Nested ticket_consumed_items
      else if (item.ticket_consumed_items) {
        consumedItem = item.ticket_consumed_items;
        itemData = item.items || item.item || {};
        itemId = consumedItem.id;
        itemName = itemData.name || consumedItem.itemName || 'Item não encontrado';
        itemType = itemData.type || consumedItem.itemType || 'Material';
      }
      // Pattern 3: Other nested structures
      else {
        consumedItem = item;
        itemData = item.items || item.item || item;
        itemId = item.id || consumedItem.id;
        itemName = itemData.name || itemData.itemName || item.itemName || 'Item não encontrado';
        itemType = itemData.type || itemData.itemType || item.itemType || 'Material';
      }

      const processedItem = {
        id: itemId || `consumed-${index}`,
        consumedItemId: itemId || `consumed-${index}`,
        itemName: itemName,
        itemType: itemType,
        quantityUsed: consumedItem.actualQuantity || consumedItem.quantityUsed || item.actualQuantity || '0',
        actualQuantity: consumedItem.actualQuantity || item.actualQuantity || '0',
        totalCost: consumedItem.totalCost || consumedItem.actualCost || item.totalCost || '0',
        actualCost: consumedItem.totalCost || item.actualCost || '0',
        createdAt: consumedItem.createdAt || consumedItem.consumedAt || item.createdAt || new Date().toISOString(),
        consumedAt: consumedItem.consumedAt || consumedItem.createdAt || item.consumedAt || new Date().toISOString(),
        unitPrice: consumedItem.unitPriceAtConsumption || item.unitPriceAtConsumption || '0',
        // Preserve original data for debugging
        originalItem: item,
        consumedItem,
        itemData
      };

      console.log('🔍 [CONSUMED-MAPPING] Processed item:', {
        index,
        itemId,
        itemName,
        processedItem
      });

      return processedItem;
    });
  }, [consumedData]);

  const costs = costsData?.data || {};

  // Enhanced error handling
  const hasDataError = itemsError || availableItemsError || plannedError || consumedError || costsError;
  const isAnyLoading = itemsLoading || availableItemsLoading || plannedLoading || consumedLoading || costsLoading;

  const handleAddPlanned = () => {
    if (!selectedItem || !quantity) {
      toast({ title: "Selecione um item e informe a quantidade", variant: "destructive" });
      return;
    }
    addPlannedMutation.mutate({ itemId: selectedItem, quantity: parseFloat(quantity) });
  };

  const handleConsumeItem = (item: any) => {
    setSelectedItem(item.itemId || item.id); // Set selected item for consumption
    // Potentially pre-fill quantity or other fields if needed
    console.log("Consuming item:", item);
    // For now, just set the item and let the user input quantity
  };

  const handleAddConsumed = () => {
    if (!selectedItem || !consumedQuantity) {
      toast({ title: "Selecione um item e informe a quantidade consumida", variant: "destructive" });
      return;
    }
    addConsumedMutation.mutate({ itemId: selectedItem, quantityUsed: parseFloat(consumedQuantity) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Materiais e Serviços</h2>
        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-700">Planejados:</span>
            <span className="text-sm font-bold text-blue-800">{plannedMaterials.length}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-green-700">Consumidos:</span>
            <span className="text-sm font-bold text-green-800">{consumedMaterials.length}</span>
          </div>
        </div>
      </div>

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-blue-200 bg-blue-50">
          <h3 className="text-sm font-semibold text-blue-800">Itens Planejados</h3>
          <div className="text-2xl font-bold text-blue-700 mt-2">{plannedMaterials.length}</div>
        </Card>

        <Card className="p-4 text-center border-green-200 bg-green-50">
          <h3 className="text-sm font-semibold text-green-800">Itens Consumidos</h3>
          <div className="text-2xl font-bold text-green-700 mt-2">{consumedMaterials.length}</div>
        </Card>

        <Card className="p-4 text-center border-purple-200 bg-purple-50">
          <h3 className="text-sm font-semibold text-purple-800">Custo Planejado</h3>
          <div className="text-xl font-bold text-purple-700 mt-2">
            R$ {parseFloat(costs.plannedCost || '0').toFixed(2) || '0,00'}
          </div>
        </Card>

        <Card className="p-4 text-center border-orange-200 bg-orange-50">
          <h3 className="text-sm font-semibold text-orange-800">Custo Real</h3>
          <div className="text-xl font-bold text-orange-700 mt-2">
            R$ {parseFloat(costs.actualCost || '0').toFixed(2) || '0,00'}
          </div>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planned">Planejar Item</TabsTrigger>
          <TabsTrigger value="consumed">Registrar Consumo</TabsTrigger>
        </TabsList>



        <TabsContent value="planned" className="space-y-4">
          <div className="flex flex-col space-y-4">
            {/* Add Planned Material/Service Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Item Planejado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Item</Label>
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {itemsLoading && (
                          <SelectItem value="loading" disabled>
                            Carregando itens...
                          </SelectItem>
                        )}
                        {!itemsLoading && items.length === 0 && (
                          <SelectItem value="no-items" disabled>
                            Nenhum item disponível
                          </SelectItem>
                        )}
                        {!itemsLoading && items.length > 0 && items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.integrationCode || item.itemCode || item.integration_code || 'sem código'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {itemsError && (
                      <p className="text-sm text-red-600 mt-1">
                        Erro ao carregar itens: {itemsError.message}
                      </p>
                    )}
                    {!itemsLoading && (
                      <p className="text-xs text-gray-500 mt-1">
                        {items.length} itens disponíveis
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Digite a quantidade"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => handleAddPlanned()}
                      disabled={!selectedItem || !quantity || addPlannedMutation.isPending}
                      className="w-full"
                    >
                      {addPlannedMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adicionando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planned Items Sub-tabs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Itens Planejados ({plannedData?.data?.plannedItems?.length || 0})
                </h3>

                {/* Sub-tabs for Materials/Services */}
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={plannedSubTab === 'all' ? 'default' : 'ghost'}
                    onClick={() => setPlannedSubTab('all')}
                    className="h-8 px-3 text-xs"
                  >
                    Todos ({plannedData?.data?.plannedItems?.length || 0})
                  </Button>
                  <Button
                    size="sm"
                    variant={plannedSubTab === 'materials' ? 'default' : 'ghost'}
                    onClick={() => setPlannedSubTab('materials')}
                    className="h-8 px-3 text-xs"
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Materiais ({(plannedData?.data?.plannedItems || []).filter((item: any) => item.itemType === 'material').length})
                  </Button>
                  <Button
                    size="sm"
                    variant={plannedSubTab === 'services' ? 'default' : 'ghost'}
                    onClick={() => setPlannedSubTab('services')}
                    className="h-8 px-3 text-xs"
                  >
                    <Wrench className="h-3 w-3 mr-1" />
                    Serviços ({(plannedData?.data?.plannedItems || []).filter((item: any) => item.itemType === 'service').length})
                  </Button>
                </div>
              </div>

              {plannedLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Carregando itens planejados...
                </div>
              ) : (
                <div className="space-y-3">
                  {(plannedData?.data?.plannedItems || [])
                    .filter((item: any) => {
                      if (plannedSubTab === 'all') return true;
                      if (plannedSubTab === 'materials') return item.itemType === 'material';
                      if (plannedSubTab === 'services') return item.itemType === 'service';
                      return true;
                    })
                    .map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {item.itemType === 'material' ? (
                            <Package className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Wrench className="h-4 w-4 text-green-500" />
                          )}
                          <h4 className="font-semibold text-blue-900">{item.itemName}</h4>
                          <Badge variant="outline" className="text-xs bg-blue-200 text-blue-800">
                            {item.itemType === 'material' ? 'Material' : 'Serviço'}
                          </Badge>
                        </div>
                        {item.itemDescription && (
                          <p className="text-xs text-blue-700 mb-2">{item.itemDescription}</p>
                        )}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Quantidade: <span className="font-medium text-blue-800">{item.plannedQuantity} {item.measurementUnit || 'UN'}</span></span>
                          </div>
                          <div>
                            <span className="text-blue-600">Valor Unit.: <span className="font-medium text-blue-800">R$ {item.unitPrice?.toFixed(2) || '0,00'}</span></span>
                          </div>
                          <div>
                            <span className="text-blue-600 font-medium">
                              Total: R$ {item.totalCost?.toFixed(2) || '0,00'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                          onClick={() => handleDeletePlannedItem(item.id, item.itemName)}
                          title="Excluir item planejado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!plannedLoading && (plannedData?.data?.plannedItems || [])
                .filter((item: any) => {
                  if (plannedSubTab === 'all') return true;
                  if (plannedSubTab === 'materials') return item.itemType === 'material';
                  if (plannedSubTab === 'services') return item.itemType === 'service';
                  return true;
                }).length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  {plannedSubTab === 'all' ? (
                    <>
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum item planejado encontrado</p>
                      <p className="text-sm">Adicione itens usando o formulário acima</p>
                    </>
                  ) : plannedSubTab === 'materials' ? (
                    <>
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum material planejado encontrado</p>
                    </>
                  ) : (
                    <>
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum serviço planejado encontrado</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="consumed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Consumo Real</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="consumed-item-select">Item</Label>
                  {availableItemsLoading ? (
                    <div className="text-center py-2">Carregando itens disponíveis...</div>
                  ) : Array.isArray(availableItemsData?.data) && availableItemsData.data.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum item planejado disponível para consumo</p>
                      <p className="text-sm">Adicione itens no planejamento primeiro</p>
                    </div>
                  ) : (
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item planejado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(availableItemsData?.data) && availableItemsData.data.map((item: any, index: number) => {
                          // Handle different data structures - try nested object first
                          const itemData = item.item || item.items || item;

                          // Try to get the item name from various possible locations in the data structure
                          let itemName = null;

                          // Priority 1: Direct name fields
                          if (itemData.itemName) itemName = itemData.itemName;
                          else if (itemData.name) itemName = itemData.name;
                          else if (item.itemName) itemName = item.itemName;
                          else if (item.name) itemName = item.name;
                          // Priority 2: Display/title fields
                          else if (itemData.display_name) itemName = itemData.display_name;
                          else if (itemData.title) itemName = itemData.title;
                          else if (item.display_name) itemName = item.display_name;
                          else if (item.title) itemName = item.title;
                          // Fallback: Use a descriptive fallback instead of UUID
                          else itemName = `Material ${item.itemId ? item.itemId.substring(0, 8) : 'Não identificado'}`;

                          // Debug log to see item structure
                          console.log('🔍 [CONSUMPTION-SELECT] Available item structure:', {
                            rawItem: item,
                            itemData: itemData,
                            itemId: item.itemId,
                            detectedName: itemName,
                            allKeys: Object.keys(item),
                            itemDataKeys: item.item ? Object.keys(item.item) : 'no item nested',
                            itemsDataKeys: item.items ? Object.keys(item.items) : 'no items nested'
                          });

                          const itemType = itemData.itemType || itemData.type || item.itemType || item.type || 'Material';
                          const itemDescription = itemData.itemDescription || item.description || itemData.display_description ||
                                                 item.itemDescription || item.description || item.display_description || '';
                          const itemSku = itemData.itemSku || item.sku || itemData.integrationCode || itemData.integration_code ||
                                         item.display_sku || itemData.itemSku || item.sku || itemData.integrationCode ||
                                         item.integration_code || item.display_sku || '';
                          const remainingQty = item.remainingQuantity || item.plannedQuantity || '0';
                          const unitPrice = parseFloat(item.unitPriceAtPlanning || item.unitPrice || item.price || item.unit_cost || 0);

                          return (
                            <SelectItem key={`available-${item.itemId}-${index}`} value={item.itemId}>
                              <div className="flex flex-col text-left w-full">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{itemName}</span>
                                  <Badge variant="secondary" className="text-xs">{itemType}</Badge>
                                </div>
                                {itemDescription && (
                                  <div className="text-xs text-gray-600 mb-1 line-clamp-1">
                                    {itemDescription}
                                  </div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  {itemSku && <span>SKU: {itemSku}</span>}
                                  <span>Disponível: {remainingQty}</span>
                                  {unitPrice > 0 && (
                                    <span className="font-medium text-green-600">R$ {unitPrice.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consumed-quantity">Quantidade</Label>
                  <Input
                    id="consumed-quantity"
                    type="number"
                    value={consumedQuantity}
                    onChange={(e) => setConsumedQuantity(e.target.value)}
                    placeholder="Qtd"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddConsumed}
                disabled={addConsumedMutation.isPending || !Array.isArray(availableItemsData?.data) || availableItemsData.data.length === 0}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {addConsumedMutation.isPending ? "Registrando..." : "Registrar Consumo"}
              </Button>

              {/* Lista de Itens Consumidos */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    Itens Consumidos ({consumedMaterials.length})
                  </h3>

                  {/* Sub-tabs para Materiais/Serviços Consumidos */}
                  <div className="flex bg-muted rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={consumedSubTab === 'all' ? 'default' : 'ghost'}
                      onClick={() => setConsumedSubTab('all')}
                      className="h-8 px-3 text-xs"
                    >
                      Todos ({consumedMaterials.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={consumedSubTab === 'materials' ? 'default' : 'ghost'}
                      onClick={() => setConsumedSubTab('materials')}
                      className="h-8 px-3 text-xs"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Materiais ({consumedMaterials.filter((item: any) => item.itemType === 'material').length})
                    </Button>
                    <Button
                      size="sm"
                      variant={consumedSubTab === 'services' ? 'default' : 'ghost'}
                      onClick={() => setConsumedSubTab('services')}
                      className="h-8 px-3 text-xs"
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Serviços ({consumedMaterials.filter((item: any) => item.itemType === 'service').length})
                    </Button>
                  </div>
                </div>

                {consumedLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Carregando itens consumidos...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consumedMaterials
                      .filter((item: any) => {
                        if (consumedSubTab === 'all') return true;
                        if (consumedSubTab === 'materials') return item.itemType === 'material';
                        if (consumedSubTab === 'services') return item.itemType === 'service';
                        return true;
                      })
                      .map((material: any, index: number) => (
                      <div key={`consumed-${material.consumedItemId || material.id}-${index}`} className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {material.itemType === 'material' ? (
                              <Package className="h-4 w-4 text-green-500" />
                            ) : (
                              <Wrench className="h-4 w-4 text-green-500" />
                            )}
                            <h4 className="font-semibold text-green-900">{material.itemName}</h4>
                            <Badge variant="outline" className="text-xs bg-green-200 text-green-800">
                              {material.itemType === 'material' ? 'Material' : 'Serviço'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-green-600">Quantidade Usada: <span className="font-medium text-green-800">{material.quantityUsed || material.actualQuantity}</span></span>
                              {material.unitPrice && parseFloat(material.unitPrice) > 0 && (
                                <div className="text-xs text-green-700 mt-1">
                                  Preço Unitário: R$ {parseFloat(material.unitPrice).toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-green-600 font-medium">
                                Custo Total: R$ {parseFloat(material.totalCost || material.actualCost || 0).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs text-green-700">
                                Consumido em: {format(new Date(material.createdAt || material.consumedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const itemId = material.consumedItemId || material.id;
                              console.log('🗑️ Deleting consumed item:', itemId);
                              deleteConsumedMutation.mutate(itemId);
                            }}
                            disabled={deleteConsumedMutation.isPending}
                            title="Excluir item consumido"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!consumedLoading && consumedMaterials
                  .filter((item: any) => {
                    if (consumedSubTab === 'all') return true;
                    if (consumedSubTab === 'materials') return item.itemType === 'material';
                    if (consumedSubTab === 'services') return item.itemType === 'service';
                    return true;
                  }).length === 0 && (
                  <div className="text-center p-8 text-muted-foreground">
                    {consumedSubTab === 'all' ? (
                      <>
                        <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum item consumido encontrado</p>
                        <p className="text-sm">Registre consumos usando o formulário acima</p>
                      </>
                    ) : consumedSubTab === 'materials' ? (
                      <>
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum material consumido encontrado</p>
                      </>
                    ) : (
                      <>
                        <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum serviço consumido encontrado</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}