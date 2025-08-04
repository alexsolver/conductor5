import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2, Calculator, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MaterialsServicesMiniSystemProps {
  ticketId: string;
}

export function MaterialsServicesMiniSystem({ ticketId }: MaterialsServicesMiniSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [consumedQuantity, setConsumedQuantity] = useState("");

  // Fetch available items
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/materials-services/items'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/materials-services/items');
      return response.json();
    },
  });

  // Fetch planned materials
  const { data: plannedData, isLoading: plannedLoading } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'planned'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/materials-services/tickets/${ticketId}/planned`);
      return response.json();
    },
  });

  // Fetch consumed materials
  const { data: consumedData, isLoading: consumedLoading } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'consumed'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/materials-services/tickets/${ticketId}/consumed`);
      return response.json();
    },
  });

  // Fetch cost summary
  const { data: costsData, isLoading: costsLoading } = useQuery({
    queryKey: ['/api/materials-services/tickets', ticketId, 'costs-summary'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/materials-services/tickets/${ticketId}/costs-summary`);
      return response.json();
    },
  });

  // Add planned material mutation
  const addPlannedMutation = useMutation({
    mutationFn: async (data: { itemId: string; quantity: number }) => {
      const response = await apiRequest('POST', `/api/materials-services/tickets/${ticketId}/planned`, {
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      setSelectedItem("");
      setQuantity("");
      toast({ title: "Material planejado adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar material planejado", variant: "destructive" });
    }
  });

  // Add consumed material mutation
  const addConsumedMutation = useMutation({
    mutationFn: async (data: { itemId: string; quantityUsed: number }) => {
      const response = await apiRequest('POST', `/api/materials-services/tickets/${ticketId}/consumed`, {
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/tickets', ticketId] });
      setSelectedItem("");
      setConsumedQuantity("");
      toast({ title: "Consumo registrado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao registrar consumo", variant: "destructive" });
    }
  });

  // Delete planned material mutation
  const deletePlannedMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/materials-services/tickets/${ticketId}/planned/${itemId}`);
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

  const items = itemsData?.data || [];
  const plannedMaterials = plannedData?.data || [];
  const consumedMaterials = consumedData?.data || [];
  const costs = costsData?.data || {};

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="planned">Planejar Material</TabsTrigger>
          <TabsTrigger value="consumed">Registrar Consumo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planned Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Materiais Planejados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plannedLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : plannedMaterials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum material planejado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plannedMaterials.map((material: any) => (
                      <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{material.itemName}</p>
                          <p className="text-sm text-gray-600">Qtd: {material.quantity}</p>
                          <p className="text-sm text-green-600">R$ {material.estimatedCost?.toFixed(2)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePlannedMutation.mutate(material.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consumed Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  Materiais Consumidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {consumedLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : consumedMaterials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum consumo registrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consumedMaterials.map((material: any) => (
                      <div key={material.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{material.itemName}</p>
                        <p className="text-sm text-gray-600">Qtd Usada: {material.quantityUsed}</p>
                        <p className="text-sm text-green-600">R$ {material.actualCost?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(material.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Material Planejado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-select">Item</Label>
                {itemsLoading ? (
                  <div className="text-center py-2">Carregando itens...</div>
                ) : (
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {item.type} (R$ {item.unitCost?.toFixed(2)})
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
                  placeholder="Quantidade planejada"
                />
              </div>

              <Button 
                onClick={handleAddPlanned}
                disabled={addPlannedMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addPlannedMutation.isPending ? "Adicionando..." : "Adicionar Planejado"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Consumo Real</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="consumed-item-select">Item</Label>
                {itemsLoading ? (
                  <div className="text-center py-2">Carregando itens...</div>
                ) : (
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {item.type} (R$ {item.unitCost?.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumed-quantity">Quantidade Consumida</Label>
                <Input
                  id="consumed-quantity"
                  type="number"
                  value={consumedQuantity}
                  onChange={(e) => setConsumedQuantity(e.target.value)}
                  placeholder="Quantidade realmente utilizada"
                />
              </div>

              <Button 
                onClick={handleAddConsumed}
                disabled={addConsumedMutation.isPending}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {addConsumedMutation.isPending ? "Registrando..." : "Registrar Consumo"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}