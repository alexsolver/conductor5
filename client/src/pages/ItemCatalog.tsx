import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// UI Components
import {
  Package,
  Wrench,
  Plus,
  Edit,
  Eye,
  Trash2,
  Building,
  Truck,
  Link,
  Save,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Clock,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Local Components
// CustomerPersonalizationTab component temporarily removed

// Schema and Types
interface Item {
  id: string;
  name: string;
  type: 'material' | 'service';
  integrationCode?: string;
  description?: string;
  measurementUnit: string;
  maintenancePlan?: string;
  defaultChecklist?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["material", "service"]),
  integrationCode: z.string().optional(),
  description: z.string().optional(),
  measurementUnit: z.string().min(1, "Unidade de medida é obrigatória"),
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemTypeTab, setItemTypeTab] = useState("materials");

  // Estados para vínculos
  const [linkedItems, setLinkedItems] = useState<string[]>([]);
  const [linkedCustomers, setLinkedCustomers] = useState<string[]>([]);
  const [linkedSuppliers, setLinkedSuppliers] = useState<string[]>([]);

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

  // Query para buscar vínculos de todos os itens (para indicadores visuais)
  const { data: itemLinks = {}, isLoading: isLoadingItemLinks } = useQuery({
    queryKey: ['/api/materials-services/item-links-overview'],
    queryFn: async () => {
      try {
        const [customerLinks, supplierLinks] = await Promise.all([
          fetch('/api/materials-services/customer-personalizations/overview'),
          fetch('/api/materials-services/supplier-links/overview')
        ]);

        const customerData = customerLinks.ok ? await customerLinks.json() : { data: [] };
        const supplierData = supplierLinks.ok ? await supplierLinks.json() : { data: [] };

        // Organizar por item ID para acesso rápido
        const linksByItem: Record<string, { customers: number; suppliers: number }> = {};
        
        // Processar vínculos de clientes
        (customerData.data || []).forEach((link: any) => {
          if (!linksByItem[link.item_id]) {
            linksByItem[link.item_id] = { customers: 0, suppliers: 0 };
          }
          linksByItem[link.item_id].customers++;
        });

        // Processar vínculos de fornecedores
        (supplierData.data || []).forEach((link: any) => {
          if (!linksByItem[link.item_id]) {
            linksByItem[link.item_id] = { customers: 0, suppliers: 0 };
          }
          linksByItem[link.item_id].suppliers++;
        });

        return linksByItem;
      } catch (error) {
        console.error('Erro ao carregar vínculos dos itens:', error);
        return {};
      }
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const { data: availableCustomers } = useQuery({
    queryKey: ["/api/customers/companies"]
  });

  const { data: availableSuppliers } = useQuery({
    queryKey: ["/api/materials-services/suppliers"],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/materials-services/suppliers');
        const data = await response.json();
        return data.data?.map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name || supplier.tradeName || 'Sem nome'
        })) || [];
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        return [];
      }
    }
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
      form.reset();
      setSelectedItem(null);
    },
    onError: () => {
      toast({
        title: "Erro ao criar item",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof itemSchema> }) => {
      const response = await apiRequest('PUT', `/api/materials-services/items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items"] });
      toast({
        title: "Item atualizado com sucesso",
        description: "As alterações foram salvas.",
      });
      setIsCreateModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar item",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/materials-services/items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items"] });
      toast({
        title: "Item excluído com sucesso",
        description: "O item foi removido do catálogo.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir item",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Processar dados dos itens
  const items: Item[] = (itemsResponse as any)?.data || [];
  const itemStats = (itemStatsResponse as any)?.data || [];

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

  const onSubmit = async (data: z.infer<typeof itemSchema>) => {
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

  const renderItemCard = (item: Item) => {
    const itemLinksData = itemLinks[item.id] || { customers: 0, suppliers: 0 };
    
    return (
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
              
              {/* Indicadores visuais de vínculos */}
              <div className="flex items-center space-x-1">
                {itemLinksData.customers > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <Building className="h-3 w-3" />
                    <span>{itemLinksData.customers}</span>
                  </div>
                )}
                {itemLinksData.suppliers > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    <Truck className="h-3 w-3" />
                    <span>{itemLinksData.suppliers}</span>
                  </div>
                )}
                {itemLinksData.customers === 0 && itemLinksData.suppliers === 0 && (
                  <div className="text-xs text-muted-foreground px-2 py-1 bg-gray-100 rounded-full">
                    Sem vínculos
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {item.integrationCode && (
                <span>Código: {item.integrationCode}</span>
              )}
              <span>Unidade: {item.measurementUnit}</span>
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground max-w-md truncate">
                {item.description}
              </p>
            )}

            {/* Tooltip com informações detalhadas dos vínculos */}
            {(itemLinksData.customers > 0 || itemLinksData.suppliers > 0) && (
              <div className="text-xs text-muted-foreground">
                {itemLinksData.customers > 0 && (
                  <span>
                    {itemLinksData.customers} personalização{itemLinksData.customers > 1 ? 'ões' : ''} de cliente{itemLinksData.customers > 1 ? 's' : ''}
                  </span>
                )}
                {itemLinksData.customers > 0 && itemLinksData.suppliers > 0 && <span> • </span>}
                {itemLinksData.suppliers > 0 && (
                  <span>
                    {itemLinksData.suppliers} vínculo{itemLinksData.suppliers > 1 ? 's' : ''} de fornecedor{itemLinksData.suppliers > 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedItem(item);
              form.reset({
                name: item.name || '',
                type: item.type || 'material',
                integrationCode: item.integrationCode || '',
                description: item.description || '',
                measurementUnit: item.measurementUnit || 'UN',
                maintenancePlan: item.maintenancePlan || '',
                defaultChecklist: item.defaultChecklist || '',
                active: item.active !== undefined ? item.active : true,
              });
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
  };

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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Item
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={itemTypeTab} onValueChange={setItemTypeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materiais ({materialItems.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Serviços ({serviceItems.length})
          </TabsTrigger>
          <TabsTrigger value="customer-mappings" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Personalizações
          </TabsTrigger>
          <TabsTrigger value="supplier-links" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Vínculos
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

        <TabsContent value="customer-mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalizações de Clientes</CardTitle>
              <CardDescription>
                Configure personalizações específicas para cada cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">Sistema de Personalização</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Configure SKUs personalizados, nomes específicos e referências únicas para cada cliente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier-links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vínculos de Fornecedores</CardTitle>
              <CardDescription>
                Vincule itens com fornecedores e configure preços e condições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">Sistema de Catalogação por Fornecedor</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Em desenvolvimento: Sistema avançado para vinculação de itens com fornecedores
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}