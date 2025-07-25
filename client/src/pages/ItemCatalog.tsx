import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Search, 
  Package, 
  Wrench, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Link2,
  Users,
  Building2,
  Upload,
  Paperclip,
  PlusCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Types
interface Item {
  id: string;
  tenantId: string;
  active: boolean;
  type: 'material' | 'service';
  name: string;
  integrationCode?: string;
  description?: string;
  measurementUnit: string;
  maintenancePlan?: string;
  group?: string;
  defaultChecklist?: any;
  status: 'active' | 'under_review' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

interface ItemAttachment {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface ItemLink {
  id: string;
  linkType: 'item_item' | 'item_customer' | 'item_supplier';
  linkedItemId?: string;
  relationship?: string;
}

interface ItemCustomerLink {
  id: string;
  customerId: string;
  alias?: string;
  sku?: string;
  barcode?: string;
  qrCode?: string;
  isAsset: boolean;
}

interface ItemSupplierLink {
  id: string;
  supplierId: string;
  partNumber?: string;
  description?: string;
  qrCode?: string;
  barcode?: string;
  unitPrice?: number;
}

// Schema de validação
const itemSchema = z.object({
  active: z.boolean().default(true),
  type: z.enum(['material', 'service']),
  name: z.string().min(1, "Nome é obrigatório"),
  integrationCode: z.string().optional(),
  description: z.string().optional(),
  measurementUnit: z.string().default('UN'),
  maintenancePlan: z.string().optional(),
  group: z.string().optional(),
  defaultChecklist: z.string().optional(),
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
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const { toast } = useToast();

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      active: true,
      type: 'material',
      name: '',
      integrationCode: '',
      description: '',
      measurementUnit: 'UN',
      maintenancePlan: '',
      group: '',
      defaultChecklist: '',
    }
  });

  // Queries
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/materials-services/items"],
    enabled: true
  });

  const { data: itemStats = { total: 0, materials: 0, services: 0, active: 0 } } = useQuery({
    queryKey: ["/api/materials-services/items/stats"],
    enabled: true
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/clientes"],
    enabled: true
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/materials-services/suppliers"],
    enabled: true
  });

  // Filtros
  const filteredItems = items.filter((item: Item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.integrationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const onSubmit = async (data: z.infer<typeof itemSchema>) => {
    try {
      // Implementar criação/edição de item
      toast({
        title: "Item salvo com sucesso",
        description: `${data.name} foi ${selectedItem ? 'atualizado' : 'criado'} com sucesso.`,
      });
      
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      form.reset();
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: "Erro ao salvar item",
        description: "Ocorreu um erro ao salvar o item. Tente novamente.",
        variant: "destructive",
      });
    }
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
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Item</DialogTitle>
              <DialogDescription>
                Cadastre um novo material ou serviço no sistema
              </DialogDescription>
            </DialogHeader>
            <ItemForm 
              form={form} 
              onSubmit={onSubmit} 
              onCancel={() => setIsCreateModalOpen(false)}
              customers={customers}
              suppliers={suppliers}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiais</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemStats.materials}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Wrench className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemStats.services}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Badge variant="outline" className="text-xs">
              {itemStats.active}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{itemStats.active}</div>
          </CardContent>
        </Card>
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
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
              </SelectContent>
            </Select>
            
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

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens Cadastrados ({filteredItems.length})</CardTitle>
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
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum item encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item: Item) => (
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
                        {item.group && (
                          <span>Grupo: {item.group}</span>
                        )}
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
                      onClick={() => {
                        setSelectedItem(item);
                        setIsLinksModalOpen(true);
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Vínculos
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        form.reset(item);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Altere as informações do item selecionado
            </DialogDescription>
          </DialogHeader>
          <ItemForm 
            form={form} 
            onSubmit={onSubmit} 
            onCancel={() => setIsEditModalOpen(false)}
            customers={customers}
            suppliers={suppliers}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Vínculos */}
      <Dialog open={isLinksModalOpen} onOpenChange={setIsLinksModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Vínculos - {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Configure vínculos com outros itens, clientes e fornecedores
            </DialogDescription>
          </DialogHeader>
          <LinksManager 
            item={selectedItem} 
            customers={customers}
            suppliers={suppliers}
            onClose={() => setIsLinksModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente do Formulário
function ItemForm({ 
  form, 
  onSubmit, 
  onCancel, 
  customers, 
  suppliers, 
  isEditing = false 
}: {
  form: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  customers: any[];
  suppliers: any[];
  isEditing?: boolean;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="attachments">Anexos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Item está ativo no sistema
                      </div>
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
              
              <FormField
                control={form.control}
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
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
                      <Input placeholder="Código para integração" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição detalhada do item"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="measurementUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {measurementUnits.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label} ({unit.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo</FormLabel>
                    <FormControl>
                      <Input placeholder="Grupo de categorização" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="maintenancePlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Manutenção Padrão</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição do plano de manutenção"
                      {...field} 
                    />
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
                    <Textarea 
                      placeholder="Checklist padrão (formato JSON ou texto)"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="attachments" className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload de Arquivos</h3>
              <p className="text-muted-foreground mb-4">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <Button variant="outline">
                <Paperclip className="h-4 w-4 mr-2" />
                Selecionar Arquivos
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {isEditing ? 'Atualizar' : 'Criar'} Item
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Componente de Gerenciamento de Vínculos
function LinksManager({ 
  item, 
  customers, 
  suppliers, 
  onClose 
}: {
  item: Item | null;
  customers: any[];
  suppliers: any[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("items");
  
  if (!item) return null;
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Vínculos com Itens</TabsTrigger>
          <TabsTrigger value="customers">Vínculos com Clientes</TabsTrigger>
          <TabsTrigger value="suppliers">Vínculos com Fornecedores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Vínculos Item ↔ Item
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Vínculo
                </Button>
              </CardTitle>
              <CardDescription>
                Configure relacionamentos com outros itens (kits, substitutos, equivalentes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Nenhum vínculo configurado
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Vínculos Item ↔ Cliente
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </CardTitle>
              <CardDescription>
                Configure dados específicos para cada cliente (SKU, códigos, asset)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Nenhum cliente vinculado
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Vínculos Item ↔ Fornecedor
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Fornecedor
                </Button>
              </CardTitle>
              <CardDescription>
                Configure dados específicos para cada fornecedor (part number, códigos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Nenhum fornecedor vinculado
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end pt-6 border-t">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}