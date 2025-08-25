import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import {
  Plus, Search, Edit, Eye, Copy, Trash2, TrendingUp, DollarSign, Settings, BarChart3,
  FileText, Clock, CheckCircle, Calculator, X, Save, RotateCcw, Check, AlertCircle,
  History, Upload, Download, Users, Target, Percent, Hash, Calendar, Building,
  Package, ShoppingCart, CreditCard, Zap, Activity, ArrowUp, ArrowDown
} from "lucide-react";
import PricingRuleConfigurationModal from "@/components/lpu/PricingRuleConfigurationModal";
import PriceSimulatorModal from "@/components/lpu/PriceSimulatorModal";
import MarginConfigurationPanel from "@/components/lpu/MarginConfigurationPanel";

interface PriceList {
  id: string;
  name: string;
  code: string;
  version: string;
  customerId?: string;
  contractId?: string;
  costCenterId?: string;
  validFrom: string;
  validTo?: string;
  isActive: boolean;
  currency: string;
  automaticMargin?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customerCompanyId?: string;
}

interface PriceListItem {
  id: string;
  priceListId: string;
  itemId?: string;
  serviceTypeId?: string;
  unitPrice: number;
  specialPrice?: number;
  hourlyRate?: number;
  travelCost?: number;
  isActive: boolean;
  itemName?: string;
  measurementUnit?: string;
}

