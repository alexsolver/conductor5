import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2, Calculator, AlertTriangle, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MaterialsServicesMiniSystemProps {
  ticketId: string;
  ticket?: any; // Add ticket data to get company information
}

export function MaterialsServicesMiniSystem({ ticketId, ticket }: MaterialsServicesMiniSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("planned");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
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
    mutationFn: async (data: { itemId: string; quantity: number }) => {
      // Get item details for pricing from itemsData
      const itemsList = itemsData?.data || [];
      const selectedItemData = itemsList.find((item: any) => item.id === data.itemId);
      
      console.log('🔍 [ADD-PLANNED-MUTATION] Selected item data:', selectedItemData);
      console.log('🔍 [ADD-PLANNED-MUTATION] Available items:', itemsList.length);

      // Use available data or defaults
      const unitPrice = selectedItemData?.price || 
                       selectedItemData?.unitCost || 
                       selectedItemData?.unit_cost || 
                       parseFloat(selectedItemData?.unitPrice || '0') || 
                       0;

      const requestData = {
        itemId: data.itemId,
        plannedQuantity: data.quantity,
        lpuId: '00000000-0000-0000-0000-000000000001', // Default LPU ID
        unitPriceAtPlanning: unitPrice,
        priority: 'medium',
        notes: ''
      };

      console.log('🔍 [ADD-PLANNED-MUTATION] Sending request data:', requestData);

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
      toast({ title: "Material removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover material", variant: "destructive" });
    }
  });

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

  const items = itemsData?.data || [];
  const availableItems = Array.isArray(availableItemsData?.data?.availableItems) ? availableItemsData.data.availableItems : 
                         Array.isArray(availableItemsData?.data) ? availableItemsData.data : 
                         Array.isArray(availableItemsData?.availableItems) ? availableItemsData.availableItems :
                         Array.isArray(availableItemsData) ? availableItemsData : [];
  const plannedMaterials = plannedData?.data?.plannedItems || [];

  // Process consumed materials data
  const consumedMaterials = useMemo(() => {
    if (!consumedData?.data?.consumedItems) return [];

    return consumedData.data.consumedItems.map((item: any, index: number) => {
      // Handle both nested and flat data structures
      const consumedItem = item.ticket_consumed_items || item;
      const itemData = item.items || item.item || {};

      // Extract ID with multiple fallback options
      const itemId = consumedItem.id || item.id || consumedItem.consumedItemId;

      console.log('🔍 [CONSUMED-MAPPING] Processing item:', {
        index,
        itemId,
        consumedItem: { id: consumedItem.id },
        item: { id: item.id },
        rawItem: item
      });

      return {
        id: itemId,
        consumedItemId: itemId, // Explicit consumed item ID
        itemName: itemData.name || consumedItem.itemName || 'Item não encontrado',
        itemType: itemData.type || consumedItem.itemType || 'Material',
        quantityUsed: consumedItem.actualQuantity || consumedItem.quantityUsed || '0',
        actualQuantity: consumedItem.actualQuantity || '0',
        totalCost: consumedItem.totalCost || consumedItem.actualCost || '0',
        actualCost: consumedItem.totalCost || '0',
        createdAt: consumedItem.createdAt || consumedItem.consumedAt || new Date().toISOString(),
        consumedAt: consumedItem.consumedAt || consumedItem.createdAt || new Date().toISOString(),
        // Preserve original data for debugging
        originalItem: item,
        consumedItem,
        itemData
      };
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
            R$ {costs.plannedCost?.toFixed(2) || '0,00'}
          </div>
        </Card>

        <Card className="p-4 text-center border-orange-200 bg-orange-50">
          <h3 className="text-sm font-semibold text-orange-800">Custo Real</h3>
          <div className="text-xl font-bold text-orange-700 mt-2">
            R$ {costs.actualCost?.toFixed(2) || '0,00'}
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
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Item Planejado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="item-select">Item</Label>
                  {itemsLoading ? (
                    <div className="text-center py-2">Carregando itens...</div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum item disponível para esta empresa</p>
                      <p className="text-sm">Vincule itens à empresa do ticket no catálogo</p>
                    </div>
                  ) : (
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item: any, index: number) => (
                          <SelectItem key={`item-${item.id}-${index}`} value={item.id}>
                            <div className="flex flex-col text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {item.display_name || item.custom_name || item.title || item.name}
                                </span>
                                {item.has_custom_mapping && (
                                  <Badge variant="secondary" className="text-xs">Personalizado</Badge>
                                )}
                              </div>
                              {(item.display_description || item.custom_description || item.description) && (
                                <div className="text-xs text-gray-600 mb-1 line-clamp-1">
                                  {item.display_description || item.custom_description || item.description}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>SKU: {item.display_sku || item.custom_sku || item.sku || item.integration_code}</span>
                                <span>Tipo: {item.type}</span>
                                <span className="font-medium">R$ {parseFloat(item.price || item.unit_cost || 0).toFixed(2)}</span>
                                {item.discount_percent && (
                                  <span className="text-green-600">-{item.discount_percent}%</span>
                                )}
                              </div>
                              {item.customer_reference && (
                                <span className="text-xs text-blue-600">Ref. Cliente: {item.customer_reference}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Qtd"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddPlanned}
                disabled={addPlannedMutation.isPending || items.length === 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addPlannedMutation.isPending ? "Adicionando..." : "Adicionar Planejado"}
              </Button>

              {/* Lista de Itens Planejados */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Itens Planejados
                </h3>
                {plannedLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : plannedMaterials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum item planejado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plannedMaterials.map((material: any, index: number) => {
                      // Handle both old and new data structures
                      const itemData = material.ticket_planned_items || material;
                      const itemDetails = material.items || {};

                      return (
                        <div key={`planned-${itemData.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{itemDetails.name || material.itemName || 'Item sem nome'}</p>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {itemDetails.type || material.itemType || 'Tipo não informado'}
                              </span>
                            </div>
                            {(itemDetails.description || material.itemDescription) && (
                              <p className="text-sm text-gray-500 mb-1">{itemDetails.description || material.itemDescription}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">Qtd: {itemData.plannedQuantity || material.plannedQuantity || material.quantity}</span>
                              <span className="text-gray-600">Preço unit.: R$ {parseFloat(itemData.unitPriceAtPlanning || material.unitPriceAtPlanning || 0).toFixed(2)}</span>
                              <span className="text-green-600 font-medium">Total: R$ {parseFloat(itemData.estimatedCost || material.estimatedCost || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePlannedMutation.mutate(itemData.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
                  ) : availableItems.length === 0 ? (
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
                        {availableItems.map((item: any, index: number) => (
                          <SelectItem key={`available-${item.itemId}-${index}`} value={item.itemId}>
                            <div className="flex flex-col text-left w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.itemName}</span>
                                <Badge variant="secondary" className="text-xs">{item.itemType}</Badge>
                              </div>
                              {item.itemDescription && (
                                <div className="text-xs text-gray-600 mb-1 line-clamp-1">
                                  {item.itemDescription}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                {item.itemSku && <span>SKU: {item.itemSku}</span>}
                                <span>Disponível: {item.remainingQuantity}</span>
                                <span className="font-medium text-green-600">R$ {parseFloat(item.unitPriceAtPlanning || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
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
                disabled={addConsumedMutation.isPending || availableItems.length === 0}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {addConsumedMutation.isPending ? "Registrando..." : "Registrar Consumo"}
              </Button>

              {/* Lista de Itens Consumidos */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  Itens Consumidos
                </h3>
                {consumedLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : consumedMaterials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum consumo registrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consumedMaterials.map((material: any, index: number) => (
                      <div key={`consumed-${material.consumedItemId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{material.itemName}</p>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {material.itemType || 'Material'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">Qtd Usada: {material.quantityUsed || material.actualQuantity}</span>
                            <span className="text-green-600 font-medium">R$ {parseFloat(material.totalCost || material.actualCost || 0).toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(material.createdAt || material.consumedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteConsumedMutation.mutate(material.consumedItemId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
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