import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Search, 
  Plus, 
  Package, 
  Warehouse, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload
} from "lucide-react";

// Form schemas
const itemFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  internalCode: z.string().min(1, "Código interno é obrigatório"),
  manufacturerCode: z.string().min(1, "Código do fabricante é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  costPrice: z.string().min(1, "Preço de custo é obrigatório"),
  salePrice: z.string().min(1, "Preço de venda é obrigatório"),
  status: z.string().default("active"),
});

const supplierFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  supplierCode: z.string().min(1, "Código é obrigatório"),
  tradeName: z.string().min(1, "Nome fantasia é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  documentNumber: z.string().optional(),
  address: z.string().optional(),
  category: z.string().optional(),
  status: z.string().default("active"),
});

type Item = {
  id: string;
  title: string;
  description?: string;
  internalCode: string;
  manufacturerCode: string;
  type: string;
  category: string;
  costPrice: number;
  salePrice: number;
  status: string;
  createdAt: string;
};

type Supplier = {
  id: string;
  name: string;
  supplierCode: string;
  tradeName: string;
  email: string;
  phone?: string;
  documentNumber?: string;
  address?: string;
  category?: string;
  status: string;
  createdAt: string;
};

type DashboardStats = {
  totalItems: number;
  totalSuppliers: number;
  lowStockItems: number;
  pendingOrders: number;
  totalValue: number;
};

export default function PartsServices() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchItems, setSearchItems] = useState("");
  const [searchSuppliers, setSearchSuppliers] = useState("");
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/parts-services/dashboard/stats'],
  });

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/parts-services/items', searchItems, filterStatus],
    queryFn: () => apiRequest('GET', `/api/parts-services/items?search=${searchItems}&status=${filterStatus === 'all' ? '' : filterStatus}`),
  });

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['/api/parts-services/suppliers', searchSuppliers, filterStatus],
    queryFn: () => apiRequest('GET', `/api/parts-services/suppliers?search=${searchSuppliers}&status=${filterStatus === 'all' ? '' : filterStatus}`),
  });

  const { data: stockLevels } = useQuery({
    queryKey: ['/api/parts-services/stock-levels'],
  });

  // Forms
  const itemForm = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      title: "",
      description: "",
      internalCode: "",
      manufacturerCode: "",
      type: "",
      category: "",
      costPrice: "",
      salePrice: "",
      status: "active",
    },
  });

  const supplierForm = useForm<z.infer<typeof supplierFormSchema>>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      supplierCode: "",
      tradeName: "",
      email: "",
      phone: "",
      documentNumber: "",
      address: "",
      category: "",
      status: "active",
    },
  });

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: (data: z.infer<typeof itemFormSchema>) =>
      apiRequest('POST', '/api/parts-services/items', {
        ...data,
        costPrice: parseFloat(data.costPrice),
        salePrice: parseFloat(data.salePrice),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      toast({ title: "Item criado com sucesso!" });
      setIsCreateItemOpen(false);
      itemForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar item", variant: "destructive" });
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: z.infer<typeof supplierFormSchema>) =>
      apiRequest('POST', '/api/parts-services/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      toast({ title: "Fornecedor criado com sucesso!" });
      setIsCreateSupplierOpen(false);
      supplierForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar fornecedor", variant: "destructive" });
    },
  });

  const onSubmitItem = (values: z.infer<typeof itemFormSchema>) => {
    createItemMutation.mutate(values);
  };

  const onSubmitSupplier = (values: z.infer<typeof supplierFormSchema>) => {
    createSupplierMutation.mutate(values);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      discontinued: "destructive",
    };
    
    const labels: Record<string, string> = {
      active: "Ativo",
      inactive: "Inativo",
      discontinued: "Descontinuado",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Peças e Serviços</h1>
          <p className="text-muted-foreground">
            Gestão completa de peças, estoque e fornecedores
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="items">Peças</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats?.lowStockItems || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(stats?.totalValue || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar peças..."
                  value={searchItems}
                  onChange={(e) => setSearchItems(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="discontinued">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Peça
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Nova Peça</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova peça ao catálogo
                  </DialogDescription>
                </DialogHeader>
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
                    <FormField
                      control={itemForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome da peça" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="internalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Interno *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="P001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="manufacturerCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Fabricante *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="MFG001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="part">Peça</SelectItem>
                                <SelectItem value="service">Serviço</SelectItem>
                                <SelectItem value="consumable">Consumível</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mechanical">Mecânica</SelectItem>
                                <SelectItem value="electrical">Elétrica</SelectItem>
                                <SelectItem value="electronic">Eletrônica</SelectItem>
                                <SelectItem value="hydraulic">Hidráulica</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="costPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço de Custo *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="salePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço de Venda *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={itemForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descrição da peça" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createItemMutation.isPending}>
                        {createItemMutation.isPending ? "Criando..." : "Criar Peça"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              {itemsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Carregando peças...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {itemsData?.items?.map((item: Item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.internalCode} • {item.manufacturerCode}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{item.type}</Badge>
                            <Badge variant="outline">{item.category}</Badge>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Custo</p>
                          <p className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.costPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Venda</p>
                          <p className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.salePrice)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fornecedores..."
                  value={searchSuppliers}
                  onChange={(e) => setSearchSuppliers(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Fornecedor</DialogTitle>
                  <DialogDescription>
                    Adicione um novo fornecedor ao sistema
                  </DialogDescription>
                </DialogHeader>
                <Form {...supplierForm}>
                  <form onSubmit={supplierForm.handleSubmit(onSubmitSupplier)} className="space-y-4">
                    <FormField
                      control={supplierForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome da empresa" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supplierForm.control}
                      name="supplierCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="FORN001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supplierForm.control}
                      name="tradeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome comercial" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supplierForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="email@fornecedor.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supplierForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(11) 99999-9999" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supplierForm.control}
                      name="documentNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="00.000.000/0000-00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createSupplierMutation.isPending}>
                        {createSupplierMutation.isPending ? "Criando..." : "Criar Fornecedor"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              {suppliersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Carregando fornecedores...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {suppliersData?.suppliers?.map((supplier: Supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium">{supplier.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {supplier.supplierCode} • {supplier.email}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(supplier.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Estoque</CardTitle>
              <CardDescription>
                Visualização dos níveis de estoque por localização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Controle de estoque em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>
                Análises e relatórios do módulo de peças e serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Relatórios em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}