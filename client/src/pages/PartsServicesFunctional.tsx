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
  internal_code: z.string()
    .min(1, "Código interno obrigatório")
    .max(100, "Código interno muito longo")
    .regex(/^[A-Za-z0-9\-_]+$/, "Use apenas letras, números, hífen e underscore"),
  manufacturer_code: z.string()
    .min(1, "Código fabricante obrigatório")
    .max(100, "Código fabricante muito longo"),
  title: z.string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(255, "Título muito longo"),
  description: z.string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(1000, "Descrição muito longa"),
  cost_price: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Preço de custo deve ser um número positivo"),
  sale_price: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Preço de venda deve ser um número positivo"),
  margin_percentage: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, "Margem deve ser entre 0 e 100%"),
  abc_classification: z.enum(["A", "B", "C"], {
    errorMap: () => ({ message: "Classificação deve ser A, B ou C" })
  }),
  weight_kg: z.string().optional()
    .refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), "Peso deve ser um número positivo"),
  material: z.string().max(100, "Material muito longo").optional(),
  voltage: z.string().max(50, "Voltagem muito longa").optional(),
  power_watts: z.string().optional()
    .refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), "Potência deve ser um número positivo")
}).refine(data => parseFloat(data.sale_price) > parseFloat(data.cost_price), {
  message: "Preço de venda deve ser maior que o preço de custo",
  path: ["sale_price"]
});

const supplierSchema = z.object({
  supplier_code: z.string()
    .min(1, "Código obrigatório")
    .max(100, "Código muito longo")
    .regex(/^[A-Za-z0-9\-_]+$/, "Use apenas letras, números, hífen e underscore"),
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(255, "Nome muito longo"),
  trade_name: z.string()
    .min(2, "Nome fantasia deve ter pelo menos 2 caracteres")
    .max(255, "Nome fantasia muito longo"),
  document_number: z.string()
    .min(14, "CNPJ deve ter 14 dígitos")
    .max(18, "CNPJ inválido")
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, "Formato de CNPJ inválido"),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email muito longo"),
  phone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(20, "Telefone muito longo")
    .regex(/^[\d\s\(\)\-\+]+$/, "Formato de telefone inválido"),
  address: z.string()
    .min(10, "Endereço deve ter pelo menos 10 caracteres")
    .max(500, "Endereço muito longo"),
  city: z.string()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(100, "Nome da cidade muito longo"),
  state: z.string()
    .length(2, "Estado deve ter 2 caracteres (ex: SP)")
    .regex(/^[A-Z]{2}$/, "Estado deve estar em maiúsculas (ex: SP)"),
  country: z.string()
    .max(100, "Nome do país muito longo")
    .default("Brasil"),
  payment_terms: z.string()
    .min(5, "Condições de pagamento devem ter pelo menos 5 caracteres")
    .max(255, "Condições de pagamento muito longas"),
  lead_time_days: z.number()
    .min(1, "Prazo deve ser pelo menos 1 dia")
    .max(365, "Prazo não pode ser superior a 1 ano"),
  supplier_type: z.enum(["regular", "preferred"], {
    errorMap: () => ({ message: "Tipo deve ser 'regular' ou 'preferred'" })
  })
});

