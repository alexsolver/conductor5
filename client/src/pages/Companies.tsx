import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  Trash2,
  Users,
  Star,
  Calendar,
  UserPlus,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AssociateMultipleCustomersModal from "@/components/customers/AssociateMultipleCustomersModal";
import CompanyCustomersSection from "@/components/CompanyCustomersSection";

const companySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  displayName: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z
    .enum(["startup", "small", "medium", "large", "enterprise"])
    .optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      {
        message: "URL inválida",
      },
    ),
  subscriptionTier: z
    .enum(["basic", "professional", "enterprise"])
    .default("basic"),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});

interface Company {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  industry?: string;
  size?: string;
  email?: string;
  phone?: string;
  website?: string;
  subscriptionTier: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Companies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Associate multiple customers modal
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      industry: "",
      email: "",
      phone: "",
      website: "",
      subscriptionTier: "basic",
      status: "active",
    },
  });

  // Query para buscar empresas - usando endpoint correto
  const {
    data: companiesData,
    isLoading,
    error,
    refetch: refetchCompanies
  } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/companies");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Query para buscar customers
  const {
    data: customersData,
    isLoadingCustomers,
    errorCustomers,
  } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });



  // Handle different response formats from the API
  const companies = (() => {
    console.log("🔍 [COMPANIES-DEBUG] Raw API response:", companiesData);
    if (!companiesData) {
      console.log("❌ [COMPANIES-DEBUG] No data received");
      return [];
    }

    // Direct array format
    if (Array.isArray(companiesData)) {
      console.log(
        "✅ [COMPANIES-DEBUG] Array format:",
        companiesData.length,
        "companies",
      );
      return companiesData;
    }

    // Success wrapper with data array
    if (
      companiesData &&
      typeof companiesData === 'object' &&
      'success' in companiesData &&
      'data' in companiesData &&
      Array.isArray((companiesData as any).data)
    ) {
      console.log(
        "✅ [COMPANIES-DEBUG] Success wrapper format:",
        (companiesData as any).data.length,
        "companies",
      );
      return (companiesData as any).data;
    }

    // Data wrapper format
    if (
      companiesData &&
      typeof companiesData === 'object' &&
      'data' in companiesData &&
      Array.isArray((companiesData as any).data)
    ) {
      console.log(
        "✅ [COMPANIES-DEBUG] Data wrapper format:",
        (companiesData as any).data.length,
        "companies",
      );
      return (companiesData as any).data;
    }

    // Check if the response itself has company-like properties
    if (
      companiesData &&
      typeof companiesData === 'object' &&
      'id' in companiesData &&
      'name' in companiesData
    ) {
      console.log("✅ [COMPANIES-DEBUG] Single company object format");
      return [companiesData];
    }

    // Handle nested data structures
    const dataKeys = ['companies', 'items', 'results'];
    for (const key of dataKeys) {
      if (
        companiesData &&
        typeof companiesData === 'object' &&
        key in companiesData &&
        Array.isArray((companiesData as any)[key])
      ) {
        console.log(`✅ [COMPANIES-DEBUG] Found data in ${key} property:`, (companiesData as any)[key].length);
        return (companiesData as any)[key];
      }
    }

    console.log("❌ [COMPANIES-DEBUG] Unknown format, data structure:", Object.keys(companiesData || {}));
    console.log("❌ [COMPANIES-DEBUG] Full response:", JSON.stringify(companiesData, null, 2));
    return [];
  })();

  // Mutation para criar empresa
  const createCompanyMutation = useMutation({
    mutationFn: (data: z.infer<typeof companySchema>) =>
      apiRequest("POST", "/api/companies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateDialogOpen(false);
      companyForm.reset();
      toast({
        title: "Empresa criada",
        description: "A empresa foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar empresa
  const editCompanyMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: z.infer<typeof companySchema>;
    }) => apiRequest("PUT", `/api/customers/companies/${id}`, data),
    onSuccess: () => {
      //queryClient.invalidateQueries({ queryKey: ["/api/customers/companies"] });
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      companyForm.reset();
      refetchCompanies();
      toast({
        title: "Empresa atualizada",
        description: "A empresa foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar empresa
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Empresa removida",
        description: "A empresa foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCompany = (data: z.infer<typeof companySchema>) => {
    createCompanyMutation.mutate(data);
  };

  const handleEditCompany = (data: z.infer<typeof companySchema>) => {
    if (selectedCompany) {
      editCompanyMutation.mutate({ id: selectedCompany.id, data });
    }
  };

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company);
    companyForm.reset({
      name: company.name,
      displayName: company.displayName || "",
      description: company.description || "",
      industry: company.industry || "",
      size: (company.size as any) || undefined,
      email: company.email || "",
      phone: company.phone || "",
      website: company.website || "",
      subscriptionTier: (company.subscriptionTier as any) || "basic",
      status: (company.status as any) || "active",
    });
    setIsEditDialogOpen(true);
  };

  // Filtrar empresas com base no termo de busca
  const filteredCompanies = (Array.isArray(companies) ? companies : []).filter(
    (company: Company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.displayName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (company.industry?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ),
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-pulse">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Carregando empresas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Empresas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas empresas e clientes associados
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Empresa</DialogTitle>
              </DialogHeader>
              <Form {...companyForm}>
                <form
                  onSubmit={companyForm.handleSubmit(handleCreateCompany)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de Exibição</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome fantasia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o setor da empresa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="servicos-manutencao">
                                Serviços de Manutenção
                              </SelectItem>
                              <SelectItem value="transportes-logistica">
                                Transportes e Logística
                              </SelectItem>
                              <SelectItem value="instalacao-sistemas-equipamentos">
                                Instalação de Sistemas e Equipamentos
                              </SelectItem>
                              <SelectItem value="servicos-limpeza">
                                Serviços de Limpeza
                              </SelectItem>
                              <SelectItem value="servicos-seguranca">
                                Serviços de Segurança
                              </SelectItem>
                              <SelectItem value="consultoria-campo">
                                Consultoria de Campo
                              </SelectItem>
                              <SelectItem value="servicos-atendimento-cliente">
                                Serviços de Atendimento ao Cliente
                              </SelectItem>
                              <SelectItem value="servicos-saude-domiciliar">
                                Serviços de Saúde Domiciliar
                              </SelectItem>
                              <SelectItem value="servicos-construcao-civil">
                                Serviços de Construção Civil
                              </SelectItem>
                              <SelectItem value="servicos-entrega">
                                Serviços de Entrega
                              </SelectItem>
                              <SelectItem value="agricultura-precisao">
                                Agricultura de Precisão
                              </SelectItem>
                              <SelectItem value="monitoramento-ambiental">
                                Monitoramento Ambiental
                              </SelectItem>
                              <SelectItem value="servicos-emergencia">
                                Serviços de Emergência
                              </SelectItem>
                              <SelectItem value="inspecao-avaliacao-campo">
                                Inspeção e Avaliação de Campo
                              </SelectItem>
                              <SelectItem value="servicos-reparacao-suporte-tecnico">
                                Serviços de Reparação e Suporte Técnico
                              </SelectItem>
                              <SelectItem value="servicos-telecomunicacoes">
                                Serviços de Telecomunicações
                              </SelectItem>
                              <SelectItem value="servicos-manutencao-predial">
                                Serviços de Manutenção Predial
                              </SelectItem>
                              <SelectItem value="servicos-ti">
                                Serviços de TI
                              </SelectItem>
                              <SelectItem value="outros">
                                Outros
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porte</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o porte" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="startup">Startup</SelectItem>
                              <SelectItem value="small">Pequena</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="large">Grande</SelectItem>
                              <SelectItem value="enterprise">
                                Corporação
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contato@empresa.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://empresa.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="subscriptionTier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plano</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="basic">Básico</SelectItem>
                              <SelectItem value="professional">
                                Profissional
                              </SelectItem>
                              <SelectItem value="enterprise">
                                Empresarial
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descrição da empresa..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCompanyMutation.isPending}
                    >
                      {createCompanyMutation.isPending
                        ? "Criando..."
                        : "Criar Empresa"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm
              ? "Nenhuma empresa encontrada"
              : "Nenhuma empresa cadastrada"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm
              ? "Tente ajustar o termo de busca."
              : "Comece criando sua primeira empresa para organizar seus clientes."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Empresa
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company: Company) => (
            <Card
              key={company.id}
              className="group hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 line-clamp-1">
                      {company.displayName || company.name}
                    </CardTitle>
                    {company.displayName && (
                      <p className="text-sm text-gray-500 mb-2">
                        {company.name}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          company.status === "active" ? "default" : "secondary"
                        }
                      >
                        {company.status === "active"
                          ? "Ativa"
                          : company.status === "inactive"
                            ? "Inativa"
                            : "Suspensa"}
                      </Badge>
                      <Badge variant="outline">
                        {company.subscriptionTier === "basic"
                          ? "Básico"
                          : company.subscriptionTier === "professional"
                            ? "Profissional"
                            : "Empresarial"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(company)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (
                          confirm(
                            "Tem certeza que deseja remover esta empresa?",
                          )
                        ) {
                          deleteCompanyMutation.mutate(company.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {company.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {company.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {company.industry && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="w-4 h-4" />
                      <span>{company.industry}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Globe className="w-4 h-4" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 truncate"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Company Customers Section */}
                <CompanyCustomersSection
                  companyId={company.id}
                  customersData={customersData}
                  onAssociateCustomers={() => {
                    setSelectedCompany(company);
                    setIsAssociateModalOpen(true);
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <Form {...companyForm}>
            <form
              onSubmit={companyForm.handleSubmit(handleEditCompany)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Exibição</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome fantasia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o setor da empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="servicos-manutencao">
                            Serviços de Manutenção
                          </SelectItem>
                          <SelectItem value="transportes-logistica">
                            Transportes e Logística
                          </SelectItem>
                          <SelectItem value="instalacao-sistemas-equipamentos">
                            Instalação de Sistemas e Equipamentos
                          </SelectItem>
                          <SelectItem value="servicos-limpeza">
                            Serviços de Limpeza
                          </SelectItem>
                          <SelectItem value="servicos-seguranca">
                            Serviços de Segurança
                          </SelectItem>
                          <SelectItem value="consultoria-campo">
                            Consultoria de Campo
                          </SelectItem>
                          <SelectItem value="servicos-atendimento-cliente">
                            Serviços de Atendimento ao Cliente
                          </SelectItem>
                          <SelectItem value="servicos-saude-domiciliar">
                            Serviços de Saúde Domiciliar
                          </SelectItem>
                          <SelectItem value="servicos-construcao-civil">
                            Serviços de Construção Civil
                          </SelectItem>
                          <SelectItem value="servicos-entrega">
                            Serviços de Entrega
                          </SelectItem>
                          <SelectItem value="agricultura-precisao">
                            Agricultura de Precisão
                          </SelectItem>
                          <SelectItem value="monitoramento-ambiental">
                            Monitoramento Ambiental
                          </SelectItem>
                          <SelectItem value="servicos-emergencia">
                            Serviços de Emergência
                          </SelectItem>
                          <SelectItem value="inspecao-avaliacao-campo">
                            Inspeção e Avaliação de Campo
                          </SelectItem>
                          <SelectItem value="servicos-reparacao-suporte-tecnico">
                            Serviços de Reparação e Suporte Técnico
                          </SelectItem>
                          <SelectItem value="servicos-telecomunicacoes">
                            Serviços de Telecomunicações
                          </SelectItem>
                          <SelectItem value="servicos-manutencao-predial">
                            Serviços de Manutenção Predial
                          </SelectItem>
                          <SelectItem value="servicos-ti">
                            Serviços de TI
                          </SelectItem>
                          <SelectItem value="outros">
                            Outros
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porte</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o porte" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="small">Pequena</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                          <SelectItem value="enterprise">Corporação</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contato@empresa.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="subscriptionTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="professional">
                            Profissional
                          </SelectItem>
                          <SelectItem value="enterprise">
                            Empresarial
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="inactive">Inativa</SelectItem>
                          <SelectItem value="suspended">Suspensa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={companyForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição da empresa..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editCompanyMutation.isPending}>
                  {editCompanyMutation.isPending
                    ? "Salvando..."
                    : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Associate Multiple Customers Modal */}
      <AssociateMultipleCustomersModal
        isOpen={isAssociateModalOpen}
        onClose={() => setIsAssociateModalOpen(false)}
        company={selectedCompany}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
          setIsAssociateModalOpen(false);
        }}
      />
    </div>
  );
}