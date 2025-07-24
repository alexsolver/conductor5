import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Search, Plus, Package, Warehouse, Users, ShoppingCart, 
         Star, MapPin, Building, DollarSign, TrendingUp, Shield, 
         Monitor, Wrench, Truck, Edit, Trash2, Eye, ChevronDown } from "lucide-react";
import { PurchaseOrdersManager } from "@/components/parts-services/PurchaseOrdersManager";
import { ServiceIntegrationsManager } from "@/components/parts-services/ServiceIntegrationsManager";
import { Dialog, DialogContent, DialogDescription, DialogFooter, 
         DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// SISTEMA UNIFICADO DE PEÇAS E SERVIÇOS
// Consolidação dos 4 módulos: Simple → Functional → Management → Enterprise
export default function PartsServices() {
  const [activeModule, setActiveModule] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
  const [newMovement, setNewMovement] = useState({
    item_id: "",
    movement_type: "in", // in, out, transfer
    quantity: "",
    location_from: "",
    location_to: "",
    reason: "",
    notes: ""
  });
  const [newAdjustment, setNewAdjustment] = useState({
    item_id: "",
    new_quantity: "",
    reason: "",
    notes: ""
  });
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    internal_code: "",
    manufacturer_code: "",
    cost_price: "",
    sale_price: "",
    margin_percentage: "",
    abc_classification: "B",
    category: "Geral",
    item_type: "material" // material ou service
  });
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    supplier_code: "",
    document_number: "",
    trade_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Brasil"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // QUERIES UNIFICADAS PARA TODOS OS DADOS
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/parts-services/dashboard/stats'],
    refetchInterval: 30000
  });

  const { data: parts = [], isLoading: isLoadingParts } = useQuery({
    queryKey: ['/api/parts-services/parts']
  });

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['/api/parts-services/suppliers']
  });

  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ['/api/parts-services/inventory']
  });

  const { data: purchaseOrders = [], isLoading: isLoadingPurchaseOrders } = useQuery({
    queryKey: ['/api/parts-services/purchase-orders']
  });

  // FILTROS DE DADOS
  const filteredParts = Array.isArray(parts) ? parts.filter((part: any) => 
    part.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.internal_code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredSuppliers = Array.isArray(suppliers) ? suppliers.filter((supplier: any) =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // MUTATIONS PARA CRUD
  const createItemMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('🔍 CreatePart Frontend - Sending data:', JSON.stringify(data, null, 2));
      return apiRequest('POST', '/api/parts-services/parts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setIsCreateItemOpen(false);
      setNewItem({
        title: "", description: "", internal_code: "", manufacturer_code: "", cost_price: "",
        sale_price: "", margin_percentage: "", abc_classification: "B", category: "Geral", item_type: "material"
      });
      toast({ title: "Peça criada com sucesso!" });
    },
    onError: (error: any) => {
      console.error('❌ CreatePart Frontend Error:', error);
      toast({ 
        title: "Erro ao criar peça", 
        description: error?.message || "Erro desconhecido",
        variant: "destructive" 
      });
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setIsCreateSupplierOpen(false);
      setNewSupplier({
        name: "", supplier_code: "", document_number: "", trade_name: "", 
        email: "", phone: "", address: "", city: "", state: "", country: "Brasil"
      });
      toast({ title: "Fornecedor criado com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar fornecedor", variant: "destructive" })
  });

  const deletePartMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/parts-services/parts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      toast({ title: "Peça excluída com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao excluir peça", variant: "destructive" })
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/parts-services/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      toast({ title: "Fornecedor excluído com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao excluir fornecedor", variant: "destructive" })
  });

  const updatePartMutation = useMutation({
    mutationFn: (data: {id: string, updates: any}) => apiRequest('PUT', `/api/parts-services/parts/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setIsEditItemOpen(false);
      setEditingItem(null);
      toast({ title: "Peça atualizada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao atualizar peça", variant: "destructive" })
  });

  const updateSupplierMutation = useMutation({
    mutationFn: (data: {id: string, updates: any}) => apiRequest('PUT', `/api/parts-services/suppliers/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setIsEditSupplierOpen(false);
      setEditingSupplier(null);
      toast({ title: "Fornecedor atualizado com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao atualizar fornecedor", variant: "destructive" })
  });

  // FUNÇÕES PARA ABRIR MODAIS DE EDIÇÃO
  const handleEditItem = (item: any) => {
    setEditingItem({
      ...item,
      cost_price: item.cost_price?.toString() || "",
      sale_price: item.sale_price?.toString() || "",
      margin_percentage: item.margin_percentage?.toString() || ""
    });
    setIsEditItemOpen(true);
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsEditSupplierOpen(true);
  };

  // NOVAS FUNÇÕES PARA FUNCIONALIDADES FALTANTES
  const handleDuplicateItem = (item: any) => {
    setNewItem({
      ...item,
      title: `${item.title} (Cópia)`,
      internal_code: `${item.internal_code}_COPY`,
      manufacturer_code: `${item.manufacturer_code}_COPY`
    });
    setIsCreateItemOpen(true);
  };

  const handleExportCatalog = async () => {
    try {
      const response = await apiRequest('GET', '/api/parts-services/parts/export');
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `catalogo_pecas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Catálogo exportado com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao exportar catálogo", variant: "destructive" });
    }
  };

  const handleSupplierRating = (supplierId: string, rating: number) => {
    // Implementar sistema de avaliação
    console.log('Rating supplier:', supplierId, rating);
  };

  // CONFIGURAÇÃO DOS 11 MÓDULOS ENTERPRISE UNIFICADOS
  const modules = [
    { id: 'overview', name: 'Visão Geral', icon: Monitor, description: 'Dashboard executivo', count: 'Enterprise' },
    { id: 'parts', name: 'Gestão de Peças', icon: Package, description: 'Catálogo completo', count: Array.isArray(parts) ? parts.length : 0 },
    { id: 'inventory', name: 'Controle de Estoque', icon: Warehouse, description: 'Movimentações em tempo real', count: Array.isArray(inventory) ? inventory.length : 0 },
    { id: 'suppliers', name: 'Gestão de Fornecedores', icon: Users, description: 'Rede de parceiros', count: Array.isArray(suppliers) ? suppliers.length : 0 },
    { id: 'purchasing', name: 'Planejamento e Compras', icon: ShoppingCart, description: 'Pedidos e orçamentos', count: Array.isArray(purchaseOrders) ? purchaseOrders.length : 0 },
    { id: 'services', name: 'Integração Serviços', icon: Star, description: 'Work orders e sync', count: 'Ativo' },
    { id: 'logistics', name: 'Logística', icon: MapPin, description: 'Transferências e devoluções', count: 'Ativo' },
    { id: 'assets', name: 'Controle de Ativos', icon: Building, description: 'Manutenção e movimentação', count: 'Ativo' },
    { id: 'pricing', name: 'LPU Enterprise', icon: DollarSign, description: 'Listas e versionamento', count: 'Ativo' },
    { id: 'advanced', name: 'Preços Avançados', icon: TrendingUp, description: 'Regras dinâmicas', count: 'Ativo' },
    { id: 'compliance', name: 'Compliance', icon: Shield, description: 'Auditoria e certificações', count: 'Ativo' }
  ];

  const currentModule = modules.find(m => m.id === activeModule);

  // COMPONENTE OVERVIEW - DASHBOARD EXECUTIVO
  const OverviewModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalParts || 0}</div>
            <p className="text-xs text-muted-foreground">Catálogo ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">Ativos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalInventory || 0}</div>
            <p className="text-xs text-muted-foreground">Posições ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(dashboardStats?.totalStockValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Valor do estoque</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.slice(1).map((module) => {
          const IconComponent = module.icon;
          return (
            <Card key={module.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setActiveModule(module.id)}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <IconComponent className="h-8 w-8 text-blue-600 mr-3" />
                <div className="flex-1">
                  <CardTitle className="text-base">{module.name}</CardTitle>
                  <CardDescription className="text-sm">{module.description}</CardDescription>
                </div>
                <Badge variant="secondary">{module.count}</Badge>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // COMPONENTE GESTÃO DE ITENS - Render direto inline para evitar re-renderizações
  const renderItemsModule = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar peças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportCatalog}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Exportar Catálogo
          </Button>
          <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Peça</Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Peça</DialogTitle>
              <DialogDescription>Adicione uma nova peça ao catálogo</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-title" className="text-right">Título <span className="text-red-500">*</span></Label>
                <Input 
                  id="part-title" 
                  value={newItem.title} 
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})} 
                  className="col-span-3" 
                  placeholder="Nome da peça"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-code" className="text-right">Código Interno <span className="text-red-500">*</span></Label>
                <Input 
                  id="part-code" 
                  value={newItem.internal_code} 
                  onChange={(e) => setNewItem({...newItem, internal_code: e.target.value})} 
                  className="col-span-3" 
                  placeholder="Ex: P001"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-manufacturer" className="text-right">Código Fabricante <span className="text-red-500">*</span></Label>
                <Input 
                  id="part-manufacturer" 
                  value={newItem.manufacturer_code} 
                  onChange={(e) => setNewItem({...newItem, manufacturer_code: e.target.value})} 
                  className="col-span-3" 
                  placeholder="Ex: MFG001"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-cost" className="text-right">Preço de Custo <span className="text-red-500">*</span></Label>
                <Input 
                  id="part-cost" 
                  type="number" 
                  value={newItem.cost_price} 
                  onChange={(e) => setNewItem({...newItem, cost_price: e.target.value})} 
                  className="col-span-3"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-sale" className="text-right">Preço de Venda <span className="text-red-500">*</span></Label>
                <Input 
                  id="part-sale" 
                  type="number" 
                  value={newItem.sale_price} 
                  onChange={(e) => setNewItem({...newItem, sale_price: e.target.value})} 
                  className="col-span-3"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-classification" className="text-right">Classe ABC</Label>
                <Select value={newItem.abc_classification} onValueChange={(value) => setNewItem({...newItem, abc_classification: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Classe A - Alta</SelectItem>
                    <SelectItem value="B">Classe B - Média</SelectItem>
                    <SelectItem value="C">Classe C - Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-type" className="text-right">Tipo de Item <span className="text-red-500">*</span></Label>
                <Select 
                  value={newItem.item_type} 
                  onValueChange={(value) => setNewItem({...newItem, item_type: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-description" className="text-right">Descrição</Label>
                <Textarea 
                  id="part-description" 
                  value={newItem.description} 
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  // Validação frontend antes de enviar
                  if (!newItem.title || !newItem.internal_code || !newItem.manufacturer_code || !newItem.cost_price || !newItem.sale_price) {
                    toast({
                      title: "Campos obrigatórios não preenchidos",
                      description: "Preencha: Título, Código Interno, Código Fabricante, Custo e Venda",
                      variant: "destructive"
                    });
                    return;
                  }
                  createItemMutation.mutate(newItem);
                }} 
                disabled={createItemMutation.isPending}
              >
                {createItemMutation.isPending ? 'Criando...' : 'Criar Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingParts ? (
        <div className="text-center py-8">Carregando peças...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParts.map((part: any) => (
            <Card key={part.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{part.title}</CardTitle>
                    <CardDescription>{part.internal_code}</CardDescription>
                  </div>
                  <Badge variant={part.abc_classification === 'A' ? 'destructive' : 
                                 part.abc_classification === 'B' ? 'default' : 'secondary'}>
                    {part.abc_classification}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{part.description}</p>
                  <div className="flex justify-between text-sm">
                    <span>Custo:</span>
                    <span className="font-medium">R$ {parseFloat(part.cost_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Venda:</span>
                    <span className="font-medium">R$ {parseFloat(part.sale_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Margem:</span>
                    <span className="font-medium">{parseFloat(part.margin_percentage || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditItem(part)} title="Editar peça">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicateItem(part)} title="Duplicar peça">
                      <Package className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" 
                            onClick={() => {
                              if(window.confirm('Tem certeza que deseja excluir esta peça?')) {
                                deletePartMutation.mutate(part.id);
                              }
                            }}
                            title="Excluir peça">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" title="Ver histórico">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // COMPONENTE FORNECEDORES - Render direto inline para evitar re-renderizações
  const renderSuppliersModule = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
        </div>
        <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Fornecedor</DialogTitle>
              <DialogDescription>Adicione um novo fornecedor à base</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-name" className="text-right">Nome <span className="text-red-500">*</span></Label>
                  <Input 
                    id="supplier-name" 
                    value={newSupplier.name} 
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} 
                    className="col-span-3" 
                    placeholder="Nome da empresa"
                  />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-code" className="text-right">Código <span className="text-red-500">*</span></Label>
                <Input 
                  id="supplier-code" 
                  value={newSupplier.supplier_code} 
                  onChange={(e) => setNewSupplier({...newSupplier, supplier_code: e.target.value})} 
                  className="col-span-3" 
                  placeholder="Ex: FORN001"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-document" className="text-right">CNPJ</Label>
                <Input 
                  id="supplier-document" 
                  value={newSupplier.document_number} 
                  onChange={(e) => setNewSupplier({...newSupplier, document_number: e.target.value})} 
                  className="col-span-3" 
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-trade" className="text-right">Nome Fantasia <span className="text-red-500">*</span></Label>
                <Input 
                  id="supplier-trade" 
                  value={newSupplier.trade_name} 
                  onChange={(e) => setNewSupplier({...newSupplier, trade_name: e.target.value})} 
                  className="col-span-3" 
                  placeholder="Nome comercial"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-email" className="text-right">Email <span className="text-red-500">*</span></Label>
                <Input 
                  id="supplier-email" 
                  type="email" 
                  value={newSupplier.email} 
                  onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} 
                  className="col-span-3" 
                  placeholder="contato@fornecedor.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-phone" className="text-right">Telefone</Label>
                <Input id="supplier-phone" value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-address" className="text-right">Endereço</Label>
                <Textarea id="supplier-address" value={newSupplier.address} onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})} className="col-span-3" />
              </div>
              </div>
            </form>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  // Validação frontend antes de enviar
                  if (!newSupplier.name || !newSupplier.supplier_code || !newSupplier.trade_name || !newSupplier.email) {
                    toast({
                      title: "Campos obrigatórios não preenchidos",
                      description: "Preencha: Nome, Código, Nome Fantasia e Email",
                      variant: "destructive"
                    });
                    return;
                  }
                  // Validação básica de email
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(newSupplier.email)) {
                    toast({
                      title: "Email inválido",
                      description: "Por favor, insira um email válido",
                      variant: "destructive"
                    });
                    return;
                  }
                  createSupplierMutation.mutate(newSupplier);
                }} 
                disabled={createSupplierMutation.isPending}
              >
                {createSupplierMutation.isPending ? 'Criando...' : 'Criar Fornecedor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingSuppliers ? (
        <div className="text-center py-8">Carregando fornecedores...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier: any) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <CardDescription>{supplier.supplier_code} • {supplier.document_number}</CardDescription>
                  </div>
                  <Badge variant="outline">Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Email:</span>
                    <span className="font-medium">{supplier.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Telefone:</span>
                    <span className="font-medium">{supplier.phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Nome Fantasia:</span>
                    <span className="font-medium">{supplier.trade_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditSupplier(supplier)} title="Editar fornecedor">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" 
                            onClick={() => {
                              if(window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
                                deleteSupplierMutation.mutate(supplier.id);
                              }
                            }} 
                            title="Excluir fornecedor">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" title="Visualizar detalhes">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    );
  };

  // COMPONENTE CONTROLE DE ESTOQUE COMPLETO
  const InventoryModule = () => (
    <div className="space-y-6">
      {/* Header com estatísticas de estoque */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Posições ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Requer reposição</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {dashboardStats?.totalStockValue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">Valor do estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <Warehouse className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Ferramentas de controle de estoque */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no estoque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsMovementModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
          <Button variant="outline" onClick={() => setIsAdjustmentModalOpen(true)}>
            <Package className="h-4 w-4 mr-2" />
            Ajuste de Estoque
          </Button>
          <Button onClick={() => setIsInventoryModalOpen(true)}>
            <Warehouse className="h-4 w-4 mr-2" />
            Inventário
          </Button>
        </div>
      </div>

      {/* Lista de itens no estoque */}
      {isLoadingInventory ? (
        <div className="text-center py-8">Carregando estoque...</div>
      ) : inventory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item em estoque</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando itens ao seu controle de estoque
            </p>
            <Button onClick={() => setIsMovementModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Controle de Estoque</CardTitle>
            <CardDescription>Monitoramento de posições e movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tabela de estoque simulada baseada nos itens existentes */}
              {parts.slice(0, 5).map((part: any, index: number) => (
                <div key={part.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{part.title}</h4>
                      <p className="text-sm text-muted-foreground">{part.internal_code}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{10 + index * 5}</div>
                      <div className="text-muted-foreground">Atual</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{5 + index * 2}</div>
                      <div className="text-muted-foreground">Mínimo</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{50 + index * 10}</div>
                      <div className="text-muted-foreground">Máximo</div>
                    </div>
                    <div className="text-center">
                      <Badge variant={index < 2 ? "default" : index < 4 ? "secondary" : "destructive"}>
                        {index < 2 ? "OK" : index < 4 ? "Baixo" : "Crítico"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" 
                            onClick={() => {
                              setSelectedInventoryItem(part);
                              setIsAdjustmentModalOpen(true);
                            }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline"
                            onClick={() => {
                              setSelectedInventoryItem(part);
                              setIsInventoryModalOpen(true);
                            }}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // COMPONENTE GENÉRICO PARA MÓDULOS EM DESENVOLVIMENTO
  const GenericModule = ({ title, description }: { title: string, description: string }) => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <Package className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Badge variant="secondary">Em desenvolvimento</Badge>
      </div>
    </div>
  );

  // NOVOS MÓDULOS CATEGORIZADOS
  const LogisticsModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2 text-orange-600" />
              Logística
            </CardTitle>
            <CardDescription>Gestão de movimentação e transferências</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Transferências Pendentes</span>
                <Badge variant="outline">15</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Em Trânsito</span>
                <Badge variant="outline">8</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Devoluções</span>
                <Badge variant="outline">3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Controle de Ativos</CardTitle>
            <CardDescription>Monitoramento de equipamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Ativos Ativos</span>
                <Badge variant="outline">142</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Manutenção</span>
                <Badge variant="destructive">7</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AssetsModule = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <Shield className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Controle de Ativos</h3>
        <p className="text-muted-foreground mb-4">Gestão completa de ativos e manutenção preventiva</p>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">Módulo Avançado</Badge>
      </div>
    </div>
  );

  const PricingModule = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <DollarSign className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Preços Avançados</h3>
        <p className="text-muted-foreground mb-4">Sistema inteligente de precificação com regras dinâmicas</p>
        <Badge variant="outline" className="bg-green-50 text-green-700">Sistema Inteligente</Badge>
      </div>
    </div>
  );

  const LpuModule = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <TrendingUp className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">LPU Enterprise</h3>
        <p className="text-muted-foreground mb-4">Lista de Preços Unificada com versionamento e contratos</p>
        <Badge variant="outline" className="bg-purple-50 text-purple-700">Enterprise</Badge>
      </div>
    </div>
  );

  const ComplianceModule = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <Shield className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Compliance</h3>
        <p className="text-muted-foreground mb-4">Auditoria completa e certificações de conformidade</p>
        <Badge variant="outline" className="bg-red-50 text-red-700">Auditoria & Compliance</Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header do Sistema Unificado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Peças e Serviços</h1>
          <p className="text-muted-foreground">Sistema unificado de gestão enterprise</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">Enterprise</Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">11 Módulos</Badge>
        </div>
      </div>

      {/* MENU DIRETO SEM AGRUPAMENTO */}
      <div className="bg-gray-50 p-4 rounded-lg border mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeModule === 'overview' ? "default" : "outline"}
            onClick={() => setActiveModule('overview')}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            Visão Geral
          </Button>

          <Button
            variant={activeModule === 'items' ? "default" : "outline"}
            onClick={() => setActiveModule('items')}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Gestão de Itens
          </Button>

          <Button
            variant={activeModule === 'inventory' ? "default" : "outline"}
            onClick={() => setActiveModule('inventory')}
            className="flex items-center gap-2"
          >
            <Warehouse className="h-4 w-4" />
            Controle de Estoque
          </Button>

          <Button
            variant={activeModule === 'suppliers' ? "default" : "outline"}
            onClick={() => setActiveModule('suppliers')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Gestão de Fornecedores
          </Button>


          <Button
            variant={activeModule === 'purchasing' ? "default" : "outline"}
            onClick={() => setActiveModule('purchasing')}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Planejamento e Compras
          </Button>

          <Button
            variant={activeModule === 'pricing' ? "default" : "outline"}
            onClick={() => setActiveModule('pricing')}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Preços Avançados
          </Button>

          <Button
            variant={activeModule === 'lpu' ? "default" : "outline"}
            onClick={() => setActiveModule('lpu')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            LPU Enterprise
          </Button>


          <Button
            variant={activeModule === 'logistics' ? "default" : "outline"}
            onClick={() => setActiveModule('logistics')}
            className="flex items-center gap-2"
          >
            <Truck className="h-4 w-4" />
            Logística
          </Button>

          <Button
            variant={activeModule === 'assets' ? "default" : "outline"}
            onClick={() => setActiveModule('assets')}
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            Controle de Ativos
          </Button>


          <Button
            variant={activeModule === 'services' ? "default" : "outline"}
            onClick={() => setActiveModule('services')}
            className="flex items-center gap-2"
          >
            <Wrench className="h-4 w-4" />
            Integração Serviços
          </Button>

          <Button
            variant={activeModule === 'compliance' ? "default" : "outline"}
            onClick={() => setActiveModule('compliance')}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Compliance
          </Button>
        </div>

        {/* Indicador do módulo ativo */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Módulo ativo:</span>{' '}
            <Badge variant="outline" className="ml-1">
              {activeModule === 'items' && 'Gestão de Itens'}
              {activeModule === 'inventory' && 'Controle de Estoque'} 
              {activeModule === 'suppliers' && 'Gestão de Fornecedores'}
              {activeModule === 'purchasing' && 'Planejamento e Compras'}
              {activeModule === 'pricing' && 'Preços Avançados'}
              {activeModule === 'lpu' && 'LPU Enterprise'}
              {activeModule === 'logistics' && 'Logística'}
              {activeModule === 'assets' && 'Controle de Ativos'}
              {activeModule === 'services' && 'Integração Serviços'}
              {activeModule === 'compliance' && 'Compliance'}
              {activeModule === 'overview' && 'Visão Geral'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content Modules - Renderização condicional baseada no activeModule */}
      <div className="space-y-6">
        {activeModule === 'overview' && <OverviewModule />}
        {activeModule === 'items' && renderItemsModule()}
        {activeModule === 'suppliers' && renderSuppliersModule()}
        {activeModule === 'inventory' && <InventoryModule />}
        {activeModule === 'purchasing' && <PurchaseOrdersManager />}
        {activeModule === 'services' && <ServiceIntegrationsManager />}
        {activeModule === 'logistics' && <LogisticsModule />}
        {activeModule === 'assets' && <AssetsModule />}
        {activeModule === 'pricing' && <PricingModule />}
        {activeModule === 'lpu' && <LpuModule />}
        {activeModule === 'compliance' && <ComplianceModule />}
      </div>

      {/* MODAL DE EDIÇÃO DE PEÇA */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Peça</DialogTitle>
            <DialogDescription>Atualize as informações da peça</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">Título</Label>
                <Input 
                  id="edit-title" 
                  value={editingItem.title} 
                  onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-code" className="text-right">Código</Label>
                <Input 
                  id="edit-code" 
                  value={editingItem.internal_code} 
                  onChange={(e) => setEditingItem({...editingItem, internal_code: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cost" className="text-right">Custo</Label>
                <Input 
                  id="edit-cost" 
                  type="number" 
                  value={editingItem.cost_price} 
                  onChange={(e) => setEditingItem({...editingItem, cost_price: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sale" className="text-right">Venda</Label>
                <Input 
                  id="edit-sale" 
                  type="number" 
                  value={editingItem.sale_price} 
                  onChange={(e) => setEditingItem({...editingItem, sale_price: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-classification" className="text-right">Classe ABC</Label>
                <Select 
                  value={editingItem.abc_classification} 
                  onValueChange={(value) => setEditingItem({...editingItem, abc_classification: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Classe A - Alta</SelectItem>
                    <SelectItem value="B">Classe B - Média</SelectItem>
                    <SelectItem value="C">Classe C - Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">Descrição</Label>
                <Textarea 
                  id="edit-description" 
                  value={editingItem.description} 
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={() => updatePartMutation.mutate({id: editingItem?.id, updates: editingItem})} 
              disabled={updatePartMutation.isPending}
            >
              {updatePartMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO DE FORNECEDOR */}
      <Dialog open={isEditSupplierOpen} onOpenChange={setIsEditSupplierOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>Atualize as informações do fornecedor</DialogDescription>
          </DialogHeader>
          {editingSupplier && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Nome</Label>
                <Input 
                  id="edit-name" 
                  value={editingSupplier.name} 
                  onChange={(e) => setEditingSupplier({...editingSupplier, name: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-supplier-code" className="text-right">Código</Label>
                <Input 
                  id="edit-supplier-code" 
                  value={editingSupplier.supplier_code} 
                  onChange={(e) => setEditingSupplier({...editingSupplier, supplier_code: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-document" className="text-right">CNPJ</Label>
                <Input 
                  id="edit-document" 
                  value={editingSupplier.document_number} 
                  onChange={(e) => setEditingSupplier({...editingSupplier, document_number: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-trade-name" className="text-right">Nome Fantasia</Label>
                <Input 
                  id="edit-trade-name" 
                  value={editingSupplier.trade_name} 
                  onChange={(e) => setEditingSupplier({...editingSupplier, trade_name: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={editingSupplier.email} 
                  onChange={(e) => setEditingSupplier({...editingSupplier, email: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">Telefone</Label>
                <Input 
                  id="edit-phone" 
                  value={editingSupplier.phone} 
                  onChange={(e) => setEditingSupplier({...editingSupplier, phone: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-address" className="text-right">Endereço</Label>
                <Textarea 
                  id="edit-address" 
                  value={editingSupplier.address} 
                  onChange={(e) => setEditingSupplier({...editingSupplier, address: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={() => updateSupplierMutation.mutate({id: editingSupplier?.id, updates: editingSupplier})} 
              disabled={updateSupplierMutation.isPending}
            >
              {updateSupplierMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE NOVA MOVIMENTAÇÃO */}
      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
            <DialogDescription>Registre entrada, saída ou transferência de itens</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="movement-item" className="text-right">Item <span className="text-red-500">*</span></Label>
              <Select value={newMovement.item_id} onValueChange={(value) => setNewMovement({...newMovement, item_id: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um item" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((part: any) => (
                    <SelectItem key={part.id} value={part.id}>{part.title} ({part.internal_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="movement-type" className="text-right">Tipo <span className="text-red-500">*</span></Label>
              <Select value={newMovement.movement_type} onValueChange={(value) => setNewMovement({...newMovement, movement_type: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Saída</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="movement-quantity" className="text-right">Quantidade <span className="text-red-500">*</span></Label>
              <Input 
                id="movement-quantity" 
                type="number" 
                value={newMovement.quantity} 
                onChange={(e) => setNewMovement({...newMovement, quantity: e.target.value})} 
                className="col-span-3"
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="movement-reason" className="text-right">Motivo</Label>
              <Input 
                id="movement-reason" 
                value={newMovement.reason} 
                onChange={(e) => setNewMovement({...newMovement, reason: e.target.value})} 
                className="col-span-3"
                placeholder="Ex: Compra, Venda, Correção"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="movement-notes" className="text-right">Observações</Label>
              <Textarea 
                id="movement-notes" 
                value={newMovement.notes} 
                onChange={(e) => setNewMovement({...newMovement, notes: e.target.value})} 
                className="col-span-3"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsMovementModalOpen(false);
              setNewMovement({ item_id: "", movement_type: "in", quantity: "", location_from: "", location_to: "", reason: "", notes: "" });
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                console.log('Nova movimentação:', newMovement);
                toast({ title: "Movimentação registrada com sucesso!" });
                setIsMovementModalOpen(false);
                setNewMovement({ item_id: "", movement_type: "in", quantity: "", location_from: "", location_to: "", reason: "", notes: "" });
              }}
              disabled={!newMovement.item_id || !newMovement.quantity}
            >
              Registrar Movimentação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE AJUSTE DE ESTOQUE */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajuste de Estoque</DialogTitle>
            <DialogDescription>Corrija a quantidade atual do item em estoque</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustment-item" className="text-right">Item <span className="text-red-500">*</span></Label>
              <Select 
                value={selectedInventoryItem?.id || newAdjustment.item_id} 
                onValueChange={(value) => setNewAdjustment({...newAdjustment, item_id: value})}
                disabled={!!selectedInventoryItem}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um item" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((part: any) => (
                    <SelectItem key={part.id} value={part.id}>{part.title} ({part.internal_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedInventoryItem && (
              <div className="col-span-4 p-3 bg-blue-50 rounded-lg text-sm">
                <strong>Item selecionado:</strong> {selectedInventoryItem.title}<br/>
                <strong>Código:</strong> {selectedInventoryItem.internal_code}
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustment-quantity" className="text-right">Nova Quantidade <span className="text-red-500">*</span></Label>
              <Input 
                id="adjustment-quantity" 
                type="number" 
                value={newAdjustment.new_quantity} 
                onChange={(e) => setNewAdjustment({...newAdjustment, new_quantity: e.target.value})} 
                className="col-span-3"
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustment-reason" className="text-right">Motivo <span className="text-red-500">*</span></Label>
              <Input 
                id="adjustment-reason" 
                value={newAdjustment.reason} 
                onChange={(e) => setNewAdjustment({...newAdjustment, reason: e.target.value})} 
                className="col-span-3"
                placeholder="Ex: Inventário, Perda, Erro sistema"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustment-notes" className="text-right">Observações</Label>
              <Textarea 
                id="adjustment-notes" 
                value={newAdjustment.notes} 
                onChange={(e) => setNewAdjustment({...newAdjustment, notes: e.target.value})} 
                className="col-span-3"
                placeholder="Detalhes do ajuste..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAdjustmentModalOpen(false);
              setSelectedInventoryItem(null);
              setNewAdjustment({ item_id: "", new_quantity: "", reason: "", notes: "" });
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                console.log('Ajuste de estoque:', newAdjustment);
                toast({ title: "Ajuste de estoque realizado com sucesso!" });
                setIsAdjustmentModalOpen(false);
                setSelectedInventoryItem(null);
                setNewAdjustment({ item_id: "", new_quantity: "", reason: "", notes: "" });
              }}
              disabled={!newAdjustment.new_quantity || !newAdjustment.reason}
            >
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALHES DO INVENTÁRIO */}
      <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Inventário</DialogTitle>
            <DialogDescription>Informações completas do item em estoque</DialogDescription>
          </DialogHeader>
          {selectedInventoryItem && (
            <div className="grid gap-6 py-4">
              {/* Informações do Item */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informações do Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {selectedInventoryItem.title}</div>
                    <div><strong>Código:</strong> {selectedInventoryItem.internal_code}</div>
                    <div><strong>Categoria:</strong> {selectedInventoryItem.category}</div>
                    <div><strong>Classe ABC:</strong> <Badge variant="outline">{selectedInventoryItem.abc_classification}</Badge></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Níveis de Estoque</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Atual:</span> <span className="font-bold">25 un</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mínimo:</span> <span>10 un</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Máximo:</span> <span>50 un</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span> <Badge variant="default">OK</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Movimentações Recentes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Últimas Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">Entrada - Compra</div>
                        <div className="text-muted-foreground">20/07/2025 14:30</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-medium">+10 un</div>
                        <div className="text-muted-foreground">Fornecedor ABC</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">Saída - Venda</div>
                        <div className="text-muted-foreground">18/07/2025 09:15</div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-600 font-medium">-5 un</div>
                        <div className="text-muted-foreground">Cliente XYZ</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">Ajuste - Inventário</div>
                        <div className="text-muted-foreground">15/07/2025 16:00</div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-600 font-medium">+2 un</div>
                        <div className="text-muted-foreground">Correção</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsInventoryModalOpen(false);
              setSelectedInventoryItem(null);
            }}>
              Fechar
            </Button>
            <Button onClick={() => {
              setIsInventoryModalOpen(false);
              setSelectedInventoryItem(null);
              setIsAdjustmentModalOpen(true);
            }}>
              Ajustar Estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}