export default function PartsServicesFunctional() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeModule, setActiveModule] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries para dados das APIs com tratamento de erro adequado
  const { data: dashboardStats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['/api/parts-services/dashboard/stats'],
    refetchInterval: 30000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const { data: parts, isLoading: isLoadingParts, error: partsError } = useQuery({
    queryKey: ['/api/parts-services/parts'],
    retry: 3
  });

  const { data: suppliers, isLoading: isLoadingSuppliers, error: suppliersError } = useQuery({
    queryKey: ['/api/parts-services/suppliers'],
    retry: 3
  });

  const { data: inventory, isLoading: isLoadingInventory, error: inventoryError } = useQuery({
    queryKey: ['/api/parts-services/inventory'],
    retry: 3
  });

  const { data: purchaseOrders, isLoading: isLoadingPurchaseOrders } = useQuery({
    queryKey: ['/api/parts-services/purchase-orders']
  });

  const { data: serviceIntegrations, isLoading: isLoadingServiceIntegrations } = useQuery({
    queryKey: ['/api/parts-services/service-integrations']
  });

  const { data: transfers, isLoading: isLoadingTransfers } = useQuery({
    queryKey: ['/api/parts-services/transfers']
  });

  const { data: assetsComplete, isLoading: isLoadingAssetsComplete } = useQuery({
    queryKey: ['/api/parts-services/assets-complete']
  });

  const { data: priceListsComplete, isLoading: isLoadingPriceListsComplete } = useQuery({
    queryKey: ['/api/parts-services/price-lists-complete']
  });

  const { data: pricingTables, isLoading: isLoadingPricingTables } = useQuery({
    queryKey: ['/api/parts-services/pricing-tables']
  });

  const { data: auditLogsComplete, isLoading: isLoadingAuditLogsComplete } = useQuery({
    queryKey: ['/api/parts-services/audit-logs-complete']
  });

  const { data: budgetSimulations, isLoading: isLoadingBudgetSimulations } = useQuery({
    queryKey: ['/api/parts-services/budget-simulations']
  });

  // Filtro de peças por termo de busca com verificação de array
  const filteredParts = Array.isArray(parts) ? parts.filter((part: any) => 
    part.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.internal_code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

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
              {isLoadingStats ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : statsError ? (
                <span className="text-red-500">Erro</span>
              ) : (
                (dashboardStats as any)?.totalParts?.toLocaleString() || '0'
              )}
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
              {isLoadingStats ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : statsError ? (
                <span className="text-red-500">Erro</span>
              ) : (
                (dashboardStats as any)?.totalSuppliers?.toLocaleString() || '0'
              )}
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
              {isLoadingStats ? '...' : (dashboardStats as any)?.totalOrders || 0}
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
              {isLoadingStats ? '...' : (dashboardStats as any)?.totalSimulations || 0}
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
                    <CardDescription>
                      {part.internal_code} | {part.partNumber || 'N/A'}
                    </CardDescription>
                  </div>
                  <Badge variant={part.abc_classification === 'A' ? 'destructive' : 
                                 part.abc_classification === 'B' ? 'default' : 'secondary'}>
                    {part.abc_classification}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">{part.description}</p>

                  {part.category && (
                    <div className="flex justify-between text-sm">
                      <span>Categoria:</span>
                      <span className="font-medium">{part.category}</span>
                    </div>
                  )}

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

                  {(part.weight_kg || part.material || part.voltage || part.power_watts) && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Especificações:</p>
                      {part.weight_kg && (
                        <p className="text-xs">Peso: {part.weight_kg}kg</p>
                      )}
                      {part.material && (
                        <p className="text-xs">Material: {part.material}</p>
                      )}
                      {part.voltage && (
                        <p className="text-xs">Voltagem: {part.voltage}</p>
                      )}
                      {part.power_watts && (
                        <p className="text-xs">Potência: {part.power_watts}W</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <EditPartDialog part={part} />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta peça?')) {
                          deletePartMutation.mutate(part.id);
                        }
                      }}
                      disabled={deletePartMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {deletePartMutation.isPending ? 'Excluindo...' : 'Excluir'}
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
              {Array.isArray(suppliers) ? suppliers.map((supplier: any) => (
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

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avaliação Geral:</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{parseFloat(supplier.overall_rating || 0).toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{parseFloat(supplier.quality_rating || 0).toFixed(1)}</div>
                          <div className="text-muted-foreground">Qualidade</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{parseFloat(supplier.delivery_rating || 0).toFixed(1)}</div>
                          <div className="text-muted-foreground">Entrega</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{parseFloat(supplier.price_rating || 0).toFixed(1)}</div>
                          <div className="text-muted-foreground">Preço</div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <EditSupplierDialog supplier={supplier} />
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

// ===== COMPONENTE DE EDIÇÃO DE PEÇA =====
function EditPartDialog({ part }: { part: any }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof partSchema>>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      internal_code: part.internal_code || "",
      manufacturer_code: part.manufacturer_code || "",
      title: part.title || "",
      description: part.description || "",
      cost_price: part.cost_price || "",
      sale_price: part.sale_price || "",
      margin_percentage: part.margin_percentage || "",
      abc_classification: part.abc_classification || "B",
      weight_kg: part.weight_kg || "",
      material: part.material || "",
      voltage: part.voltage || "",
      power_watts: part.power_watts || ""
    }
  });

  const updatePartMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/parts-services/parts/${part.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/dashboard/stats'] });
      setOpen(false);
      toast({ title: "Peça atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar peça", 
        description: error.message || "Erro interno do servidor",
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: z.infer<typeof partSchema>) => {
    updatePartMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-3 h-3 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Peça</DialogTitle>
          <DialogDescription>
            Modifique os dados da peça {part.title}
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Aço, Alumínio, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="voltage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voltagem</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="220V" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="power_watts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potência (Watts)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="100" />
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
                disabled={updatePartMutation.isPending}
              >
                {updatePartMutation.isPending ? 'Atualizando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Functional component that manages parts and services data with CRUD operations and validation.