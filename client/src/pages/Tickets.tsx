import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocalization } from "@/hooks/useLocalization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Filter } from "lucide-react";
import { DynamicSelect } from "@/components/DynamicSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useFieldColors } from "@/hooks/useFieldColors";
import { TicketViewSelector } from "@/components/TicketViewSelector";
import { useLocation } from "wouter";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

import { NewTicketModalData, newTicketModalSchema } from "../../../shared/ticket-validation";

export default function Tickets() {
  const { t } = useTranslation();
  const { formatDate } = useLocalization();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentViewId, setCurrentViewId] = useState<string | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { getFieldColor, getFieldLabel, isLoading: isFieldColorsLoading, isReady } = useFieldColors();

  // Status mapping - manter valores em inglês conforme banco de dados 
  const statusMapping: Record<string, string> = {
    'new': 'new',
    'open': 'open', 
    'in_progress': 'in_progress',
    'in progress': 'in_progress',
    'resolved': 'resolved',
    'closed': 'closed',
    'cancelled': 'cancelled'
  };

  const priorityMapping: Record<string, string> = {
    'low': 'low',
    'medium': 'medium', 
    'high': 'high',
    'critical': 'critical'
  };

  // Funções de mapeamento
  const mapStatusValue = (value: string): string => {
    if (!value) return 'new';
    return statusMapping[value.toLowerCase()] || value;
  };

  const mapPriorityValue = (value: string): string => {
    if (!value) return 'medium';
    return priorityMapping[value.toLowerCase()] || value;
  };

  const categoryMapping: Record<string, string> = {
    'hardware': 'infraestrutura',
    'software': 'suporte_tecnico', 
    'network': 'infraestrutura',
    'access': 'suporte_tecnico',
    'other': 'suporte_tecnico',
    'technical_support': 'suporte_tecnico',
    'customer_service': 'atendimento_cliente',
    'financial': 'financeiro',
    'infrastructure': 'infraestrutura'
  };

  const mapCategoryValue = (value: string): string => {
    if (!value || value === null || value === 'null' || value === '' || typeof value !== 'string') {
      return 'suporte_tecnico';
    }
    const mapped = categoryMapping[value.toLowerCase()] || 'suporte_tecnico';
    return mapped;
  };

  // Token management handled by auth hook
  // Remove debug code for production

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ["/api/tickets"],
    retry: false,
  });

  // Fetch customers for the dropdown
  const { data: customersData, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch companies for filtering
  const { data: companiesData } = useQuery({
    queryKey: ["/api/customers/companies"],
    retry: false,
  });

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
    retry: false,
  });

  // Fetch favorecidos (beneficiaries)
  const { data: favorecidosData } = useQuery({
    queryKey: ["/api/beneficiaries"],
    retry: false,
  });

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ["/api/locations-new/local"],
    retry: false,
  });

  // Fetch hierarchical categories 
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/ticket-hierarchy/categories"],
    retry: false,
  });

  // Fetch subcategories based on selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const { data: subcategoriesData } = useQuery({
    queryKey: ["/api/ticket-hierarchy/subcategories", selectedCategoryId],
    enabled: !!selectedCategoryId,
    retry: false,
  });

  // Fetch actions based on selected subcategory
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const { data: actionsData } = useQuery({
    queryKey: ["/api/ticket-hierarchy/actions", selectedSubcategoryId],
    enabled: !!selectedSubcategoryId,
    retry: false,
  });

  // Extract customers with proper error handling
  const customers = Array.isArray(customersData?.customers) ? customersData.customers : [];
  
  // Handle customer loading errors
  if (customersData?.error || customersError) {
    console.error('Customer loading error:', customersData?.error || customersError);
  }

  // Get raw companies and filter out Default if inactive
  const rawCompanies = Array.isArray(companiesData) ? companiesData : [];

  // Filter companies directly removing Default if inactive
  const companies = rawCompanies
    .filter((company: any) => {
      // Remove Default company if it's inactive
      const isDefaultCompany = company.name?.toLowerCase().includes('default');
      if (isDefaultCompany && (company.status === 'inactive' || company.is_active === false)) {
        console.log('🚫 Filtering out Default company (inactive):', company);
        return false;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      return (a.name || a.displayName || '').localeCompare(b.name || b.displayName || '');
    });

  // Debug: Check if Default company is in the list
  console.log('🔍 Final companies list for ticket modal:', companies.map(c => ({
    id: c.id, 
    name: c.name, 
    status: c.status,
    isActive: c.is_active,
    isDefault: c.name?.toLowerCase().includes('default')
  })));

  console.log('🔍 Raw companies from API before filtering:', rawCompanies.length);
  console.log('🔍 Filtered companies for dropdown:', companies.length);

  // Additional debug for Default company filtering
  const defaultCompany = rawCompanies.find((c: any) => c.name?.toLowerCase().includes('default'));
  if (defaultCompany) {
    console.log('🎯 Default company found in raw data:', defaultCompany);
    console.log('🎯 Default company status:', defaultCompany.status, 'is_active:', defaultCompany.is_active);
  } else {
    console.log('✅ No Default company in raw API data');
  }

  const users = (usersData as any)?.users || [];

  // Extract data for new modal fields with safe type checking
  const favorecidos = (favorecidosData as any)?.data?.beneficiaries || (favorecidosData as any)?.favorecidos || [];
  const locations = (locationsData as any)?.data?.locations || (locationsData as any)?.data || [];
  const categories = (categoriesData as any)?.data || [];
  const subcategories = (subcategoriesData as any)?.data || [];
  const actions = (actionsData as any)?.data || [];

  console.log('Customers data:', { customersData, customers: customers.length });

  // Form setup with new schema
  const form = useForm<NewTicketModalData>({
    resolver: zodResolver(newTicketModalSchema),
    defaultValues: {
      companyId: "",
      customerId: "",
      beneficiaryId: "",
      subject: "",
      category: "",
      subcategory: "",
      action: "",
      priority: "medium" as const,
      urgency: "medium" as const,
      description: "",
      symptoms: "",
      businessImpact: "",
      workaround: "",
      location: "",
    },
  });

  // Watch for company selection to filter customers
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      setSelectedSubcategoryId("");
      form.setValue("subcategory", "");
      form.setValue("action", "");
    }
  }, [selectedCategoryId]);

  // Reset action when subcategory changes  
  useEffect(() => {
    if (selectedSubcategoryId) {
      form.setValue("action", "");
    }
  }, [selectedSubcategoryId]);

  // Filter customers based on selected company
  useEffect(() => {
    if (!selectedCompanyId) {
      setFilteredCustomers(customers);
      return;
    }

    // Fetch customers for the selected company
    const fetchCustomersForCompany = async () => {
      try {
        console.log('Fetching customers for company:', selectedCompanyId);
        const response = await apiRequest("GET", `/api/companies/${selectedCompanyId}/customers`);
        const data = await response.json();

        console.log('Company customers response:', data);

        if (data.success && data.customers) {
          setFilteredCustomers(data.customers);
        } else {
          console.warn('No customers found for company, using all customers');
          setFilteredCustomers(customers);
        }
      } catch (error) {
        console.error('Error fetching customers for company:', error);
        // Fallback: use all customers if API fails
        setFilteredCustomers(customers);
      }
    };

    fetchCustomersForCompany();
  }, [selectedCompanyId, customers]);

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tickets", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ticket criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar ticket",
        variant: "destructive",
      });
    },
  });

  // Handle form submission  
  const onSubmit = (data: NewTicketModalData) => {
    console.log('🎫 New ticket form submitted:', data);

    // Standardized field mapping to backend
    const ticketData = {
      // Core fields
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      urgency: data.urgency,
      
      // Hierarchical classification
      category: data.category,
      subcategory: data.subcategory,
      action: data.action,
      
      // Person relationships (standardized)
      caller_id: data.customerId,
      beneficiary_id: data.beneficiaryId || null,
      customer_company_id: data.companyId,
      
      // Assignment
      assignment_group_id: data.assignmentGroup,
      
      // Location and context
      location: data.location,
      symptoms: data.symptoms || null,
      business_impact: data.businessImpact || null,
      workaround: data.workaround || null,
    };

    createTicketMutation.mutate(ticketData);
  };

  // Função para trocar visualização ativa
  const handleViewChange = (viewId: string) => {
    setCurrentViewId(viewId);
    console.log('Visualização alterada para:', viewId);
    // Aqui podemos adicionar lógica para aplicar filtros/colunas da visualização
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading || isFieldColorsLoading || !isReady) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Parse consistente dos dados de tickets
  // A API retorna { success: true, message: "...", data: [...] }
  let ticketsList: any[] = [];
  
  if (tickets && typeof tickets === 'object') {
    // Se tickets tem uma propriedade 'data'
    if (tickets.data && Array.isArray(tickets.data)) {
      ticketsList = tickets.data;
    }
    // Se tickets é diretamente um array
    else if (Array.isArray(tickets)) {
      ticketsList = tickets;
    }
    // Se tickets tem success e data
    else if (tickets.success && tickets.data && Array.isArray(tickets.data)) {
      ticketsList = tickets.data;
    }
  }
  
  const ticketsCount = ticketsList.length;
  
  // Debug para verificar estrutura dos dados
  console.log('TicketsTable - Detailed Data Analysis:', {
    ticketsError: error,
    isLoading,
    ticketsCount,
    ticketsListLength: ticketsList.length,
    ticketsListType: typeof ticketsList,
    isArray: Array.isArray(ticketsList),
    rawTicketsData: tickets,
    firstTicket: ticketsList[0]
  });

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tickets de Suporte ({ticketsCount})
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie e acompanhe solicitações de suporte ao cliente
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Ticket
              </Button>
            </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Ticket</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Company Selection - Must be first */}
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Empresa *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCompanyId(value);
                            // Reset customer selection when company changes
                            form.setValue("customerId", "");
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecione uma empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.length === 0 ? (
                              <SelectItem value="no-companies" disabled>
                                Nenhuma empresa encontrada
                              </SelectItem>
                            ) : (
                              companies.map((company: any) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name || company.company_name || company.displayName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Customer/Cliente Selection - Filtered by Company */}
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Cliente *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedCompanyId}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue 
                                placeholder={
                                  !selectedCompanyId 
                                    ? "Primeiro selecione uma empresa" 
                                    : "Selecione o cliente"
                                } 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customersLoading ? (
                              <SelectItem value="loading" disabled>Carregando clientes...</SelectItem>
                            ) : !selectedCompanyId ? (
                              <SelectItem value="no-company" disabled>
                                Selecione uma empresa primeiro
                              </SelectItem>
                            ) : filteredCustomers.length === 0 ? (
                              <SelectItem value="no-customers" disabled>
                                Nenhum cliente encontrado para esta empresa
                              </SelectItem>
                            ) : (
                              filteredCustomers.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {(() => {
                                    const firstName = customer.first_name || customer.firstName || '';
                                    const lastName = customer.last_name || customer.lastName || '';
                                    const fullName = customer.fullName || customer.full_name || '';
                                    const name = customer.name || '';
                                    
                                    if (fullName) return fullName;
                                    if (firstName && lastName) return `${firstName} ${lastName}`;
                                    if (firstName) return firstName;
                                    if (lastName) return lastName;
                                    if (name) return name;
                                    return customer.email || 'N/A';
                                  })()} 
                                  {customer.email && ` (${customer.email})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 3. FAVORECIDO */}
                  <FormField
                    control={form.control}
                    name="beneficiaryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favorecido</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o favorecido (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum favorecido</SelectItem>
                            {favorecidos.map((favorecido: any) => (
                              <SelectItem key={favorecido.id} value={favorecido.id}>
                                {favorecido.name || favorecido.fullName || favorecido.full_name || `${favorecido.first_name || ''} ${favorecido.last_name || ''}`.trim()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 4. ASSUNTO/TÍTULO */}
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Assunto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o assunto do ticket" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 5. CATEGORIA */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategoryId(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 6. SUB CATEGORIA */}
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub Categoria *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedSubcategoryId(value);
                          }} 
                          value={field.value}
                          disabled={!selectedCategoryId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedCategoryId ? "Primeiro selecione uma categoria" : "Selecione a subcategoria"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedCategoryId ? (
                              <SelectItem value="no-category" disabled>Selecione uma categoria primeiro</SelectItem>
                            ) : subcategories.length === 0 ? (
                              <SelectItem value="no-subcategories" disabled>Nenhuma subcategoria encontrada</SelectItem>
                            ) : (
                              subcategories.map((subcategory: any) => (
                                <SelectItem key={subcategory.id} value={subcategory.id}>
                                  {subcategory.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 7. AÇÃO */}
                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ação *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedSubcategoryId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedSubcategoryId ? "Primeiro selecione uma subcategoria" : "Selecione a ação"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedSubcategoryId ? (
                              <SelectItem value="no-subcategory" disabled>Selecione uma subcategoria primeiro</SelectItem>
                            ) : actions.length === 0 ? (
                              <SelectItem value="no-actions" disabled>Nenhuma ação encontrada</SelectItem>
                            ) : (
                              actions.map((action: any) => (
                                <SelectItem key={action.id} value={action.id}>
                                  {action.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* 8. PRIORIDADE */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade *</FormLabel>
                          <FormControl>
                            <DynamicSelect
                              fieldName="priority"
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Selecione a prioridade"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 9. URGÊNCIA */}
                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgência *</FormLabel>
                          <FormControl>
                            <DynamicSelect
                              fieldName="urgency"
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Selecione a urgência"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 10. DESCRIÇÃO DETALHADA */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Descrição Detalhada *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva detalhadamente o problema ou solicitação"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 11. SINTOMAS */}
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sintomas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva os sintomas observados (opcional)"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 12. IMPACTO NO NEGÓCIO */}
                  <FormField
                    control={form.control}
                    name="businessImpact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impacto no Negócio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o impacto no negócio (opcional)"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 13. SOLUÇÃO TEMPORÁRIA */}
                  <FormField
                    control={form.control}
                    name="workaround"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solução Temporária</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva alguma solução temporária aplicada (opcional)"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 14. LOCAL */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o local de atendimento (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum local específico</SelectItem>
                            {locations.map((location: any) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name || location.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending ? "Criando..." : "Criar Ticket"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sistema de Visualizações de Tickets */}
      <div className="mb-6">
        <TicketViewSelector 
          currentViewId={currentViewId}
          onViewChange={handleViewChange}
        />
      </div>

      <div className="space-y-4">
        {Array.isArray(ticketsList) && ticketsList.length > 0 ? (
          ticketsList.map((ticket: any) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mr-4">
                      #{ticket.number || ticket.id} - {ticket.subject || 'Sem título'}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <DynamicBadge 
                        fieldName="priority" 
                        value={mapPriorityValue(ticket.priority)}
                        showIcon={true}
                        className="font-medium"
                        size="sm"
                      >
                        {getFieldLabel('priority', ticket.priority || 'medium')}
                      </DynamicBadge>
                      <DynamicBadge 
                        fieldName="status" 
                        value={mapStatusValue(ticket.status)}
                        showIcon={true}
                        className="font-medium"
                        size="sm"
                      >
                        {getFieldLabel('status', ticket.status || 'open')}
                      </DynamicBadge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <DynamicBadge 
                      fieldName="category" 
                      value={mapCategoryValue(ticket.category)}
                      showIcon={false}
                      className="font-medium text-xs"
                      size="sm"
                    >
                      {getFieldLabel('category', ticket.category || 'suporte_tecnico')}
                    </DynamicBadge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {ticket.description ? 
                      (ticket.description.length > 150 ? 
                        ticket.description.substring(0, 150) + '...' : 
                        ticket.description
                      ).replace(/<[^>]*>/g, '') : 
                      'Sem descrição disponível'
                    }
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>ID: {ticket.id}</span>
                    <span>•</span>
                    <span>Criado: {formatDate(ticket.created_at || ticket.opened_at)}</span>
                    {ticket.assigned_to_id && (
                      <>
                        <span>•</span>
                        <span>Atribuído</span>
                      </>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tickets/${ticket.id}`);
                  }}
                >
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">📋 Nenhum ticket encontrado</div>
                <p className="text-sm mb-4">Não há tickets para exibir no momento.</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}