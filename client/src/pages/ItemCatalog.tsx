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
  Tag,
  Search,
  Filter,
  ArrowLeft,
  Settings,
  Users,
  ShoppingCart,
  Layers,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle2
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

interface ItemLink {
  id: string;
  sourceItemId: string;
  targetItemId: string;
  linkType: string;
  quantity?: number;
  description?: string;
}

interface CustomerPersonalization {
  id: string;
  itemId: string;
  customerId: string;
  customerName: string;
  customSku?: string;
  customName?: string;
  customDescription?: string;
  isActive: boolean;
}

interface SupplierLink {
  id: string;
  itemId: string;
  supplierId: string;
  supplierName: string;
  price?: number;
  currency: string;
  leadTime?: number;
  isPreferred: boolean;
}

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  type: z.enum(["material", "service"]),
  integrationCode: z.string().max(100, "Código muito longo").optional().or(z.literal(""))
    .refine(async (code) => {
      if (!code) return true;
      // Validação de unicidade - será implementada no backend
      return true;
    }, "Código de integração já existe"),
  description: z.string().max(1000, "Descrição muito longa").optional(),
  measurementUnit: z.string().min(1, "Unidade de medida é obrigatória"),
  maintenancePlan: z.string().max(255, "Plano muito longo").optional(),
  defaultChecklist: z.string().max(255, "Checklist muito longo").optional(),
  active: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  minPrice: z.number().min(0, "Preço mínimo deve ser positivo").optional(),
  maxPrice: z.number().min(0, "Preço máximo deve ser positivo").optional(),
}).refine((data) => {
  if (data.minPrice && data.maxPrice) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: "Preço mínimo deve ser menor que o máximo",
  path: ["maxPrice"]
});

const bulkEditSchema = z.object({
  active: z.boolean().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const itemLinkSchema = z.object({
  targetItemId: z.string().min(1, "Item de destino é obrigatório"),
  linkType: z.enum(["kit", "substitute", "compatible", "accessory"]),
  quantity: z.number().min(1).optional(),
  description: z.string().optional(),
});

const customerPersonalizationSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  customSku: z.string().optional(),
  customName: z.string().optional(),
  customDescription: z.string().optional(),
});

