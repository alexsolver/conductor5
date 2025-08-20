import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, Package, DollarSign, User, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// import useLocalization from '@/hooks/useLocalization';

interface CustomerItemMapping {
  id: string;
  tenant_id: string;
  customer_id: string;
  item_id: string;
  custom_sku: string;
  custom_name: string;
  custom_description?: string;
  customer_reference: string;
  special_instructions?: string;
  notes?: string;
  is_active: boolean;
  item_name: string;
  item_integration_code: string;
  item_type: string;
  item_description: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
}

export function CustomerItemMappings() {
  // Localization temporarily disabled

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CustomerItemMapping | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    item_id: "",
    custom_sku: "",
    custom_name: "",
    custom_description: "",
    customer_reference: "",
    special_instructions: "",
    notes: ""
  });

  // Get user data for tenant context
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/me');
      return response.json();
    }
  });

  const tenantId = userData?.tenantId;

  // Fetch customer item mappings
  const { data: mappingsData, isLoading: mappingsLoading, refetch } = useQuery({
    queryKey: ['/api/materials-services/customer-item-mappings', tenantId, searchTerm, selectedCustomer],
    queryFn: async () => {
      if (!tenantId) return { data: [] };
      
      const params = new URLSearchParams({
        tenantId,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCustomer && selectedCustomer !== "all-customers" && { customerId: selectedCustomer })
      });
      
      const response = await apiRequest('GET', `/api/materials-services/customer-item-mappings?${params}`);
      const result = await response.json();
      console.log('🔍 [CustomerMappings] Fetched mappings:', result.data?.length || 0);
      return result;
    },
    enabled: !!tenantId,
  });

  // Fetch customer companies for filter
  const { data: customerCompaniesData } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      if (!tenantId) return [];
      const response = await apiRequest('GET', `/api/companies?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch items for creating new mappings
  const { data: itemsData } = useQuery({
    queryKey: ['/api/materials-services/items'],
    queryFn: async () => {
      if (!tenantId) return { data: [] };
      const response = await apiRequest('GET', `/api/materials-services/items?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Create/Update mapping mutation
  const createMappingMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingMapping ? 'PUT' : 'POST';
      const url = editingMapping 
        ? `/api/materials-services/customer-item-mappings/${editingMapping.id}`
        : '/api/materials-services/customer-item-mappings';
      
      const response = await apiRequest(method, url, {
        ...data,
        tenant_id: tenantId,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar mapeamento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: editingMapping ? "Mapeamento atualizado com sucesso!" : "Novo mapeamento criado com sucesso!"
      });
      setDialogOpen(false);
      setEditingMapping(null);
      resetForm();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mapping mutation
  const deleteMappingMutation = useMutation({
    mutationFn: async (mappingId: string) => {
      const response = await apiRequest('DELETE', `/api/materials-services/customer-item-mappings/${mappingId}?tenantId=${tenantId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao deletar mapeamento');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Mapeamento deletado com sucesso!"
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      item_id: "",
      custom_sku: "",
      custom_name: "",
      custom_description: "",
      customer_reference: "",
      special_instructions: "",
      notes: ""
    });
  };

  const handleEdit = (mapping: CustomerItemMapping) => {
    setEditingMapping(mapping);
    setFormData({
      customer_id: mapping.customer_id,
      item_id: mapping.item_id,
      custom_sku: mapping.custom_sku || "",
      custom_name: mapping.custom_name || "",
      custom_description: mapping.custom_description || "",
      customer_reference: mapping.customer_reference || "",
      special_instructions: mapping.special_instructions || "",
      notes: mapping.notes || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMappingMutation.mutate(formData);
  };

  const mappings = mappingsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Personalização de Itens por Cliente</h1>
            <p className="text-muted-foreground">
              Gerencie SKUs e configurações personalizadas para cada cliente
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingMapping(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Mapeamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMapping ? '[TRANSLATION_NEEDED]' : '[TRANSLATION_NEEDED]'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_id">Empresa Cliente</Label>
                    <Select 
                      value={formData.customer_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                      disabled={!!editingMapping}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                      </SelectTrigger>
                      <SelectContent>
                        {customerCompaniesData?.map((company: any) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name} {company.tradeName && `(${company.tradeName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="item_id">Item</Label>
                    <Select 
                      value={formData.item_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, item_id: value }))}
                      disabled={!!editingMapping}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                      </SelectTrigger>
                      <SelectContent>
                        {itemsData?.data?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.integration_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom_sku">SKU Personalizado</Label>
                    <Input
                      id="custom_sku"
                      value={formData.custom_sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_sku: e.target.value }))}
                      placeholder="Ex: CLIENTE-ITEM-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_reference">Referência do Cliente</Label>
                    <Input
                      id="customer_reference"
                      value={formData.customer_reference}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_reference: e.target.value }))}
                      placeholder="Referência interna do cliente"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom_name">Nome Personalizado</Label>
                  <Input
                    id="custom_name"
                    value={formData.custom_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_name: e.target.value }))}
                    placeholder="Nome como aparece para o cliente"
                  />
                </div>

                <div>
                  <Label htmlFor="custom_description">Descrição Personalizada</Label>
                  <Textarea
                    id="custom_description"
                    value={formData.custom_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_description: e.target.value }))}
                    placeholder="Descrição específica para este cliente"
                  />
                </div>

                <div>
                  <Label htmlFor="special_instructions">Instruções Especiais</Label>
                  <Textarea
                    id="special_instructions"
                    value={formData.special_instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                    placeholder="Instruções de instalação, uso ou manuseio"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder='[TRANSLATION_NEEDED]'
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMappingMutation.isPending}>
                    {createMappingMutation.isPending ? "Salvando..." : '[TRANSLATION_NEEDED]'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder='[TRANSLATION_NEEDED]'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer-filter">Empresa Cliente</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-customers">Todas as empresas</SelectItem>
                    {customerCompaniesData?.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} {company.tradeName && `(${company.tradeName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type-filter">Tipo de Item</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-types">Todos os tipos</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                    <SelectItem value="asset">Ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total de Mapeamentos</p>
                  <p className="text-2xl font-bold">{mappings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Clientes Ativos</p>
                  <p className="text-2xl font-bold">
                    {new Set(mappings.map((m: CustomerItemMapping) => m.customer_id)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Tabela de Mapeamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamentos Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          {mappingsLoading ? (
            <div className="text-center py-8">Carregando mapeamentos...</div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum mapeamento encontrado. Crie o primeiro mapeamento personalizado!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Item Original</TableHead>
                  <TableHead>SKU Personalizado</TableHead>
                  <TableHead>Nome Personalizado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping: CustomerItemMapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {mapping.customer_first_name} {mapping.customer_last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {mapping.customer_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mapping.item_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {mapping.item_integration_code} • {mapping.item_type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mapping.custom_sku}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium">{mapping.custom_name}</div>
                        {mapping.customer_reference && (
                          <div className="text-sm text-muted-foreground">
                            Ref: {mapping.customer_reference}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={mapping.is_active ? "default" : "secondary"}>
                        {mapping.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(mapping)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMappingMutation.mutate(mapping.id)}
                          disabled={deleteMappingMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}