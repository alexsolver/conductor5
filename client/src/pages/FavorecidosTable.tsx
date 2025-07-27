import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { validateCpfCnpj, validateRG, formatCpfCnpj, applyCpfCnpjMask } from "../../../shared/validators/brazilian-documents";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Building,
  Phone,
  Mail,
  UserCheck,
  MapPin,
  Settings
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CustomerLocationManager } from "@/components/CustomerLocationManager";
import { LocationModal } from "@/components/LocationModal";

// Schema for favorecido creation/editing - ALIGNED WITH DATABASE SCHEMA
const favorecidoSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  birthDate: z.string().optional(),
  rg: z.string().optional().refine(validateRG, "RG inválido"),
  cpfCnpj: z.string().optional().refine(validateCpfCnpj, "CPF/CNPJ inválido"),
  isActive: z.boolean().default(true),
  customerCode: z.string().optional(),
  phone: z.string().optional(),
  cellPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

type FavorecidoFormData = z.infer<typeof favorecidoSchema>;

// PROBLEMA 1,2,3 RESOLVIDO: Interface alinhada com schema real do banco
interface Favorecido {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  birthDate?: string;
  rg?: string;
  cpfCnpj?: string;
  isActive: boolean;
  customerCode?: string;
  phone?: string;
  cellPhone?: string;
  contactPerson?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FavorecidosTable() {
  // TODOS OS ESTADOS NO INÍCIO DO COMPONENTE
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFavorecido, setEditingFavorecido] = useState<Favorecido | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Location management states
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [selectedFavorecidoIdForLocations, setSelectedFavorecidoIdForLocations] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // TODOS OS HOOKS NO INÍCIO DO COMPONENTE PARA RESPEITAR REGRAS DO REACT
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch favorecidos with pagination and search
  const { data: favorecidosData, isLoading, refetch } = useQuery({
    queryKey: ["/api/favorecidos", { page: currentPage, limit: itemsPerPage, search: searchTerm }],
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/favorecidos?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.error(`Favorecidos fetch failed: ${response.status}`, await response.text());
        throw new Error(`Failed to fetch favorecidos: ${response.status}`);
      }

      return response.json();
    },
    retry: 3,
  });

  // Fetch locations for location manager
  const { data: locationsData } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch("/api/locations", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
    enabled: isLocationManagerOpen
  });

  // Form setup
  const form = useForm<FavorecidoFormData>({
    resolver: zodResolver(favorecidoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      birthDate: "",
      rg: "",
      cpfCnpj: "",
      isActive: true,
      customerCode: "",
      phone: "",
      cellPhone: "",
      contactPerson: "",
      contactPhone: "",
    },
  });

  // Create favorecido mutation
  const createFavorecidoMutation = useMutation({
    mutationFn: async (data: FavorecidoFormData) => {
      const response = await apiRequest("POST", "/api/favorecidos", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Favorecido criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorecidos"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar favorecido",
        variant: "destructive",
      });
    },
  });

  // Update favorecido mutation
  const updateFavorecidoMutation = useMutation({
    mutationFn: async (data: FavorecidoFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/favorecidos/${id}`, updateData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Update mutation success:', data);
      toast({
        title: "Sucesso",
        description: "Favorecido atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorecidos"] });
      queryClient.refetchQueries({ queryKey: ["/api/favorecidos"] });
      refetch(); // Force refetch
      setIsEditDialogOpen(false);
      setEditingFavorecido(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar favorecido",
        variant: "destructive",
      });
    },
  });

  // Delete favorecido mutation
  const deleteFavorecidoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/favorecidos/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Favorecido excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorecidos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir favorecido",
        variant: "destructive",
      });
    },
  });

  // Derived values
  const favorecidos = favorecidosData?.favorecidos || [];
  const pagination = favorecidosData?.pagination || { total: 0, totalPages: 0 };
  const locations = locationsData?.locations || [];

  const handleEdit = (favorecido: Favorecido) => {
    setEditingFavorecido(favorecido);
    form.reset({
      firstName: favorecido.firstName || "",
      lastName: favorecido.lastName || "",
      email: favorecido.email || "",
      birthDate: favorecido.birthDate || "",
      rg: favorecido.rg || "",
      cpfCnpj: favorecido.cpfCnpj || "",
      isActive: favorecido.isActive ?? true,
      customerCode: favorecido.customerCode || "",
      phone: favorecido.phone || "",
      cellPhone: favorecido.cellPhone || "",
      contactPerson: favorecido.contactPerson || "",
      contactPhone: favorecido.contactPhone || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (data: FavorecidoFormData) => {
    if (editingFavorecido) {
      updateFavorecidoMutation.mutate({ ...data, id: editingFavorecido.id });
    } else {
      createFavorecidoMutation.mutate(data);
    }
  };

  // Filter favorecidos based on search term
  const filteredFavorecidos = useMemo(() => {
    if (!searchTerm) return favorecidos;
    return favorecidos.filter((favorecido: Favorecido) => 
      favorecido.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorecido.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorecido.customerCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [favorecidos, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredFavorecidos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFavorecidos = filteredFavorecidos.slice(startIndex, endIndex);



  // Early return for loading state - AFTER ALL HOOKS
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  const FavorecidoForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
            <TabsTrigger value="locations">Locais</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do favorecido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sobrenome do favorecido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Código do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input placeholder="Registro Geral" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpfCnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF ou CNPJ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 9999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cellPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da pessoa de contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone de Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="additional" className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Favorecido ativo no sistema
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
          </TabsContent>

          <TabsContent value="locations" className="space-y-4 mt-6">
            <div className="text-center py-8">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Gerenciar Localizações
              </h3>
              <p className="text-gray-500 mb-6">
                Associe este favorecido a uma ou mais localizações do sistema.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  type="button"
                  onClick={() => {
                    if (!editingFavorecido?.id) {
                      toast({
                        title: "Salve o favorecido primeiro",
                        description: "É necessário salvar o favorecido antes de gerenciar localizações.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setSelectedFavorecidoIdForLocations(editingFavorecido.id);
                    setIsLocationManagerOpen(true);
                  }}
                  disabled={!editingFavorecido?.id}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Gerenciar Localizações
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Localização
                </Button>
              </div>
              {!editingFavorecido?.id && (
                <p className="text-sm text-amber-600 mt-4">
                  💡 Salve o favorecido primeiro para gerenciar localizações
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingFavorecido(null);
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createFavorecidoMutation.isPending || updateFavorecidoMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {editingFavorecido ? "Atualizar" : "Criar"} Favorecido
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Favorecidos
          </h1>
          <p className="text-muted-foreground">
            Gerencie favorecidos externos, parceiros e fornecedores
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Favorecido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Favorecido</DialogTitle>
            </DialogHeader>
            <FavorecidoForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorecidos Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Favorecidos ({filteredFavorecidos.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Código Cliente</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Telefones</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentFavorecidos.map((favorecido) => (
                <TableRow key={favorecido.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {favorecido.firstName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="font-medium">{favorecido.fullName}</div>
                        {favorecido.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {favorecido.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {favorecido.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {favorecido.customerCode ? (
                      <Badge variant="secondary">{favorecido.customerCode}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {favorecido.cpfCnpj ? (
                      <span className="font-mono text-sm">{favorecido.cpfCnpj}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {favorecido.phone && (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {favorecido.phone}
                        </div>
                      )}
                      {favorecido.cellPhone && (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {favorecido.cellPhone}
                        </div>
                      )}
                      {!favorecido.phone && !favorecido.cellPhone && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={favorecido.isActive ? "default" : "secondary"}>
                      {favorecido.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        "Inativo"
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(favorecido)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedFavorecidoIdForLocations(favorecido.id);
                            setIsLocationManagerOpen(true);
                          }}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Gerenciar Locais
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteFavorecidoMutation.mutate(favorecido.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {currentFavorecidos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum favorecido encontrado</p>
              <p className="text-sm">
                {searchTerm ? "Tente ajustar sua busca" : "Comece criando seu primeiro favorecido"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredFavorecidos.length)} de {filteredFavorecidos.length} favorecidos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Favorecido</DialogTitle>
          </DialogHeader>
          <FavorecidoForm />
        </DialogContent>
      </Dialog>

      {/* Location Manager Modal */}
      {selectedFavorecidoIdForLocations && (
        <CustomerLocationManager
          customerId={selectedFavorecidoIdForLocations}
          isOpen={isLocationManagerOpen}
          onClose={() => {
            setIsLocationManagerOpen(false);
            setSelectedFavorecidoIdForLocations(null);
          }}
          onAddNewLocation={() => {
            setIsLocationManagerOpen(false);
            setIsLocationModalOpen(true);
          }}
        />
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          // Invalidate locations query to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
        }}
      />
    </div>
  );
}