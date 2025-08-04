
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Wrench, 
  Plus, 
  Search, 
  Save, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Calculator
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber: string;
  customerId?: string;
}

interface TicketMaterial {
  id: string;
  itemType: 'material' | 'service';
  itemName: string;
  itemCode?: string;
  recordType: 'planned' | 'consumed';
  plannedQuantity: number;
  consumedQuantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPlannedCost: number;
  totalConsumedCost: number;
  consumptionNotes?: string;
  isApproved: boolean;
  consumedAt?: string;
  consumedByName?: string;
}

interface CostSummary {
  totalPlannedMaterialsCost: number;
  totalPlannedServicesCost: number;
  totalPlannedCost: number;
  totalConsumedMaterialsCost: number;
  totalConsumedServicesCost: number;
  totalConsumedCost: number;
  costVariance: number;
  costVariancePercentage: number;
  totalItems: number;
  itemsWithConsumption: number;
  hasPlannedItems: boolean;
  hasConsumedItems: boolean;
  isFullyConsumed: boolean;
}

export default function TicketMaterialsModal({ 
  isOpen, 
  onClose, 
  ticketId, 
  ticketNumber,
  customerId 
}: TicketMaterialsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [consumptionData, setConsumptionData] = useState<Record<string, { quantity: number; notes: string }>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ticket materials
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "materials"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/materials`);
      return response.json();
    },
    enabled: isOpen,
  });

  // Fetch available items
  const { data: availableItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/tickets", ticketId, "materials", "available-items", customerId, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', customerId);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/materials/available-items?${params}`);
      return response.json();
    },
    enabled: isOpen && activeTab === "add-items",
  });

  const materials: TicketMaterial[] = materialsData?.data?.materials || [];
  const costSummary: CostSummary = materialsData?.data?.costSummary || {};
  const totals = materialsData?.data?.totals || {};

  // Add planned items mutation
  const addPlannedItemMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const promises = items.map(item => 
        apiRequest("POST", `/api/tickets/${ticketId}/materials/planned`, item)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Itens adicionados ao planejamento com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "materials"] });
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar itens",
        variant: "destructive",
      });
    },
  });

  // Register consumption mutation
  const registerConsumptionMutation = useMutation({
    mutationFn: async (consumptions: any[]) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/materials/bulk-consumption`, {
        consumptions
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Consumo registrado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "materials"] });
      setConsumptionData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao registrar consumo",
        variant: "destructive",
      });
    },
  });

  const handleAddItems = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um item para adicionar",
        variant: "destructive",
      });
      return;
    }

    const itemsToAdd = selectedItems.map(item => ({
      itemId: item.type === 'material' ? item.id : undefined,
      serviceTypeId: item.type === 'service' ? item.id : undefined,
      itemType: item.type,
      itemName: item.name,
      itemCode: item.code,
      plannedQuantity: item.plannedQuantity || 1,
      unitOfMeasure: item.measurementUnit || 'UN',
      unitPrice: item.unitPrice || 0,
      priceListId: item.priceListId
    }));

    addPlannedItemMutation.mutate(itemsToAdd);
  };

  const handleRegisterConsumption = () => {
    const consumptions = Object.entries(consumptionData)
      .filter(([_, data]) => data.quantity > 0)
      .map(([materialId, data]) => ({
        ticketMaterialId: materialId,
        consumedQuantity: data.quantity,
        consumptionNotes: data.notes
      }));

    if (consumptions.length === 0) {
      toast({
        title: "Atenção",
        description: "Registre pelo menos um consumo",
        variant: "destructive",
      });
      return;
    }

    registerConsumptionMutation.mutate(consumptions);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-red-600";
    if (variance < 0) return "text-green-600";
    return "text-gray-600";
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Materiais e Serviços - {ticketNumber}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="planned">Planejado</TabsTrigger>
            <TabsTrigger value="consumption">Consumo</TabsTrigger>
            <TabsTrigger value="add-items">Adicionar Itens</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Custo Planejado */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custo Planejado</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totals.plannedCost || 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Materiais: {formatCurrency(costSummary.totalPlannedMaterialsCost || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Serviços: {formatCurrency(costSummary.totalPlannedServicesCost || 0)}
                  </div>
                </CardContent>
              </Card>

              {/* Custo Real */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custo Real</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totals.consumedCost || 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Materiais: {formatCurrency(costSummary.totalConsumedMaterialsCost || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Serviços: {formatCurrency(costSummary.totalConsumedServicesCost || 0)}
                  </div>
                </CardContent>
              </Card>

              {/* Variação */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Variação</CardTitle>
                  {getVarianceIcon(totals.variance || 0)}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getVarianceColor(totals.variance || 0)}`}>
                    {formatCurrency(Math.abs(totals.variance || 0))}
                  </div>
                  <div className={`text-xs ${getVarianceColor(totals.variance || 0)}`}>
                    {totals.variancePercentage ? `${totals.variancePercentage > 0 ? '+' : ''}${totals.variancePercentage.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(totals.variance || 0) > 0 ? 'Acima do planejado' : 
                     (totals.variance || 0) < 0 ? 'Abaixo do planejado' : 
                     'Conforme planejado'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso do Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Itens com consumo registrado</span>
                    <span>{costSummary.itemsWithConsumption || 0} de {costSummary.totalItems || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${costSummary.totalItems > 0 ? ((costSummary.itemsWithConsumption || 0) / costSummary.totalItems) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-center">
                    {costSummary.isFullyConsumed ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Atendimento Completo
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Consumo Pendente
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planned Items Tab */}
          <TabsContent value="planned" className="space-y-4">
            <div className="space-y-4">
              {materials.filter(m => m.recordType === 'planned').map((material) => (
                <Card key={material.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {material.itemType === 'material' ? (
                          <Package className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Wrench className="h-5 w-5 text-green-600" />
                        )}
                        <div>
                          <div className="font-medium">{material.itemName}</div>
                          {material.itemCode && (
                            <div className="text-sm text-gray-500">Código: {material.itemCode}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {material.plannedQuantity} {material.unitOfMeasure}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(material.unitPrice)} / {material.unitOfMeasure}
                        </div>
                        <div className="font-bold text-blue-600">
                          {formatCurrency(material.totalPlannedCost)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Consumption Tab */}
          <TabsContent value="consumption" className="space-y-4">
            <div className="space-y-4">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3">
                        {material.itemType === 'material' ? (
                          <Package className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Wrench className="h-5 w-5 text-green-600" />
                        )}
                        <div>
                          <div className="font-medium">{material.itemName}</div>
                          <div className="text-sm text-gray-500">
                            Planejado: {material.plannedQuantity} {material.unitOfMeasure}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Quantidade Consumida</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={consumptionData[material.id]?.quantity || material.consumedQuantity || ''}
                          onChange={(e) => setConsumptionData(prev => ({
                            ...prev,
                            [material.id]: {
                              ...prev[material.id],
                              quantity: parseFloat(e.target.value) || 0
                            }
                          }))}
                        />
                        <Input
                          placeholder="Observações sobre o consumo..."
                          value={consumptionData[material.id]?.notes || material.consumptionNotes || ''}
                          onChange={(e) => setConsumptionData(prev => ({
                            ...prev,
                            [material.id]: {
                              ...prev[material.id],
                              notes: e.target.value
                            }
                          }))}
                        />
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Custo Unit.</div>
                        <div className="font-medium">{formatCurrency(material.unitPrice)}</div>
                        <div className="text-sm text-gray-500 mt-2">Custo Total</div>
                        <div className="font-bold text-green-600">
                          {formatCurrency(
                            (consumptionData[material.id]?.quantity || material.consumedQuantity || 0) * material.unitPrice
                          )}
                        </div>
                        {material.isApproved && (
                          <Badge variant="default" className="mt-2 bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleRegisterConsumption}
                disabled={registerConsumptionMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {registerConsumptionMutation.isPending ? "Salvando..." : "Registrar Consumo"}
              </Button>
            </div>
          </TabsContent>

          {/* Add Items Tab */}
          <TabsContent value="add-items" className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar materiais e serviços..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddItems}
                disabled={selectedItems.length === 0 || addPlannedItemMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar ({selectedItems.length})
              </Button>
            </div>

            {/* Available Materials */}
            {availableItems?.data?.materials?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Materiais Disponíveis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableItems.data.materials.map((item: any) => (
                    <Card 
                      key={item.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedItems.find(si => si.id === item.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        const isSelected = selectedItems.find(si => si.id === item.id);
                        if (isSelected) {
                          setSelectedItems(prev => prev.filter(si => si.id !== item.id));
                        } else {
                          setSelectedItems(prev => [...prev, { ...item, plannedQuantity: 1 }]);
                        }
                      }}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.code && (
                              <div className="text-sm text-gray-500">Código: {item.code}</div>
                            )}
                            {item.groupName && (
                              <Badge variant="outline" className="mt-1">{item.groupName}</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {item.unitPrice ? formatCurrency(item.unitPrice) : 'Sem preço'}
                            </div>
                            <div className="text-sm text-gray-500">/{item.measurementUnit}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Services */}
            {availableItems?.data?.services?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-green-600" />
                  Serviços Disponíveis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableItems.data.services.map((item: any) => (
                    <Card 
                      key={item.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedItems.find(si => si.id === item.id) ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        const isSelected = selectedItems.find(si => si.id === item.id);
                        if (isSelected) {
                          setSelectedItems(prev => prev.filter(si => si.id !== item.id));
                        } else {
                          setSelectedItems(prev => [...prev, { ...item, plannedQuantity: 1 }]);
                        }
                      }}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.code && (
                              <div className="text-sm text-gray-500">Código: {item.code}</div>
                            )}
                            {item.complexity && (
                              <Badge variant="outline" className="mt-1">{item.complexity}</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {item.unitPrice ? formatCurrency(item.unitPrice) : 'Sem preço'}
                            </div>
                            <div className="text-sm text-gray-500">/hora</div>
                            {item.estimatedDuration && (
                              <div className="text-xs text-gray-400">
                                ~{Math.round(item.estimatedDuration / 60)}h
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
