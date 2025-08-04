import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye, Edit, Copy, Trash2, Search, Filter, DollarSign, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const { data: priceLists, isLoading: priceListsLoading } = useQuery({
    queryKey: ['/api/materials-services/lpu/price-lists'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/materials-services/lpu/price-lists');
      return response.json();
    },
  });

  // Fetch pricing rules
  const { data: pricingRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/materials-services/lpu/pricing-rules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/materials-services/lpu/pricing-rules');
      return response.json();
    },
  });

  // Fetch price list items for selected list
  const { data: priceListItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/materials-services/lpu/price-lists', selectedPriceList?.id, 'items'],
    queryFn: async () => {
      if (!selectedPriceList?.id) return [];
      const response = await apiRequest('GET', `/api/materials-services/lpu/price-lists/${selectedPriceList.id}/items`);
      return response.json();
    },
    enabled: !!selectedPriceList?.id,
  });

  // Create price list mutation
  const createPriceListMutation = useMutation({
    mutationFn: async (data: Partial<PriceList>) => {
      const response = await apiRequest('POST', '/api/materials-services/lpu/price-lists', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/lpu/price-lists'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Lista de preços criada com sucesso!" });
    },
    onError: (error) => {
      console.error('Error creating price list:', error);
      toast({ title: "Erro ao criar lista de preços", variant: "destructive" });
    }
  });

  // Update price list mutation
  const updatePriceListMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PriceList> }) => {
      const response = await apiRequest('PUT', `/api/materials-services/lpu/price-lists/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/lpu/price-lists'] });
      setIsEditDialogOpen(false);
      setEditingPriceList(null);
      toast({ title: "Lista de preços atualizada com sucesso!" });
    },
    onError: (error) => {
      console.error('Error updating price list:', error);
      toast({ title: "Erro ao atualizar lista de preços", variant: "destructive" });
    }
  });

  // Duplicate price list mutation
  const duplicatePriceListMutation = useMutation({
    mutationFn: async (originalList: PriceList) => {
      const response = await apiRequest('POST', `/api/materials-services/price-lists/${originalList.id}/duplicate`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/price-lists'] });
      toast({ title: "Lista de preços duplicada com sucesso!" });
    },
    onError: (error) => {
      console.error('Error duplicating price list:', error);
      toast({ title: "Erro ao duplicar lista de preços", variant: "destructive" });
    }
  });

  // Create pricing rule mutation
  const createPricingRuleMutation = useMutation({
    mutationFn: async (data: Partial<PricingRule>) => {
      const response = await apiRequest('POST', '/api/materials-services/lpu/pricing-rules', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/lpu/pricing-rules'] });
      setIsCreateRuleDialogOpen(false);
      toast({ title: "Regra de precificação criada com sucesso!" });
    },
    onError: (error) => {
      console.error('Error creating pricing rule:', error);
      toast({ title: "Erro ao criar regra de precificação", variant: "destructive" });
    }
  });

  const handleView = (priceList: PriceList) => {
    setSelectedPriceList(priceList);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (priceList: PriceList) => {
    setEditingPriceList(priceList);
    setIsEditDialogOpen(true);
  };

  const handleDuplicate = (priceList: PriceList) => {
    duplicatePriceListMutation.mutate(priceList);
  };

  const filteredPriceLists = priceLists?.filter((list: PriceList) =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LPU - Lista de Preços Unitários</h1>
          <p className="text-muted-foreground">Gestão completa de listas de preços e regras de precificação</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Nova Lista de Preços
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="price-lists">Listas de Preços</TabsTrigger>
          <TabsTrigger value="pricing-rules">Regras de Precificação</TabsTrigger>
          <TabsTrigger value="margins">Controle de Margem</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="price-lists" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Listas de Preços
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar listas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {priceListsLoading ? (
                <div className="text-center py-4">Carregando listas de preços...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Vigência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Moeda</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPriceLists.map((priceList: PriceList) => (
                      <TableRow key={priceList.id}>
                        <TableCell className="font-medium">{priceList.name}</TableCell>
                        <TableCell>{priceList.code}</TableCell>
                        <TableCell>{priceList.version}</TableCell>
                        <TableCell>
                          {new Date(priceList.validFrom).toLocaleDateString()} 
                          {priceList.validTo ? ` - ${new Date(priceList.validTo).toLocaleDateString()}` : ' - Indeterminado'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={priceList.isActive ? "default" : "secondary"}>
                            {priceList.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>{priceList.currency}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(priceList)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(priceList)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicate(priceList)}
                              disabled={duplicatePriceListMutation.isPending}
                            >
                              <Copy className="w-4 h-4" />
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

        <TabsContent value="pricing-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Regras de Precificação
                </CardTitle>
                <Button onClick={() => setIsCreateRuleDialogOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Regra
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-center py-4">Carregando regras de precificação...</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma regra de precificação encontrada. Clique em "Nova Regra" para começar.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Margem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Funcionalidade de controle de margem em desenvolvimento.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análises LPU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Análises e relatórios em desenvolvimento.
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
          </DialogHeader>
          {editingPriceList && (
            <PriceListForm
              initialData={editingPriceList}
              onSubmit={(data) => updatePriceListMutation.mutate({ id: editingPriceList.id, data })}
              isLoading={updatePriceListMutation.isPending}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingPriceList(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Price List Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualizar Lista de Preços</DialogTitle>
          </DialogHeader>
          {selectedPriceList && (
            <PriceListViewer
              priceList={selectedPriceList}
              items={priceListItems || []}
              isLoadingItems={itemsLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Pricing Rule Dialog */}
      <Dialog open={isCreateRuleDialogOpen} onOpenChange={setIsCreateRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Regra de Precificação</DialogTitle>
          </DialogHeader>
          <PricingRuleForm
            onSubmit={(data: Partial<PricingRule>) => createPricingRuleMutation.mutate(data)}
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
    code: initialData?.code || '',
    version: initialData?.version || '1.0',
    currency: initialData?.currency || 'BRL',
    validFrom: initialData?.validFrom ? new Date(initialData.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validTo: initialData?.validTo ? new Date(initialData.validTo).toISOString().split('T')[0] : '',
    automaticMargin: initialData?.automaticMargin || 0,
    notes: initialData?.notes || '',
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      validFrom: new Date(formData.validFrom).toISOString(),
      validTo: formData.validTo ? new Date(formData.validTo).toISOString() : undefined,
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

      <div className="grid grid-cols-3 gap-4">
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
          <Label htmlFor="currency">Moeda</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">BRL - Real</SelectItem>
              <SelectItem value="USD">USD - Dólar</SelectItem>
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
            value={formData.automaticMargin}
            onChange={(e) => setFormData(prev => ({ ...prev, automaticMargin: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">Válido De</Label>
          <Input
            id="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="validTo">Válido Até</Label>
          <Input
            id="validTo"
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
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
            {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Price List Viewer Component
function PriceListViewer({ 
  priceList, 
  items, 
  isLoadingItems 
}: { 
  priceList: PriceList; 
  items: PriceListItem[]; 
  isLoadingItems: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
            <p className="text-lg">{priceList.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Código</Label>
            <p>{priceList.code}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Versão</Label>
            <p>{priceList.version}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Vigência</Label>
            <p>
              {new Date(priceList.validFrom).toLocaleDateString()} 
              {priceList.validTo ? ` até ${new Date(priceList.validTo).toLocaleDateString()}` : ' - Indeterminado'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <div>
              <Badge variant={priceList.isActive ? "default" : "secondary"}>
                {priceList.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Moeda</Label>
            <p>{priceList.currency}</p>
          </div>
        </div>
      </div>
      
      {priceList.notes && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
          <p className="mt-1">{priceList.notes}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Itens da Lista</h3>
        {isLoadingItems ? (
          <div className="text-center py-4">Carregando itens...</div>
        ) : items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item/Serviço</TableHead>
                <TableHead>Preço Unitário</TableHead>
                <TableHead>Preço Especial</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.itemId || item.serviceTypeId}</TableCell>
                  <TableCell>R$ {item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>{item.specialPrice ? `R$ ${item.specialPrice.toFixed(2)}` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum item cadastrado nesta lista.
          </div>
        )}
      </div>
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
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'percentage',
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
              <SelectItem value="percentage">Percentual</SelectItem>
              <SelectItem value="fixed">Valor Fixo</SelectItem>
              <SelectItem value="tiered">Escalonada</SelectItem>
              <SelectItem value="dynamic">Dinâmica</SelectItem>
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Regra"}
          </Button>
        </div>
      </div>
    </form>
  );
}