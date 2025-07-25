
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Package, Truck, Warehouse, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Item {
  id: string;
  name: string;
  type: 'material' | 'service';
  description?: string;
  integrationCode?: string;
  measurementUnit: string;
  active: boolean;
  createdAt: string;
}

interface Supplier {
  id: string;
  name: string;
  supplierCode?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: string;
}

interface Location {
  id: string;
  name: string;
  code?: string;
  description?: string;
  address?: string;
  active: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalItems: number;
  totalSuppliers: number;
  totalLocations: number;
  lowStockItems: number;
  totalStockValue: number;
}

const PartsServices = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'suppliers' | 'locations'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES
  // ============================================

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ['parts-services', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/parts-services/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  });

  const { data: itemsData } = useQuery({
    queryKey: ['parts-services', 'items', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/parts-services/items?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },
    enabled: activeTab === 'items'
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['parts-services', 'suppliers', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/parts-services/suppliers?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    },
    enabled: activeTab === 'suppliers'
  });

  const { data: locationsData } = useQuery({
    queryKey: ['parts-services', 'locations', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/parts-services/locations?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
    enabled: activeTab === 'locations'
  });

  // ============================================
  // MUTATIONS - ITEMS
  // ============================================

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parts-services/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      setIsCreateItemOpen(false);
      toast({ title: "Item criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar item", variant: "destructive" });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch(`/api/parts-services/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      setEditingItem(null);
      toast({ title: "Item atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar item", variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/parts-services/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      toast({ title: "Item excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir item", variant: "destructive" });
    }
  });

  // ============================================
  // MUTATIONS - SUPPLIERS
  // ============================================

  const createSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parts-services/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create supplier');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      setIsCreateSupplierOpen(false);
      toast({ title: "Fornecedor criado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar fornecedor", variant: "destructive" });
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch(`/api/parts-services/suppliers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update supplier');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      setEditingSupplier(null);
      toast({ title: "Fornecedor atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar fornecedor", variant: "destructive" });
    }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/parts-services/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete supplier');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      toast({ title: "Fornecedor excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir fornecedor", variant: "destructive" });
    }
  });

  // ============================================
  // MUTATIONS - LOCATIONS
  // ============================================

  const createLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parts-services/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      setIsCreateLocationOpen(false);
      toast({ title: "Localização criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar localização", variant: "destructive" });
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch(`/api/parts-services/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      setEditingLocation(null);
      toast({ title: "Localização atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar localização", variant: "destructive" });
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/parts-services/locations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete location');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-services'] });
      toast({ title: "Localização excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir localização", variant: "destructive" });
    }
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreateItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      description: formData.get('description'),
      integrationCode: formData.get('integrationCode'),
      measurementUnit: formData.get('measurementUnit') || 'UN',
      maintenancePlan: formData.get('maintenancePlan'),
      group: formData.get('group')
    };
    createItemMutation.mutate(data);
  };

  const handleUpdateItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingItem.id,
      name: formData.get('name'),
      type: formData.get('type'),
      description: formData.get('description'),
      integrationCode: formData.get('integrationCode'),
      measurementUnit: formData.get('measurementUnit') || 'UN',
      maintenancePlan: formData.get('maintenancePlan'),
      group: formData.get('group')
    };
    updateItemMutation.mutate(data);
  };

  const handleCreateSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      supplierCode: formData.get('supplierCode'),
      documentNumber: formData.get('documentNumber'),
      email: formData.get('email'),
      phone: formData.get('phone')
    };
    createSupplierMutation.mutate(data);
  };

  const handleUpdateSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSupplier) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingSupplier.id,
      name: formData.get('name'),
      supplierCode: formData.get('supplierCode'),
      documentNumber: formData.get('documentNumber'),
      email: formData.get('email'),
      phone: formData.get('phone')
    };
    updateSupplierMutation.mutate(data);
  };

  const handleCreateLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      address: formData.get('address')
    };
    createLocationMutation.mutate(data);
  };

  const handleUpdateLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLocation) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingLocation.id,
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      address: formData.get('address')
    };
    updateLocationMutation.mutate(data);
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardStats?.totalItems || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardStats?.totalSuppliers || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Localizações</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardStats?.totalLocations || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{dashboardStats?.lowStockItems || 0}</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderItems = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Item</DialogTitle>
              <DialogDescription>
                Adicione um novo item de material ou serviço
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="integrationCode">Código de Integração</Label>
                <Input id="integrationCode" name="integrationCode" />
              </div>
              <div>
                <Label htmlFor="measurementUnit">Unidade de Medida</Label>
                <Select name="measurementUnit" defaultValue="UN">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">Unidade</SelectItem>
                    <SelectItem value="KG">Quilograma</SelectItem>
                    <SelectItem value="M">Metro</SelectItem>
                    <SelectItem value="L">Litro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="group">Grupo</Label>
                <Input id="group" name="group" />
              </div>
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending ? 'Criando...' : 'Criar Item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Modifique as informações do item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome *</Label>
                <Input id="edit-name" name="name" defaultValue={editingItem.name} required />
              </div>
              <div>
                <Label htmlFor="edit-type">Tipo *</Label>
                <Select name="type" defaultValue={editingItem.type} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Input id="edit-description" name="description" defaultValue={editingItem.description || ''} />
              </div>
              <div>
                <Label htmlFor="edit-integrationCode">Código de Integração</Label>
                <Input id="edit-integrationCode" name="integrationCode" defaultValue={editingItem.integrationCode || ''} />
              </div>
              <div>
                <Label htmlFor="edit-measurementUnit">Unidade de Medida</Label>
                <Select name="measurementUnit" defaultValue={editingItem.measurementUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">Unidade</SelectItem>
                    <SelectItem value="KG">Quilograma</SelectItem>
                    <SelectItem value="M">Metro</SelectItem>
                    <SelectItem value="L">Litro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? 'Atualizando...' : 'Atualizar Item'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsData?.items?.map((item: Item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.type === 'material' ? 'default' : 'secondary'}>
                    {item.type === 'material' ? 'Material' : 'Serviço'}
                  </Badge>
                </TableCell>
                <TableCell>{item.integrationCode || '-'}</TableCell>
                <TableCell>
                  <Badge variant={item.active ? 'default' : 'destructive'}>
                    {item.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Deseja realmente excluir este item?')) {
                          deleteItemMutation.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderSuppliers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar fornecedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>

        <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Fornecedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <Label htmlFor="supplier-name">Nome *</Label>
                <Input id="supplier-name" name="name" required />
              </div>
              <div>
                <Label htmlFor="supplierCode">Código do Fornecedor</Label>
                <Input id="supplierCode" name="supplierCode" />
              </div>
              <div>
                <Label htmlFor="documentNumber">CNPJ/CPF</Label>
                <Input id="documentNumber" name="documentNumber" />
              </div>
              <div>
                <Label htmlFor="supplier-email">Email</Label>
                <Input id="supplier-email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="supplier-phone">Telefone</Label>
                <Input id="supplier-phone" name="phone" />
              </div>
              <Button type="submit" disabled={createSupplierMutation.isPending}>
                {createSupplierMutation.isPending ? 'Criando...' : 'Criar Fornecedor'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Supplier Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={() => setEditingSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
          </DialogHeader>
          {editingSupplier && (
            <form onSubmit={handleUpdateSupplier} className="space-y-4">
              <div>
                <Label htmlFor="edit-supplier-name">Nome *</Label>
                <Input id="edit-supplier-name" name="name" defaultValue={editingSupplier.name} required />
              </div>
              <div>
                <Label htmlFor="edit-supplierCode">Código do Fornecedor</Label>
                <Input id="edit-supplierCode" name="supplierCode" defaultValue={editingSupplier.supplierCode || ''} />
              </div>
              <div>
                <Label htmlFor="edit-documentNumber">CNPJ/CPF</Label>
                <Input id="edit-documentNumber" name="documentNumber" defaultValue={editingSupplier.documentNumber || ''} />
              </div>
              <div>
                <Label htmlFor="edit-supplier-email">Email</Label>
                <Input id="edit-supplier-email" name="email" type="email" defaultValue={editingSupplier.email || ''} />
              </div>
              <div>
                <Label htmlFor="edit-supplier-phone">Telefone</Label>
                <Input id="edit-supplier-phone" name="phone" defaultValue={editingSupplier.phone || ''} />
              </div>
              <Button type="submit" disabled={updateSupplierMutation.isPending}>
                {updateSupplierMutation.isPending ? 'Atualizando...' : 'Atualizar Fornecedor'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliersData?.suppliers?.map((supplier: Supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.supplierCode || '-'}</TableCell>
                <TableCell>{supplier.documentNumber || '-'}</TableCell>
                <TableCell>{supplier.email || '-'}</TableCell>
                <TableCell>
                  <Badge variant={supplier.status === 'active' ? 'default' : 'destructive'}>
                    {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSupplier(supplier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Deseja realmente excluir este fornecedor?')) {
                          deleteSupplierMutation.mutate(supplier.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar localizações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>

        <Dialog open={isCreateLocationOpen} onOpenChange={setIsCreateLocationOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Localização
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Localização</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <Label htmlFor="location-name">Nome *</Label>
                <Input id="location-name" name="name" required />
              </div>
              <div>
                <Label htmlFor="location-code">Código</Label>
                <Input id="location-code" name="code" />
              </div>
              <div>
                <Label htmlFor="location-description">Descrição</Label>
                <Input id="location-description" name="description" />
              </div>
              <div>
                <Label htmlFor="location-address">Endereço</Label>
                <Input id="location-address" name="address" />
              </div>
              <Button type="submit" disabled={createLocationMutation.isPending}>
                {createLocationMutation.isPending ? 'Criando...' : 'Criar Localização'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Location Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={() => setEditingLocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Localização</DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div>
                <Label htmlFor="edit-location-name">Nome *</Label>
                <Input id="edit-location-name" name="name" defaultValue={editingLocation.name} required />
              </div>
              <div>
                <Label htmlFor="edit-location-code">Código</Label>
                <Input id="edit-location-code" name="code" defaultValue={editingLocation.code || ''} />
              </div>
              <div>
                <Label htmlFor="edit-location-description">Descrição</Label>
                <Input id="edit-location-description" name="description" defaultValue={editingLocation.description || ''} />
              </div>
              <div>
                <Label htmlFor="edit-location-address">Endereço</Label>
                <Input id="edit-location-address" name="address" defaultValue={editingLocation.address || ''} />
              </div>
              <Button type="submit" disabled={updateLocationMutation.isPending}>
                {updateLocationMutation.isPending ? 'Atualizando...' : 'Atualizar Localização'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locationsData?.locations?.map((location: Location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>{location.code || '-'}</TableCell>
                <TableCell>{location.description || '-'}</TableCell>
                <TableCell>{location.address || '-'}</TableCell>
                <TableCell>
                  <Badge variant={location.active ? 'default' : 'destructive'}>
                    {location.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLocation(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Deseja realmente excluir esta localização?')) {
                          deleteLocationMutation.mutate(location.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Peças e Serviços</h1>
        <p className="text-muted-foreground">
          Gerencie itens, fornecedores e controle de estoque
        </p>
      </div>

      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'dashboard' ? 'default' : 'outline'}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'items' ? 'default' : 'outline'}
          onClick={() => setActiveTab('items')}
        >
          Itens
        </Button>
        <Button
          variant={activeTab === 'suppliers' ? 'default' : 'outline'}
          onClick={() => setActiveTab('suppliers')}
        >
          Fornecedores
        </Button>
        <Button
          variant={activeTab === 'locations' ? 'default' : 'outline'}
          onClick={() => setActiveTab('locations')}
        >
          Localizações
        </Button>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'items' && renderItems()}
      {activeTab === 'suppliers' && renderSuppliers()}
      {activeTab === 'locations' && renderLocations()}
    </div>
  );
};

export default PartsServices;
