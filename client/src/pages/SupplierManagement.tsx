import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
// import useLocalization from '@/hooks/useLocalization';
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  code: string;
  tradeName: string;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  website?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  paymentTerms: string;
  deliveryTerms: string;
  rating: number;
  status: 'active' | 'inactive' | 'blocked';
  isPreferred: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  preferredSuppliers: number;
  totalOrders: number;
  totalValue: number;
  averageRating: number;
}

export function SupplierManagement() {
  // Localization temporarily disabled

  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch suppliers data
  const { data: suppliersResponse, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["/api/materials-services/suppliers"],
    enabled: true
  });
  const suppliers: Supplier[] = (suppliersResponse as any)?.data || [];

  // Fetch supplier statistics
  const { data: statsResponse } = useQuery({
    queryKey: ["/api/materials-services/suppliers/stats"],
    enabled: true
  });
  const supplierStats: SupplierStats = (statsResponse as any)?.data || {
    totalSuppliers: 0,
    activeSuppliers: 0,
    preferredSuppliers: 0,
    totalOrders: 0,
    totalValue: 0,
    averageRating: 0
  };

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (data: Partial<Supplier>) => {
      const response = await apiRequest('POST', '/api/materials-services/suppliers', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/suppliers"] });
      toast({ title: "Sucesso", description: "Fornecedor criado com sucesso!" });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: "destructive"
      });
    }
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Supplier> & { id: string }) => {
      const response = await apiRequest('PUT', `/api/materials-services/suppliers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/suppliers"] });
      toast({ title: "Sucesso", description: "Fornecedor atualizado com sucesso!" });
      setIsEditOpen(false);
      setSelectedSupplier(null);
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: "destructive"
      });
    }
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/materials-services/suppliers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/suppliers"] });
      toast({ title: "Sucesso", description: "Fornecedor removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || '[TRANSLATION_NEEDED]',
        variant: "destructive"
      });
    }
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier: Supplier) => {
    const matchesSearch = supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.documentNumber?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'blocked': return 'Bloqueado';
      default: return 'Indefinido';
    }
  };

  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const handleCreateSupplier = (formData: FormData) => {
    const supplierData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      tradeName: formData.get('tradeName') as string,
      documentNumber: formData.get('documentNumber') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postalCode: formData.get('postalCode') as string,
      country: formData.get('country') as string || 'Brasil',
      website: formData.get('website') as string,
      contactPerson: formData.get('contactPerson') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      paymentTerms: formData.get('paymentTerms') as string,
      deliveryTerms: formData.get('deliveryTerms') as string,
      notes: formData.get('notes') as string,
      status: 'active' as const,
      isPreferred: false,
      rating: 5
    };

    createSupplierMutation.mutate(supplierData);
  };

  const handleEditSupplier = (formData: FormData) => {
    if (!selectedSupplier) return;

    const supplierData = {
      id: selectedSupplier.id,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      tradeName: formData.get('tradeName') as string,
      documentNumber: formData.get('documentNumber') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postalCode: formData.get('postalCode') as string,
      country: formData.get('country') as string,
      website: formData.get('website') as string,
      contactPerson: formData.get('contactPerson') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      paymentTerms: formData.get('paymentTerms') as string,
      deliveryTerms: formData.get('deliveryTerms') as string,
      notes: formData.get('notes') as string,
      status: formData.get('status') as 'active' | 'inactive' | 'blocked',
      isPreferred: formData.get('isPreferred') === 'true'
    };

    updateSupplierMutation.mutate(supplierData);
  };

  if (isLoadingSuppliers) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando fornecedores...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores, contratos e relacionamentos comerciais
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierStats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {supplierStats.activeSuppliers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Preferenciais</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierStats.preferredSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              Classificação especial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Este ano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplierStats.averageRating ? supplierStats.averageRating.toFixed(1) : '0.0'}/5
            </div>
            <div className="flex mt-1">
              {renderStarRating(Math.round(supplierStats.averageRating || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder='[TRANSLATION_NEEDED]'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>
            {filteredSuppliers.length} fornecedor(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{supplier.name}</h3>
                      {supplier.isPreferred && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{supplier.code} • {supplier.documentNumber}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {supplier.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {renderStarRating(supplier.rating)}
                    </div>
                    <Badge className={getStatusColor(supplier.status)}>
                      {getStatusLabel(supplier.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        // View supplier details logic
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover este fornecedor?')) {
                          deleteSupplierMutation.mutate(supplier.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum fornecedor encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Supplier Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Cadastre um novo fornecedor no sistema
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateSupplier(formData);
          }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código do Fornecedor *</Label>
                <Input id="code" name="code" placeholder="FOR001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName">Nome Fantasia *</Label>
                <Input id="tradeName" name="tradeName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber">CNPJ</Label>
                <Input id="documentNumber" name="documentNumber" placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" placeholder="(11) 9999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" name="city" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" name="state" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">CEP</Label>
                <Input id="postalCode" name="postalCode" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                <Input id="contactPerson" name="contactPerson" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email do Contato</Label>
                <Input id="contactEmail" name="contactEmail" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
                <Input id="paymentTerms" name="paymentTerms" placeholder="30 dias" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryTerms">Prazo de Entrega</Label>
                <Input id="deliveryTerms" name="deliveryTerms" placeholder="5 dias úteis" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSupplierMutation.isPending}>
                {createSupplierMutation.isPending ? 'Criando...' : '[TRANSLATION_NEEDED]'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>
              Atualize as informações do fornecedor
            </DialogDescription>
          </DialogHeader>
          
          {selectedSupplier && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEditSupplier(formData);
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome da Empresa *</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedSupplier.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Código do Fornecedor *</Label>
                  <Input id="edit-code" name="code" defaultValue={selectedSupplier.code} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tradeName">Nome Fantasia *</Label>
                  <Input id="edit-tradeName" name="tradeName" defaultValue={selectedSupplier.tradeName} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-documentNumber">CNPJ</Label>
                  <Input id="edit-documentNumber" name="documentNumber" defaultValue={selectedSupplier.documentNumber} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedSupplier.email} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input id="edit-phone" name="phone" defaultValue={selectedSupplier.phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={selectedSupplier.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-isPreferred">Fornecedor Preferencial</Label>
                  <Select name="isPreferred" defaultValue={selectedSupplier?.isPreferred?.toString() || "false"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateSupplierMutation.isPending}>
                  {updateSupplierMutation.isPending ? 'Atualizando...' : 'Atualizar Fornecedor'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}