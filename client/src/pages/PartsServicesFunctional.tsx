import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Package, Users, Warehouse, ShoppingCart, Plus, Star, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Schemas de validação
const partSchema = z.object({
  internal_code: z.string().min(1, "Código interno obrigatório"),
  manufacturer_code: z.string().min(1, "Código fabricante obrigatório"), 
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  cost_price: z.string().min(1, "Preço de custo obrigatório"),
  sale_price: z.string().min(1, "Preço de venda obrigatório"),
  margin_percentage: z.string().min(1, "Margem obrigatória"),
  abc_classification: z.enum(["A", "B", "C"]),
  weight_kg: z.string().optional(),
  material: z.string().optional(),
  voltage: z.string().optional(),
  power_watts: z.string().optional()
});

const supplierSchema = z.object({
  supplier_code: z.string().min(1, "Código obrigatório"),
  name: z.string().min(1, "Nome obrigatório"),
  trade_name: z.string().min(1, "Nome fantasia obrigatório"),
  document_number: z.string().min(1, "CNPJ obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone obrigatório"),
  address: z.string().min(1, "Endereço obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().min(2, "Estado obrigatório"),
  country: z.string().default("Brasil"),
  payment_terms: z.string().min(1, "Condições de pagamento obrigatórias"),
  lead_time_days: z.number().min(1, "Prazo de entrega obrigatório"),
  supplier_type: z.enum(["regular", "preferred"])
});

export default function PartsServicesFunctional() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries para dados reais das APIs
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/parts-services/dashboard/stats'],
    refetchInterval: 30000
  });

  const { data: parts, isLoading: isLoadingParts } = useQuery({
    queryKey: ['/api/parts-services/parts']
  });

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['/api/parts-services/suppliers']
  });

  // Filtro de peças por termo de busca
  const filteredParts = parts?.filter((part: any) => 
    part.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.internal_code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Mutations para CRUD
  const createPartMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/parts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      toast({ title: "Peça criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar peça", variant: "destructive" });
    }
  });

  const deletePartMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/parts-services/parts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      toast({ title: "Peça excluída com sucesso!" });
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      toast({ title: "Fornecedor criado com sucesso!" });
    }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/parts-services/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      toast({ title: "Fornecedor excluído com sucesso!" });
    }
  });

  return (
    <div className="p-4 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Sistema Parts & Services</h1>
        <p className="text-gray-600">Gestão completa com operações CRUD funcionais</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : dashboardStats?.totalParts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Peças ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSuppliers ? '...' : dashboardStats?.totalSuppliers || 0}
            </div>
            <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : dashboardStats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">Pedidos de compra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulações</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : dashboardStats?.totalSimulations || 0}
            </div>
            <p className="text-xs text-muted-foreground">Orçamentos simulados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com dados reais */}
      <Tabs defaultValue="parts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parts">Gestão de Peças</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
        </TabsList>

        {/* Tab de Peças */}
        <TabsContent value="parts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Catálogo de Peças</h2>
            <CreatePartDialog />
          </div>

          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar peças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
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
                        <span className="font-medium">R$ {parseFloat(part.cost_price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Venda:</span>
                        <span className="font-medium text-green-600">R$ {parseFloat(part.sale_price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Margem:</span>
                        <span className="font-medium">{part.margin_percentage}%</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta peça?')) {
                              deletePartMutation.mutate(part.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab de Fornecedores */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Rede de Fornecedores</h2>
            <CreateSupplierDialog />
          </div>

          {isLoadingSuppliers ? (
            <div className="text-center py-8">Carregando fornecedores...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers?.map((supplier: any) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{supplier.trade_name}</CardTitle>
                        <CardDescription>{supplier.supplier_code}</CardDescription>
                      </div>
                      <Badge variant={supplier.supplier_type === 'preferred' ? 'default' : 'secondary'}>
                        {supplier.supplier_type === 'preferred' ? 'Preferencial' : 'Regular'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{supplier.name}</p>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-3 h-3 mr-1" />
                        {supplier.phone}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 mr-1" />
                        {supplier.email}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        {supplier.city}, {supplier.state}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
                              deleteSupplierMutation.mutate(supplier.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== COMPONENTE DE CRIAÇÃO DE PEÇA =====
function CreatePartDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof partSchema>>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      internal_code: "",
      manufacturer_code: "",
      title: "",
      description: "",
      cost_price: "",
      sale_price: "",
      margin_percentage: "",
      abc_classification: "B",
      weight_kg: "",
      material: "",
      voltage: "",
      power_watts: ""
    }
  });

  const createPartMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/parts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setOpen(false);
      form.reset();
      toast({ title: "Peça criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar peça", variant: "destructive" });
    }
  });

  const onSubmit = (data: z.infer<typeof partSchema>) => {
    createPartMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Peça
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Peça</DialogTitle>
          <DialogDescription>
            Adicione uma nova peça ao catálogo
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="internal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Interno *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: PEC001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="manufacturer_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Fabricante *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: FAB-123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
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
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Descrição detalhada da peça" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="margin_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margem (%) *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="abc_classification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classificação ABC</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A - Alto valor</SelectItem>
                      <SelectItem value="B">B - Médio valor</SelectItem>
                      <SelectItem value="C">C - Baixo valor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createPartMutation.isPending}
              >
                {createPartMutation.isPending ? 'Criando...' : 'Criar Peça'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ===== COMPONENTE DE CRIAÇÃO DE FORNECEDOR =====
function CreateSupplierDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplier_code: "",
      name: "",
      trade_name: "",
      document_number: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "Brasil",
      payment_terms: "",
      lead_time_days: 1,
      supplier_type: "regular"
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setOpen(false);
      form.reset();
      toast({ title: "Fornecedor criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar fornecedor", variant: "destructive" });
    }
  });

  const onSubmit = (data: z.infer<typeof supplierSchema>) => {
    createSupplierMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Adicione um novo fornecedor ao sistema
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Fornecedor *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: FORN001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="preferred">Preferencial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome oficial da empresa" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trade_name"
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
            </div>

            <FormField
              control={form.control}
              name="document_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="00.000.000/0000-00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="contato@fornecedor.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(11) 9999-9999" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="São Paulo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SP" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lead_time_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (dias) *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder="7"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createSupplierMutation.isPending}
              >
                {createSupplierMutation.isPending ? 'Criando...' : 'Criar Fornecedor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}