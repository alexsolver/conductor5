import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

// Schema for favorecido creation/editing
const favorecidoSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  company: z.string().optional(),
  cpfCnpj: z.string().optional(),
  contactType: z.string().default("external"),
  relationship: z.string().optional(),
  preferredContactMethod: z.string().default("email"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FavorecidoFormData = z.infer<typeof favorecidoSchema>;

interface Favorecido {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  cpfCnpj?: string;
  contactType: string;
  relationship?: string;
  preferredContactMethod: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FavorecidosTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFavorecido, setEditingFavorecido] = useState<Favorecido | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Location management states
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [selectedFavorecidoIdForLocations, setSelectedFavorecidoIdForLocations] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch favorecidos with pagination and search
  const { data: favorecidosData, isLoading } = useQuery({
    queryKey: ["/api/favorecidos", { page: currentPage, limit: itemsPerPage, search: searchTerm }],
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

  const favorecidos = favorecidosData?.favorecidos || [];
  const pagination = favorecidosData?.pagination || { total: 0, totalPages: 0 };

  // Form setup
  const form = useForm<FavorecidoFormData>({
    resolver: zodResolver(favorecidoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      cpfCnpj: "",
      contactType: "external",
      relationship: "",
      preferredContactMethod: "email",
      notes: "",
      isActive: true,
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
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Favorecido atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorecidos"] });
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

  const handleEdit = (favorecido: Favorecido) => {
    setEditingFavorecido(favorecido);
    form.reset({
      firstName: favorecido.firstName || "",
      lastName: favorecido.lastName || "",
      email: favorecido.email || "",
      phone: favorecido.phone || "",
      company: favorecido.company || "",
      cpfCnpj: favorecido.cpfCnpj || "",
      contactType: favorecido.contactType || "external",
      relationship: favorecido.relationship || "",
      preferredContactMethod: favorecido.preferredContactMethod || "email",
      notes: favorecido.notes || "",
      isActive: favorecido.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este favorecido?")) {
      deleteFavorecidoMutation.mutate(id);
    }
  };

  const onSubmit = (data: FavorecidoFormData) => {
    if (editingFavorecido) {
      updateFavorecidoMutation.mutate({ ...data, id: editingFavorecido.id });
    } else {
      createFavorecidoMutation.mutate(data);
    }
  };

  // Reset page when search changes
  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return favorecidos;
  }, [searchTerm]);

  const FavorecidoForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full h-auto p-1">
            <div className="grid grid-cols-4 gap-1 w-full">
              <TabsTrigger value="basic" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                <User className="h-3 w-3 lg:h-4 lg:w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                <Phone className="h-3 w-3 lg:h-4 lg:w-4" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                <MapPin className="h-3 w-3 lg:h-4 lg:w-4" />
                Locais
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
                Observações
              </TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome" {...field} />
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
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o sobrenome" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Digite o email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
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

          <TabsContent value="contact" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o telefone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="external">Contato Externo</SelectItem>
                      <SelectItem value="partner">Parceiro</SelectItem>
                      <SelectItem value="vendor">Fornecedor</SelectItem>
                      <SelectItem value="client">Cliente Final</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredContactMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método Preferido de Contato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relacionamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do relacionamento comercial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">Favorecido ativo no sistema</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="locations" className="space-y-4 mt-4">
            <div className="text-center py-8 space-y-4">
              <MapPin className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium">Gerenciamento de Locais</h3>
                <p className="text-sm text-gray-600">
                  Associe locais a este favorecido para facilitar a gestão geográfica
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (editingFavorecido?.id) {
                      setSelectedFavorecidoIdForLocations(editingFavorecido.id);
                      setIsLocationManagerOpen(true);
                    } else {
                      toast({
                        title: "Salve o favorecido primeiro",
                        description: "É necessário salvar o favorecido antes de gerenciar locais",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Gerenciar Locais
                </Button>
              </div>
              <p className="text-sm text-amber-600 mt-4">
                💡 Salve o favorecido primeiro para gerenciar locais
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Internas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações internas sobre este favorecido..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

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

  const locations = locationsData?.locations || [];

  // Location Management Component
  const LocationManager = () => {
    const [favorecidoLocations, setFavorecidoLocations] = useState<any[]>([]);
    
    // Fetch favorecido locations
    const { data: favorecidoLocationData } = useQuery({
      queryKey: ["/api/favorecidos", selectedFavorecidoIdForLocations, "locations"],
      queryFn: async () => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/favorecidos/${selectedFavorecidoIdForLocations}/locations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch favorecido locations');
        return response.json();
      },
      enabled: !!selectedFavorecidoIdForLocations && isLocationManagerOpen
    });

    const favorecidoLocationsList = favorecidoLocationData?.locations || [];

    // Add location to favorecido
    const addLocationMutation = useMutation({
      mutationFn: async ({ locationId, isPrimary }: { locationId: string; isPrimary: boolean }) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/favorecidos/${selectedFavorecidoIdForLocations}/locations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ locationId, isPrimary })
        });
        if (!response.ok) throw new Error('Failed to add location');
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Local adicionado ao favorecido",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/favorecidos", selectedFavorecidoIdForLocations, "locations"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Erro",
          description: error.message || "Falha ao adicionar local",
          variant: "destructive",
        });
      },
    });

    // Remove location from favorecido
    const removeLocationMutation = useMutation({
      mutationFn: async (locationId: string) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/favorecidos/${selectedFavorecidoIdForLocations}/locations/${locationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to remove location');
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Local removido do favorecido",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/favorecidos", selectedFavorecidoIdForLocations, "locations"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Erro",
          description: error.message || "Falha ao remover local",
          variant: "destructive",
        });
      },
    });

    return (
      <Dialog open={isLocationManagerOpen} onOpenChange={setIsLocationManagerOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Locais do Favorecido</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Available Locations */}
            <div>
              <h3 className="text-lg font-medium mb-3">Locais Disponíveis</h3>
              <div className="grid gap-3 max-h-40 overflow-y-auto">
                {locations.filter(loc => 
                  !favorecidoLocationsList.some(fl => fl.locationId === loc.id)
                ).map((location: any) => (
                  <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-gray-600">{location.address}, {location.city}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addLocationMutation.mutate({ locationId: location.id, isPrimary: false })}
                      disabled={addLocationMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Associated Locations */}
            <div>
              <h3 className="text-lg font-medium mb-3">Locais Associados</h3>
              <div className="space-y-3">
                {favorecidoLocationsList.map((favorecidoLocation: any) => (
                  <div key={favorecidoLocation.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{favorecidoLocation.location?.name}</p>
                        {favorecidoLocation.isPrimary && (
                          <Badge className="bg-blue-100 text-blue-800">Principal</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {favorecidoLocation.location?.address}, {favorecidoLocation.location?.city}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeLocationMutation.mutate(favorecidoLocation.locationId)}
                      disabled={removeLocationMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ))}
                {favorecidoLocationsList.length === 0 && (
                  <p className="text-gray-500 text-center py-8">Nenhum local associado</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Favorecidos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie contatos externos e beneficiários</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Favorecido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Favorecido</DialogTitle>
            </DialogHeader>
            <FavorecidoForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar favorecidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Favorecidos Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Favorecidos ({pagination.total})</span>
            <span className="text-sm font-normal text-gray-500">
              Página {currentPage} de {pagination.totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {favorecidos.map((favorecido: Favorecido) => (
                  <TableRow key={favorecido.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {favorecido.firstName?.charAt(0)}{favorecido.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{`${favorecido.firstName || ''} ${favorecido.lastName || ''}`.trim() || 'Sem Nome'}</div>
                          <div className="text-sm text-gray-500">ID: {favorecido.id.slice(-8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{favorecido.email}</TableCell>
                    <TableCell>{favorecido.phone || '-'}</TableCell>
                    <TableCell>
                      {favorecido.company ? (
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{favorecido.company}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {favorecido.contactType === 'external' ? 'Externo' :
                         favorecido.contactType === 'partner' ? 'Parceiro' :
                         favorecido.contactType === 'vendor' ? 'Fornecedor' :
                         favorecido.contactType === 'client' ? 'Cliente' :
                         favorecido.contactType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {favorecido.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(favorecido.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => console.log('View favorecido', favorecido.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
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
                            onClick={() => handleDelete(favorecido.id)}
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
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} até {Math.min(currentPage * itemsPerPage, pagination.total)} de {pagination.total} entradas
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Favorecido</DialogTitle>
          </DialogHeader>
          <FavorecidoForm />
        </DialogContent>
      </Dialog>

      {/* Location Manager */}
      <LocationManager />
    </div>
  );
}