const supplierLinkSchema = z.object({
  supplierId: z.string().min(1, "Fornecedor é obrigatório"),
  price: z.number().min(0).optional(),
  currency: z.string().default("BRL"),
  leadTime: z.number().min(0).optional(),
  isPreferred: z.boolean().default(false),
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

const linkTypeLabels = {
  kit: "Kit/Conjunto",
  substitute: "Substituto",
  compatible: "Compatível",
  accessory: "Acessório"
};

export default function ItemCatalog() {
  // Estados da jornada do usuário
  const [currentView, setCurrentView] = useState<'catalog' | 'item-details' | 'management'>('catalog');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Estados para operações em lote
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for the selected file

  // Estados de modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const [isSupplierLinkModalOpen, setIsSupplierLinkModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const itemForm = useForm<z.infer<typeof itemSchema>>({
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

  const linkForm = useForm<z.infer<typeof itemLinkSchema>>({
    resolver: zodResolver(itemLinkSchema),
    defaultValues: {
      targetItemId: '',
      linkType: 'kit',
      quantity: 1,
      description: '',
    }
  });

  const personalizationForm = useForm<z.infer<typeof customerPersonalizationSchema>>({
    resolver: zodResolver(customerPersonalizationSchema),
    defaultValues: {
      customerId: '',
      customSku: '',
      customName: '',
      customDescription: '',
    }
  });

  const supplierForm = useForm<z.infer<typeof supplierLinkSchema>>({
    resolver: zodResolver(supplierLinkSchema),
    defaultValues: {
      supplierId: '',
      price: 0,
      currency: 'BRL',
      leadTime: 0,
      isPreferred: false,
    }
  });

  // Queries
  const { data: itemsResponse, isLoading: isLoadingItems, refetch } = useQuery({
    queryKey: ["/api/materials-services/items"],
    enabled: true
  });

  const { data: itemStatsResponse } = useQuery({
    queryKey: ["/api/materials-services/items/stats"],
    enabled: true
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

  // Query para vínculos do item selecionado
  const { data: itemLinksResponse } = useQuery({
    queryKey: ["/api/materials-services/item-links", selectedItem?.id],
    enabled: !!selectedItem,
    queryFn: async () => {
      if (!selectedItem) return { data: { itemLinks: [] } };
      try {
        const response = await apiRequest('GET', `/api/materials-services/item-links/${selectedItem.id}`);
        const result = await response.json();
        return result.success ? result : { data: { itemLinks: [] } };
      } catch (error) {
        console.error('Erro ao carregar vínculos:', error);
        return { data: { itemLinks: [] } };
      }
    }
  });

  // Query para personalizações do item selecionado
  const { data: personalizationsResponse } = useQuery({
    queryKey: ["/api/materials-services/customer-personalizations", selectedItem?.id],
    enabled: !!selectedItem,
    queryFn: async () => {
      if (!selectedItem) return { data: { personalizations: [] } };
      try {
        const response = await apiRequest('GET', `/api/materials-services/customer-personalizations/item/${selectedItem.id}`);
        const result = await response.json();
        return result.success ? result : { data: { personalizations: [] } };
      } catch (error) {
        console.error('Erro ao carregar personalizações:', error);
        return { data: { personalizations: [] } };
      }
    }
  });

  // Query para vínculos de fornecedores do item selecionado
  const { data: supplierLinksResponse } = useQuery({
    queryKey: ["/api/materials-services/supplier-links", selectedItem?.id],
    enabled: !!selectedItem,
    queryFn: async () => {
      if (!selectedItem) return { data: { supplierLinks: [] } };
      try {
        const response = await apiRequest('GET', `/api/materials-services/supplier-links/item/${selectedItem.id}`);
        const result = await response.json();
        return result.success ? result : { data: { supplierLinks: [] } };
      } catch (error) {
        console.error('Erro ao carregar vínculos de fornecedores:', error);
        return { data: { supplierLinks: [] } };
      }
    }
  });

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof itemSchema>) => {
      const response = await apiRequest('POST', '/api/materials-services/items', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar item');
      }
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
      itemForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar item",
        description: error.message || "Tente novamente mais tarde.",
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
      setIsEditModalOpen(false);
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

  const createItemLinkMutation = useMutation({
    mutationFn: async (data: z.infer<typeof itemLinkSchema>) => {
      const payload = {
        ...data,
        sourceItemId: selectedItem?.id,
      };
      const response = await apiRequest('POST', '/api/materials-services/item-links', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/item-links", selectedItem?.id] });
      toast({
        title: "Vínculo criado com sucesso",
        description: "O vínculo entre itens foi estabelecido.",
      });
      setIsLinkModalOpen(false);
      linkForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao criar vínculo",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const createPersonalizationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerPersonalizationSchema>) => {
      const payload = {
        ...data,
        itemId: selectedItem?.id,
      };
      const response = await apiRequest('POST', '/api/materials-services/customer-personalizations', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/customer-personalizations", selectedItem?.id] });
      toast({
        title: "Personalização criada com sucesso",
        description: "A personalização para o cliente foi configurada.",
      });
      setIsPersonalizationModalOpen(false);
      personalizationForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao criar personalização",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const createSupplierLinkMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supplierLinkSchema>) => {
      const payload = {
        ...data,
        itemId: selectedItem?.id,
      };
      const response = await apiRequest('POST', '/api/materials-services/supplier-links', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/supplier-links", selectedItem?.id] });
      toast({
        title: "Vínculo de fornecedor criado com sucesso",
        description: "O fornecedor foi vinculado ao item.",
      });
      setIsSupplierLinkModalOpen(false);
      supplierForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao criar vínculo de fornecedor",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Processar dados
  const items: Item[] = (itemsResponse as any)?.data || [];
  const itemStats = (itemStatsResponse as any)?.data || [];

  const filteredItems = items.filter((item: Item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.integrationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && item.active) ||
                         (statusFilter === "inactive" && !item.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  const materialCount = items.filter(item => item.type === 'material').length;
  const serviceCount = items.filter(item => item.type === 'service').length;

  // Handlers
  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setCurrentView('item-details');
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    itemForm.reset({
      name: item.name || '',
      type: item.type || 'material',
      integrationCode: item.integrationCode || '',
      description: item.description || '',
      measurementUnit: item.measurementUnit || 'UN',
      maintenancePlan: item.maintenancePlan || '',
      defaultChecklist: item.defaultChecklist || '',
      active: item.active !== undefined ? item.active : true,
    });
    setIsEditModalOpen(true);
  };

  const onSubmitItem = async (data: z.infer<typeof itemSchema>) => {
    if (selectedItem && isEditModalOpen) {
      updateItemMutation.mutate({ id: selectedItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const onSubmitItemLink = async (data: z.infer<typeof itemLinkSchema>) => {
    createItemLinkMutation.mutate(data);
  };

  const onSubmitPersonalization = async (data: z.infer<typeof customerPersonalizationSchema>) => {
    createPersonalizationMutation.mutate(data);
  };

  const onSubmitSupplierLink = async (data: z.infer<typeof supplierLinkSchema>) => {
    createSupplierLinkMutation.mutate(data);
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedItems.size === paginatedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedItems.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    try {
      const deletePromises = Array.from(selectedItems).map(id => 
        deleteItemMutation.mutateAsync(id)
      );
      await Promise.all(deletePromises);

      setSelectedItems(new Set());
      toast({
        title: "Itens excluídos com sucesso",
        description: `${selectedItems.size} itens foram removidos do catálogo.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exclusão em lote",
        description: "Alguns itens não puderam ser excluídos.",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: boolean) => {
    if (selectedItems.size === 0) return;

    try {
      const updatePromises = Array.from(selectedItems).map(id => {
        const item = items.find(i => i.id === id);
        if (!item) return Promise.resolve();

        return updateItemMutation.mutateAsync({
          id,
          data: { ...item, active: newStatus }
        });
      });

      await Promise.all(updatePromises);
      setSelectedItems(new Set());

      toast({
        title: "Status atualizado",
        description: `${selectedItems.size} itens foram ${newStatus ? 'ativados' : 'desativados'}.`,
      });
    } catch (error) {
      toast({
        title: "Erro na atualização em lote",
        description: "Alguns itens não puderam ser atualizados.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const csvData = items.map(item => ({
      nome: item.name,
      tipo: item.type,
      codigo: item.integrationCode || '',
      descricao: item.description || '',
      unidade: item.measurementUnit,
      status: item.active ? 'Ativo' : 'Inativo',
      criado_em: new Date(item.createdAt).toLocaleDateString('pt-BR')
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `itens_catalogo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handlers for file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Handler for the import action
  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo CSV para importar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await fetch('/api/materials-services/import/csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Importação concluída",
          description: `${result.data.imported} itens importados com sucesso.`,
        });

        // Refresh items list
        refetch(); // Assuming refetch is available from useQuery
        setIsImportModalOpen(false);
        setSelectedFile(null);
      } else {
        toast({
          title: "Erro na importação",
          description: result.message || "Falha ao importar arquivo CSV.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar arquivo CSV.",
        variant: "destructive",
      });
    }
  };

  // Renderizar catálogo principal
  const renderCatalogView = () => (
    <div className="space-y-6">
      {/* Header com métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total de Itens</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Materiais</p>
                <p className="text-2xl font-bold">{materialCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wrench className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Serviços</p>
                <p className="text-2xl font-bold">{serviceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Ativos</p>
                <p className="text-2xl font-bold">{items.filter(i => i.active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de busca e filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="material">Materiais</SelectItem>
                <SelectItem value="service">Serviços</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsBulkMode(!isBulkMode)}
                className={isBulkMode ? "bg-blue-100 border-blue-300" : ""}
              >
                <Checkbox className="h-4 w-4 mr-2" />
                {isBulkMode ? "Sair do Modo Lote" : "Modo Lote"}
              </Button>

              <Button variant="outline" onClick={exportToCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar
              </Button>

              <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Importar
              </Button>

              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barra de ações em lote */}
      {isBulkMode && selectedItems.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-700">
                  {selectedItems.size} item(s) selecionado(s)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkStatusChange(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Ativar Todos
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkStatusChange(false)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Desativar Todos
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsBulkEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Lote
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Todos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir {selectedItems.size} item(s)? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Excluir {selectedItems.size} Item(s)
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de itens */}
      <Card>
        <CardContent className="p-6">
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
          ) : paginatedItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item encontrado</h3>
              <p className="text-gray-500 mb-4">Tente ajustar os filtros ou criar um novo item.</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header com seleção geral no modo lote */}
              {isBulkMode && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Checkbox
                    checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-600">
                    Selecionar todos os itens desta página
                  </span>
                </div>
              )}

              {paginatedItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    !isBulkMode ? 'cursor-pointer' : ''
                  } ${selectedItems.has(item.id) ? 'bg-blue-50 border-blue-200' : ''}`}
                  onClick={() => !isBulkMode && handleItemClick(item)}
                >
                  <div className="flex items-center space-x-4">
                    {/* Checkbox para modo lote */}
                    {isBulkMode && (
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => handleSelectItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-2"
                      />
                    )}

                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      item.type === 'material' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {item.type === 'material' ? <Package className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium hover:text-blue-600">{item.name}</h3>
                        <Badge variant={item.active ? "default" : "secondary"}>
                          {item.active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">
                          {item.type === 'material' ? 'Material' : 'Serviço'}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {item.integrationCode && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {item.integrationCode}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {item.measurementUnit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 max-w-2xl truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditItem(item);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o item "{item.name}"? 
                            Esta ação não pode ser desfeita e removerá todos os vínculos associados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir Item
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} itens
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (page === currentPage || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={page === currentPage}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );

  // Renderizar detalhes do item
  const renderItemDetailsView = () => {
    if (!selectedItem) return null;

    const itemLinks = (itemLinksResponse as any)?.data?.itemLinks || [];
    const personalizations = (personalizationsResponse as any)?.data?.personalizations || [];
    const supplierLinks = (supplierLinksResponse as any)?.data?.supplierLinks || [];

    return (
      <div className="space-y-6">
        {/* Header do item */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentView('catalog')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Catálogo
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedItem.type === 'material' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              }`}>
                {selectedItem.type === 'material' ? <Package className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedItem.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedItem.active ? "default" : "secondary"}>
                    {selectedItem.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Badge variant="outline">
                    {selectedItem.type === 'material' ? 'Material' : 'Serviço'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => handleEditItem(selectedItem)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Item
            </Button>
          </div>
        </div>

        {/* Informações básicas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações principais */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedItem.integrationCode && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Código de Integração</label>
                      <p className="text-sm mt-1">{selectedItem.integrationCode}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Unidade de Medida</label>
                    <p className="text-sm mt-1">{selectedItem.measurementUnit}</p>
                  </div>

                  {selectedItem.maintenancePlan && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Plano de Manutenção</label>
                      <p className="text-sm mt-1">{selectedItem.maintenancePlan}</p>
                    </div>
                  )}

                  {selectedItem.defaultChecklist && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Checklist Padrão</label>
                      <p className="text-sm mt-1">{selectedItem.defaultChecklist}</p>
                    </div>
                  )}
                </div>

                {selectedItem.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <p className="text-sm mt-1">{selectedItem.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-gray-500">
                  <div>
                    <label className="font-medium">Criado em</label>
                    <p>{new Date(selectedItem.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="font-medium">Atualizado em</label>
                    <p>{new Date(selectedItem.updatedAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo de vínculos */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Vínculos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Vínculos de Itens</span>
                  </div>
                  <Badge variant="secondary">{itemLinks.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Personalizações</span>
                  </div>
                  <Badge variant="secondary">{personalizations.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Fornecedores</span>
                  </div>
                  <Badge variant="secondary">{supplierLinks.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Abas de vínculos */}
        <Tabs defaultValue="item-links" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="item-links" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Vínculos de Itens ({itemLinks.length})
            </TabsTrigger>
            <TabsTrigger value="personalizations" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Personalizações ({personalizations.length})
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Fornecedores ({supplierLinks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="item-links" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vínculos de Itens</CardTitle>
                  <CardDescription>
                    Itens relacionados, kits, substitutos e acessórios
                  </CardDescription>
                </div>
                <Button onClick={() => setIsLinkModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Vínculo
                </Button>
              </CardHeader>
              <CardContent>
                {itemLinks.length === 0 ? (
                  <div className="text-center py-8">
                    <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum vínculo configurado</p>
                    <Button onClick={() => setIsLinkModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Vínculo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itemLinks.map((link: any) => (
                      <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Link className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{link.targetItem?.name || 'Item não encontrado'}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Badge variant="outline" className="text-xs">
                                {linkTypeLabels[link.linkType as keyof typeof linkTypeLabels] || link.linkType}
                              </Badge>
                              {link.quantity && <span>Qtd: {link.quantity}</span>}
                            </div>
                            {link.description && (
                              <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personalizations" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personalizações de Clientes</CardTitle>
                  <CardDescription>
                    Configurações específicas para cada cliente
                  </CardDescription>
                </div>
                <Button onClick={() => setIsPersonalizationModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Personalização
                </Button>
              </CardHeader>
              <CardContent>
                {personalizations.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma personalização configurada</p>
                    <Button onClick={() => setIsPersonalizationModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Personalização
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {personalizations.map((personalization: any) => (
                      <div key={personalization.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{personalization.customerName}</h4>
                            <div className="text-sm text-gray-500 space-y-1">
                              {personalization.customSku && (
                                <p><span className="font-medium">SKU:</span> {personalization.customSku}</p>
                              )}
                              {personalization.customName && (
                                <p><span className="font-medium">Nome:</span> {personalization.customName}</p>
                              )}
                              {personalization.customDescription && (
                                <p><span className="font-medium">Descrição:</span> {personalization.customDescription}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={personalization.isActive ? "default" : "secondary"}>
                          {personalization.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Fornecedores</CardTitle>
                  <CardDescription>
                    Fornecedores, preços e condições de compra
                  </CardDescription>
                </div>
                <Button onClick={() => setIsSupplierLinkModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </CardHeader>
              <CardContent>
                {supplierLinks.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum fornecedor configurado</p>
                    <Button onClick={() => setIsSupplierLinkModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Fornecedor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supplierLinks.map((link: any) => (
                      <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Truck className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{link.supplierName}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {link.price && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {new Intl.NumberFormat('pt-BR', { 
                                    style: 'currency', 
                                    currency: link.currency || 'BRL' 
                                  }).format(link.price)}
                                </span>
                              )}
                              {link.leadTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {link.leadTime} dias
                                </span>
                              )}
                              {link.isPreferred && (
                                <Badge variant="default" className="text-xs">Preferencial</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>Gestão</span>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">Catálogo de Itens</span>
        {currentView === 'item-details' && selectedItem && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-gray-900">{selectedItem.name}</span>
          </>
        )}
      </div>

      {/* Header principal */}
      {currentView === 'catalog' && (
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Catálogo de Itens</h1>
            <p className="text-gray-600 mt-2">
              Gerencie materiais, serviços e suas configurações em um só lugar
            </p>
          </div>
          <Button onClick={() => setCurrentView('management')} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Gestão Avançada
          </Button>
        </div>
      )}

      {/* Conteúdo baseado na view atual */}
      {currentView === 'catalog' && renderCatalogView()}
      {currentView === 'item-details' && renderItemDetailsView()}

      {/* Modal de Criação/Edição de Item */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        setIsEditModalOpen(open);
        if (!open) {
          setSelectedItem(null);
          itemForm.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? 'Editar Item' : 'Criar Novo Item'}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen 
                ? 'Modifique as informações do item selecionado'
                : 'Preencha as informações para criar um novo item no catálogo'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Item *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={itemForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
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
                  control={itemForm.control}
                  name="integrationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Integração</FormLabel>
                      <FormControl>
                        <Input placeholder="Código" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={itemForm.control}
                  name="measurementUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida *</FormLabel>
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
              </div>

              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do item" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
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
                  control={itemForm.control}
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
              </div>

              <FormField
                control={itemForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Ativo</FormLabel>
                      <FormDescription>
                        Determina se o item está disponível para uso
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                    itemForm.reset();
                  }}
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {createItemMutation.isPending || updateItemMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {isEditModalOpen ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditModalOpen ? 'Atualizar Item' : 'Criar Item'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Vínculo de Item */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Vínculo de Item</DialogTitle>
            <DialogDescription>
              Vincule este item a outro item do catálogo
            </DialogDescription>
          </DialogHeader>

          <Form {...linkForm}>
            <form onSubmit={linkForm.handleSubmit(onSubmitItemLink)} className="space-y-4">
              <FormField
                control={linkForm.control}
                name="targetItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item de Destino *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.filter(item => item.id !== selectedItem?.id).map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.type === 'material' ? 'Material' : 'Serviço'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={linkForm.control}
                name="linkType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Vínculo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kit">Kit/Conjunto</SelectItem>
                        <SelectItem value="substitute">Substituto</SelectItem>
                        <SelectItem value="compatible">Compatível</SelectItem>
                        <SelectItem value="accessory">Acessório</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={linkForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={linkForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre o vínculo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsLinkModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createItemLinkMutation.isPending}>
                  {createItemLinkMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Criar Vínculo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Personalização */}
      <Dialog open={isPersonalizationModalOpen} onOpenChange={setIsPersonalizationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Personalização de Cliente</DialogTitle>
            <DialogDescription>
              Configure personalizações específicas para um cliente
            </DialogDescription>
          </DialogHeader>

          <Form {...personalizationForm}>
            <form onSubmit={personalizationForm.handleSubmit(onSubmitPersonalization)} className="space-y-4">
              <FormField
                control={personalizationForm.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(availableCustomers || []).map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name || customer.tradeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalizationForm.control}
                name="customSku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU Personalizado</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalizationForm.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Personalizado</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome usado pelo cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalizationForm.control}
                name="customDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Personalizada</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição específica para o cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPersonalizationModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createPersonalizationMutation.isPending}>
                  {createPersonalizationMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Building className="h-4 w-4 mr-2" />
                      Criar Personalização
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Vínculo de Fornecedor */}
      <Dialog open={isSupplierLinkModalOpen} onOpenChange={setIsSupplierLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Fornecedor</DialogTitle>
            <DialogDescription>
              Configure um fornecedor para este item
            </DialogDescription>
          </DialogHeader>

          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit(onSubmitSupplierLink)} className="space-y-4">
              <FormField
                control={supplierForm.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(availableSuppliers || []).map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={supplierForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
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
                  control={supplierForm.control}
                  name="leadTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Time (dias)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
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
                control={supplierForm.control}
                name="isPreferred"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Fornecedor Preferencial</FormLabel>
                      <FormDescription>
                        Marca este fornecedor como preferencial para o item
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSupplierLinkModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSupplierLinkMutation.isPending}>
                  {createSupplierLinkMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Vincular Fornecedor
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição em Lote */}
      <Dialog open={isBulkEditModalOpen} onOpenChange={setIsBulkEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edição em Lote</DialogTitle>
            <DialogDescription>
              Editar {selectedItems.size} item(s) selecionado(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="bulk-active"
                onCheckedChange={(checked) => handleBulkStatusChange(checked)}
              />
              <label htmlFor="bulk-active" className="text-sm font-medium">
                Ativar/Desativar todos os itens
              </label>
            </div>

            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipamentos">Equipamentos</SelectItem>
                  <SelectItem value="consumiveis">Consumíveis</SelectItem>
                  <SelectItem value="ferramentas">Ferramentas</SelectItem>
                  <SelectItem value="servicos-tecnicos">Serviços Técnicos</SelectItem>
                  <SelectItem value="servicos-consultoria">Serviços de Consultoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tags</label>
              <Input placeholder="Digite tags separadas por vírgula" />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsBulkEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsBulkEditModalOpen(false)}>
              <Save className="h-4 w-4 mr-2" />
              Aplicar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Importação */}
      <Dialog open={isImportModalOpen} onOpenChange={(open) => {
        setIsImportModalOpen(open);
        if (!open) {
          setSelectedFile(null); // Clear selected file when modal is closed
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Itens</DialogTitle>
            <DialogDescription>
              Importe itens em lote através de arquivo CSV ou Excel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Arraste um arquivo CSV/Excel aqui ou clique para selecionar
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="file-upload"
                onChange={handleFileChange} // Attach the handler here
              />
              <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                <FileText className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-2">Arquivo selecionado: {selectedFile.name}</p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Formato do Arquivo</h4>
              <p className="text-sm text-blue-700 mb-2">
                O arquivo deve conter as seguintes colunas:
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <div>• <strong>nome</strong> (obrigatório)</div>
                <div>• <strong>tipo</strong> (material ou service)</div>
                <div>• <strong>codigo</strong> (opcional)</div>
                <div>• <strong>descricao</strong> (opcional)</div>
                <div>• <strong>unidade</strong> (obrigatório)</div>
                <div>• <strong>categoria</strong> (opcional)</div>
                <div>• <strong>tags</strong> (opcional, separadas por ;)</div>
              </div>
            </div>

            <div>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Baixar Modelo CSV
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => {
              setIsImportModalOpen(false);
              setSelectedFile(null); // Clear selected file on cancel
            }}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!selectedFile}> {/* Disable if no file is selected */}
              <ShoppingCart className="h-4 w-4 mr-2" />
              Importar Itens
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}