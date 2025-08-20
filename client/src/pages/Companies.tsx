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
// import useLocalization from '@/hooks/useLocalization';
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
  // Localization temporarily disabled
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
      status: "active"
    },
  });
  // Query para buscar empresas - usando endpoint correto
  const { data: companiesData, isLoading, error } = useQuery({
    queryKey: ['/api/customers/companies'],
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
  // Mutation para criar empresa
  const createCompanyMutation = useMutation({
    mutationFn: (data: z.infer<typeof companySchema>) =>
      apiRequest('POST', '/api/customers/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers/companies'] });
      setIsCreateDialogOpen(false);
      companyForm.reset();
      toast({
        title: "Empresa criada",
        description: "A empresa foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });
  // Mutation para editar empresa
  const editCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: z.infer<typeof companySchema> }) =>
      apiRequest('PUT', "
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers/companies'] });
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      companyForm.reset();
      toast({
        title: "Empresa atualizada",
        description: "A empresa foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });
  // Mutation para deletar empresa
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', "
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers/companies'] });
      toast({
        title: "Empresa removida",
        description: "A empresa foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
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
      status: (company.status as any) || "active"
    });
    setIsEditDialogOpen(true);
  };
  // Filtrar empresas com base no termo de busca
  const filteredCompanies = (Array.isArray(companies) ? companies : []).filter((company: Company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.displayName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (company.industry?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );
  if (isLoading) {
    return (
      <div className=""
        <div className=""
          <div className=""
            <div className=""
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            </div>
            <p className=""
              Carregando empresas...
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className=""
      {/* Header */}
      <div className=""
        <div>
          <h1 className=""
            Empresas
          </h1>
          <p className=""
            Gerencie suas empresas e clientes associados
          </p>
        </div>
        <div className=""
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className=""
              <DialogHeader>
                <DialogTitle>Criar Nova Empresa</DialogTitle>
              </DialogHeader>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(handleCreateCompany)} className=""
                  <div className=""
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
                          <FormControl>
                            <Input placeholder="Ex: Tecnologia, Saúde, Educação" {...field} />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                            <Input type="email" placeholder="contato@empresa.com" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="basic">Básico</SelectItem>
                              <SelectItem value="professional">Profissional</SelectItem>
                              <SelectItem value="enterprise">Empresarial</SelectItem>
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
                  <div className=""
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
                      {createCompanyMutation.isPending ? "Criando..." : '[TRANSLATION_NEEDED]'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Search */}
      <div className=""
        <div className=""
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder='[TRANSLATION_NEEDED]'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className=""
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className=""
            {searchTerm ? '[TRANSLATION_NEEDED]' : '[TRANSLATION_NEEDED]'}
          </h3>
          <p className=""
            {searchTerm 
              ? "Tente ajustar o termo de busca." 
              : "Comece criando sua primeira empresa para organizar seus clientes."
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Empresa
            </Button>
          )}
        </div>
      ) : (
        <div className=""
          {filteredCompanies.map((company: Company) => (
            <Card key={company.id} className=""
              <CardHeader className=""
                <div className=""
                  <div className=""
                    <CardTitle className=""
                      {company.displayName || company.name}
                    </CardTitle>
                    {company.displayName && (
                      <p className="text-lg">"{company.name}</p>
                    )}
                    <div className=""
                      <Badge 
                        variant={company.status === 'active' ? 'default' : 'secondary'}
                      >
                        {company.status === 'active' ? 'Ativa' : 
                         company.status === 'inactive' ? 'Inativa' : 'Suspensa'}
                      </Badge>
                      <Badge variant="outline>
                        {company.subscriptionTier === 'basic' ? 'Básico' :
                         company.subscriptionTier === 'professional' ? 'Profissional' : 'Empresarial'}
                      </Badge>
                    </div>
                  </div>
                  <div className=""
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
                        if (confirm('Tem certeza que deseja remover esta empresa?')) {
                          deleteCompanyMutation.mutate(company.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className=""
                {company.description && (
                  <p className=""
                    {company.description}
                  </p>
                )}
                <div className=""
                  {company.industry && (
                    <div className=""
                      <Building2 className="w-4 h-4" />
                      <span>{company.industry}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className=""
                      <Mail className="w-4 h-4" />
                      <span className="text-lg">"{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className=""
                      <Phone className="w-4 h-4" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className=""
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
        <DialogContent className=""
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <Form {...companyForm}>
            <form onSubmit={companyForm.handleSubmit(handleEditCompany)} className=""
              <div className=""
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
                      <FormControl>
                        <Input placeholder="Ex: Tecnologia, Saúde, Educação" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                        <Input type="email" placeholder="contato@empresa.com" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="enterprise">Empresarial</SelectItem>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
              <div className=""
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={editCompanyMutation.isPending}
                >
                  {editCompanyMutation.isPending ? "Salvando..." : '[TRANSLATION_NEEDED]'}
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
          queryClient.invalidateQueries({ queryKey: ['/api/customers/companies'] });
          setIsAssociateModalOpen(false);
        }}
      />
    </div>
  );
}