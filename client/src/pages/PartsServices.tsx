import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Package, Warehouse, Users, ShoppingCart, 
         Star, MapPin, Building, DollarSign, TrendingUp, Shield, 
         Monitor, Wrench, Truck, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, 
         DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// SISTEMA UNIFICADO DE PEÇAS E SERVIÇOS
// Consolidação dos 4 módulos: Simple → Functional → Management → Enterprise
export default function PartsServices() {
  const [activeModule, setActiveModule] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePartOpen, setIsCreatePartOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newPart, setNewPart] = useState({
    title: "",
    description: "",
    internal_code: "",
    cost_price: "",
    sale_price: "",
    margin_percentage: "",
    abc_classification: "B",
    category: "Geral"
  });
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    contact_person: "",
    address: ""
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
    supplier.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // MUTATIONS PARA CRUD
  const createPartMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/parts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setIsCreatePartOpen(false);
      setNewPart({
        title: "", description: "", internal_code: "", cost_price: "",
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
        name: "", cnpj: "", email: "", phone: "", contact_person: "", address: ""
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

  // COMPONENTE GESTÃO DE PEÇAS
  const PartsModule = () => (
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
                <Label htmlFor="title" className="text-right">Título</Label>
                <Input id="title" value={newPart.title} onChange={(e) => setNewPart({...newPart, title: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">Código</Label>
                <Input id="code" value={newPart.internal_code} onChange={(e) => setNewPart({...newPart, internal_code: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">Custo</Label>
                <Input id="cost" type="number" value={newPart.cost_price} onChange={(e) => setNewPart({...newPart, cost_price: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sale" className="text-right">Venda</Label>
                <Input id="sale" type="number" value={newPart.sale_price} onChange={(e) => setNewPart({...newPart, sale_price: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="classification" className="text-right">Classe ABC</Label>
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
                <Label htmlFor="description" className="text-right">Descrição</Label>
                <Textarea id="description" value={newPart.description} onChange={(e) => setNewPart({...newPart, description: e.target.value})} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => createPartMutation.mutate(newPart)} disabled={createPartMutation.isPending}>
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
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" 
                            onClick={() => {
                              if(window.confirm('Tem certeza que deseja excluir esta peça?')) {
                                deletePartMutation.mutate(part.id);
                              }
                            }}>
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

  // COMPONENTE FORNECEDORES
  const SuppliersModule = () => (
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cnpj" className="text-right">CNPJ</Label>
                <Input id="cnpj" value={newSupplier.cnpj} onChange={(e) => setNewSupplier({...newSupplier, cnpj: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Telefone</Label>
                <Input id="phone" value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-right">Contato</Label>
                <Input id="contact" value={newSupplier.contact_person} onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => createSupplierMutation.mutate(newSupplier)} disabled={createSupplierMutation.isPending}>
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
                    <CardDescription>{supplier.cnpj}</CardDescription>
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
                    <span>Contato:</span>
                    <span className="font-medium">{supplier.contact_person}</span>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
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

      {/* Navigation Tabs - 11 Módulos Enterprise */}
      <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="parts">Peças</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="purchasing">Compras</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>

        {/* Content Modules */}
        <TabsContent value="overview">
          <OverviewModule />
        </TabsContent>

        <TabsContent value="parts">
          <PartsModule />
        </TabsContent>

        <TabsContent value="suppliers">
          <SuppliersModule />
        </TabsContent>

        <TabsContent value="inventory">
          <GenericModule title="Controle de Estoque" description="Monitoramento completo de movimentações e níveis de estoque" />
        </TabsContent>

        <TabsContent value="purchasing">
          <GenericModule title="Planejamento e Compras" description="Gestão de pedidos, orçamentos e fornecedores" />
        </TabsContent>

        <TabsContent value="services">
          <GenericModule title="Integração Serviços" description="Sincronização com work orders e sistemas externos" />
        </TabsContent>
      </Tabs>
    </div>
  );
}