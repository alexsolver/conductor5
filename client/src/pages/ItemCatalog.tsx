import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Search, 
  Filter, 
  Plus, 
  Package, 
  Wrench, 
  Edit, 
  Eye, 
  Trash2,
  Loader2,
  Link,
  Building,
  Users,
  Truck,
  DollarSign,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface Item {
  id: string;
  name: string;
  type: 'material' | 'service';
  integrationCode?: string;
  description?: string;
  measurementUnit: string;
  // groupName?: string; // Disabled - column doesn't exist in current schema
  maintenancePlan?: string;
  defaultChecklist?: string;
  status: 'active' | 'under_review' | 'discontinued';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomerItemMapping {
  id: string;
  tenant_id: string;
  customer_id: string;
  item_id: string;
  custom_sku: string;
  custom_name: string;
  custom_description?: string;
  customer_reference: string;
  negotiated_price: string;
  minimum_quantity: string;
  discount_percent: string;
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

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['material', 'service'], {
    required_error: "Tipo é obrigatório",
  }),
  integrationCode: z.string().optional(),
  description: z.string().optional(),
  measurementUnit: z.string().min(1, "Unidade de medida é obrigatória"),
  // groupName: z.string().optional(), // Disabled - column doesn't exist in current schema
  maintenancePlan: z.string().optional(),
  defaultChecklist: z.string().optional(),
  active: z.boolean().default(true),
});

const measurementUnits = [
  { value: 'UN', label: 'Unidade' },
  { value: 'M', label: 'Metro' },
  { value: 'M2', label: 'Metro Quadrado' },
  { value: 'M3', label: 'Metro Cúbico' },
  { value: 'KG', label: 'Quilograma' },
  { value: 'L', label: 'Litro' },
  { value: 'H', label: 'Hora' },
  { value: 'PC', label: 'Peça' },
  { value: 'CX', label: 'Caixa' },
  { value: 'GL', label: 'Galão' },
  { value: 'SET', label: 'Conjunto' }
];

