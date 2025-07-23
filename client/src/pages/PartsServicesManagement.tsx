import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Package, 
  Warehouse, 
  Users, 
  ShoppingCart, 
  Wrench, 
  Truck, 
  Shield, 
  DollarSign,
  TrendingUp,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  FileText,
  Cog,
  Activity,
  MapPin,
  QrCode,
  Building
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// ===== INTERFACES DOS 11 MÓDULOS =====

// MÓDULO 1: GESTÃO DE PEÇAS
interface Part {
  id: string;
  internal_code: string;
  manufacturer_code: string;
  title: string;
  description: string;
  category_id: string;
  cost_price: number;
  sale_price: number;
  abc_classification: string;
  is_active: boolean;
  technical_specs: any;
  dimensions: string;
  weight_kg: number;
  material: string;
  voltage: string;
  power_watts: number;
  barcode?: string;
  images?: string[];
  manuals?: string[];
}

// MÓDULO 2: CONTROLE DE ESTOQUE
interface Inventory {
  id: string;
  part_id: string;
  location_id: string;
  current_quantity: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  economic_lot: number;
  reserved_quantity: number;
  consigned_quantity: number;
  lot_number?: string;
  serial_number?: string;
  expiry_date?: string;
  part?: Part;
}

// MÓDULO 3: GESTÃO DE FORNECEDORES
interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  email: string;
  phone: string;
  quality_rating: number;
  delivery_rating: number;
  price_rating: number;
  overall_rating: number;
  is_active: boolean;
}

// MÓDULO 4: PLANEJAMENTO E COMPRAS
interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  order_date: string;
  expected_delivery: string;
  total_amount: number;
}

// MÓDULO 5: INTEGRAÇÃO COM SERVIÇOS
interface ServiceIntegration {
  id: string;
  integration_name: string;
  service_type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  last_sync: string;
}

// MÓDULO 6: LOGÍSTICA E DISTRIBUIÇÃO
interface Transfer {
  id: string;
  transfer_number: string;
  from_location: string;
  to_location: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  transfer_type: 'INTERNAL' | 'CUSTOMER' | 'TECHNICIAN';
}

// MÓDULO 7: CONTROLE DE ATIVOS
interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  category: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';
  acquisition_date: string;
  warranty_expiry: string;
}

// MÓDULO 8: LISTA DE PREÇOS UNITÁRIOS (LPU)
interface PriceList {
  id: string;
  name: string;
  version: string;
  effective_date: string;
  expiry_date: string;
  customer_id?: string;
  contract_id?: string;
  is_active: boolean;
}

// MÓDULO 9: FUNCIONALIDADES AVANÇADAS DE PREÇO
interface PricingTable {
  id: string;
  name: string;
  version: string;
  client_segment: string;
  region: string;
  effective_date: string;
}

// MÓDULO 10: COMPLIANCE E AUDITORIA
interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string;
  timestamp: string;
  changes: any;
}

// MÓDULO 11: DIFERENCIAIS AVANÇADOS
interface BudgetSimulation {
  id: string;
  customer_id: string;
  project_name: string;
  price_list_id: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
  total_estimated: number;
  validity_days: number;
}

// ===== SCHEMAS DE VALIDAÇÃO =====
const partFormSchema = z.object({
  internal_code: z.string().min(1, 'Código interno obrigatório'),
  manufacturer_code: z.string().min(1, 'Código do fabricante obrigatório'),
  title: z.string().min(1, 'Nome da peça obrigatório'),
  description: z.string().min(1, 'Descrição obrigatória'),
  category_id: z.string().min(1, 'Categoria obrigatória'),
  cost_price: z.number().min(0, 'Preço de custo deve ser positivo'),
  sale_price: z.number().min(0, 'Preço de venda deve ser positivo'),
  abc_classification: z.enum(['A', 'B', 'C']),
});

const PartsServicesManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ===== QUERIES PARA OS DADOS =====
  const { data: partsData = [], isLoading: partsLoading } = useQuery({
    queryKey: ['/api/parts-services/parts'],
    enabled: activeTab === 'parts' || activeTab === 'overview'
  });

  const { data: suppliersData = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['/api/parts-services/suppliers'],
    enabled: activeTab === 'suppliers' || activeTab === 'overview'
  });

  const { data: inventoryData = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/parts-services/inventory'],
    enabled: activeTab === 'inventory' || activeTab === 'overview'
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/parts-services/dashboard/stats'],
    enabled: activeTab === 'overview'
  });

  // ===== MUTATIONS PARA CRUD =====
  const createPartMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/parts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/parts'] });
      toast({ title: 'Sucesso', description: 'Peça criada com sucesso!' });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar peça', variant: 'destructive' });
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/parts-services/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts-services/suppliers'] });
      toast({ title: 'Sucesso', description: 'Fornecedor criado com sucesso!' });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar fornecedor', variant: 'destructive' });
    }
  });

  // ===== FILTROS =====
  const filteredParts = partsData.filter((part: Part) =>
    part.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.internal_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliersData.filter((supplier: Supplier) =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventory = inventoryData.filter((item: Inventory) =>
    item.part?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.part?.internal_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== COMPONENTES =====

  // Dashboard de estatísticas
  const DashboardStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{partsData.length}</div>
          <p className="text-xs text-muted-foreground">
            +{partsData.filter((p: Part) => p.is_active).length} ativas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{suppliersData.length}</div>
          <p className="text-xs text-muted-foreground">
            {suppliersData.filter((s: Supplier) => Number(s.overall_rating) >= 4.0).length} com alta avaliação
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {inventoryData.reduce((acc: number, item: Inventory) => acc + item.current_quantity, 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {inventoryData.filter((i: Inventory) => i.current_quantity <= i.reorder_point).length} em ponto de reposição
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {dashboardStats?.totalInventoryValue ? Number(dashboardStats.totalInventoryValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor total em estoque
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Barra de busca e ações
  const SearchAndActions = () => (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
      </div>
      <Button 
        onClick={() => setIsCreateDialogOpen(true)}
        className="flex items-center space-x-2"
      >
        <Plus className="h-4 w-4" />
        <span>Adicionar</span>
      </Button>
    </div>
  );

  // Tabela de peças
  const PartsTable = () => (
    <div className="space-y-4">
      <SearchAndActions />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Preço Custo</TableHead>
            <TableHead>Preço Venda</TableHead>
            <TableHead>Classificação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredParts.map((part: Part) => (
            <TableRow key={part.id}>
              <TableCell className="font-medium">{part.internal_code}</TableCell>
              <TableCell>{part.title}</TableCell>
              <TableCell>{part.category_id}</TableCell>
              <TableCell>R$ {Number(part.cost_price || 0).toFixed(2)}</TableCell>
              <TableCell>R$ {Number(part.sale_price || 0).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={part.abc_classification === 'A' ? 'destructive' : 
                                part.abc_classification === 'B' ? 'default' : 'secondary'}>
                  {part.abc_classification}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={part.is_active ? 'default' : 'secondary'}>
                  {part.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Tabela de fornecedores
  const SuppliersTable = () => (
    <div className="space-y-4">
      <SearchAndActions />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Avaliação Geral</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSuppliers.map((supplier: Supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
              <TableCell>{supplier.name}</TableCell>
              <TableCell>{supplier.email}</TableCell>
              <TableCell>{supplier.phone}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <span>{Number(supplier.overall_rating || 0).toFixed(1)}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${i < Math.floor(Number(supplier.overall_rating || 0)) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                  {supplier.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Tabela de estoque
  const InventoryTable = () => (
    <div className="space-y-4">
      <SearchAndActions />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Peça</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Qtd Atual</TableHead>
            <TableHead>Estoque Mínimo</TableHead>
            <TableHead>Ponto Reposição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInventory.map((item: Inventory) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{item.part?.title || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{item.part?.internal_code || 'N/A'}</div>
                </div>
              </TableCell>
              <TableCell>{item.location_id}</TableCell>
              <TableCell className="font-medium">{item.current_quantity}</TableCell>
              <TableCell>{item.minimum_stock}</TableCell>
              <TableCell>{item.reorder_point}</TableCell>
              <TableCell>
                {item.current_quantity <= item.reorder_point ? (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Repor</span>
                  </Badge>
                ) : item.current_quantity <= item.minimum_stock ? (
                  <Badge variant="default" className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Baixo</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>OK</span>
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Formulário de criação dinâmico
  const CreateItemDialog = () => {
    const partForm = useForm({
      resolver: zodResolver(partFormSchema),
      defaultValues: {
        internal_code: '',
        manufacturer_code: '',
        title: '',
        description: '',
        category_id: '',
        cost_price: 0,
        sale_price: 0,
        abc_classification: 'C' as const
      }
    });

    const onSubmitPart = (data: any) => {
      createPartMutation.mutate(data);
    };

    const onSubmitSupplier = (data: any) => {
      createSupplierMutation.mutate({
        ...data,
        quality_rating: 5.0,
        delivery_rating: 5.0,
        price_rating: 5.0,
        overall_rating: 5.0,
        is_active: true
      });
    };

    const getDialogTitle = () => {
      switch (activeTab) {
        case 'parts': return 'Nova Peça';
        case 'suppliers': return 'Novo Fornecedor';
        case 'inventory': return 'Novo Item de Estoque';
        case 'purchases': return 'Nova Ordem de Compra';
        case 'services': return 'Nova Integração de Serviço';
        case 'logistics': return 'Nova Transferência';
        case 'assets': return 'Novo Ativo';
        case 'pricing': return 'Nova Lista de Preços';
        case 'advanced': return 'Nova Tabela de Preços';
        case 'compliance': return 'Novo Log de Auditoria';
        case 'reports': return 'Nova Simulação';
        default: return 'Novo Item';
      }
    };

    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo item
            </DialogDescription>
          </DialogHeader>

          {activeTab === 'parts' && (
            <Form {...partForm}>
              <form onSubmit={partForm.handleSubmit(onSubmitPart)} className="space-y-4">
                <FormField
                  control={partForm.control}
                  name="internal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Interno</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: PCA001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partForm.control}
                  name="manufacturer_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Fabricante</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: MFG123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Peça</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Resistor 10K" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição técnica da peça" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eletronica">Eletrônica</SelectItem>
                            <SelectItem value="mecanica">Mecânica</SelectItem>
                            <SelectItem value="hidraulica">Hidráulica</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={partForm.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={partForm.control}
                    name="sale_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={partForm.control}
                  name="abc_classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classificação ABC</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A - Alta criticidade</SelectItem>
                            <SelectItem value="B">B - Média criticidade</SelectItem>
                            <SelectItem value="C">C - Baixa criticidade</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPartMutation.isPending}>
                    {createPartMutation.isPending ? 'Criando...' : 'Criar Peça'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier_code">Código do Fornecedor</Label>
                <Input id="supplier_code" placeholder="Ex: FOR001" />
              </div>
              <div>
                <Label htmlFor="name">Nome do Fornecedor</Label>
                <Input id="name" placeholder="Ex: Empresa Fornecedora Ltda" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="fornecedor@empresa.com" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(11) 99999-9999" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    const supplierData = {
                      supplier_code: (document.getElementById('supplier_code') as HTMLInputElement)?.value,
                      name: (document.getElementById('name') as HTMLInputElement)?.value,
                      email: (document.getElementById('email') as HTMLInputElement)?.value,
                      phone: (document.getElementById('phone') as HTMLInputElement)?.value,
                    };
                    onSubmitSupplier(supplierData);
                  }}
                  disabled={createSupplierMutation.isPending}
                >
                  {createSupplierMutation.isPending ? 'Criando...' : 'Criar Fornecedor'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {!['parts', 'suppliers'].includes(activeTab) && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Formulário de criação para este módulo será implementado em breve
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // Placeholder para outros módulos
  const ModulePlaceholder = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => (
    <div className="space-y-4">
      <SearchAndActions />
      <Card>
        <CardHeader className="text-center py-8">
          <Icon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button className="w-32" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Peças e Serviços</h1>
          <p className="text-muted-foreground">
            Sistema completo para gerenciamento de peças, estoque, fornecedores e serviços
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-12">
          <TabsTrigger value="overview" className="flex items-center space-x-1">
            <BarChart3 className="h-3 w-3" />
            <span className="text-xs">Visão</span>
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center space-x-1">
            <Package className="h-3 w-3" />
            <span className="text-xs">Peças</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center space-x-1">
            <Warehouse className="h-3 w-3" />
            <span className="text-xs">Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span className="text-xs">Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center space-x-1">
            <ShoppingCart className="h-3 w-3" />
            <span className="text-xs">Compras</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center space-x-1">
            <Wrench className="h-3 w-3" />
            <span className="text-xs">Serviços</span>
          </TabsTrigger>
          <TabsTrigger value="logistics" className="flex items-center space-x-1">
            <Truck className="h-3 w-3" />
            <span className="text-xs">Logística</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center space-x-1">
            <Building className="h-3 w-3" />
            <span className="text-xs">Ativos</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3" />
            <span className="text-xs">LPU</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs">Avançado</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span className="text-xs">Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-1">
            <FileText className="h-3 w-3" />
            <span className="text-xs">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardStats />
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          <PartsTable />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventoryTable />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <SuppliersTable />
        </TabsContent>

        <TabsContent value="purchases" className="space-y-6">
          <ModulePlaceholder 
            title="Planejamento e Compras" 
            description="Gerencie ordens de compra, análise de demanda e ponto de reposição automático"
            icon={ShoppingCart}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ModulePlaceholder 
            title="Integração com Serviços" 
            description="Aplicação em ordens de serviço, peças por modelo/marca e histórico de utilização"
            icon={Wrench}
          />
        </TabsContent>

        <TabsContent value="logistics" className="space-y-6">
          <ModulePlaceholder 
            title="Logística e Distribuição" 
            description="Transferências entre unidades, expedição e controle de envios"
            icon={Truck}
          />
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <ModulePlaceholder 
            title="Controle de Ativos" 
            description="Cadastro de ativos com hierarquia, geolocalização e histórico de manutenção"
            icon={Building}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <ModulePlaceholder 
            title="Lista de Preços Unitários (LPU)" 
            description="Múltiplas LPUs por cliente, contrato e centro de custo com versionamento"
            icon={DollarSign}
          />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <ModulePlaceholder 
            title="Funcionalidades Avançadas de Preço" 
            description="Tabelas de preços por tenant, versionamento e segmentação"
            icon={TrendingUp}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ModulePlaceholder 
            title="Compliance e Auditoria" 
            description="Rastreabilidade completa, controle de acesso e logs de auditoria"
            icon={Shield}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ModulePlaceholder 
            title="Diferenciais Avançados" 
            description="Simulador de orçamento, dashboards operacionais e APIs de integração"
            icon={FileText}
          />
        </TabsContent>
      </Tabs>

      {/* Diálogo de criação */}
      <CreateItemDialog />
    </div>
  );
};

export default PartsServicesManagement;