interface PricingRule {
  id: string;
  name: string;
  description?: string;
  ruleType: string;
  conditions: any;
  actions: any;
  priority: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface LPUStats {
  totalLists: number;
  activeLists: number;
  draftLists: number;
  pendingApproval: number;
  approvedVersions: number;
  activeRules: number;
  approvalRate: number;
}

export default function LPU() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [selectedPricingRule, setSelectedPricingRule] = useState<PricingRule | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateRuleDialogOpen, setIsCreateRuleDialogOpen] = useState(false);
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteRuleDialogOpen, setIsDeleteRuleDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isAdvancedRuleDialogOpen, setIsAdvancedRuleDialogOpen] = useState(false);
  const [isPriceSimulatorOpen, setIsPriceSimulatorOpen] = useState(false);
  const [isMarginConfigOpen, setIsMarginConfigOpen] = useState(false);

  // Other states
  const [selectedPriceListForRules, setSelectedPriceListForRules] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'list' | 'rule', id: string } | null>(null);

  // Fetch LPU stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<LPUStats>({
    queryKey: ['/api/materials-services/price-lists/stats'],
    retry: 3,
    staleTime: 30000,
  });

  // Fetch price lists
  const { data: priceListsResponse, isLoading: priceListsLoading, error: priceListsError } = useQuery({
    queryKey: ['/api/materials-services/price-lists'],
    retry: 3,
    staleTime: 30000,
  });

  const priceLists = Array.isArray(priceListsResponse) ? priceListsResponse : 
    (priceListsResponse?.data && Array.isArray(priceListsResponse.data) ? priceListsResponse.data : []);

  // Fetch pricing rules
  const { data: pricingRulesResponse, isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['/api/materials-services/pricing-rules'],
    retry: 3,
    staleTime: 30000,
  });

  const pricingRules = Array.isArray(pricingRulesResponse) ? pricingRulesResponse : [];

  // Fetch price list items when viewing details
  const { data: priceListItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/materials-services/price-lists', selectedPriceList?.id, 'items'],
    queryFn: async () => {
      if (!selectedPriceList) return [];
      const response = await apiRequest('GET', `/api/materials-services/price-lists/${selectedPriceList.id}/items`);
      return response.json();
    },
    enabled: !!selectedPriceList,
    retry: 3,
  });

  // Create price list mutation
  const createPriceListMutation = useMutation({
    mutationFn: async (data: Partial<PriceList>) => {
      const processedData = {
        ...data,
        validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : new Date().toISOString(),
        validTo: data.validTo ? new Date(data.validTo).toISOString() : undefined
      };
      const response = await apiRequest('POST', '/api/materials-services/price-lists', processedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists/stats'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Lista de preços criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar lista de preços",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Update price list mutation
  const updatePriceListMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<PriceList> }) => {
      const response = await apiRequest('PUT', `/api/materials-services/price-lists/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      setIsEditDialogOpen(false);
      setSelectedPriceList(null);
      toast({ title: "Lista de preços atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar lista de preços",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Delete price list mutation
  const deletePriceListMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/materials-services/price-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists/stats'] });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      toast({ title: "Lista de preços excluída com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir lista de preços",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Duplicate price list mutation
  const duplicatePriceListMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/materials-services/price-lists/${id}/duplicate`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      toast({ title: "Lista de preços duplicada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao duplicar lista de preços",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Create pricing rule mutation
  const createPricingRuleMutation = useMutation({
    mutationFn: async (data: Partial<PricingRule>) => {
      const response = await apiRequest('POST', '/api/materials-services/pricing-rules', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists/stats'] });
      setIsCreateRuleDialogOpen(false);
      toast({ title: "Regra de precificação criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar regra de precificação",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Update pricing rule mutation
  const updatePricingRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<PricingRule> }) => {
      const response = await apiRequest('PUT', `/api/materials-services/pricing-rules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/pricing-rules'] });
      setIsEditRuleDialogOpen(false);
      setSelectedPricingRule(null);
      toast({ title: "Regra de precificação atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar regra de precificação",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Delete pricing rule mutation
  const deletePricingRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/materials-services/pricing-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/pricing-rules'] });
      setIsDeleteRuleDialogOpen(false);
      setItemToDelete(null);
      toast({ title: "Regra de precificação excluída com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir regra de precificação",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Apply rules mutation
  const applyRulesMutation = useMutation({
    mutationFn: async (priceListId: string) => {
      const response = await apiRequest('POST', `/api/materials-services/price-lists/${priceListId}/apply-rules`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      toast({
        title: "Regras aplicadas com sucesso!",
        description: `${data.affectedItems || 0} itens atualizados`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aplicar regras",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const handleEditPriceList = (list: PriceList) => {
    setSelectedPriceList(list);
    setIsEditDialogOpen(true);
  };

  const handleDeletePriceList = (id: string) => {
    setItemToDelete({ type: 'list', id });
    setIsDeleteDialogOpen(true);
  };

  const handleEditPricingRule = (rule: PricingRule) => {
    setSelectedPricingRule(rule);
    setIsEditRuleDialogOpen(true);
  };

  const handleDeletePricingRule = (id: string) => {
    setItemToDelete({ type: 'rule', id });
    setIsDeleteRuleDialogOpen(true);
  };

  const handleViewItems = (list: PriceList) => {
    setSelectedPriceList(list);
    setIsItemsDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'list') {
        deletePriceListMutation.mutate(itemToDelete.id);
      } else {
        deletePricingRuleMutation.mutate(itemToDelete.id);
      }
    }
  };

  // Safe filtering
  const filteredPriceLists = priceLists.filter((list: PriceList) => {
    try {
      return list?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             list?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      return false;
    }
  });

  const filteredPricingRules = pricingRules.filter((rule: PricingRule) => {
    try {
      return rule?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             rule?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      return false;
    }
  });

  // Error display component
  const ErrorDisplay = ({ error, title }: { error: any, title: string }) => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <h3 className="text-red-800 font-medium">{title}</h3>
        <p className="text-red-600 text-sm mt-1">
          {error?.message || 'Erro desconhecido'}
        </p>
      </CardContent>
    </Card>
  );

  // Improved loading state
  if (priceListsLoading || statsLoading || rulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">Carregando Sistema LPU</p>
            <p className="text-sm text-gray-600">Preparando listas de preços e regras...</p>
          </div>
        </div>
      </div>
    );
  }

  // Improved error state
  if (priceListsError || statsError || rulesError) {
    const errorMessage = (priceListsError as any)?.message || (statsError as any)?.message || (rulesError as any)?.message;
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-4xl">⚠️</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Erro no Sistema LPU</h3>
            <p className="text-sm text-gray-600">
              {errorMessage || 'Erro interno do servidor'}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Recarregar Página
            </Button>
            <Button onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
              queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists/stats'] });
              queryClient.invalidateQueries({ queryKey: ['/api/materials-services/pricing-rules'] });
            }}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pl-[9px] pr-[9px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LPU - Lista de Preços Unitários</h1>
          <p className="text-muted-foreground">Sistema completo de gestão de listas de preços e regras de precificação</p>
        </div>
      </div>

      {/* Error States - Removed as the main error handling is done above */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="price-lists">Listas de Preços</TabsTrigger>
          <TabsTrigger value="pricing-rules">Regras de Precificação</TabsTrigger>
          <TabsTrigger value="associations">Associações</TabsTrigger>
          <TabsTrigger value="advanced-config">Configurações Avançadas</TabsTrigger>
          <TabsTrigger value="versions">Versões</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Listas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalLists || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeLists || 0} listas ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pricingRules.filter(r => r.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pricingRules.length} regras totais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {`${stats?.approvalRate || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.approvedVersions || 0} aprovadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente Aprovação</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.pendingApproval || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  aguardando análise
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Operações comuns do sistema LPU</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="h-20 flex-col hover:scale-105 transition-transform"
                >
                  <Plus className="h-6 w-6 mb-2" />
                  Nova Lista de Preços
                </Button>
                <Button
                  onClick={() => setIsAdvancedRuleDialogOpen(true)}
                  variant="outline"
                  className="h-20 flex-col hover:scale-105 transition-transform"
                >
                  <Settings className="h-6 w-6 mb-2" />
                  Configurar Regras Avançadas
                </Button>
                <Button
                  onClick={() => setIsPriceSimulatorOpen(true)}
                  variant="outline"
                  className="h-20 flex-col hover:scale-105 transition-transform"
                >
                  <Calculator className="h-6 w-6 mb-2" />
                  Simulador de Preços
                </Button>
                <Button
                  onClick={() => setIsMarginConfigOpen(true)}
                  variant="outline"
                  className="h-20 flex-col hover:scale-105 transition-transform"
                >
                  <Percent className="h-6 w-6 mb-2" />
                  Configurar Margens
                </Button>
                <Button
                  onClick={() => setActiveTab("associations")}
                  variant="outline"
                  className="h-20 flex-col hover:scale-105 transition-transform"
                >
                  <Target className="h-6 w-6 mb-2" />
                  Gerenciar Associações
                </Button>
                <Button
                  onClick={() => setIsApprovalDialogOpen(true)}
                  variant="outline"
                  className="h-20 flex-col hover:scale-105 transition-transform"
                >
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Central de Aprovações
                </Button>

                <Button
                  onClick={() => setActiveTab("analytics")}
                  variant="outline"
                  className="h-20 flex-col hover:scale-105 transition-transform"
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Análises Avançadas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price-lists" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar listas de preços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Lista de Preços
            </Button>
          </div>

          <div className="grid gap-4">
            {priceListsLoading ? (
              <div className="text-center py-8">Carregando listas...</div>
            ) : filteredPriceLists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {priceLists.length === 0 ? "Nenhuma lista encontrada" : "Nenhum resultado para a busca"}
              </div>
            ) : (
              filteredPriceLists.map((list: PriceList) => (
                <Card key={list.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex-1">
                      <CardTitle className="text-base">{list.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Código: {list.code} • Versão: {list.version} • {list.currency}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Válida de {new Date(list.validFrom).toLocaleDateString()}
                        {list.validTo && ` até ${new Date(list.validTo).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={list.isActive ? "default" : "secondary"}
                        className={list.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}
                      >
                        {list.isActive ? "Ativa" : "Inativa"}
                      </Badge>

                      <Button variant="outline" size="sm" onClick={() => handleViewItems(list)}>
                        <Package className="mr-1 h-3 w-3" />
                        Itens
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => handleEditPriceList(list)}>
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => duplicatePriceListMutation.mutate(list.id)}>
                        <Copy className="mr-1 h-3 w-3" />
                        Duplicar
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyRulesMutation.mutate(list.id)}
                        disabled={applyRulesMutation.isPending}
                      >
                        {applyRulesMutation.isPending ? (
                          "Aplicando..."
                        ) : (
                          <>
                            <Calculator className="mr-1 h-3 w-3" />
                            Aplicar Regras
                          </>
                        )}
                      </Button>

                      {!list.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => {
                            updatePriceListMutation.mutate({
                              id: list.id,
                              data: { isActive: true }
                            });
                            toast({ title: "Lista aprovada e ativada!" });
                          }}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Aprovar
                        </Button>
                      )}

                      <Button variant="destructive" size="sm" onClick={() => handleDeletePriceList(list.id)}>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </CardHeader>
                  {list.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{list.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pricing-rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar regras de precificação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreateRuleDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </div>

          <div className="grid gap-4">
            {rulesLoading ? (
              <div className="text-center py-8">Carregando regras...</div>
            ) : filteredPricingRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {pricingRules.length === 0 ? "Nenhuma regra configurada" : "Nenhum resultado para a busca"}
              </div>
            ) : (
              filteredPricingRules.map((rule: PricingRule) => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex-1">
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="capitalize">{rule.ruleType}</Badge>
                        <Badge variant="secondary">Prioridade: {rule.priority}</Badge>
                        <Badge
                          variant={rule.isActive ? "default" : "secondary"}
                          className={rule.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}
                        >
                          {rule.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditPricingRule(rule)}>
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeletePricingRule(rule.id)}>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="associations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Associação de Regras</h2>
              <p className="text-gray-600">Associe regras de precificação às listas de preços</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Preços */}
            <Card>
              <CardHeader>
                <CardTitle>Listas de Preços</CardTitle>
                <CardDescription>Selecione uma lista para gerenciar suas regras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {priceLists.map((list) => (
                    <div
                      key={list.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPriceListForRules === list.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPriceListForRules(list.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{list.name}</h4>
                          <p className="text-sm text-gray-500">{list.code}</p>
                        </div>
                        <Badge variant={list.isActive ? "default" : "secondary"}>
                          {list.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regras Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Regras de Precificação</CardTitle>
                <CardDescription>Regras disponíveis para associação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pricingRules.map((rule) => (
                    <div key={rule.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-500">{rule.ruleType} • Prioridade: {rule.priority}</p>
                        </div>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Aplicação de Regras */}
          {selectedPriceListForRules && (
            <Card>
              <CardHeader>
                <CardTitle>Aplicar Regras à Lista Selecionada</CardTitle>
                <CardDescription>
                  Aplique as regras ativas aos itens da lista de preços selecionada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Lista selecionada: <strong>{priceLists.find(l => l.id === selectedPriceListForRules)?.name}</strong>
                  </div>
                  <Button
                    onClick={() => applyRulesMutation.mutate(selectedPriceListForRules)}
                    disabled={applyRulesMutation.isPending}
                    className="w-full"
                  >
                    {applyRulesMutation.isPending ? "Aplicando..." : "Aplicar Todas as Regras Ativas"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advanced-config" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Configurações Avançadas</h2>
              <p className="text-muted-foreground">Configurações detalhadas de margens, fatores sazonais e simulações</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setIsPriceSimulatorOpen(true)} variant="outline">
                <Calculator className="mr-2 h-4 w-4" />
                Simulador
              </Button>
              <Button onClick={() => setIsAdvancedRuleDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Regra Avançada
              </Button>
            </div>
          </div>

          {selectedPriceList ? (
            <MarginConfigurationPanel
              priceListId={selectedPriceList.id}
              onSave={(margins) => {
                console.log('Saving margin configuration:', margins);
                toast({ title: "Configurações de margem salvas com sucesso!" });
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Selecione uma lista de preços para configurar margens avançadas
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab("price-lists")}
                >
                  Ir para Listas de Preços
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Controle de Versões</h2>
              <p className="text-muted-foreground">Gerenciar versões e histórico de listas de preços</p>
            </div>
            <Button onClick={() => setIsVersionDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Versão
            </Button>
          </div>

          <div className="grid gap-4">
            {priceLists.map((list: PriceList) => (
              <Card key={list.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Versão Atual: {list.version} • Criada em {new Date(list.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">v{list.version}</Badge>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedPriceList(list);
                        setIsVersionDialogOpen(true);
                      }}>
                        <History className="mr-1 h-3 w-3" />
                        Histórico
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Última modificação:</span>
                      <span>{new Date(list.updatedAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={list.isActive ? "default" : "secondary"}>
                        {list.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>

                    <div className="border-t pt-3">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">1</div>
                          <div className="text-xs text-muted-foreground">Versões</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{priceListItems.length}</div>
                          <div className="text-xs text-muted-foreground">Itens</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">0</div>
                          <div className="text-xs text-muted-foreground">Alterações</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                        const newVersion = (parseFloat(list.version) + 0.1).toFixed(1);
                        duplicatePriceListMutation.mutate(list.id);
                        toast({ title: `Nova versão ${newVersion} criada!` });
                      }}>
                        <Copy className="mr-1 h-3 w-3" />
                        Criar Nova Versão
                      </Button>

                      <Button variant="outline" size="sm" disabled>
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Rollback
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {priceLists.length === 0 && (
            <div className="text-center py-12">
              <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhuma lista de preços encontrada</h3>
              <p className="text-muted-foreground mb-4">Crie sua primeira lista para começar o controle de versões</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Lista
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Análises e Relatórios</h2>
              <p className="text-muted-foreground">Insights detalhados sobre precificação e performance</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Dados
              </Button>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Margem Média</p>
                    <p className="text-2xl font-bold text-green-600">18.5%</p>
                  </div>
                  <Percent className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600">+2.3%</span>
                  <span className="text-muted-foreground ml-1">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Regras Aplicadas</p>
                    <p className="text-2xl font-bold text-blue-600">{pricingRules.filter(r => r.isActive).length}</p>
                  </div>
                  <Calculator className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-blue-600">{Math.round((pricingRules.filter(r => r.isActive).length / pricingRules.length) * 100)}%</span>
                  <span className="text-muted-foreground ml-1">das regras estão ativas</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Itens com Preços</p>
                    <p className="text-2xl font-bold text-purple-600">{priceListItems.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-purple-600">100%</span>
                  <span className="text-muted-foreground ml-1">cobertura de preços</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Médio</p>
                    <p className="text-2xl font-bold text-orange-600">R$ 125,50</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUp className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-orange-600">+5.2%</span>
                  <span className="text-muted-foreground ml-1">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos e Análises */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance das Listas</CardTitle>
                <CardDescription>Comparativo de utilização e eficiência</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceLists.slice(0, 5).map((list: PriceList, index) => (
                    <div key={list.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        <div>
                          <p className="font-medium text-sm">{list.name}</p>
                          <p className="text-xs text-muted-foreground">v{list.version}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{Math.floor(Math.random() * 100) + 50}%</p>
                        <p className="text-sm text-muted-foreground">utilização</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendências de Preços</CardTitle>
                <CardDescription>Evolução dos preços ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-green-600">+12%</div>
                      <div className="text-xs text-muted-foreground">Últimos 30 dias</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-blue-600">+8%</div>
                      <div className="text-xs text-muted-foreground">Últimos 90 dias</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-purple-600">+15%</div>
                      <div className="text-xs text-muted-foreground">Último ano</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Materiais</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Serviços</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className="text-sm font-medium">60%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mão de Obra</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Relatórios Personalizados */}
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Personalizados</CardTitle>
              <CardDescription>Gere relatórios específicos para suas necessidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Relatório de Margens
                </Button>

                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Análise de Tendências
                </Button>

                <Button variant="outline" className="h-20 flex-col">
                  <Target className="h-6 w-6 mb-2" />
                  Performance por Cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Price List Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Lista de Preços</DialogTitle>
            <DialogDescription>
              Configure uma nova lista de preços com parâmetros específicos
            </DialogDescription>
          </DialogHeader>
          <PriceListForm
            onSubmit={(data) => createPriceListMutation.mutate(data)}
            isLoading={createPriceListMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Price List Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Lista de Preços</DialogTitle>
            <DialogDescription>
              Modifique as configurações da lista de preços
            </DialogDescription>
          </DialogHeader>
          {selectedPriceList && (
            <PriceListForm
              initialData={selectedPriceList}
              onSubmit={(data) => updatePriceListMutation.mutate({ id: selectedPriceList.id, data })}
              isLoading={updatePriceListMutation.isPending}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedPriceList(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Pricing Rule Dialog */}
      <Dialog open={isCreateRuleDialogOpen} onOpenChange={setIsCreateRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Regra de Precificação</DialogTitle>
            <DialogDescription>
              Configure uma nova regra para cálculo automático de preços
            </DialogDescription>
          </DialogHeader>
          <PricingRuleForm
            onSubmit={(data) => createPricingRuleMutation.mutate(data)}
            isLoading={createPricingRuleMutation.isPending}
            onCancel={() => setIsCreateRuleDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Pricing Rule Dialog */}
      <Dialog open={isEditRuleDialogOpen} onOpenChange={setIsEditRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Regra de Precificação</DialogTitle>
            <DialogDescription>
              Modifique as configurações da regra de precificação
            </DialogDescription>
          </DialogHeader>
          {selectedPricingRule && (
            <PricingRuleForm
              initialData={selectedPricingRule}
              onSubmit={(data) => updatePricingRuleMutation.mutate({ id: selectedPricingRule.id, data })}
              isLoading={updatePricingRuleMutation.isPending}
              onCancel={() => {
                setIsEditRuleDialogOpen(false);
                setSelectedPricingRule(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Items Dialog */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Itens da Lista: {selectedPriceList?.name}</DialogTitle>
            <DialogDescription>
              Visualizar e gerenciar itens da lista de preços
            </DialogDescription>
          </DialogHeader>
          <PriceListItemsView
            priceList={selectedPriceList}
            items={priceListItems}
            isLoading={itemsLoading}
            onClose={() => {
              setIsItemsDialogOpen(false);
              setSelectedPriceList(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Approval Workflow Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Workflow de Aprovação</DialogTitle>
            <DialogDescription>
              Gerencie aprovações para listas de preços e alterações
            </DialogDescription>
          </DialogHeader>
          <ApprovalWorkflowComponent
            priceLists={priceLists}
            onClose={() => setIsApprovalDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPriceList ? `Histórico de Versões - ${selectedPriceList.name}` : 'Criar Nova Versão'}
            </DialogTitle>
            <DialogDescription>
              Visualize o histórico de alterações e gerencie versões
            </DialogDescription>
          </DialogHeader>
          <VersionHistoryComponent
            priceList={selectedPriceList}
            onClose={() => {
              setIsVersionDialogOpen(false);
              setSelectedPriceList(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este {itemToDelete?.type === 'list' ? 'lista de preços' : 'regra de precificação'}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Advanced Pricing Rule Configuration Modal */}
      <PricingRuleConfigurationModal
        open={isAdvancedRuleDialogOpen}
        onOpenChange={setIsAdvancedRuleDialogOpen}
        rule={selectedPricingRule}
        onSave={(rule) => {
          if (selectedPricingRule) {
            updatePricingRuleMutation.mutate({ id: selectedPricingRule.id, data: rule });
          } else {
            createPricingRuleMutation.mutate(rule);
          }
          setIsAdvancedRuleDialogOpen(false);
          setSelectedPricingRule(null);
        }}
      />

      {/* Price Simulator Modal */}
      <PriceSimulatorModal
        open={isPriceSimulatorOpen}
        onOpenChange={setIsPriceSimulatorOpen}
        priceLists={priceLists}
        pricingRules={pricingRules}
      />
    </div>
  );
}

// Price List Form Component
function PriceListForm({
  initialData,
  onSubmit,
  isLoading,
  onCancel
}: {
  initialData?: PriceList;
  onSubmit: (data: Partial<PriceList>) => void;
  isLoading: boolean;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    version: initialData?.version || '1.0',
    currency: initialData?.currency || 'BRL',
    validFrom: initialData?.validFrom ? new Date(initialData.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validTo: initialData?.validTo ? new Date(initialData.validTo).toISOString().split('T')[0] : '',
    isActive: initialData?.isActive ?? true,
    notes: initialData?.notes || '',
    customerCompanyId: initialData?.customerCompanyId || undefined as string | undefined,
    automaticMargin: initialData?.automaticMargin || undefined as number | undefined
  });

  // Fetch customer companies
  const { data: customerCompaniesResponse, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/companies'],
    retry: 3,
    staleTime: 30000,
  });

  const customerCompanies = Array.isArray(customerCompaniesResponse) ? customerCompaniesResponse : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (!formData.name.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Nome da lista é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (formData.validTo && new Date(formData.validTo) <= new Date(formData.validFrom)) {
      toast({
        title: "Erro de Validação",
        description: "Data de término deve ser posterior à data de início",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...formData,
      customerCompanyId: formData.customerCompanyId === 'none' ? undefined : formData.customerCompanyId,
      validTo: formData.validTo || undefined
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome da Lista</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="Digite o nome da lista de preços"
          />
        </div>
        <div>
          <Label htmlFor="version">Versão</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">Válida a partir de</Label>
          <Input
            id="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="validTo">Válida até (opcional)</Label>
          <Input
            id="validTo"
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Moeda</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a moeda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
              <SelectItem value="USD">USD - Dólar Americano</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="automaticMargin">Margem Automática (%)</Label>
          <Input
            id="automaticMargin"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.automaticMargin || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, automaticMargin: e.target.value ? parseFloat(e.target.value) : undefined }))}
            placeholder="Ex: 10.5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="customerCompanyId">Empresa</Label>
        <Select
          value={formData.customerCompanyId || 'none'}
          onValueChange={(value) => setFormData(prev => ({ ...prev, customerCompanyId: value === 'none' ? undefined : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={companiesLoading ? "Carregando empresas..." : "Selecione uma empresa"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma empresa específica</SelectItem>
            {companiesLoading ? (
              <SelectItem value="loading" disabled>Carregando empresas...</SelectItem>
            ) : customerCompanies.length === 0 ? (
              <SelectItem value="no-companies" disabled>Nenhuma empresa encontrada</SelectItem>
            ) : (
              customerCompanies.map((company: any) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name || company.display_name || company.displayName || 'Empresa sem nome'}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="Observações sobre a lista de preços..."
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          <Label htmlFor="isActive">Lista Ativa</Label>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (initialData ? "Atualizando..." : "Criando...") : (initialData ? "Atualizar Lista" : "Criar Lista")}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Pricing Rule Form Component
function PricingRuleForm({
  initialData,
  onSubmit,
  isLoading,
  onCancel
}: {
  initialData?: PricingRule;
  onSubmit: (data: Partial<PricingRule>) => void;
  isLoading: boolean;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    ruleType: initialData?.ruleType || 'percentual',
    priority: initialData?.priority || 1,
    isActive: initialData?.isActive ?? true,
    conditions: initialData?.conditions || {},
    actions: initialData?.actions || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome da Regra</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="Nome da regra de precificação"
          />
        </div>
        <div>
          <Label htmlFor="ruleType">Tipo de Regra</Label>
          <Select value={formData.ruleType} onValueChange={(value) => setFormData(prev => ({ ...prev, ruleType: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentual">Percentual</SelectItem>
              <SelectItem value="fixo">Valor Fixo</SelectItem>
              <SelectItem value="escalonado">Escalonada</SelectItem>
              <SelectItem value="dinamico">Dinâmica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          placeholder="Descrição detalhada da regra..."
        />
      </div>

      <div>
        <Label htmlFor="priority">Prioridade (1-10)</Label>
        <Input
          id="priority"
          type="number"
          min="1"
          max="10"
          value={formData.priority}
          onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          <Label htmlFor="isActive">Regra Ativa</Label>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (initialData ? "Atualizando..." : "Criando...") : (initialData ? "Atualizar Regra" : "Criar Regra")}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Price List Items View Component
function PriceListItemsView({
  priceList,
  items,
  isLoading,
  onClose
}: {
  priceList: PriceList | null;
  items: PriceListItem[];
  isLoading: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PriceListItem | null>(null);

  // Fetch available items from catalog
  const { data: catalogItemsResponse, isLoading: catalogLoading } = useQuery({
    queryKey: ['/api/materials-services/items'],
    retry: 3,
    staleTime: 30000,
  });

  // Ensure catalog items is always an array, handling both direct array and object with data property
  const catalogItems = Array.isArray(catalogItemsResponse) ? catalogItemsResponse : 
    (catalogItemsResponse?.data && Array.isArray(catalogItemsResponse.data) ? catalogItemsResponse.data : []);

  // Add item to price list mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: Partial<PriceListItem>) => {
      const response = await apiRequest('POST', `/api/materials-services/price-lists/${priceList?.id}/items`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists', priceList?.id, 'items'] });
      setIsAddItemDialogOpen(false);
      toast({ title: "Item adicionado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar item",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<PriceListItem> }) => {
      const response = await apiRequest('PUT', `/api/materials-services/price-lists/items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists', priceList?.id, 'items'] });
      setEditingItem(null);
      toast({ title: "Item atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar item",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/materials-services/price-lists/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists', priceList?.id, 'items'] });
      setItemToDelete(null);
      toast({ title: "Item removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover item",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  if (!priceList) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{priceList.name}</h3>
          <p className="text-sm text-muted-foreground">
            {items.length} itens • Versão {priceList.version} • {priceList.currency}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Fechar
          </Button>
        </div>
      </div>

      {isLoading || catalogLoading ? (
        <div className="text-center py-8">Carregando itens...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4" />
          <p>Nenhum item encontrado nesta lista</p>
          <p className="text-sm mt-2">Adicione itens para começar a usar a lista de preços</p>
          <Button className="mt-4" onClick={() => setIsAddItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Primeiro Item
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Preço Unitário</TableHead>
                <TableHead>Preço Especial</TableHead>
                <TableHead>Taxa Horária</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.itemName || `Item ${item.itemId}`}</p>
                      {item.itemId && (
                        <p className="text-sm text-muted-foreground">ID: {item.itemId}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.measurementUnit || '-'}</TableCell>
                  <TableCell>{priceList.currency} {Number(item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell>
                    {item.specialPrice ? `${priceList.currency} ${Number(item.specialPrice).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    {item.hourlyRate ? `${priceList.currency} ${Number(item.hourlyRate).toFixed(2)}/h` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.isActive ? "default" : "secondary"}
                      className={item.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}
                    >
                      {item.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setItemToDelete(item)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item à Lista</DialogTitle>
            <DialogDescription>
              Selecione um item do catálogo e defina os preços
            </DialogDescription>
          </DialogHeader>
          <PriceListItemForm
            catalogItems={catalogItems}
            currency={priceList.currency}
            onSubmit={(data) => addItemMutation.mutate(data)}
            isLoading={addItemMutation.isPending}
            onCancel={() => setIsAddItemDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item da Lista</DialogTitle>
            <DialogDescription>
              Modifique os preços e configurações do item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <PriceListItemForm
              initialData={editingItem}
              catalogItems={catalogItems}
              currency={priceList.currency}
              onSubmit={(data) => updateItemMutation.mutate({ id: editingItem.id, data })}
              isLoading={updateItemMutation.isPending}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este item da lista de preços? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Approval Workflow Component
function ApprovalWorkflowComponent({
  priceLists,
  onClose
}: {
  priceLists: PriceList[];
  onClose: () => void;
}) {
  const [selectedForApproval, setSelectedForApproval] = useState<string[]>([]);
  const [approvalNotes, setApprovalNotes] = useState('');
  const { toast } = useToast();

  const pendingApprovals = priceLists.filter(list => !list.isActive);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium">Itens Pendentes de Aprovação</h3>
          <p className="text-sm text-muted-foreground">{pendingApprovals.length} itens aguardando aprovação</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Nenhum item pendente de aprovação</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {pendingApprovals.map((list) => (
                <div key={list.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedForApproval.includes(list.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedForApproval([...selectedForApproval, list.id]);
                      } else {
                        setSelectedForApproval(selectedForApproval.filter(id => id !== list.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{list.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Versão {list.version} • Criada em {new Date(list.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">Pendente</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedForApproval.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="approvalNotes">Observações da Aprovação</Label>
            <Textarea
              id="approvalNotes"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
              placeholder="Adicione observações sobre a aprovação..."
            />
          </div>

          <div className="flex space-x-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => {
                // Simulate approval action here
                toast({ title: `${selectedForApproval.length} item(s) aprovado(s) com sucesso!` });
                setSelectedForApproval([]);
                setApprovalNotes('');
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Aprovar Selecionados ({selectedForApproval.length})
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                toast({
                  title: `${selectedForApproval.length} item(s) rejeitado(s)`,
                  variant: "destructive"
                });
                setSelectedForApproval([]);
                setApprovalNotes('');
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}

// Version History Component
function VersionHistoryComponent({
  priceList,
  onClose
}: {
  priceList: PriceList | null;
  onClose: () => void;
}) {
  if (!priceList) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Selecione uma lista de preços para ver o histórico</p>
        <Button className="mt-4" onClick={onClose}> Fechar</Button>
      </div>
    );
  }

  // Mock version history
  const versionHistory = [
    {
      version: priceList.version,
      date: priceList.updatedAt,
      changes: "Versão atual",
      user: "Sistema",
      status: "ativo"
    },
    {
      version: (parseFloat(priceList.version) - 0.1).toFixed(1),
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      changes: "Ajuste de preços para categoria materiais (+5%)",
      user: "Admin",
      status: "arquivado"
    },
    {
      version: (parseFloat(priceList.version) - 0.2).toFixed(1),
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      changes: "Criação inicial da lista",
      user: "Sistema",
      status: "arquivado"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{priceList.name}</h3>
          <p className="text-sm text-muted-foreground">Histórico completo de versões</p>
        </div>
      </div>

      <div className="space-y-3">
        {versionHistory.map((version, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Badge variant={index === 0 ? "default" : "secondary"}>
                  v{version.version}
                </Badge>
                <span className="text-sm font-medium">{version.user}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(version.date).toLocaleString()}
                </span>
              </div>

              <div className="flex space-x-2">
                {index === 0 && <Badge variant="default">Atual</Badge>}
                {index > 0 && (
                  <Button variant="outline" size="sm" disabled={index === 0}>
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Restaurar
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700">{version.changes}</p>

            {index < versionHistory.length - 1 && (
              <div className="flex justify-center mt-3">
                <div className="w-px h-4 bg-gray-300"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}

// Price List Item Form Component
function PriceListItemForm({
  initialData,
  catalogItems,
  currency,
  onSubmit,
  isLoading,
  onCancel
}: {
  initialData?: PriceListItem;
  catalogItems: any[];
  currency: string;
  onSubmit: (data: Partial<PriceListItem>) => void;
  isLoading: boolean;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState({
    itemId: initialData?.itemId || '',
    unitPrice: initialData?.unitPrice || 0,
    specialPrice: initialData?.specialPrice || undefined as number | undefined,
    hourlyRate: initialData?.hourlyRate || undefined as number | undefined,
    travelCost: initialData?.travelCost || undefined as number | undefined,
    isActive: initialData?.isActive ?? true
  });

  const safeCatalogItems = Array.isArray(catalogItems) ? catalogItems : [];
  const selectedItem = safeCatalogItems.find(item => item.id === formData.itemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      specialPrice: formData.specialPrice === 0 ? undefined : formData.specialPrice, // Handle 0 as undefined if necessary
      hourlyRate: formData.hourlyRate === 0 ? undefined : formData.hourlyRate,
      travelCost: formData.travelCost === 0 ? undefined : formData.travelCost
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initialData && (
        <div>
          <Label htmlFor="itemId">Item do Catálogo</Label>
          <Select
            value={formData.itemId}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, itemId: value }));
              // Automatically set default values if an item is selected
              if (value && safeCatalogItems.find(item => item.id === value)) {
                const itemDefaults = safeCatalogItems.find(item => item.id === value);
                setFormData(prev => ({
                  ...prev,
                  unitPrice: itemDefaults?.unitPrice || 0,
                  specialPrice: itemDefaults?.specialPrice,
                  hourlyRate: itemDefaults?.hourlyRate,
                  travelCost: itemDefaults?.travelCost,
                }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um item do catálogo" />
            </SelectTrigger>
            <SelectContent>
              {safeCatalogItems.length === 0 ? (
                <SelectItem value="no-items" disabled>Nenhum item disponível</SelectItem>
              ) : (
                safeCatalogItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.measurementUnit || 'sem unidade'})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedItem && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedItem.description}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unitPrice">Preço Unitário ({currency})</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.unitPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="specialPrice">Preço Especial ({currency})</Label>
          <Input
            id="specialPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.specialPrice === undefined ? '' : formData.specialPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, specialPrice: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hourlyRate">Taxa Horária ({currency})</Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            value={formData.hourlyRate === undefined ? '' : formData.hourlyRate}
            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
            placeholder="Para serviços"
          />
        </div>
        <div>
          <Label htmlFor="travelCost">Custo de Deslocamento ({currency})</Label>
          <Input
            id="travelCost"
            type="number"
            step="0.01"
            min="0"
            value={formData.travelCost === undefined ? '' : formData.travelCost}
            onChange={(e) => setFormData(prev => ({ ...prev, travelCost: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          <Label htmlFor="isActive">Item Ativo</Label>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading || (!initialData && !formData.itemId)}>
            {isLoading ? (initialData ? "Atualizando..." : "Adicionando...") : (initialData ? "Atualizar Item" : "Adicionar Item")}
          </Button>
        </div>
      </div>
    </form>
  );
}