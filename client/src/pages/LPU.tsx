import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Eye, Copy, Trash2, TrendingUp, DollarSign, Settings, BarChart3, FileText, Clock, CheckCircle } from "lucide-react";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateRuleDialogOpen, setIsCreateRuleDialogOpen] = useState(false);

  // Fetch LPU stats with error handling
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<LPUStats>({
    queryKey: ['/api/materials-services/price-lists/stats'],
    queryFn: () => apiRequest('GET', '/api/materials-services/price-lists/stats'),
    retry: 3,
    staleTime: 30000,
  });

  // Fetch price lists with robust error handling
  const { data: priceListsResponse, isLoading: priceListsLoading, error: priceListsError } = useQuery({
    queryKey: ['/api/materials-services/price-lists'],
    queryFn: () => apiRequest('GET', '/api/materials-services/price-lists'),
    retry: 3,
    staleTime: 30000,
  });

  // Safe data extraction with fallbacks
  const priceLists = Array.isArray(priceListsResponse)
    ? priceListsResponse
    : priceListsResponse?.data
    ? Array.isArray(priceListsResponse.data)
      ? priceListsResponse.data
      : []
    : [];

  // Fetch pricing rules with error handling
  const { data: pricingRulesResponse, isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['/api/materials-services/pricing-rules'],
    queryFn: () => apiRequest('GET', '/api/materials-services/pricing-rules'),
    retry: 3,
    staleTime: 30000,
  });

  const pricingRules = Array.isArray(pricingRulesResponse)
    ? pricingRulesResponse
    : pricingRulesResponse?.data
    ? Array.isArray(pricingRulesResponse.data)
      ? pricingRulesResponse.data
      : []
    : [];

  // Create price list mutation with better error handling
  const createPriceListMutation = useMutation({
    mutationFn: (data: Partial<PriceList>) => {
      console.log('Creating price list with data:', data);
      // Ensure dates are properly formatted
      const processedData = {
        ...data,
        validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : new Date().toISOString(),
        validTo: data.validTo ? new Date(data.validTo).toISOString() : undefined
      };
      console.log('Processed data for API:', processedData);
      return apiRequest('POST', '/api/materials-services/price-lists', processedData);
    },
    onSuccess: () => {
      // Force invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists/stats'] });
      // Also refetch immediately to ensure UI updates
      queryClient.refetchQueries({ queryKey: ['/api/materials-services/price-lists'] });
      queryClient.refetchQueries({ queryKey: ['/api/materials-services/price-lists/stats'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Lista de preços criada com sucesso!" });
    },
    onError: (error: any) => {
      console.error('Error creating price list:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      toast({
        title: "Erro ao criar lista de preços",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Create pricing rule mutation
  const createPricingRuleMutation = useMutation({
    mutationFn: (data: Partial<PricingRule>) => apiRequest('POST', '/api/materials-services/pricing-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists/stats'] });
      setIsCreateRuleDialogOpen(false);
      toast({ title: "Regra de precificação criada com sucesso!" });
    },
    onError: (error: any) => {
      console.error('Error creating pricing rule:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      toast({
        title: "Erro ao criar regra de precificação",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleCreatePriceList = (data: Partial<PriceList>) => {
    createPriceListMutation.mutate(data);
  };

  const handleCreatePricingRule = (data: Partial<PricingRule>) => {
    createPricingRuleMutation.mutate(data);
  };

  // Safe filtering with error handling
  const filteredPriceLists = priceLists.filter((list: PriceList) => {
    try {
      return list?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             list?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      console.warn('Error filtering price list:', error, list);
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

  return (
    <div className="space-y-6 pl-[9px] pr-[9px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LPU - Lista de Preços Unificada</h1>
          <p className="text-muted-foreground">Gestão completa de listas de preços e regras de precificação</p>
        </div>
      </div>

      {/* Error States */}
      {statsError && <ErrorDisplay error={statsError} title="Erro ao carregar estatísticas" />}
      {priceListsError && <ErrorDisplay error={priceListsError} title="Erro ao carregar listas de preços" />}
      {rulesError && <ErrorDisplay error={rulesError} title="Erro ao carregar regras de precificação" />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="price-lists">Listas de Preços</TabsTrigger>
          <TabsTrigger value="pricing-rules">Regras de Precificação</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Listas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalLists || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeLists || 0} listas ativas
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
                  {statsLoading ? "..." : stats?.pendingApproval || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  aguardando análise
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
                  {statsLoading ? "..." : `${stats?.approvalRate || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.approvedVersions || 0} aprovadas
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
                  {statsLoading ? "..." : stats?.activeRules || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  regras configuradas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Lista de Preços
                </Button>
                <Button onClick={() => setIsCreateRuleDialogOpen(true)} variant="outline" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Nova Regra de Precificação
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Listas de Preços</span>
                    <Badge variant={priceListsError ? "destructive" : "default"}>
                      {priceListsError ? "Erro" : "OK"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Regras de Precificação</span>
                    <Badge variant={rulesError ? "destructive" : "default"}>
                      {rulesError ? "Erro" : "OK"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estatísticas</span>
                    <Badge variant={statsError ? "destructive" : "default"}>
                      {statsError ? "Erro" : "OK"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
              filteredPriceLists.map((priceList: PriceList) => (
                <Card key={priceList.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">{priceList.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Código: {priceList.code} • Versão: {priceList.version}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={priceList.isActive ? "default" : "secondary"}>
                        {priceList.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedPriceList(priceList);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Válida de {new Date(priceList.validFrom).toLocaleDateString()}
                      {priceList.validTo && ` até ${new Date(priceList.validTo).toLocaleDateString()}`}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pricing-rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Regras de Precificação</h2>
              <p className="text-muted-foreground">Gerenciar regras automáticas de precificação</p>
            </div>
            <Button onClick={() => setIsCreateRuleDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </div>

          <div className="grid gap-4">
            {rulesLoading ? (
              <div className="text-center py-8">Carregando regras...</div>
            ) : pricingRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma regra configurada
              </div>
            ) : (
              pricingRules.map((rule: PricingRule) => (
                <Card key={rule.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{rule.ruleType}</Badge>
                      <Badge variant="secondary">Prioridade: {rule.priority}</Badge>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análises Avançadas</CardTitle>
              <p className="text-muted-foreground">
                Métricas detalhadas e insights de precificação
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <p>Módulo de análises em desenvolvimento</p>
                <p className="text-sm mt-2">
                  Métricas: margem, rentabilidade, tendências de preço
                </p>
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
            onSubmit={handleCreatePriceList}
            isLoading={createPriceListMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
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
            onSubmit={handleCreatePricingRule}
            isLoading={createPricingRuleMutation.isPending}
            onCancel={() => setIsCreateRuleDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Price List Form Component
function PriceListForm({
  onSubmit,
  isLoading,
  onCancel
}: {
  onSubmit: (data: Partial<PriceList>) => void;
  isLoading: boolean;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    version: '1.0',
    currency: 'BRL',
    validFrom: new Date().toISOString().split('T')[0],
    isActive: true,
    notes: '',
    customerCompanyId: undefined
  });

  // Fetch customer companies
  const { data: customerCompaniesResponse, isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['/api/customers/companies'],
    retry: 3,
    staleTime: 30000,
  });

  // Safe data extraction with fallbacks
  const customerCompanies = Array.isArray(customerCompaniesResponse)
    ? customerCompaniesResponse
    : [];

  console.log('Companies loading:', companiesLoading);
  console.log('Companies error:', companiesError);
  console.log('Companies response:', customerCompaniesResponse);
  console.log('Companies array:', customerCompanies);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert 'none' back to undefined/null for API
    const submitData = {
      ...formData,
      customerCompanyId: formData.customerCompanyId === 'none' ? undefined : formData.customerCompanyId
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="version">Versão</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            required
          />
        </div>
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
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      {/* Corrected field name here */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerCompanyId">Empresa Cliente</Label>
          <Select
            value={formData.customerCompanyId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, customerCompanyId: value }))}
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
            {isLoading ? "Criando..." : "Criar Lista"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Pricing Rule Form Component
function PricingRuleForm({
  onSubmit,
  isLoading,
  onCancel
}: {
  onSubmit: (data: Partial<PricingRule>) => void;
  isLoading: boolean;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'percentual',
    priority: 1,
    isActive: true,
    conditions: {},
    actions: {}
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
            {isLoading ? "Criando..." : "Criar Regra"}
          </Button>
        </div>
      </div>
    </form>
  );
}