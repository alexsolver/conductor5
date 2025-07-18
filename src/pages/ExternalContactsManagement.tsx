import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  UserPlus, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Plus,
  FileText,
  UserCheck
} from "lucide-react";

// Form schemas
const solicitanteSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  phone: z.string().optional(),
  documento: z.string().optional(),
  tipoPessoa: z.enum(["fisica", "juridica"]).default("fisica"),
  companyId: z.string().optional(),
  locationId: z.string().optional(),
  preferenciaContato: z.enum(["email", "telefone", "ambos"]).default("email"),
  idioma: z.string().default("pt-BR"),
  observacoes: z.string().optional(),
});

const favorecidoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  telefone: z.string().optional(),
  companyId: z.string().optional(),
  locationId: z.string().optional(),
  customerId: z.string().optional(),
  podeInteragir: z.boolean().default(false),
  tipoVinculo: z.enum(["colaborador", "gerente_local", "parceiro", "auditor", "outro"]).default("outro"),
  observacoes: z.string().optional(),
});

type SolicitanteForm = z.infer<typeof solicitanteSchema>;
type FavorecidoForm = z.infer<typeof favorecidoSchema>;

export default function ExternalContactsManagement() {
  const [activeTab, setActiveTab] = useState("solicitantes");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateSolicitanteOpen, setIsCreateSolicitanteOpen] = useState(false);
  const [isCreateFavorecidoOpen, setIsCreateFavorecidoOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const solicitanteForm = useForm<SolicitanteForm>({
    resolver: zodResolver(solicitanteSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      documento: "",
      tipoPessoa: "fisica",
      preferenciaContato: "email",
      idioma: "pt-BR",
      observacoes: ""
    },
  });

  const favorecidoForm = useForm<FavorecidoForm>({
    resolver: zodResolver(favorecidoSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      podeInteragir: false,
      tipoVinculo: "outro",
      observacoes: ""
    },
  });

  // Queries
  const { data: solicitantes, isLoading: loadingSolicitantes } = useQuery({
    queryKey: ["/api/external-contacts/solicitantes"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/external-contacts/solicitantes');
      return response.json();
    },
  });

  const { data: favorecidos, isLoading: loadingFavorecidos } = useQuery({
    queryKey: ["/api/external-contacts/favorecidos"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/external-contacts/favorecidos');
      return response.json();
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["/api/customers/companies"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers/companies');
      return response.json();
    },
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/locations');
      return response.json();
    },
  });

  // Mutations
  const createSolicitanteMutation = useMutation({
    mutationFn: async (data: SolicitanteForm) => {
      const response = await apiRequest('POST', '/api/external-contacts/solicitantes', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar solicitante');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-contacts/solicitantes"] });
      setIsCreateSolicitanteOpen(false);
      solicitanteForm.reset();
      toast({
        title: "Solicitante criado",
        description: "Solicitante foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar solicitante",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const createFavorecidoMutation = useMutation({
    mutationFn: async (data: FavorecidoForm) => {
      const response = await apiRequest('POST', '/api/external-contacts/favorecidos', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar favorecido');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-contacts/favorecidos"] });
      setIsCreateFavorecidoOpen(false);
      favorecidoForm.reset();
      toast({
        title: "Favorecido criado",
        description: "Favorecido foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar favorecido",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmitSolicitante = (data: SolicitanteForm) => {
    createSolicitanteMutation.mutate(data);
  };

  const onSubmitFavorecido = (data: FavorecidoForm) => {
    createFavorecidoMutation.mutate(data);
  };

  const filteredSolicitantes = solicitantes?.data?.filter((s: any) =>
    s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredFavorecidos = favorecidos?.data?.filter((f: any) =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Contatos Externos</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie solicitantes e favorecidos para tickets
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="solicitantes" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Solicitantes
              <Badge variant="secondary">
                {solicitantes?.data?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="favorecidos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Favorecidos
              <Badge variant="secondary">
                {favorecidos?.data?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === "solicitantes" && (
              <Dialog open={isCreateSolicitanteOpen} onOpenChange={setIsCreateSolicitanteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Solicitante
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Solicitante</DialogTitle>
                  </DialogHeader>
                  <Form {...solicitanteForm}>
                    <form onSubmit={solicitanteForm.handleSubmit(onSubmitSolicitante)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={solicitanteForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={solicitanteForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sobrenome</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Sobrenome" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={solicitanteForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="email@exemplo.com" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={solicitanteForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="(11) 99999-9999" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={solicitanteForm.control}
                          name="documento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Documento (CPF/CNPJ)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="000.000.000-00" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={solicitanteForm.control}
                          name="tipoPessoa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Pessoa</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={solicitanteForm.control}
                          name="companyId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empresa Cliente</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma empresa" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {companies?.data?.map((company: any) => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={solicitanteForm.control}
                          name="locationId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Local</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um local" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {locations?.data?.map((location: any) => (
                                    <SelectItem key={location.id} value={location.id}>
                                      {location.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={solicitanteForm.control}
                        name="preferenciaContato"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferência de Contato</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="telefone">Telefone</SelectItem>
                                <SelectItem value="ambos">Ambos</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={solicitanteForm.control}
                        name="observacoes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Observações adicionais..." />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateSolicitanteOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createSolicitanteMutation.isPending}
                        >
                          {createSolicitanteMutation.isPending ? "Criando..." : "Criar Solicitante"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "favorecidos" && (
              <Dialog open={isCreateFavorecidoOpen} onOpenChange={setIsCreateFavorecidoOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Favorecido
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Favorecido</DialogTitle>
                  </DialogHeader>
                  <Form {...favorecidoForm}>
                    <form onSubmit={favorecidoForm.handleSubmit(onSubmitFavorecido)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={favorecidoForm.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome completo" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={favorecidoForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="email@exemplo.com" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={favorecidoForm.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(11) 99999-9999" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={favorecidoForm.control}
                          name="companyId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empresa Cliente</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma empresa" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {companies?.data?.map((company: any) => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={favorecidoForm.control}
                          name="tipoVinculo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Vínculo</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="colaborador">Colaborador</SelectItem>
                                  <SelectItem value="gerente_local">Gerente Local</SelectItem>
                                  <SelectItem value="parceiro">Parceiro</SelectItem>
                                  <SelectItem value="auditor">Auditor</SelectItem>
                                  <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={favorecidoForm.control}
                        name="observacoes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Observações adicionais..." />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateFavorecidoOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createFavorecidoMutation.isPending}
                        >
                          {createFavorecidoMutation.isPending ? "Criando..." : "Criar Favorecido"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent value="solicitantes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Solicitantes
              </CardTitle>
              <CardDescription>
                Pessoas responsáveis por originar tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSolicitantes ? (
                <div className="text-center py-8">Carregando solicitantes...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSolicitantes.map((solicitante: any) => (
                      <TableRow key={solicitante.id}>
                        <TableCell className="font-medium">
                          {solicitante.firstName} {solicitante.lastName}
                        </TableCell>
                        <TableCell>{solicitante.email}</TableCell>
                        <TableCell>{solicitante.company || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {solicitante.tipoPessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={solicitante.active ? "default" : "secondary"}>
                            {solicitante.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
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

        <TabsContent value="favorecidos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Favorecidos
              </CardTitle>
              <CardDescription>
                Contatos adicionais que acompanham tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFavorecidos ? (
                <div className="text-center py-8">Carregando favorecidos...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vínculo</TableHead>
                      <TableHead>Pode Interagir</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFavorecidos.map((favorecido: any) => (
                      <TableRow key={favorecido.id}>
                        <TableCell className="font-medium">
                          {favorecido.nome}
                        </TableCell>
                        <TableCell>{favorecido.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {favorecido.tipoVinculo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={favorecido.podeInteragir ? "default" : "secondary"}>
                            {favorecido.podeInteragir ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={favorecido.status === "ativo" ? "default" : "secondary"}>
                            {favorecido.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
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
    </div>
  );
}