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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Plus, Search, Edit, Eye, Copy, Trash2, TrendingUp, DollarSign, Settings, BarChart3 } from "lucide-react";

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

export default function LPU() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("price-lists");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateRuleDialogOpen, setIsCreateRuleDialogOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);

  // Fetch price lists
  const { data: priceListsData, isLoading: priceListsLoading } = useQuery({
    queryKey: ['/api/materials-services/price-lists'],
    queryFn: () => apiRequest('GET', '/api/materials-services/price-lists'),
  });

  const priceLists = Array.isArray(priceListsData) ? priceListsData : [];

  // Fetch pricing rules
  const { data: pricingRulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/materials-services/pricing-rules'],
    queryFn: () => apiRequest('GET', '/api/materials-services/pricing-rules'),
  });

  const pricingRules = Array.isArray(pricingRulesData) ? pricingRulesData : [];

  // Fetch price list items for selected list
  const { data: priceListItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/materials-services/price-lists', selectedPriceList?.id, 'items'],
    queryFn: () => {
      if (!selectedPriceList?.id) return [];
      return apiRequest('GET', `/api/materials-services/price-lists/${selectedPriceList.id}/items`);
    },
    enabled: !!selectedPriceList?.id,
  });

  // Create price list mutation
  const createPriceListMutation = useMutation({
    mutationFn: (data: Partial<PriceList>) => apiRequest('POST', '/api/materials-services/price-lists', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Lista de preços criada com sucesso!" });
    },
    onError: (error) => {
      console.error('Error creating price list:', error);
      toast({ title: "Erro ao criar lista de preços", variant: "destructive" });
    }
  });

  // Create pricing rule mutation
  const createPricingRuleMutation = useMutation({
    mutationFn: (data: Partial<PricingRule>) => apiRequest('POST', '/api/materials-services/pricing-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/pricing-rules'] });
      setIsCreateRuleDialogOpen(false);
      toast({ title: "Regra de precificação criada com sucesso!" });
    },
    onError: (error) => {
      console.error('Error creating pricing rule:', error);
      toast({ title: "Erro ao criar regra de precificação", variant: "destructive" });
    }
  });

  // Delete pricing rule mutation
  const deletePricingRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/materials-services/pricing-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/pricing-rules'] });
      toast({ title: "Regra de precificação excluída com sucesso!" });
    },
    onError: (error) => {
      console.error('Error deleting pricing rule:', error);
      toast({ title: "Erro ao excluir regra de precificação", variant: "destructive" });
    }
  });

  const handleCreatePriceList = (data: Partial<PriceList>) => {
    // Convert date string to Date object
    const processedData = {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validTo: data.validTo ? new Date(data.validTo) : undefined
    };
    createPriceListMutation.mutate(processedData);
  };

  const handleCreatePricingRule = (data: Partial<PricingRule>) => {
    createPricingRuleMutation.mutate(data);
  };

  const handleDeletePricingRule = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra de precificação?')) {
      deletePricingRuleMutation.mutate(id);
    }
  };

  const filteredPriceLists = priceLists.filter((list: PriceList) =>
    list.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pl-[9px] pr-[9px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LPU - Lista de Preços Unificada</h1>
          <p className="text-muted-foreground">Gestão completa de listas de preços e regras de precificação</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="price-lists">Listas de Preços</TabsTrigger>
          <TabsTrigger value="pricing-rules">Regras de Precificação</TabsTrigger>
        </TabsList>

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
            {filteredPriceLists.map((priceList: PriceList) => (
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
                      setIsViewDialogOpen(true);
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
            ))}
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
            {pricingRules.map((rule: PricingRule) => (
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeletePricingRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Price List Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Lista de Preços</DialogTitle>
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
    code: '',
    version: '1.0',
    currency: 'BRL',
    validFrom: new Date().toISOString().split('T')[0],
    isActive: true,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
          />
        </div>
        <div>
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            required
          />
        </div>
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