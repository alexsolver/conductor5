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
  const [isCreatePartOpen, setIsCreatePartOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isEditPartOpen, setIsEditPartOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [newPart, setNewPart] = useState({
    title: "",
    description: "",
    internal_code: "",
    manufacturer_code: "",
    cost_price: "",
    sale_price: "",
    margin_percentage: "",
    abc_classification: "B",
    category: "Geral"
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
  const createPartMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/parts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setIsCreatePartOpen(false);
      setNewPart({
        title: "", description: "", internal_code: "", manufacturer_code: "", cost_price: "",
        sale_price: "", margin_percentage: "", abc_classification: "B", category: "Geral"
      });
      toast({ title: "Peça criada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar peça", variant: "destructive" })
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
      setIsEditPartOpen(false);
      setEditingPart(null);
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
  const handleEditPart = (part: any) => {
    setEditingPart({
      ...part,
      cost_price: part.cost_price?.toString() || "",
      sale_price: part.sale_price?.toString() || "",
      margin_percentage: part.margin_percentage?.toString() || ""
    });
    setIsEditPartOpen(true);
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsEditSupplierOpen(true);
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

  // COMPONENTE GESTÃO DE PEÇAS - Render direto inline para evitar re-renderizações
  const renderPartsModule = () => (
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
        <Dialog open={isCreatePartOpen} onOpenChange={setIsCreatePartOpen}>
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
                <Label htmlFor="part-title" className="text-right">Título</Label>
                <Input 
                  id="part-title" 
                  value={newPart.title} 
                  onChange={(e) => setNewPart({...newPart, title: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-code" className="text-right">Código Interno</Label>
                <Input 
                  id="part-code" 
                  value={newPart.internal_code} 
                  onChange={(e) => setNewPart({...newPart, internal_code: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-manufacturer" className="text-right">Código Fabricante</Label>
                <Input 
                  id="part-manufacturer" 
                  value={newPart.manufacturer_code} 
                  onChange={(e) => setNewPart({...newPart, manufacturer_code: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-cost" className="text-right">Custo</Label>
                <Input 
                  id="part-cost" 
                  type="number" 
                  value={newPart.cost_price} 
                  onChange={(e) => setNewPart({...newPart, cost_price: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-sale" className="text-right">Venda</Label>
                <Input 
                  id="part-sale" 
                  type="number" 
                  value={newPart.sale_price} 
                  onChange={(e) => setNewPart({...newPart, sale_price: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part-classification" className="text-right">Classe ABC</Label>
                <Select value={newPart.abc_classification} onValueChange={(value) => setNewPart({...newPart, abc_classification: value})}>
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
                <Label htmlFor="part-description" className="text-right">Descrição</Label>
                <Textarea 
                  id="part-description" 
                  value={newPart.description} 
                  onChange={(e) => setNewPart({...newPart, description: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  createPartMutation.mutate(newPart);
                }} 
                disabled={createPartMutation.isPending}
              >
                {createPartMutation.isPending ? 'Criando...' : 'Criar Peça'}
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
                    <Button size="sm" variant="outline" onClick={() => handleEditPart(part)} title="Editar peça">
                      <Edit className="h-3 w-3" />
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
                  <Label htmlFor="supplier-name" className="text-right">Nome</Label>
                  <Input id="supplier-name" value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-code" className="text-right">Código</Label>
                <Input id="supplier-code" value={newSupplier.supplier_code} onChange={(e) => setNewSupplier({...newSupplier, supplier_code: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-document" className="text-right">CNPJ</Label>
                <Input id="supplier-document" value={newSupplier.document_number} onChange={(e) => setNewSupplier({...newSupplier, document_number: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-trade" className="text-right">Nome Fantasia</Label>
                <Input id="supplier-trade" value={newSupplier.trade_name} onChange={(e) => setNewSupplier({...newSupplier, trade_name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier-email" className="text-right">Email</Label>
                <Input id="supplier-email" type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} className="col-span-3" />
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
            variant={activeModule === 'parts' ? "default" : "outline"}
            onClick={() => setActiveModule('parts')}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Gestão de Peças
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
              {activeModule === 'parts' && 'Gestão de Peças'}
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
        {activeModule === 'parts' && renderPartsModule()}
        {activeModule === 'suppliers' && renderSuppliersModule()}
        {activeModule === 'inventory' && <GenericModule title="Controle de Estoque" description="Monitoramento completo de movimentações e níveis de estoque" />}
        {activeModule === 'purchasing' && <GenericModule title="Planejamento e Compras" description="Gestão de pedidos, orçamentos e fornecedores" />}
        {activeModule === 'services' && <GenericModule title="Integração Serviços" description="Sincronização com work orders e sistemas externos" />}
        {activeModule === 'logistics' && <LogisticsModule />}
        {activeModule === 'assets' && <AssetsModule />}
        {activeModule === 'pricing' && <PricingModule />}
        {activeModule === 'lpu' && <LpuModule />}
        {activeModule === 'compliance' && <ComplianceModule />}
      </div>

      {/* MODAL DE EDIÇÃO DE PEÇA */}
      <Dialog open={isEditPartOpen} onOpenChange={setIsEditPartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Peça</DialogTitle>
            <DialogDescription>Atualize as informações da peça</DialogDescription>
          </DialogHeader>
          {editingPart && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">Título</Label>
                <Input 
                  id="edit-title" 
                  value={editingPart.title} 
                  onChange={(e) => setEditingPart({...editingPart, title: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-code" className="text-right">Código</Label>
                <Input 
                  id="edit-code" 
                  value={editingPart.internal_code} 
                  onChange={(e) => setEditingPart({...editingPart, internal_code: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cost" className="text-right">Custo</Label>
                <Input 
                  id="edit-cost" 
                  type="number" 
                  value={editingPart.cost_price} 
                  onChange={(e) => setEditingPart({...editingPart, cost_price: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sale" className="text-right">Venda</Label>
                <Input 
                  id="edit-sale" 
                  type="number" 
                  value={editingPart.sale_price} 
                  onChange={(e) => setEditingPart({...editingPart, sale_price: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-classification" className="text-right">Classe ABC</Label>
                <Select 
                  value={editingPart.abc_classification} 
                  onValueChange={(value) => setEditingPart({...editingPart, abc_classification: value})}
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
                  value={editingPart.description} 
                  onChange={(e) => setEditingPart({...editingPart, description: e.target.value})} 
                  className="col-span-3" 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={() => updatePartMutation.mutate({id: editingPart?.id, updates: editingPart})} 
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
    </div>
  );
}