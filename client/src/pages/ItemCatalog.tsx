import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// import useLocalization from '@/hooks/useLocalization';
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
  Search,
  Filter,
  ArrowLeft,
  Settings,
  ChevronRight,
  ExternalLink,
  Users,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShoppingCart,
  Tag,
  Calendar,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  // Campos para hierarquia
  parentId?: string;
  isParent?: boolean;
  childrenCount?: number;
  // Campos para vínculos
  companiesCount?: number;
  suppliersCount?: number;
  linkedCompanies?: { id: string; name: string }[];
  linkedSuppliers?: { id: string; name: string }[];
  linkedChildren?: { id: string; name: string }[];
}
const itemSchema = z.object({
  // Localization temporarily disabled
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  type: z.enum(["material", "service"]),
  integrationCode: z.string().max(100, "Código muito longo").optional().or(z.literal("")),
  description: z.string().max(1000, "Descrição muito longa").optional(),
  measurementUnit: z.string().min(1, "Unidade de medida é obrigatória"),
  maintenancePlan: z.string().max(255, "Plano muito longo").optional(),
  defaultChecklist: z.string().max(255, "Checklist muito longo").optional(),
  active: z.boolean().default(true),
  parentId: z.string().optional(),
  childrenIds: z.array(z.string()).optional(), // Para vincular filhos
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
  // Estados principais
  const [currentView, setCurrentView] = useState<'catalog' | 'item-details' | 'item-edit'>('catalog');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]); // State to hold fetched items
  const [loading, setLoading] = useState(true); // State for loading indicator
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hierarchyFilter, setHierarchyFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  // Estados para operações em lote
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  // Estados de modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Form
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
      parentId: undefined,
      childrenIds: [],
    }
  });
  // Fetch items on mount and when filters change
  useEffect(() => {
    fetchItems();
  }, [searchTerm, typeFilter, statusFilter, hierarchyFilter]);
  // Fetch items with enhanced authentication handling per 1qa.md compliance
  const fetchItems = async () => {
    try {
      console.log('🔍 [ItemCatalog] Starting to fetch items...');
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim() !== '') {
        params.append('search', searchTerm.trim());
      }
      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const url = "
      console.log('🔍 [ItemCatalog] Fetching from URL:', url);
      // ✅ CRITICAL FIX - Enhanced token validation per 1qa.md compliance
      const token = localStorage.getItem('accessToken');
      if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
        console.error('❌ [ItemCatalog] No valid authentication token found');
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive"
        });
        // Don't force redirect following 1qa.md - let components handle auth state
        console.log('Invalid tokens detected - components will handle auth state');
        return;
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': "
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
      console.log('🔍 [ItemCatalog] Response status:', response.status);
      console.log('🔍 [ItemCatalog] Response headers:', Object.fromEntries(response.headers.entries()));
      // ✅ CRITICAL FIX - Handle 401/403 responses with token refresh per 1qa.md
      if (response.status === 401 || response.status === 403) {
        console.log('🔄 [ItemCatalog] Token expired, attempting refresh...');
        
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
          console.error('❌ [ItemCatalog] No refresh token available');
          
          // Clear invalid tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // Don't force redirect following 1qa.md - let components handle auth state
          console.log('Session expired detected - components will handle auth state');
          return;
        }
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            
            // ✅ CRITICAL FIX - Handle backend response structure per 1qa.md compliance
            if (refreshData.success && refreshData.data?.tokens) {
              const { accessToken, refreshToken: newRefreshToken } = refreshData.data.tokens;
              localStorage.setItem('accessToken', accessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              
              // Retry the original request with new token
              const retryResponse = await fetch(url, {
                headers: {
                  'Authorization': "
                  'Content-Type': 'application/json'
                }
              });
              
              if (retryResponse.ok) {
                const data = await retryResponse.json();
                if (data.success && Array.isArray(data.data)) {
                  setItems(data.data);
                  console.log('✅ [ItemCatalog] Successfully loaded after token refresh:', data.data.length, 'items');
                  return;
                }
              }
            }
          }
        } catch (refreshError) {
          console.error('❌ [ItemCatalog] Token refresh failed:', refreshError);
        }
        
        // If refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive"
        });
        
        // Don't force redirect following 1qa.md - let components handle auth state
        console.log('CSP-related errors detected - components will handle auth state');
        return;
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 [ItemCatalog] Response error:', errorText);
        throw new Error("
      }
      // ✅ CRITICAL FIX - Enhanced error handling per 1qa.md compliance
      let data;
      try {
        const responseText = await response.text();
        console.log('🔍 [ItemCatalog] Raw response length:', responseText.length);
        console.log('🔍 [ItemCatalog] Raw response start:', responseText.substring(0, 200));
        console.log('🔍 [ItemCatalog] Response content-type:', response.headers.get('content-type'));
        
        // ✅ CRITICAL FIX - Enhanced HTML response detection per 1qa.md compliance
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.error('❌ [ItemCatalog] Non-JSON content-type:', contentType);
          console.error('❌ [ItemCatalog] This indicates Vite is intercepting the API route');
          throw new Error('API route intercepted by Vite - authentication required');
        }
        // Check if response is HTML (error page)
        if (responseText.trim().startsWith('<!DOCTYPE') || 
            responseText.trim().startsWith('<html') || 
            responseText.includes('<script') ||
            responseText.includes('import { createHotContext }') ||
            responseText.includes('vite') ||
            responseText.includes('@vite/client')) {
          console.error('❌ [ItemCatalog] Received HTML/JavaScript instead of JSON - Vite interception detected');
          console.error('❌ [ItemCatalog] This indicates API routing is not working properly');
          
          // Clear tokens and force re-authentication
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          throw new Error('Vite intercepted API route - forcing re-authentication');
        }
        
        // Check if response is empty
        if (!responseText.trim()) {
          console.error('❌ [ItemCatalog] Received empty response');
          throw new Error('Server returned empty response');
        }
        
        data = JSON.parse(responseText);
        console.log('✅ [ItemCatalog] Successfully parsed JSON response');
      } catch (parseError) {
        console.error('❌ [ItemCatalog] JSON parsing error:', parseError);
        console.error('❌ [ItemCatalog] Parse error details:', {
          name: parseError.name,
          message: parseError.message,
          position: parseError.position
        });
        throw new Error("
      }
      console.log('🔍 [ItemCatalog] Response data:', {
        success: data.success,
        itemCount: data.data?.length || 0,
        total: data.total,
        metadata: data.metadata
      });
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
        console.log('✅ [ItemCatalog] Successfully loaded', data.data.length, 'items');
        if (data.data.length > 0) {
          console.log('🔍 [ItemCatalog] Sample item:', data.data[0]);
        }
      } else {
        console.warn('⚠️ [ItemCatalog] Unexpected response format:', data);
        setItems([]);
      }
    } catch (error) {
      console.error('❌ [ItemCatalog] Error fetching items:', error);
      setItems([]);
      // ✅ Enhanced error handling per 1qa.md compliance
      if (error.message.includes('authentication') || error.message.includes('401') || error.message.includes('403')) {
        // Don't force redirect following 1qa.md - let components handle auth state  
        console.log('Authentication error detected - components will handle auth state');
      } else {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: '[TRANSLATION_NEEDED]',
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };
  // Queries
  const { data: availableCustomers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers/companies"],
    queryFn: () => apiRequest('GET', '/api/customers/companies').then(res => res.json()),
  });
  const { data: availableSuppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["/api/materials-services/suppliers"],
    queryFn: () => apiRequest('GET', '/api/materials-services/suppliers').then(res => res.json()),
  });
  // Query for specific item links when editing
  const { data: itemLinksData, refetch: refetchItemLinks } = useQuery({
    queryKey: ['/api/materials-services/items', selectedItem?.id, 'links'],
    queryFn: async () => {
      if (!selectedItem?.id) return { customers: [], suppliers: [] };
      try {
        const response = await apiRequest('GET', "/links`);
        const result = await response.json();
        console.log('🔗 Links carregados:', result);
        return result?.data || { customers: [], suppliers: [] };
      } catch (error) {
        console.error('[TRANSLATION_NEEDED]', error);
        return { customers: [], suppliers: [] };
      }
    },
    enabled: !!selectedItem?.id && (currentView === 'item-details' || currentView === 'item-edit')
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
        title: '[TRANSLATION_NEEDED]',
        description: "O item foi adicionado ao catálogo.",
      });
      setIsCreateModalOpen(false);
      itemForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof itemSchema> }) => {
      const response = await apiRequest('PUT', "
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items/stats"] });
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "As alterações foram salvas.",
      });
      setCurrentView('item-details');
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', "
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items"] });
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "O item foi removido do catálogo.",
      });
    },
    onError: () => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
  // Processar dados
  const companies = (availableCustomers as any)?.data || [];
  const suppliers = (availableSuppliers as any)?.data || [];
  const filteredItems = items.filter((item: Item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.integrationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && item.active) ||
                         (statusFilter === "inactive" && !item.active);
    const matchesHierarchy = hierarchyFilter === "all" ||
                           (hierarchyFilter === "parent" && item.isParent) ||
                           (hierarchyFilter === "child" && item.parentId) ||
                           (hierarchyFilter === "standalone" && !item.parentId && !item.isParent);
    return matchesSearch && matchesType && matchesStatus && matchesHierarchy;
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
  }, [searchTerm, typeFilter, statusFilter, hierarchyFilter]);
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
      parentId: item.parentId || undefined,
      childrenIds: item.linkedChildren?.map(child => child.id) || [], // Assuming linkedChildren is available or fetched
    });
    setCurrentView('item-edit');
  };
  const onSubmitItem = async (data: z.infer<typeof itemSchema>) => {
    if (selectedItem && currentView === 'item-edit') {
      // Logic to update item and its hierarchical links
      try {
        const updateResponse = await apiRequest('PUT', "
          ...data,
          childrenIds: data.childrenIds, // Ensure childrenIds are sent
        });
        if (!updateResponse.ok) throw new Error('Failed to update item');
        toast({ title: "Item atualizado", description: "Informações e vínculos salvos." });
        queryClient.invalidateQueries({ queryKey: ["/api/materials-services/items"] });
        setCurrentView('item-details');
      } catch (error) {
        toast({ title: "Erro ao atualizar", description: "Tente novamente.", variant: "destructive" });
      }
    } else {
      createItemMutation.mutate(data);
    }
  };
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
  const renderCatalogView = () => (
    <div className=""
      <div className=""
        <div>
          <h1 className="text-lg">"Catálogo de Itens</h1>
          <p className=""
            {items.length} {items.length === 1 ? 'item encontrado' : 'itens encontrados'}
            {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && ' (filtrado)'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setCurrentView('management')}>
          <Settings className="h-4 w-4 mr-2" />
          Ferramentas
        </Button>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>
      <Card>
        <CardContent className=""
          <div className=""
            <div className=""
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder='[TRANSLATION_NEEDED]'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className=""
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className=""
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="material">Materiais</SelectItem>
                  <SelectItem value="service">Serviços</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className=""
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={hierarchyFilter} onValueChange={setHierarchyFilter}>
                <SelectTrigger className=""
                  <SelectValue placeholder="Hierarquia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="parent">Apenas Pais</SelectItem>
                  <SelectItem value="child">Apenas Filhos</SelectItem>
                  <SelectItem value="standalone">Independentes</SelectItem>
                </SelectContent>
              </Select>
              <div className=""
                <Button
                  variant={isBulkMode ? "default" : "outline"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className="flex items-center gap-2"
                >
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                    isBulkMode ? 'bg-primary border-primary' : 'border-input'
                  >
                    {isBulkMode && <div className="h-2 w-2 bg-primary-foreground rounded-sm" />}
                  </div>
                  Lote ({selectedItems.size})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className=""
          {loading ? (
            <div className=""
              <div className="text-lg">"</div>
              <span className="text-lg">"Carregando itens...</span>
            </div>
          ) : items.length === 0 ? (
            <div className=""
              <div className=""
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? '[TRANSLATION_NEEDED]'
                  : '[TRANSLATION_NEEDED]'}
              </div>
              {(!searchTerm && typeFilter === 'all' && statusFilter === 'all') && (
                <Button onClick={() => window.location.reload()} variant="outline>
                  Recarregar página
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {isBulkMode && (
                      <TableHead className=""
                        <Checkbox
                          checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-lg">"Tipo</TableHead>
                    <TableHead className="text-lg">"Código</TableHead>
                    <TableHead className="text-lg">"Unidade</TableHead>
                    <TableHead className="text-lg">"Hierarquia</TableHead>
                    <TableHead className="text-lg">"Empresas</TableHead>
                    <TableHead className="text-lg">"Fornecedores</TableHead>
                    <TableHead className="text-lg">"Status</TableHead>
                    <TableHead className="text-lg">"Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedItems.has(item.id) ? 'bg-blue-50' : ''
                      "
                    >
                      {isBulkMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell
                        className="font-medium cursor-pointer hover:text-blue-600"
                        onClick={() => handleItemClick(item)}
                      >
                        <div className=""
                          {item.type === 'material' ?
                            <Package className="h-4 w-4 text-blue-600" /> :
                            <Wrench className="h-4 w-4 text-green-600" />
                          }
                          <div>
                            <div className="text-lg">"{item.name}</div>
                            {item.description && (
                              <div className=""
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'material' ? 'default' : 'secondary'}>
                          {item.type === 'material' ? 'Material' : 'Serviço'}
                        </Badge>
                      </TableCell>
                      <TableCell className=""
                        {item.integrationCode || '-'}
                      </TableCell>
                      <TableCell className=""
                        {item.measurementUnit}
                      </TableCell>
                      <TableCell>
                        <div className=""
                          {item.isParent && (
                            <Badge variant="outline" className=""
                              <Layers className="h-3 w-3 mr-1" />
                              Pai ({item.childrenCount || 0})
                            </Badge>
                          )}
                          {item.parentId && (
                            <Badge variant="outline" className=""
                              <ChevronRight className="h-3 w-3 mr-1" />
                              Filho
                            </Badge>
                          )}
                          {!item.parentId && !item.isParent && (
                            <span className="text-lg">"-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(item.companiesCount || 0) > 0 ? (
                          <div className=""
                            <Building className="h-3 w-3 text-blue-600" />
                            <span className="text-lg">"{item.companiesCount}</span>
                          </div>
                        ) : (
                          <span className="text-lg">"-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(item.suppliersCount || 0) > 0 ? (
                          <div className=""
                            <Truck className="h-3 w-3 text-amber-600" />
                            <span className="text-lg">"{item.suppliersCount}</span>
                          </div>
                        ) : (
                          <span className="text-lg">"-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.active ? "default" : "secondary>
                          {item.active ? "Ativo" : "Inativo"
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className=""
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o item "{item.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteItemMutation.mutate(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className=""
                  <div className=""
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} itens
                  </div>
                  <div className=""
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className=""
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
  const renderItemDetailsView = () => {
    if (!selectedItem) return null;
    return (
      <div className=""
        <div className=""
          <div className=""
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('catalog')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Catálogo
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className=""
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedItem.type === 'material' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              >
                {selectedItem.type === 'material' ? <Package className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-lg">"{selectedItem.name}</h1>
                <div className=""
                  <Badge variant={selectedItem.active ? "default" : "secondary>
                    {selectedItem.active ? "Ativo" : "Inativo"
                  </Badge>
                  <Badge variant="outline>
                    {selectedItem.type === 'material' ? 'Material' : 'Serviço'}
                  </Badge>
                  {selectedItem.isParent && (
                    <Badge variant="outline>
                      <Layers className="h-3 w-3 mr-1" />
                      Item Pai
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className=""
            <Button
              variant="outline"
              onClick={() => handleEditItem(selectedItem)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Item
            </Button>
          </div>
        </div>
        <div className=""
          <div className=""
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className=""
                <div className=""
                  {selectedItem.integrationCode && (
                    <div>
                      <label className="text-lg">"Código de Integração</label>
                      <p className="text-lg">"{selectedItem.integrationCode}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-lg">"Unidade de Medida</label>
                    <p className="text-lg">"{selectedItem.measurementUnit}</p>
                  </div>
                  {selectedItem.maintenancePlan && (
                    <div>
                      <label className="text-lg">"Plano de Manutenção</label>
                      <p className="text-lg">"{selectedItem.maintenancePlan}</p>
                    </div>
                  )}
                  {selectedItem.defaultChecklist && (
                    <div>
                      <label className="text-lg">"Checklist Padrão</label>
                      <p className="text-lg">"{selectedItem.defaultChecklist}</p>
                    </div>
                  )}
                </div>
                {selectedItem.description && (
                  <div>
                    <label className="text-lg">"Descrição</label>
                    <p className="text-lg">"{selectedItem.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Vínculos</CardTitle>
              </CardHeader>
              <CardContent className=""
                <div className=""
                  <div className=""
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="text-lg">"Empresas</span>
                  </div>
                  <Badge variant="secondary">{selectedItem.companiesCount || 0}</Badge>
                </div>
                <div className=""
                  <div className=""
                    <Truck className="h-4 w-4 text-amber-600" />
                    <span className="text-lg">"Fornecedores</span>
                  </div>
                  <Badge variant="secondary">{selectedItem.suppliersCount || 0}</Badge>
                </div>
                {selectedItem.isParent && (
                  <div className=""
                    <div className=""
                      <Layers className="h-4 w-4 text-purple-600" />
                      <span className="text-lg">"Itens Filhos</span>
                    </div>
                    <Badge variant="secondary">{selectedItem.childrenCount || 0}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <Card>
          <CardContent className=""
            <Tabs defaultValue="hierarchy" className=""
              <TabsList>
                <TabsTrigger value="hierarchy">Hierarquia Pai-Filho</TabsTrigger>
                <TabsTrigger value="companies">Empresas Vinculadas</TabsTrigger>
                <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
              </TabsList>
              <TabsContent value="hierarchy" className=""
                <div className=""
                  <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg">"Funcionalidade de vínculos pai-filho será implementada</p>
                </div>
              </TabsContent>
              <TabsContent value="companies" className=""
                <div className=""
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg">"Lista de empresas vinculadas será implementada</p>
                </div>
              </TabsContent>
              <TabsContent value="suppliers" className=""
                <div className=""
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg">"Lista de fornecedores será implementada</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };
  const renderItemEditView = () => {
    if (!selectedItem) return null;
    const itemLinks = itemLinksData || { customers: [], suppliers: [] };
    return (
      <div className=""
        <div className=""
          <div className=""
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('item-details')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar Edição
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className=""
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedItem.type === 'material' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              >
                {selectedItem.type === 'material' ? <Package className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-lg">"Editar: {selectedItem.name}</h1>
                <p className="text-lg">"Modificar informações e gerenciar vínculos</p>
              </div>
            </div>
          </div>
        </div>
        <Form {...itemForm}>
          <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className=""
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className=""
                <div className=""
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
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input placeholder="Código de integração" {...field} />
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
                        <FormLabel>Unidade *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unidade" />
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
                        <Textarea placeholder="Descrição do item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className=""
                      <div className=""
                        <FormLabel className="text-lg">"Status Ativo</FormLabel>
                        <FormDescription>
                          Item disponível para uso
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
                <div className=""
                  <Button type="submit" disabled={updateItemMutation.isPending}>
                    {updateItemMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Vínculos Hierárquicos</CardTitle>
              </CardHeader>
              <CardContent className=""
                {/* Campos para itens filhos com seleção múltipla */}
                <div className=""
                  <div>
                    <label className="text-lg">"Itens Filhos</label>
                    <div className=""
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && value !== "none") {
                            const currentChildren = itemForm.watch("childrenIds") || [];
                            if (!currentChildren.includes(value)) {
                              itemForm.setValue("childrenIds", [...currentChildren, value]);
                              console.log('🔗 Item filho adicionado:', value);
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Selecionar item...</SelectItem>
                          {items.filter(item =>
                            item.id !== selectedItem?.id &&
                            !item.parentId &&
                            !(itemForm.watch("childrenIds") || []).includes(item.id)
                          ).map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.type === 'material' ? 'Material' : 'Serviço'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Lista dos itens filhos selecionados */}
                    <div className=""
                      {(itemForm.watch("childrenIds") || []).map((childId) => {
                        const child = items.find(item => item.id === childId);
                        if (!child) return null;
                        return (
                          <div key={childId} className=""
                            <div className=""
                              <ChevronRight className="h-3 w-3 text-blue-600" />
                              <span className="text-lg">"{child.name}</span>
                              <Badge variant="outline" className=""
                                {child.type === 'material' ? 'Material' : 'Serviço'}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentChildren = itemForm.watch("childrenIds") || [];
                                itemForm.setValue("childrenIds", currentChildren.filter(id => id !== childId));
                                console.log('🗑️ Item filho removido:', childId);
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-100"
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <p className=""
                      Selecione itens que serão filhos deste item. Os vínculos serão salvos automaticamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Vínculos com Empresas e Fornecedores</CardTitle>
              </CardHeader>
              <CardContent className=""
                <Tabs defaultValue="companies" className=""
                  <TabsList className=""
                    <TabsTrigger value="companies">Empresas Vinculadas</TabsTrigger>
                    <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
                  </TabsList>
                  <TabsContent value="companies" className=""
                    <div className=""
                      <h3 className="text-lg">"Empresas Vinculadas</h3>
                      <Select
                        onValueChange={async (companyId) => {
                          if (!selectedItem?.id || !companyId || companyId === "none") return;
                          try {
                            const response = await fetch("/link-customer`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ customerId: companyId })
                            });
                            if (response.ok) {
                              toast({
                                title: '[TRANSLATION_NEEDED]',
                                description: "Empresa vinculada com sucesso"
                              });
                              refetchItemLinks();
                            } else {
                              throw new Error('Falha ao vincular empresa');
                            }
                          } catch (error) {
                            toast({
                              title: '[TRANSLATION_NEEDED]',
                              description: '[TRANSLATION_NEEDED]',
                              variant: "destructive"
                            });
                          }
                        }}
                        value="" // Always reset to allow multiple selections
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vincular Empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Selecione uma empresa...</SelectItem>
                          {companies.filter(company =>
                            !itemLinks?.customers?.some((linked: any) => linked.id === company.id)
                          ).map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className=""
                      {itemLinks?.customers?.map((company: any) => (
                        <div key={company.id} className=""
                          <span>{company.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!selectedItem?.id) return;
                              try {
                                const response = await fetch("
                                  method: 'DELETE'
                                });
                                if (response.ok) {
                                  toast({
                                    title: '[TRANSLATION_NEEDED]',
                                    description: "Empresa desvinculada com sucesso"
                                  });
                                  refetchItemLinks();
                                } else {
                                  throw new Error('Falha ao desvincular empresa');
                                }
                              } catch (error) {
                                toast({
                                  title: '[TRANSLATION_NEEDED]',
                                  description: '[TRANSLATION_NEEDED]',
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Desvincular
                          </Button>
                        </div>
                      ))}
                      {(!itemLinks?.customers || itemLinks.customers.length === 0) && (
                        <div className=""
                          Nenhuma empresa vinculada
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="suppliers" className=""
                    <div className=""
                      <h3 className="text-lg">"Fornecedores Vinculados</h3>
                      <Select
                        onValueChange={async (supplierId) => {
                          if (!selectedItem?.id || !supplierId || supplierId === "none") return;
                          try {
                            const response = await fetch("/link-supplier`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ supplierId })
                            });
                            if (response.ok) {
                              toast({
                                title: '[TRANSLATION_NEEDED]',
                                description: "Fornecedor vinculado com sucesso"
                              });
                              refetchItemLinks();
                            } else {
                              throw new Error('Falha ao vincular fornecedor');
                            }
                          } catch (error) {
                            toast({
                              title: '[TRANSLATION_NEEDED]',
                              description: '[TRANSLATION_NEEDED]',
                              variant: "destructive"
                            });
                          }
                        }}
                        value="" // Always reset to allow multiple selections
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vincular Fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Selecione um fornecedor...</SelectItem>
                          {suppliers.filter(supplier =>
                            !itemLinks?.suppliers?.some((linked: any) => linked.id === supplier.id)
                          ).map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className=""
                      {itemLinks?.suppliers?.map((supplier: any) => (
                        <div key={supplier.id} className=""
                          <span>{supplier.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!selectedItem?.id) return;
                              try {
                                const response = await fetch("
                                  method: 'DELETE'
                                });
                                if (response.ok) {
                                  toast({
                                    title: '[TRANSLATION_NEEDED]',
                                    description: "Fornecedor desvinculado com sucesso"
                                  });
                                  refetchItemLinks();
                                } else {
                                  throw new Error('Falha ao desvincular fornecedor');
                                }
                              } catch (error) {
                                toast({
                                  title: '[TRANSLATION_NEEDED]',
                                  description: '[TRANSLATION_NEEDED]',
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Desvincular
                          </Button>
                        </div>
                      ))}
                      {(!itemLinks?.suppliers || itemLinks.suppliers.length === 0) && (
                        <div className=""
                          Nenhum fornecedor vinculado
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    );
  };
  return (
    <div className=""
      <div className=""
        <span>Gestão</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-lg">"Catálogo de Itens</span>
        {selectedItem && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-lg">"{selectedItem.name}</span>
          </>
        )}
      </div>
      {currentView === 'catalog' && renderCatalogView()}
      {currentView === 'item-details' && renderItemDetailsView()}
      {currentView === 'item-edit' && renderItemEditView()}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          itemForm.reset();
        }
      }}>
        <DialogContent className=""
          <DialogHeader>
            <DialogTitle>Criar Novo Item</DialogTitle>
            <DialogDescription>
              Preencha as informações essenciais para criar um novo item
            </DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className=""
              <div className=""
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
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="Código de integração" {...field} />
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
                      <FormLabel>Unidade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unidade" />
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
                      <Textarea placeholder="Descrição do item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className=""
                    <div className=""
                      <FormLabel className="text-lg">"Status Ativo</FormLabel>
                      <FormDescription>
                        Item disponível para uso
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
              <div className=""
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    itemForm.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Item
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}