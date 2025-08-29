import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, User, Globe, Star, Building, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CustomerLocationManager } from './CustomerLocationManager';
import { LocationModal } from './LocationModal';
import DynamicCustomFields from '@/components/DynamicCustomFields';
import { useCompanyFilter } from '@/hooks/useCompanyFilter';

const customerSchema = z.object({
  // Tipo e status
  customerType: z.enum(['PF', 'PJ'], { required_error: 'Tipo de cliente é obrigatório' }),
  status: z.enum(['Ativo', 'Inativo', 'active', 'inactive']).transform((val) => {
    // Normalize status values to Portuguese
    if (val === 'active') return 'Ativo';
    if (val === 'inactive') return 'Inativo';
    return val;
  }).default('Ativo'),

  // Informações básicas
  email: z.string().email('Email inválido'),
  description: z.string().optional(),
  internalCode: z.string().optional(),

  // Dados pessoa física
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  cpf: z.string().optional(),

  // Dados pessoa jurídica
  companyName: z.string().optional(),
  cnpj: z.string().optional(),

  // Contatos
  contactPerson: z.string().optional(),
  responsible: z.string().optional(),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),

  // Hierarquia
  position: z.string().optional(),
  supervisor: z.string().optional(),
  coordinator: z.string().optional(),
  manager: z.string().optional(),

  // Campos técnicos (mantidos)
  verified: z.boolean().default(false),
  active: z.boolean().default(true),
  suspended: z.boolean().default(false),
  timezone: z.string().default('America/Sao_Paulo'),
  locale: z.string().default('pt-BR'),
  language: z.string().default('pt'),
  externalId: z.string().optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
  avatar: z.string().optional(),
  signature: z.string().optional(),
}).refine((data) => {
  // Validação condicional baseada no tipo de cliente
  if (data.customerType === 'PF') {
    return data.firstName && data.lastName;
  } else if (data.customerType === 'PJ') {
    return data.companyName && data.cnpj;
  }
  return true;
}, {
  message: "Campos obrigatórios: PF precisa de Nome e Sobrenome; PJ precisa de Razão Social e CNPJ",
  path: ["customerType"]
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
  onLocationModalOpen: () => void;
}

export function CustomerModal({ isOpen, onClose, customer, onLocationModalOpen }: CustomerModalProps) {
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');


  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: "PF",
      status: "Ativo",
      email: "",
      description: "",
      internalCode: "",
      firstName: "",
      lastName: "",
      cpf: "",
      companyName: "",
      cnpj: "",
      contactPerson: "",
      responsible: "",
      phone: "",
      mobilePhone: "",
      position: "",
      supervisor: "",
      coordinator: "",
      manager: "",
      verified: false,
      active: true,
      suspended: false,
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      language: "pt",
      externalId: "",
      role: "",
      notes: "",
      avatar: "",
      signature: "",
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (customer?.id) {
        return apiRequest('PATCH', `/api/customers/${customer.id}`, data);
      } else {
        return apiRequest('POST', '/api/customers', data);
      }
    },
    onSuccess: () => {
      // Invalidate all customer-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.refetchQueries({ queryKey: ["/api/customers"] });
      onClose();
      toast({
        title: "Cliente salvo com sucesso",
        description: customer ? "Cliente atualizado." : "Novo cliente criado."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar cliente",
        variant: "destructive"
      });
    }
  });

    // Fetch available companies
    const { data: availableCompaniesData, refetch: refetchAvailableCompanies, error: availableCompaniesError } = useQuery({
      queryKey: ['/api/companies'],
      queryFn: async () => {
        const response = await apiRequest('GET', '/api/companies');
        return response.json();
      },
      enabled: isOpen, // Only fetch when the modal is open
      staleTime: 0, // Always fetch fresh data
      gcTime: 0, // Don't cache data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });

    // Parse available companies and filter Default if inactive
    const rawCompanies = Array.isArray(availableCompaniesData) ? availableCompaniesData : [];
    const { filteredCompanies } = useCompanyFilter(rawCompanies);

    // Sort filtered companies to put Default first (if it's active)
    const availableCompanies = filteredCompanies.sort((a: any, b: any) => {
      const aIsDefault = a.name?.toLowerCase().includes('default') || a.displayName?.toLowerCase().includes('default');
      const bIsDefault = b.name?.toLowerCase().includes('default') || b.displayName?.toLowerCase().includes('default');

      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      return (a.name || a.displayName || '').localeCompare(b.name || b.displayName || '');
    });

    if (availableCompaniesError) {
      console.error('Available companies error:', availableCompaniesError);
    }

    // Fetch customer companies
    const { data: companiesData, refetch: refetchCompanies } = useQuery({
      queryKey: [`/api/customers/${customer?.id}/companies`],
      queryFn: async () => {
        if (!customer?.id) return [];
        const response = await apiRequest('GET', `/api/customers/${customer.id}/companies`);
        return response.json();
      },
      enabled: isOpen && !!customer?.id, // Only fetch when the modal is open and customer exists
      staleTime: 0, // Always fetch fresh data
      gcTime: 0, // Don't cache data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });

  useEffect(() => {
    // Handle both direct array and wrapped response formats
    let companies = [];
    console.log("COMPANIES DATA: ", companiesData);
    if (Array.isArray(companiesData)) {
      companies = companiesData;
    } else if (companiesData?.success && Array.isArray(companiesData.data)) {
      companies = companiesData.data;
    } else if (companiesData?.data && Array.isArray(companiesData.data)) {
      companies = companiesData.data;
    }
    console.log("COMPANIES AQUI: ", companies);
    setCompanies(companies);
  }, [companiesData, customer?.id]);

  // Force refresh data when customer changes or modal opens
  useEffect(() => {
    if (customer?.id && isOpen) {
      // Clear cache and force fresh data
      queryClient.removeQueries({ queryKey: [`/api/customers/${customer.id}/companies`] });
      queryClient.removeQueries({ queryKey: ['/api/companies'] });

      // Force immediate refresh
      setTimeout(() => {
        refetchCompanies();
        refetchAvailableCompanies();
      }, 100);
    }
  }, [customer?.id, isOpen, refetchCompanies, refetchAvailableCompanies, queryClient]);

  // Reset form when customer data changes
  useEffect(() => {
    if (customer && isOpen) {
      form.reset({
        customerType: customer.customerType || customer.customer_type || "PF",
        status: customer.status || "Ativo",
        email: customer.email || "",
        description: customer.description || "",
        internalCode: customer.internalCode || customer.internal_code || "",
        firstName: customer.firstName || customer.first_name || "",
        lastName: customer.lastName || customer.last_name || "",
        cpf: customer.cpf || "",
        companyName: customer.companyName || customer.company_name || "",
        cnpj: customer.cnpj || "",
        contactPerson: customer.contactPerson || customer.contact_person || "",
        responsible: customer.responsible || "",
        phone: customer.phone || "",
        mobilePhone: customer.mobilePhone || customer.mobile_phone || "",
        position: customer.position || "",
        supervisor: customer.supervisor || "",
        coordinator: customer.coordinator || "",
        manager: customer.manager || "",
        verified: customer.verified || false,
        active: customer.active ?? true,
        suspended: customer.suspended || false,
        timezone: customer.timezone || "America/Sao_Paulo",
        locale: customer.locale || "pt-BR",
        language: customer.language || "pt",
        externalId: customer.externalId || customer.external_id || "",
        role: customer.role || "",
        notes: customer.notes || "",
        avatar: customer.avatar || "",
        signature: customer.signature || "",
      });
    } else if (!customer && isOpen) {
      // Reset to empty form for new customer
      form.reset({
        customerType: "PF",
        status: "Ativo",
        email: "",
        description: "",
        internalCode: "",
        firstName: "",
        lastName: "",
        cpf: "",
        companyName: "",
        cnpj: "",
        contactPerson: "",
        responsible: "",
        phone: "",
        mobilePhone: "",
        position: "",
        supervisor: "",
        coordinator: "",
        manager: "",
        verified: false,
        active: true,
        suspended: false,
        timezone: "America/Sao_Paulo",
        locale: "pt-BR",
        language: "pt",
        externalId: "",
        role: "",
        notes: "",
        avatar: "",
        signature: "",
      });
    }
  }, [customer, isOpen, form]);




  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  const handleLocationManagerOpen = () => {
    if (!customer?.id) {
      toast({
        title: "Salve o cliente primeiro",
        description: "É necessário salvar o cliente antes de gerenciar localizações.",
        variant: "destructive"
      });
      return;
    }
    setShowLocationManager(true);
  };

  const handleNewLocationClick = () => {
    setShowLocationManager(false);
    setShowLocationModal(true);
  };

  const handleAddCompany = async () => {
    // Validações melhoradas
    if (!customer?.id) {
      toast({
        title: "Erro",
        description: "É necessário salvar o cliente antes de associar empresas",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCompanyId || selectedCompanyId === 'no-companies' || selectedCompanyId === 'all-associated') {
      toast({
        title: "Erro",
        description: "Selecione uma empresa válida para associar",
        variant: "destructive"
      });
      return;
    }

    // Verificar se a empresa já está associada
    const isAlreadyAssociated = Array.isArray(companies) && 
      companies.some((cm: any) => (cm.company_id || cm.id) === selectedCompanyId);

    if (isAlreadyAssociated) {
      toast({
        title: "Erro",
        description: "Esta empresa já está associada ao cliente",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adding company:', { 
        customerId: customer.id, 
        companyId: selectedCompanyId,
        currentAssociations: companies?.length || 0
      });

      const response = await apiRequest('POST', `/api/customers/${customer.id}/companies`, {
        companyId: selectedCompanyId,
        role: 'member',
        isPrimary: Array.isArray(companies) ? companies.length === 0 : true
      });

      // Limpar seleção antes de atualizar dados
      setSelectedCompanyId('');

      // Atualizar dados
      await refetchCompanies();

      toast({
        title: "Sucesso",
        description: "Empresa associada com sucesso!",
      });
    } catch (error: any) {
      console.error('Error adding company:', error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao associar empresa",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (!customer?.id) {
      toast({
        title: "Erro",
        description: "Cliente não encontrado",
        variant: "destructive"
      });
      return;
    }

    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado ou inválido",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Removing company:', { 
        customerId: customer.id, 
        companyId
      });

      // Fazer a requisição de exclusão
      const result = await apiRequest('DELETE', `/api/customers/${customer.id}/companies/${companyId}`);
      console.log('Delete response:', result);

      if (result && (result as any).success === false) {
        throw new Error((result as any).message || 'Falha ao remover empresa');
      }

      // Atualizar estado local imediatamente
      setCompanies(prevCompanies => {
        const filtered = prevCompanies.filter(company => 
          (company.company_id || company.id) !== companyId
        );
        console.log('Updated local state:', { 
          before: prevCompanies.length, 
          after: filtered.length,
          removedCompanyId: companyId
        });
        return filtered;
      });

      // Invalidar cache e fazer refetch simples
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customer.id}/companies`] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });

      // Aguardar um pouco para o backend processar
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refetch simples
      await refetchCompanies();
      await refetchAvailableCompanies();

      toast({
        title: "Sucesso",
        description: "Empresa removida com sucesso!",
      });
    } catch (error: any) {
      console.error('Error removing company association:', {
        error,
        customerId: customer.id,
        companyId,
        errorMessage: error?.message,
        errorResponse: error?.response
      });

      toast({
        title: "Erro",
        description: error?.message || "Erro ao remover empresa",
        variant: "destructive"
      });
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="customer-modal-description">
          <div id="customer-modal-description" className="sr-only">
            Formulário para criar ou editar informações de cliente
          </div>
          <DialogHeader>
            <DialogTitle>
              {customer?.id ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="dados-basicos" className="w-full">
                <TabsList className="w-full h-auto p-1">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full">
                    <TabsTrigger value="dados-basicos" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                      <User className="h-3 w-3 lg:h-4 lg:w-4" />
                      Dados Básicos
                    </TabsTrigger>
                    <TabsTrigger value="hierarquia" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                      <Star className="h-3 w-3 lg:h-4 lg:w-4" />
                      Hierarquia
                    </TabsTrigger>
                    <TabsTrigger value="empresas" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                      <Building className="h-3 w-3 lg:h-4 lg:w-4" />
                      Empresas
                    </TabsTrigger>
                    <TabsTrigger value="locais" className="flex items-center gap-2 text-xs lg:text-sm p-2">
                      <MapPin className="h-3 w-3 lg:h-4 lg:w-4" />
                      Locais
                    </TabsTrigger>
                  </div>
                </TabsList>

                <TabsContent value="dados-basicos" className="space-y-4">
                  {/* Tipo de Cliente e Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Cliente *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                              <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Ativo">Ativo</SelectItem>
                              <SelectItem value="Inativo">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Campos condicionais baseados no tipo */}
                  {form.watch('customerType') === 'PF' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome *</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do cliente" {...field} />
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
                                <Input placeholder="Sobrenome do cliente" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {form.watch('customerType') === 'PJ' && (
                    <>
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Razão Social *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ *</FormLabel>
                            <FormControl>
                              <Input placeholder="00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Campos comuns */}
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrição do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="internalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Interno</FormLabel>
                          <FormControl>
                            <Input placeholder="Código interno" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pessoa de Contato</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da pessoa de contato" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="responsible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do responsável" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 3333-3333" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mobilePhone"
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
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função</FormLabel>
                          <FormControl>
                            <Input placeholder="Cargo/Função" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>


                </TabsContent>

                <TabsContent value="hierarquia" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="supervisor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervisor</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do supervisor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coordinator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coordenador</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do coordenador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="manager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gerente</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do gerente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Configurações Técnicas</h3>

                    <div className="grid grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="verified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Verificado</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Cliente tem email verificado
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
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Ativo</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Cliente está ativo no sistema
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
                        name="suspended"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Suspenso</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Cliente temporariamente suspenso
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
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="externalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Externo</FormLabel>
                            <FormControl>
                              <Input placeholder="ID de sistema externo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Papel no Sistema</FormLabel>
                            <FormControl>
                              <Input placeholder="Role do cliente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações sobre o cliente..."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="locais" className="space-y-4">
                  <div className="text-center py-8">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Gerenciar Localizações
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Associe este cliente a uma ou mais localizações do sistema.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        type="button"
                        onClick={handleLocationManagerOpen}
                        disabled={!customer?.id}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Gerenciar Localizações
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNewLocationClick}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Nova Localização
                      </Button>
                    </div>
                    {!customer?.id && (
                      <p className="text-sm text-amber-600 mt-4">
                        💡 Salve o cliente primeiro para gerenciar localizações
                      </p>
                    )}
                  </div>
                </TabsContent>

                 <TabsContent value="empresas" className="space-y-4">
                    {/* Empresas associadas */}
                    {customer?.id && (
                      <div className="space-y-4">
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Empresas Associadas
                          </FormLabel>

                          {/* Lista de empresas associadas */}
                          <div className="mt-2 space-y-2">
                            {Array.isArray(companies) && companies.length > 0 ? (
                              companies.map((membership: any, index: number) => {
                                // Garantir ID único e válido para cada empresa
                                const companyId = membership.company_id || membership.id;
                                const membershipId = membership.membership_id || membership.id || index;
                                // Chave única garantida usando múltiplos identificadores
                                const uniqueKey = `membership-${membershipId}-${companyId}-${index}`;

                                return (
                                  <div key={uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {membership.display_name || membership.company_name || membership.name || `Empresa ${companyId || index + 1}`}
                                      </span>
                                      <Badge variant={membership.is_primary ? "default" : "secondary"}>
                                        {membership.role || 'member'}
                                      </Badge>
                                      {membership.is_primary && (
                                        <Badge variant="outline">Principal</Badge>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveCompany(companyId)}
                                      disabled={!companyId}
                                      title={!companyId ? "ID da empresa não encontrado" : "Remover empresa"}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border">
                                Nenhuma empresa associada
                              </div>
                            )}
                          </div>
                        </FormItem>{/* Adicionar nova empresa */}
                        <div className="mt-4 space-y-2">
                          <FormLabel className="text-sm font-medium">Adicionar Empresa</FormLabel>
                          <div className="flex gap-2">
                            <FormItem className="flex-1">
                              <Select 
                                onValueChange={(value) => {
                                  setSelectedCompanyId(value);
                                }} 
                                value={selectedCompanyId}
                              >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecionar empresa para associar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(() => {
                                          // Debug: verificar dados disponíveis
                                          console.log('Available companies for selection:', {
                                            availableCompanies: availableCompanies,
                                            isArray: Array.isArray(availableCompanies),
                                            length: Array.isArray(availableCompanies) ? availableCompanies.length : 'N/A',
                                            companies: companies,
                                            associatedIds: Array.isArray(companies) ? companies.map((cm: any) => cm.company_id || cm.id) : []
                                          });

                                          if (!Array.isArray(availableCompanies) || availableCompanies.length === 0) {
                                            return (
                                              <SelectItem value="no-companies" disabled>
                                                Nenhuma empresa disponível no sistema
                                              </SelectItem>
                                            );
                                          }

                                          // Filtrar empresas já associadas
                                          const associatedCompanyIds = Array.isArray(companies) 
                                            ? companies.map((cm: any) => cm.company_id || cm.id)
                                            : [];

                                          const unassociatedCompanies = availableCompanies.filter((company: any) => {
                                            return !associatedCompanyIds.includes(company.id);
                                          });

                                          console.log('Filtered companies:', {
                                            total: availableCompanies.length,
                                            associated: associatedCompanyIds.length,
                                            available: unassociatedCompanies.length,
                                            unassociatedCompanies: unassociatedCompanies
                                          });

                                          if (unassociatedCompanies.length === 0) {
                                            return (
                                              <SelectItem value="all-associated" disabled>
                                                Todas as empresas já foram associadas
                                              </SelectItem>
                                            );
                                          }

                                          return unassociatedCompanies.map((company: any) => (
                                            <SelectItem key={`available-company-${company.id}`} value={String(company.id)}>
                                              {company.displayName || company.display_name || company.name || `Empresa ${company.id}`}
                                              {company.cnpj && ` (${company.cnpj})`}
                                            </SelectItem>
                                          ));
                                        })()}
                                      </SelectContent>
                                    </Select>
                            </FormItem>

                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddCompany}
                              disabled={!selectedCompanyId || selectedCompanyId === 'no-companies' || selectedCompanyId === 'all-associated'}
                              title={!selectedCompanyId ? "Selecione uma empresa primeiro" : "Associar empresa"}
                            >
                              <Plus className="h-4 w-4" />
                              Associar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!customer?.id && (
                      <div className="text-center py-8">
                        <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                          Gerenciar Empresas
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Associe este cliente a empresas do sistema após salvá-lo.
                        </p>
                        <p className="text-sm text-amber-600">
                          💡 Salve o cliente primeiro para gerenciar empresas
                        </p>
                      </div>
                    )}
                  </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Salvando...' : customer?.id ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Location Manager Modal */}
      {customer?.id && (
        <CustomerLocationManager
          customerId={customer.id}
          isOpen={showLocationManager}
          onClose={() => setShowLocationManager(false)}
          onAddNewLocation={handleNewLocationClick}
        />
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          // Invalidate locations query to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
        }}
      />
    </>
  );
}