import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  UserPlus
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
  size: z.enum(["startup", "small", "medium", "large", "enterprise"]).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional().refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
    message: "URL inválida"
  }),
  subscriptionTier: z.enum(["basic", "professional", "enterprise"]).default("basic"),
  status: z.enum(["active", "inactive", "suspended"]).default("active")
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
   const [selectedCompanyForAssociation, setSelectedCompanyForAssociation] = useState<any>(null);

  // Query para buscar companies
  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: () => apiRequest('GET', '/api/companies'),
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Handle different response formats from the API
  const companies = (() => {
    console.log('🔍 [COMPANIES-DEBUG] Raw API response:', companiesData);
    if (!companiesData) {
      console.log('❌ [COMPANIES-DEBUG] No data received');
      return [];
    }
    if (Array.isArray(companiesData)) {
      console.log('✅ [COMPANIES-DEBUG] Array format:', companiesData.length, 'companies');
      return companiesData;
    }
    if ((companiesData as any).success && Array.isArray((companiesData as any).data)) {
      console.log('✅ [COMPANIES-DEBUG] Success wrapper format:', (companiesData as any).data.length, 'companies');
      return (companiesData as any).data;
    }
    if ((companiesData as any).data && Array.isArray((companiesData as any).data)) {
      console.log('✅ [COMPANIES-DEBUG] Data wrapper format:', (companiesData as any).data.length, 'companies');
      return (companiesData as any).data;
    }
    console.log('❌ [COMPANIES-DEBUG] Unknown format, returning empty array');
    return [];
  })();

  // Mutation para criar company
  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar empresa",
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar company
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest('PUT', `/api/companies/${id}`, data),
    onSuccess: (result, variables) => {
      // Only invalidate cache for non-optimistic updates (when not called from Default button)
      const isOptimisticUpdate = variables.data.isOptimisticUpdate;
      if (!isOptimisticUpdate) {
        queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      }
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      editForm.reset();
      if (!isOptimisticUpdate) {
        toast({
          title: "Sucesso",
          description: "Empresa atualizada com sucesso!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar empresa",
        variant: "destructive",
      });
    }
  });

  // Mutation para deletar company
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/companies/${id}`),
    onSuccess: async (data, deletedId) => {
      console.log('Company deleted successfully:', { deletedId, response: data });

      // Validate response
      if (!data || (data as any).success === false) {
        throw new Error((data as any)?.message || 'Falha na exclusão da empresa');
      }

      // Optimistic update: remove from cache immediately
      queryClient.setQueryData(['/api/companies'], (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.filter(company => company.id !== deletedId);
      });

      // Invalidate and refetch only necessary queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/companies'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/companies'] }),
        // Invalidate any customer-specific queries that might reference this company
        queryClient.invalidateQueries({ 
          queryKey: ['/api/customers'], 
          refetchType: 'inactive' 
        })
      ]);

      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting company:', error);

      // Revert optimistic update if it was applied
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });

      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Erro ao excluir empresa";

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Forms
  const createForm = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      industry: "",
      size: undefined,
      email: "",
      phone: "",
      website: "",
      subscriptionTier: "basic",
      status: "active"
    }
  });

  const editForm = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      industry: "",
      size: undefined,
      email: "",
      phone: "",
      website: "",
      subscriptionTier: "basic",
      status: "active"
    }
  });

  const handleCreateCompany = (data: any) => {
    createCompanyMutation.mutate(data);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    editForm.reset({
      name: company.name,
      displayName: company.displayName || "",
      description: company.description || "",
      industry: company.industry || "",
      size: company.size as any,
      email: company.email || "",
      phone: company.phone || "",
      website: company.website || "",
      subscriptionTier: company.subscriptionTier as any,
      status: company.status as any
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCompany = (data: any) => {
    if (selectedCompany) {
      console.log('[FRONTEND] Updating company with data:', {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        formData: data
      });
      updateCompanyMutation.mutate({ id: selectedCompany.id, data });
    }
  };

  const handleDeleteCompany = (company: Company) => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${company.displayName || company.name}"?`)) {
      deleteCompanyMutation.mutate(company.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeIcon = (size?: string) => {
    switch (size) {
      case 'startup': return <Star className="w-4 h-4" />;
      case 'small': return <Building2 className="w-4 h-4" />;
      case 'medium': return <Users className="w-4 h-4" />;
      case 'large': return <Globe className="w-4 h-4" />;
      case 'enterprise': return <Building2 className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const filteredCompanies = companies.filter((company: Company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a: Company, b: Company) => {
    // Always put Default company first
    const aIsDefault = a.name?.toLowerCase().includes('default') || a.displayName?.toLowerCase().includes('default');
    const bIsDefault = b.name?.toLowerCase().includes('default') || b.displayName?.toLowerCase().includes('default');

    if (aIsDefault && !bIsDefault) return -1;
    if (!aIsDefault && bIsDefault) return 1;

    // Secondary sort by status (active first)
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;

    // Tertiary sort alphabetically
    return (a.displayName || a.name).localeCompare(b.displayName || b.name);
  });

  const handleOpenAssociateModal = (company: any) => {
    setSelectedCompanyForAssociation(company);
    setIsAssociateModalOpen(true);
  };

  const handleCloseAssociateModal = () => {
    setIsAssociateModalOpen(false);
    setSelectedCompanyForAssociation(null);
  };

    const handleAssociationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Empresas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie empresas e suas informações
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" aria-describedby="create-company-description">
            <div id="create-company-description" className="sr-only">
              Formulário para criar uma nova empresa cliente com informações básicas
            </div>
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateCompany)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Tech Solutions Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Exibição</FormLabel>
                        <FormControl>
                          <Input placeholder="Tech Solutions Limited" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição da empresa..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor</FormLabel>
                        <FormControl>
                          <Input placeholder="Tecnologia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tamanho" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="small">Pequena</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="large">Grande</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contato@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="+55 11 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="subscriptionTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plano</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="professional">Profissional</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="suspended">Suspenso</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
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
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {createCompanyMutation.isPending ? "Criando..." : "Criar Empresa"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Lista de empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company: Company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      company.status === 'inactive' ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        company.status === 'inactive' ? 'text-gray-400' : 'text-blue-600'
                      }`} />
                    </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className={`text-sm font-medium truncate ${
                        company.status === 'inactive' ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {company.name}
                      </p>
                      {(company.name?.toLowerCase().includes('default') || 
                    company.displayName?.toLowerCase().includes('default')) && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Padrão
                        </Badge>
                      )}
                      {company.status === 'inactive' && (
                        <Badge variant="outline" className="text-xs px-2 py-0 text-gray-500 border-gray-300">
                          Inativa
                        </Badge>
                      )}
                    </div>
                    {company.description && (
                      <p className={`text-sm truncate ${
                        company.status === 'inactive' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {company.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <Badge className={getStatusColor(company.status)}>
                    {company.status === 'active' ? 'Ativo' : 
                     company.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                  </Badge>
                  {(company.name?.toLowerCase().includes('default') || 
                    company.displayName?.toLowerCase().includes('default')) && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      Padrão
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {company.description}
                </p>
              )}

              <div className="space-y-2">
                {company.industry && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Building2 className="w-4 h-4 mr-2" />
                    {company.industry}
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="w-4 h-4 mr-2" />
                    {company.email}
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="w-4 h-4 mr-2" />
                    {company.phone}
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Globe className="w-4 h-4 mr-2" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-purple-600 truncate"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Customers Section */}
              <CompanyCustomersSection 
                companyId={company.id}
                onAssociateCustomers={() => handleOpenAssociateModal(company)}
              />

              {/* Company Footer with Actions */}
              <div className="flex justify-between items-center pt-3 border-t mt-3">
                <div className="flex items-center text-xs text-gray-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  {(() => {
                    // Check multiple possible date fields
                    const dateValue = company.createdAt || (company as any).created_at || (company as any).dateCreated;
                    if (dateValue && !isNaN(new Date(dateValue).getTime())) {
                      return new Date(dateValue).toLocaleDateString('pt-BR');
                    }
                    return 'Cadastrada recentemente';
                  })()}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCompany(company)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  {(() => {
                    const isDefaultCompany = company.name?.toLowerCase().includes('default') || 
                                           company.displayName?.toLowerCase().includes('default');
                    const hasOtherCompanies = companies.filter((c: Company) => 
                      !c.name?.toLowerCase().includes('default') && 
                      !c.displayName?.toLowerCase().includes('default')
                    ).length > 0;

                    // Show activate/deactivate option for Default company only if there are other companies
                    if (isDefaultCompany && hasOtherCompanies) {
                      const isActiveCompany = company.status === 'active' || company.isActive;
                      const newStatus = isActiveCompany ? 'inactive' : 'active';
                      const actionText = isActiveCompany ? 'Desativar' : 'Ativar';
                      const loadingText = isActiveCompany ? 'Desativando...' : 'Ativando...';
                      const iconColor = isActiveCompany ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700';
                      
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              // Send only the fields that need to be updated
                              const updateData = { 
                                status: newStatus,
                                // Include required fields to avoid validation issues
                                name: company.name,
                                displayName: company.displayName,
                                subscriptionTier: company.subscriptionTier || 'basic',
                                // Flag to prevent automatic cache invalidation
                                isOptimisticUpdate: true
                              };
                              
                              console.log(`[UPDATE-COMPANY] Updating Default company from ${company.status} to ${newStatus}`);
                              
                              // Optimistically update the company status in cache
                              queryClient.setQueryData(['/api/companies'], (oldData: any) => {
                                if (Array.isArray(oldData)) {
                                  return oldData.map(comp => 
                                    comp.id === company.id 
                                      ? { ...comp, status: newStatus, isActive: newStatus === 'active' }
                                      : comp
                                  );
                                }
                                return oldData;
                              });

                              // Use the correct mutation endpoint
                              await updateCompanyMutation.mutateAsync({ id: company.id, data: updateData });
                              
                              // Only invalidate secondary queries, not the main companies query since we already updated optimistically
                              await Promise.all([
                                queryClient.invalidateQueries({ queryKey: ['/api/companies'] }),
                                queryClient.invalidateQueries({ queryKey: ['fieldOptions'] }),
                                queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/field-options'] })
                              ]);
                              
                              toast({
                                title: "Empresa atualizada",
                                description: `Empresa Default ${isActiveCompany ? 'desativada' : 'ativada'} com sucesso.`,
                              });
                              
                            } catch (error) {
                              console.error('Error updating Default company:', error);
                              // Revert optimistic update on error
                              queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
                              toast({
                                title: "Erro",
                                description: "Falha ao atualizar empresa. Tente novamente.",
                                variant: "destructive"
                              });
                            }
                          }}
                          disabled={updateCompanyMutation.isPending}
                          className={iconColor}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {updateCompanyMutation.isPending ? loadingText : actionText}
                        </Button>
                      );
                    }

                    // Show delete for non-default companies or if it's the only company
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCompany(company)}
                        disabled={deleteCompanyMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {deleteCompanyMutation.isPending ? "Excluindo..." : "Excluir"}
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhuma empresa encontrada
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Tente ajustar sua busca.' : 'Comece criando sua primeira empresa cliente.'}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Empresa
            </Button>
          )}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="edit-company-description">
          <div id="edit-company-description" className="sr-only">
            Formulário para editar informações da empresa cliente selecionada
          </div>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateCompany)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Solutions Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Exibição</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Solutions Limited" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição da empresa..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor</FormLabel>
                      <FormControl>
                        <Input placeholder="Tecnologia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="small">Pequena</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="+55 11 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="subscriptionTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedCompany(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateCompanyMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {updateCompanyMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Associate Multiple Customers Modal */}
      <AssociateMultipleCustomersModal
        isOpen={isAssociateModalOpen}
        onClose={handleCloseAssociateModal}
        company={selectedCompanyForAssociation}
        onSuccess={handleAssociationSuccess}
      />
    </div>
  );
}