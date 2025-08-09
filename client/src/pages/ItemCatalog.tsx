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
  Calendar
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
}

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  type: z.enum(["material", "service"]),
  integrationCode: z.string().max(100, "Código muito longo").optional().or(z.literal("")),
  description: z.string().max(1000, "Descrição muito longa").optional(),
  measurementUnit: z.string().min(1, "Unidade de medida é obrigatória"),
  maintenancePlan: z.string().max(255, "Plano muito longo").optional(),
  defaultChecklist: z.string().max(255, "Checklist muito longo").optional(),
  active: z.boolean().default(true),
  parentId: z.string().optional(),
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
  const [currentView, setCurrentView] = useState<'catalog' | 'item-details'>('catalog');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hierarchyFilter, setHierarchyFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Aumentado para lidar com alto volume

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
    }
  });

  // Queries
  const { data: itemsResponse, isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/materials-services/items", searchTerm, typeFilter, statusFilter, hierarchyFilter],
    enabled: true
  });

  const { data: availableCustomers } = useQuery({
    queryKey: ["/api/customers/companies"]
  });

  const { data: availableSuppliers } = useQuery({
    queryKey: ["/api/materials-services/suppliers"]
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

  // Processar dados
  const items: Item[] = (itemsResponse as any)?.data || [];

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
      parentId: item.parentId || undefined,
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

  // Renderizar página principal de catálogo
  const renderCatalogView = () => (
    <div className="space-y-6">
      {/* Header com métricas resumidas */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Itens</h1>
          <p className="text-gray-600">
            {items.length} itens • {items.filter(i => i.active).length} ativos • {items.filter(i => i.isParent).length} pais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentView('management')}>
            <Settings className="h-4 w-4 mr-2" />
            Ferramentas
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Controles de busca e filtros - SEMPRE VISÍVEIS */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="material">Materiais</SelectItem>
                  <SelectItem value="service">Serviços</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={hierarchyFilter} onValueChange={setHierarchyFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Hierarquia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="parent">Apenas Pais</SelectItem>
                  <SelectItem value="child">Apenas Filhos</SelectItem>
                  <SelectItem value="standalone">Independentes</SelectItem>
                </SelectContent>
              </Select>

              {/* Operações em lote */}
              <Button 
                variant={isBulkMode ? "default" : "outline"}
                onClick={() => setIsBulkMode(!isBulkMode)}
              >
                <Checkbox className="h-4 w-4 mr-2" />
                Lote ({selectedItems.size})
              </Button>

              {isBulkMode && selectedItems.size > 0 && (
                <>
                  <Button variant="outline" size="sm">
                    <Building className="h-4 w-4 mr-1" />
                    Empresas
                  </Button>
                  <Button variant="outline" size="sm">
                    <Truck className="h-4 w-4 mr-1" />
                    Fornecedores
                  </Button>
                  <Button variant="outline" size="sm">
                    <Link className="h-4 w-4 mr-1" />
                    Vincular
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista principal - TABELA EFICIENTE */}
      <Card>
        <CardContent className="p-0">
          {isLoadingItems ? (
            <div className="p-8 text-center">Carregando itens...</div>
          ) : paginatedItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item encontrado</h3>
              <p className="text-gray-500 mb-4">Ajuste os filtros ou crie um novo item.</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Item
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {isBulkMode && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-24">Tipo</TableHead>
                    <TableHead className="w-32">Código</TableHead>
                    <TableHead className="w-24">Unidade</TableHead>
                    <TableHead className="w-32">Hierarquia</TableHead>
                    <TableHead className="w-32">Empresas</TableHead>
                    <TableHead className="w-32">Fornecedores</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedItems.has(item.id) ? 'bg-blue-50' : ''
                      }`}
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
                        <div className="flex items-center gap-2">
                          {item.type === 'material' ? 
                            <Package className="h-4 w-4 text-blue-600" /> : 
                            <Wrench className="h-4 w-4 text-green-600" />
                          }
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 truncate max-w-64">
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

                      <TableCell className="text-sm font-mono">
                        {item.integrationCode || '-'}
                      </TableCell>

                      <TableCell className="text-sm">
                        {item.measurementUnit}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.isParent && (
                            <Badge variant="outline" className="text-xs">
                              <Layers className="h-3 w-3 mr-1" />
                              Pai ({item.childrenCount || 0})
                            </Badge>
                          )}
                          {item.parentId && (
                            <Badge variant="outline" className="text-xs">
                              <ChevronRight className="h-3 w-3 mr-1" />
                              Filho
                            </Badge>
                          )}
                          {!item.parentId && !item.isParent && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {(item.companiesCount || 0) > 0 ? (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-blue-600" />
                            <span className="text-sm">{item.companiesCount}</span>
                            {item.linkedCompanies && item.linkedCompanies.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {item.linkedCompanies[0].name}
                                {item.linkedCompanies.length > 1 && ` +${item.linkedCompanies.length - 1}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {(item.suppliersCount || 0) > 0 ? (
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-amber-600" />
                            <span className="text-sm">{item.suppliersCount}</span>
                            {item.linkedSuppliers && item.linkedSuppliers.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {item.linkedSuppliers[0].name}
                                {item.linkedSuppliers.length > 1 && ` +${item.linkedSuppliers.length - 1}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={item.active ? "default" : "secondary"}>
                          {item.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
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

              {/* Paginação eficiente */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} itens
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
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

  // Renderizar detalhes do item
  const renderItemDetailsView = () => {
    if (!selectedItem) return null;

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
                  {selectedItem.isParent && (
                    <Badge variant="outline">
                      <Layers className="h-3 w-3 mr-1" />
                      Item Pai
                    </Badge>
                  )}
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

        {/* Informações básicas em cards */}
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
              </CardContent>
            </Card>
          </div>

          {/* Resumo de vínculos */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Vínculos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Empresas</span>
                  </div>
                  <Badge variant="secondary">{selectedItem.companiesCount || 0}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Fornecedores</span>
                  </div>
                  <Badge variant="secondary">{selectedItem.suppliersCount || 0}</Badge>
                </div>

                {selectedItem.isParent && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Itens Filhos</span>
                    </div>
                    <Badge variant="secondary">{selectedItem.childrenCount || 0}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Abas de vínculos detalhados */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="hierarchy" className="w-full">
              <TabsList>
                <TabsTrigger value="hierarchy">Hierarquia Pai-Filho</TabsTrigger>
                <TabsTrigger value="companies">Empresas Vinculadas</TabsTrigger>
                <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
              </TabsList>

              <TabsContent value="hierarchy" className="space-y-4 mt-6">
                <div className="text-center py-8">
                  <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Funcionalidade de vínculos pai-filho será implementada</p>
                </div>
              </TabsContent>

              <TabsContent value="companies" className="space-y-4 mt-6">
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Lista de empresas vinculadas será implementada</p>
                </div>
              </TabsContent>

              <TabsContent value="suppliers" className="space-y-4 mt-6">
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Lista de fornecedores será implementada</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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

      {/* Renderizar view baseada no estado atual */}
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
                : 'Preencha as informações essenciais para criar um novo item'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
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

              {/* Campo para item pai */}
              <FormField
                control={itemForm.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Pai (Opcional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um item pai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (item independente)</SelectItem>
                        {items.filter(item => item.id !== selectedItem?.id && !item.parentId).map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Defina se este item é filho de outro item
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Ativo</FormLabel>
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
                      {isEditModalOpen ? 'Salvando...' : 'Criando...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditModalOpen ? 'Salvar' : 'Criar Item'}
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