export default function ItemCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemTypeTab, setItemTypeTab] = useState("materials");

  // Estados para vínculos
  const [linkedItems, setLinkedItems] = useState<string[]>([]);
  const [linkedCustomers, setLinkedCustomers] = useState<string[]>([]);
  const [linkedSuppliers, setLinkedSuppliers] = useState<string[]>([]);

  // Estados para mapeamentos personalizados
  const [mappingSearchTerm, setMappingSearchTerm] = useState("");
  const [selectedCustomerMapping, setSelectedCustomerMapping] = useState("");
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CustomerItemMapping | null>(null);

  // Form state para mapeamentos
  const [mappingFormData, setMappingFormData] = useState({
    customer_id: "",
    item_id: "",
    custom_sku: "",
    custom_name: "",
    custom_description: "",
    customer_reference: "",
    negotiated_price: "",
    minimum_quantity: "1",
    discount_percent: "0",
    special_instructions: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      type: 'material',
      integrationCode: '',
      description: '',
      measurementUnit: 'UN',
      // groupName: '', // Disabled - column doesn't exist in current schema
      maintenancePlan: '',
      defaultChecklist: '',
      active: true,
    }
  });

  // Queries
  const { data: itemsResponse, isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/materials-services/items"],
    enabled: true
  });

  const { data: itemStatsResponse } = useQuery({
    queryKey: ["/api/materials-services/items/stats"],
    enabled: true
  });

  // Queries para vínculos
  const { data: availableItems } = useQuery({
    queryKey: ["/api/materials-services/items"],
    enabled: true
  });

  const { data: availableCustomers } = useQuery({
    queryKey: ["/api/customer-companies"],
    enabled: true
  });

  const { data: availableSuppliers } = useQuery({
    queryKey: ["/api/materials-services/suppliers"],
    enabled: true
  });

  // Queries para mapeamentos personalizados
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/me');
      return response.json();
    }
  });

  const tenantId = userData?.tenantId;

  const { data: mappingsResponse, isLoading: isLoadingMappings } = useQuery({
    queryKey: ['/api/materials-services/customer-item-mappings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/materials-services/customer-item-mappings');
      return response.json();
    },
    enabled: !!tenantId,
  });

  const { data: customerCompaniesData } = useQuery({
    queryKey: ['/api/customer-companies'],
    queryFn: async () => {
      if (!tenantId) return [];
      const response = await apiRequest('GET', `/api/customer-companies?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof itemSchema>) => {
      const response = await apiRequest('POST', '/api/materials-services/items', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items/stats"] });
      toast({
        title: "Item criado com sucesso",
        description: "O item foi adicionado ao catálogo.",
      });
      setIsCreateModalOpen(false);
      form.reset({
        name: '',
        type: 'material',
        description: '',
        measurementUnit: 'UN',
        // groupName: '',
        active: true,
      });
      setSelectedItem(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar item",
        description: "Ocorreu um erro ao criar o item. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: z.infer<typeof itemSchema> }) => {
      const response = await apiRequest('PUT', `/api/materials-services/items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items/stats"] });
      toast({
        title: "Item atualizado com sucesso",
        description: "As alterações foram salvas.",
      });
      setIsCreateModalOpen(false);
      form.reset({
        name: '',
        type: 'material',
        description: '',
        measurementUnit: 'UN',
        // groupName: '',
        active: true,
      });
      setSelectedItem(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar item",
        description: "Ocorreu um erro ao atualizar o item. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/materials-services/items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items/stats"] });
      toast({
        title: "Item excluído com sucesso",
        description: "O item foi removido do catálogo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir item",
        description: "Ocorreu um erro ao excluir o item. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutations para mapeamentos personalizados
  const createMappingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/materials-services/customer-item-mappings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/customer-item-mappings'] });
      toast({
        title: "Mapeamento criado com sucesso",
        description: "A personalização foi salva.",
      });
      setMappingDialogOpen(false);
      resetMappingForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar mapeamento",
        description: "Ocorreu um erro ao salvar a personalização.",
        variant: "destructive",
      });
    }
  });

  const updateMappingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await apiRequest('PUT', `/api/materials-services/customer-item-mappings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/customer-item-mappings'] });
      toast({
        title: "Mapeamento atualizado com sucesso",
        description: "As alterações foram salvas.",
      });
      setMappingDialogOpen(false);
      resetMappingForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar mapeamento",
        description: "Ocorreu um erro ao atualizar a personalização.",
        variant: "destructive",
      });
    }
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/materials-services/customer-item-mappings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials-services/customer-item-mappings'] });
      toast({
        title: "Mapeamento excluído com sucesso",
        description: "A personalização foi removida.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir mapeamento",
        description: "Ocorreu um erro ao excluir a personalização.",
        variant: "destructive",
      });
    }
  });

  // Extract data from API responses
  const items: Item[] = (itemsResponse as any)?.data || [];
  const itemStats = (itemStatsResponse as any)?.data || { total: 0, materials: 0, services: 0, active: 0 };
  const mappings: CustomerItemMapping[] = (mappingsResponse as any)?.data || [];

  // Função auxiliar para resetar o formulário de mapeamentos
  const resetMappingForm = () => {
    setMappingFormData({
      customer_id: "",
      item_id: "",
      custom_sku: "",
      custom_name: "",
      custom_description: "",
      customer_reference: "",
      negotiated_price: "",
      minimum_quantity: "1",
      discount_percent: "0",
      special_instructions: "",
      notes: ""
    });
    setEditingMapping(null);
  };

  // Filtros por tipo (separados para cada aba)
  const materialItems = items.filter((item: Item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.integrationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return item.type === 'material' && matchesSearch && matchesStatus;
  });

  const serviceItems = items.filter((item: Item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.integrationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return item.type === 'service' && matchesSearch && matchesStatus;
  });

  // Filtros para mapeamentos personalizados
  const filteredMappings = mappings.filter((mapping: CustomerItemMapping) => {
    const matchesSearch = mappingSearchTerm === "" || 
                         mapping.custom_name.toLowerCase().includes(mappingSearchTerm.toLowerCase()) ||
                         mapping.custom_sku.toLowerCase().includes(mappingSearchTerm.toLowerCase()) ||
                         mapping.item_name.toLowerCase().includes(mappingSearchTerm.toLowerCase()) ||
                         mapping.customer_first_name.toLowerCase().includes(mappingSearchTerm.toLowerCase()) ||
                         mapping.customer_last_name.toLowerCase().includes(mappingSearchTerm.toLowerCase());

    const matchesCustomer = selectedCustomerMapping === "" || 
                           selectedCustomerMapping === "all-customers" || 
                           mapping.customer_id === selectedCustomerMapping;

    return matchesSearch && matchesCustomer;
  });

  const onSubmit = async (data: z.infer<typeof itemSchema>) => {
    // Adicionar vínculos aos dados enviados
    const formDataWithLinks = {
      ...data,
      linkedCustomers,
      linkedItems,
      linkedSuppliers
    };

    if (selectedItem) {
      updateItemMutation.mutate({ id: selectedItem.id, data: formDataWithLinks });
    } else {
      createItemMutation.mutate(formDataWithLinks);
    }
  };

  const renderItemCard = (item: Item) => (
    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          item.type === 'material' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
        }`}>
          {item.type === 'material' ? <Package className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">{item.name}</h3>
            <Badge variant={item.active ? "default" : "secondary"}>
              {item.active ? "Ativo" : "Inativo"}
            </Badge>
            <Badge variant="outline">
              {item.type === 'material' ? 'Material' : 'Serviço'}
            </Badge>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {item.integrationCode && (
              <span>Código: {item.integrationCode}</span>
            )}
            {/* {item.groupName && ( // Disabled temporarily - column doesn't exist
              <span>Grupo: {item.groupName}</span>
            )} */}
            <span>Unidade: {item.measurementUnit}</span>
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground max-w-md truncate">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={async () => {
            setSelectedItem(item);
            form.reset({
              name: item.name || '',
              type: item.type || 'material',
              integrationCode: item.integrationCode || '',
              description: item.description || '',
              measurementUnit: item.measurementUnit || 'UN',
              // groupName: item.groupName || '',
              maintenancePlan: item.maintenancePlan || '',
              defaultChecklist: item.defaultChecklist || '',
              active: item.active !== undefined ? item.active : true,
            });

            // 🔧 CORREÇÃO: Carregar vínculos existentes do item
            try {
              const response = await apiRequest('GET', `/api/materials-services/items/${item.id}`);
              const itemData = await response.json();

              if (itemData.success && itemData.data.links) {
                // Carregar vínculos de clientes
                const customerIds = itemData.data.links.customers?.map((link: any) => link.customerId) || [];
                setLinkedCustomers(customerIds);

                // Carregar vínculos de itens
                const itemIds = itemData.data.links.items?.map((link: any) => link.linkedItemId) || [];
                setLinkedItems(itemIds);

                // Carregar vínculos de fornecedores
                const supplierIds = itemData.data.links.suppliers?.map((link: any) => link.supplierId) || [];
                setLinkedSuppliers(supplierIds);
              }
            } catch (error) {
              console.error('Erro ao carregar vínculos do item:', error);
              // Usar arrays vazios em caso de erro
              setLinkedCustomers([]);
              setLinkedItems([]);
              setLinkedSuppliers([]);
            }

            setIsCreateModalOpen(true);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSelectedItem(item);
            setIsViewModalOpen(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => deleteItemMutation.mutate(item.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Itens</h1>
          <p className="text-muted-foreground">
            Ponto de entrada para cadastro de materiais e serviços
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            setSelectedItem(null);
            form.reset({
              name: '',
              type: 'material',
              description: '',
              measurementUnit: 'UN',
              // groupName: '',
              active: true,
            });
            setLinkedItems([]);
            setLinkedCustomers([]);
            setLinkedSuppliers([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedItem(null);
              form.reset({
                name: '',
                type: 'material',
                description: '',
                measurementUnit: 'UN',
                active: true,
              });
              setLinkedItems([]);
              setLinkedCustomers([]);
              setLinkedSuppliers([]);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem ? 'Editar Item' : 'Criar Novo Item'}</DialogTitle>
              <DialogDescription>
                {selectedItem ? 'Altere as informações do item selecionado' : 'Cadastre um novo material ou serviço no sistema'}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="links">Vínculos</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <TabsContent value="basic" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="material">Material</SelectItem>
                              <SelectItem value="service">Serviço</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="integrationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Integração</FormLabel>
                      <FormControl>
                        <Input placeholder="Código de Integração" {...field} />
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
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="measurementUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {measurementUnits.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Temporarily disabled - groupName column doesn't exist in current schema
                <FormField
                  control={form.control}
                  name="groupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo</FormLabel> 
                      <FormControl>
                        <Input placeholder="Grupo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}
                <FormField
                  control={form.control}
                  name="maintenancePlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Manutenção</FormLabel>
                      <FormControl>
                        <Input placeholder="Plano de Manutenção" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultChecklist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Checklist Padrão</FormLabel>
                      <FormControl>
                        <Input placeholder="Checklist Padrão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>
                          Define se o item está ativo ou inativo.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                  </TabsContent>

                  <TabsContent value="links" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Vincular Itens */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Link className="h-5 w-5" />
                            Vincular Itens
                          </CardTitle>
                          <CardDescription>
                            Vincule este item a outros itens do catálogo
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(availableItems as any)?.data?.filter((item: any) => item.id !== selectedItem?.id)?.map((item: any) => (
                              <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`item-${item.id}`}
                                  checked={linkedItems.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setLinkedItems([...linkedItems, item.id]);
                                    } else {
                                      setLinkedItems(linkedItems.filter(id => id !== item.id));
                                    }
                                  }}
                                />
                                <label htmlFor={`item-${item.id}`} className="text-sm">
                                  {item.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Vincular Clientes */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Vincular Clientes
                          </CardTitle>
                          <CardDescription>
                            Vincule este item a empresas clientes
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Selecionar/Desselecionar Todas */}
                            {(availableCustomers as any)?.length > 0 && (
                              <div className="flex items-center space-x-2 pb-2 border-b">
                                <Checkbox
                                  id="select-all-customers"
                                  checked={
                                    (availableCustomers as any)?.length > 0 && 
                                    linkedCustomers.length === (availableCustomers as any)?.length
                                  }
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      // Selecionar todas as empresas
                                      setLinkedCustomers((availableCustomers as any)?.map((customer: any) => customer.id) || []);
                                    } else {
                                      // Desselecionar todas
                                      setLinkedCustomers([]);
                                    }
                                  }}
                                />
                                <label htmlFor="select-all-customers" className="text-sm font-medium">
                                  Selecionar Todas ({(availableCustomers as any)?.length || 0})
                                </label>
                              </div>
                            )}
                            {(availableCustomers as any)?.map((customer: any) => (
                              <div key={customer.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`customer-${customer.id}`}
                                  checked={linkedCustomers.includes(customer.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setLinkedCustomers([...linkedCustomers, customer.id]);
                                    } else {
                                      setLinkedCustomers(linkedCustomers.filter(id => id !== customer.id));
                                    }
                                  }}
                                />
                                <label htmlFor={`customer-${customer.id}`} className="text-sm">
                                  {customer.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Vincular Fornecedores */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Vincular Fornecedores
                          </CardTitle>
                          <CardDescription>
                            Vincule este item a fornecedores
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(availableSuppliers as any)?.data?.map((supplier: any) => (
                              <div key={supplier.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`supplier-${supplier.id}`}
                                  checked={linkedSuppliers.includes(supplier.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setLinkedSuppliers([...linkedSuppliers, supplier.id]);
                                    } else {
                                      setLinkedSuppliers(linkedSuppliers.filter(id => id !== supplier.id));
                                    }
                                  }}
                                />
                                <label htmlFor={`supplier-${supplier.id}`} className="text-sm">
                                  {supplier.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <div className="flex justify-end pt-6">
                    <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                      {(createItemMutation.isPending || updateItemMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {selectedItem ? 'Atualizar' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>



      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="under_review">Em análise</SelectItem>
                <SelectItem value="discontinued">Descontinuado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Abas para Materiais, Serviços e Personalizações */}
      <Tabs value={itemTypeTab} onValueChange={setItemTypeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materiais ({materialItems.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Serviços ({serviceItems.length})
          </TabsTrigger>
          <TabsTrigger value="mappings" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Personalizações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais Cadastrados ({materialItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingItems ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-16 h-8 bg-gray-200 rounded"></div>
                        <div className="w-16 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : materialItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum material encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materialItems.map(renderItemCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Cadastrados ({serviceItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingItems ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-16 h-8 bg-gray-200 rounded"></div>
                        <div className="w-16 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : serviceItems.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum serviço encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceItems.map(renderItemCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Personalizações por Empresa Cliente ({filteredMappings.length})</CardTitle>
                  <CardDescription>
                    Configurações específicas de itens para cada empresa cliente
                  </CardDescription>
                </div>
                <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetMappingForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Personalização
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMapping ? 'Editar Personalização' : 'Nova Personalização'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure como um item aparece para uma empresa cliente específica
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (editingMapping) {
                        updateMappingMutation.mutate({ id: editingMapping.id, data: mappingFormData });
                      } else {
                        createMappingMutation.mutate(mappingFormData);
                      }
                    }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customer_id">Empresa Cliente</Label>
                          <Select 
                            value={mappingFormData.customer_id} 
                            onValueChange={(value) => setMappingFormData(prev => ({ ...prev, customer_id: value }))}
                            disabled={!!editingMapping}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma empresa" />
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
                          <Label htmlFor="item_id">Item Base</Label>
                          <Select 
                            value={mappingFormData.item_id} 
                            onValueChange={(value) => setMappingFormData(prev => ({ ...prev, item_id: value }))}
                            disabled={!!editingMapping}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map((item: Item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.type === 'material' ? 'Material' : 'Serviço'})
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
                            value={mappingFormData.custom_sku}
                            onChange={(e) => setMappingFormData(prev => ({ ...prev, custom_sku: e.target.value }))}
                            placeholder="Ex: JOAO-BC150-A"
                          />
                        </div>

                        <div>
                          <Label htmlFor="custom_name">Nome Personalizado</Label>
                          <Input
                            id="custom_name"
                            value={mappingFormData.custom_name}
                            onChange={(e) => setMappingFormData(prev => ({ ...prev, custom_name: e.target.value }))}
                            placeholder="Nome específico para a empresa"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="custom_description">Descrição Personalizada</Label>
                        <Textarea
                          id="custom_description"
                          value={mappingFormData.custom_description}
                          onChange={(e) => setMappingFormData(prev => ({ ...prev, custom_description: e.target.value }))}
                          placeholder="Descrição específica para a empresa"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="negotiated_price">Preço Negociado (R$)</Label>
                          <Input
                            id="negotiated_price"
                            type="number"
                            step="0.01"
                            value={mappingFormData.negotiated_price}
                            onChange={(e) => setMappingFormData(prev => ({ ...prev, negotiated_price: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="minimum_quantity">Quantidade Mínima</Label>
                          <Input
                            id="minimum_quantity"
                            type="number"
                            value={mappingFormData.minimum_quantity}
                            onChange={(e) => setMappingFormData(prev => ({ ...prev, minimum_quantity: e.target.value }))}
                            placeholder="1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="discount_percent">Desconto (%)</Label>
                          <Input
                            id="discount_percent"
                            type="number"
                            step="0.01"
                            value={mappingFormData.discount_percent}
                            onChange={(e) => setMappingFormData(prev => ({ ...prev, discount_percent: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="special_instructions">Instruções Especiais</Label>
                        <Textarea
                          id="special_instructions"
                          value={mappingFormData.special_instructions}
                          onChange={(e) => setMappingFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                          placeholder="Instruções específicas para esta empresa"
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setMappingDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createMappingMutation.isPending || updateMappingMutation.isPending}>
                          {(createMappingMutation.isPending || updateMappingMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingMapping ? 'Atualizar' : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filtros para mapeamentos */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por SKU, nome personalizado, item ou cliente..."
                      value={mappingSearchTerm}
                      onChange={(e) => setMappingSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer-filter">Empresa Cliente</Label>
                  <Select value={selectedCustomerMapping} onValueChange={setSelectedCustomerMapping}>
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
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMappings ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-16 h-8 bg-gray-200 rounded"></div>
                        <div className="w-16 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMappings.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma personalização encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Crie personalizações para configurar como os itens aparecem para cada empresa cliente
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa Cliente</TableHead>
                      <TableHead>Item Base</TableHead>
                      <TableHead>SKU Personalizado</TableHead>
                      <TableHead>Nome Personalizado</TableHead>
                      <TableHead>Preço Negociado</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {mapping.customer_first_name} {mapping.customer_last_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {mapping.item_type === 'material' ? 
                              <Package className="h-4 w-4 text-blue-600" /> : 
                              <Wrench className="h-4 w-4 text-green-600" />
                            }
                            <span>{mapping.item_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {mapping.custom_sku}
                          </Badge>
                        </TableCell>
                        <TableCell>{mapping.custom_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>R$ {parseFloat(mapping.negotiated_price).toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {parseFloat(mapping.discount_percent).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={mapping.is_active ? "default" : "secondary"}>
                            {mapping.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingMapping(mapping);
                                setMappingFormData({
                                  customer_id: mapping.customer_id,
                                  item_id: mapping.item_id,
                                  custom_sku: mapping.custom_sku,
                                  custom_name: mapping.custom_name,
                                  custom_description: mapping.custom_description || "",
                                  customer_reference: mapping.customer_reference,
                                  negotiated_price: mapping.negotiated_price,
                                  minimum_quantity: mapping.minimum_quantity,
                                  discount_percent: mapping.discount_percent,
                                  special_instructions: mapping.special_instructions || "",
                                  notes: mapping.notes || ""
                                });
                                setMappingDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMappingMutation.mutate(mapping.id)}
                              className="text-red-600 hover:text-red-700"
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
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Item</DialogTitle>
            <DialogDescription>
              Visualização completa das informações do item
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{selectedItem.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant={selectedItem.type === 'material' ? 'default' : 'secondary'}>
                        {selectedItem.type === 'material' ? 'Material' : 'Serviço'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedItem.active ? 'default' : 'secondary'}>
                        {selectedItem.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unidade:</span>
                      <span>{selectedItem.measurementUnit}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Informações Complementares</h3>
                  <div className="space-y-2">
                    {selectedItem.integrationCode && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Código:</span>
                        <span>{selectedItem.integrationCode}</span>
                      </div>
                    )}
                    {selectedItem.maintenancePlan && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plano de Manutenção:</span>
                        <span>{selectedItem.maintenancePlan}</span>
                      </div>
                    )}
                    {selectedItem.defaultChecklist && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Checklist Padrão:</span>
                        <span>{selectedItem.defaultChecklist}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedItem.description && (
                <div>
                  <h3 className="font-semibold mb-3">Descrição</h3>
                  <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedItem.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <span className="text-sm text-muted-foreground">Criado em: </span>
                  <span className="text-sm">{new Date(selectedItem.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Atualizado em: </span>
                  <span className="text-sm">{new Date(selectedItem.updatedAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewModalOpen(false);
                setSelectedItem(null);
                if (selectedItem) {
                  form.reset({
                    name: selectedItem.name,
                    type: selectedItem.type,
                    integrationCode: selectedItem.integrationCode || '',
                    description: selectedItem.description || '',
                    measurementUnit: selectedItem.measurementUnit,
                    maintenancePlan: selectedItem.maintenancePlan || '',
                    defaultChecklist: selectedItem.defaultChecklist || '',
                    active: selectedItem.active,
                  });
                }
                setIsCreateModalOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}