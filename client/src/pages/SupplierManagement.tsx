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
      const response = await apiRequest('PUT', "
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
      const response = await apiRequest('DELETE', "
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
        className="h-4 w-4 ""
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
      <div className="p-4"
        <div className="text-lg">"Carregando fornecedores...</div>
      </div>
    );
  }
  return (
    <div className="p-4"
      {/* Header */}
      <div className="p-4"
        <div>
          <h1 className="text-lg">"Gestão de Fornecedores</h1>
          <p className="p-4"
            Gerencie fornecedores, contratos e relacionamentos comerciais
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>
      {/* Statistics Cards */}
      <div className="p-4"
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Total de Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{supplierStats.totalSuppliers}</div>
            <p className="p-4"
              {supplierStats.activeSuppliers} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Fornecedores Preferenciais</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{supplierStats.preferredSuppliers}</div>
            <p className="p-4"
              Classificação especial
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">"{supplierStats.totalOrders}</div>
            <p className="p-4"
              Este ano
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4"
            <CardTitle className="text-lg">"Avaliação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="p-4"
              {supplierStats.averageRating ? supplierStats.averageRating.toFixed(1) : '0.0'}/5
            </div>
            <div className="p-4"
              {renderStarRating(Math.round(supplierStats.averageRating || 0))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters and Search */}
      <div className="p-4"
        <div className="p-4"
          <div className="p-4"
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
          <SelectTrigger className="p-4"
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
          <div className="p-4"
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="p-4"
                  <div className="p-4"
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="p-4"
                      <h3 className="text-lg">"{supplier.name}</h3>
                      {supplier.isPreferred && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-lg">"{supplier.code} • {supplier.documentNumber}</p>
                    <div className="p-4"
                      <span className="p-4"
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </span>
                      <span className="p-4"
                        <Phone className="h-3 w-3" />
                        {supplier.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      {renderStarRating(supplier.rating)}
                    </div>
                    <Badge className={getStatusColor(supplier.status)}>
                      {getStatusLabel(supplier.status)}
                    </Badge>
                  </div>
                  
                  <div className="p-4"
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
              <div className="p-4"
                Nenhum fornecedor encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Create Supplier Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4"
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
          }} className="p-4"
            <div className="p-4"
              <div className="p-4"
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="p-4"
                <Label htmlFor="code">Código do Fornecedor *</Label>
                <Input id="code" name="code" placeholder="FOR001" required />
              </div>
              <div className="p-4"
                <Label htmlFor="tradeName">Nome Fantasia *</Label>
                <Input id="tradeName" name="tradeName" required />
              </div>
              <div className="p-4"
                <Label htmlFor="documentNumber">CNPJ</Label>
                <Input id="documentNumber" name="documentNumber" placeholder="00.000.000/0000-00" />
              </div>
              <div className="p-4"
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="p-4"
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" placeholder="(11) 9999-9999" />
              </div>
              <div className="p-4"
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" />
              </div>
              <div className="p-4"
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" name="city" />
              </div>
              <div className="p-4"
                <Label htmlFor="state">Estado</Label>
                <Input id="state" name="state" />
              </div>
              <div className="p-4"
                <Label htmlFor="postalCode">CEP</Label>
                <Input id="postalCode" name="postalCode" />
              </div>
              <div className="p-4"
                <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                <Input id="contactPerson" name="contactPerson" />
              </div>
              <div className="p-4"
                <Label htmlFor="contactEmail">Email do Contato</Label>
                <Input id="contactEmail" name="contactEmail" type="email" />
              </div>
              <div className="p-4"
                <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
                <Input id="paymentTerms" name="paymentTerms" placeholder="30 dias" />
              </div>
              <div className="p-4"
                <Label htmlFor="deliveryTerms">Prazo de Entrega</Label>
                <Input id="deliveryTerms" name="deliveryTerms" placeholder="5 dias úteis" />
              </div>
            </div>
            <div className="p-4"
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <div className="p-4"
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
        <DialogContent className="p-4"
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
            }} className="p-4"
              <div className="p-4"
                <div className="p-4"
                  <Label htmlFor="edit-name">Nome da Empresa *</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedSupplier.name} required />
                </div>
                <div className="p-4"
                  <Label htmlFor="edit-code">Código do Fornecedor *</Label>
                  <Input id="edit-code" name="code" defaultValue={selectedSupplier.code} required />
                </div>
                <div className="p-4"
                  <Label htmlFor="edit-tradeName">Nome Fantasia *</Label>
                  <Input id="edit-tradeName" name="tradeName" defaultValue={selectedSupplier.tradeName} required />
                </div>
                <div className="p-4"
                  <Label htmlFor="edit-documentNumber">CNPJ</Label>
                  <Input id="edit-documentNumber" name="documentNumber" defaultValue={selectedSupplier.documentNumber} />
                </div>
                <div className="p-4"
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedSupplier.email} required />
                </div>
                <div className="p-4"
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input id="edit-phone" name="phone" defaultValue={selectedSupplier.phone} />
                </div>
                <div className="p-4"
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
                <div className="p-4"
                  <Label htmlFor="edit-isPreferred">Fornecedor Preferencial</Label>
                  <Select name="isPreferred" defaultValue={selectedSupplier?.isPreferred?.toString() || "false>
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
              <div className="p-4"
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