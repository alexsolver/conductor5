import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// import useLocalization from "@/hooks/useLocalization";
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
    onError: (error: any) => {
      console.error('❌ [Tickets] API Error:', error);
      toast({
        title: t('tickets.messages.error_loading'),
        description: t('tickets.messages.error_loading'),
        variant: "destructive",
      });
    },
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

  console.log('[TRANSLATION_NEEDED]', { customersData, customers: customers.length });

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
        const response = await apiRequest("GET", "/customers`);
        const data = await response.json();

        console.log('Company customers response:', data);

        if (data.success && data.customers) {
          setFilteredCustomers(data.customers);
        } else {
          console.warn('No customers found for company, using all customers');
          setFilteredCustomers(customers);
        }
      } catch (error) {
        console.error('[TRANSLATION_NEEDED]', error);
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
        title: t('common.save'),
        description: t('tickets.messages.created_success'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t('tickets.messages.error_creating'),
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
      company_id: data.companyId,
      
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
      <div className=""
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className=""
          {[1, 2, 3].map((i) => (
            <Card key={i} className=""
              <CardContent className=""
                <div className=""
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className=""
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

  if (error) {
    return (
      <div className=""
        <div className=""
          <div>
            <h1 className=""
              '[TRANSLATION_NEEDED]'
            </h1>
            <p className=""
              {(error as any)?.message || t('common.error')}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className=""
            <div className=""
              <div className="text-lg font-medium mb-2">'[TRANSLATION_NEEDED]'</div>
              <p className="text-sm mb-4">'[TRANSLATION_NEEDED]'</p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                '[TRANSLATION_NEEDED]'
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse consistente dos dados de tickets seguindo Clean Architecture
  console.log('🎫 [Tickets] Raw API response:', tickets);
  
  const ticketsList = (() => {
    if (!tickets) {
      console.log('🎫 [Tickets] No tickets data received');
      return [];
    }
    
    // Standard Clean Architecture response structure
    if (tickets.success && tickets.data?.tickets && Array.isArray(tickets.data.tickets)) {
      console.log('🎫 [Tickets] Using standard Clean Architecture structure');
      return tickets.data.tickets;
    }
    
    // Legacy support for direct data property
    if (tickets.data?.tickets && Array.isArray(tickets.data.tickets)) {
      console.log('🎫 [Tickets] Using legacy data.tickets structure');
      return tickets.data.tickets;
    }
    
    // Direct tickets array (fallback)
    if (tickets.tickets && Array.isArray(tickets.tickets)) {
      console.log('🎫 [Tickets] Using direct tickets array');
      return tickets.tickets;
    }
    
    // Raw array (ultimate fallback)
    if (Array.isArray(tickets)) {
      console.log('🎫 [Tickets] Using raw array');
      return tickets;
    }
    
    console.warn('⚠️ [Tickets] Unexpected response structure:', tickets);
    console.warn('⚠️ [Tickets] Available keys:', Object.keys(tickets || {}));
    return [];
  })();
  
  const ticketsCount = ticketsList.length;
  
  console.log('🎫 [Tickets] Final parsed result:', {
    hasData: !!tickets,
    isSuccess: tickets?.success,
    dataKeys: tickets ? Object.keys(tickets) : [],
    ticketsCount,
    sampleTicket: ticketsList[0] || null
  });

  return (
    <div className=""
      <div className=""
        <div>
          <h1 className=""
            '[TRANSLATION_NEEDED]' ({ticketsCount})
          </h1>
          <p className=""
            '[TRANSLATION_NEEDED]'
          </p>
        </div>
        <div className=""
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className=""
                <Plus className="h-4 w-4 mr-2" />
                '[TRANSLATION_NEEDED]'
              </Button>
            </DialogTrigger>
              <DialogContent className=""
                <DialogHeader className=""
                  <DialogTitle>'[TRANSLATION_NEEDED]'</DialogTitle>
                </DialogHeader>
                <div className=""
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className=""
                  {/* Company Selection - Must be first */}
                    <FormField
                      control={form.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">'[TRANSLATION_NEEDED]' *</FormLabel>
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
                              <SelectTrigger className=""
                                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                              </SelectTrigger>
                            </FormControl>
                          <SelectContent>
                            {companies.length === 0 ? (
                              <SelectItem value="no-companies" disabled>
                                '[TRANSLATION_NEEDED]'
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
                          <FormLabel className="text-sm font-medium">'[TRANSLATION_NEEDED]' *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!selectedCompanyId}
                          >
                            <FormControl>
                              <SelectTrigger className=""
                                <SelectValue 
                                  placeholder={
                                    !selectedCompanyId 
                                      ? t('tickets.forms.create.first_select_company') 
                                      : t('tickets.forms.create.select_customer')
                                  } 
                                />
                              </SelectTrigger>
                            </FormControl>
                          <SelectContent>
                            {customersLoading ? (
                              <SelectItem value="loading" disabled>'[TRANSLATION_NEEDED]'</SelectItem>
                            ) : !selectedCompanyId ? (
                              <SelectItem value="no-company" disabled>
                                '[TRANSLATION_NEEDED]'
                              </SelectItem>
                            ) : filteredCustomers.length === 0 ? (
                              <SelectItem value="no-customers" disabled>
                                '[TRANSLATION_NEEDED]'
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
                                    if (firstName && lastName) return "
                                    if (firstName) return firstName;
                                    if (lastName) return lastName;
                                    if (name) return name;
                                    return customer.email || 'N/A';
                                  })()} 
                                  {customer.email && ")"
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
                        <FormLabel>'[TRANSLATION_NEEDED]'</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">'[TRANSLATION_NEEDED]'</SelectItem>
                            {favorecidos.map((favorecido: any) => (
                              <SelectItem key={favorecido.id} value={favorecido.id}>
                                {favorecido.name || favorecido.fullName || favorecido.full_name || "
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
                          <FormLabel className="text-sm font-medium">'[TRANSLATION_NEEDED]' *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder='[TRANSLATION_NEEDED]' 
                              className="h-10"
                              {...field} 
                            />
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
                        <FormLabel>'[TRANSLATION_NEEDED]' *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategoryId(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
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
                        <FormLabel>'[TRANSLATION_NEEDED]' *</FormLabel>
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
                              <SelectValue placeholder={!selectedCategoryId ? t('tickets.forms.create.first_select_category') : t('tickets.forms.create.select_subcategory')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedCategoryId ? (
                              <SelectItem value="no-category" disabled>'[TRANSLATION_NEEDED]'</SelectItem>
                            ) : subcategories.length === 0 ? (
                              <SelectItem value="no-subcategories" disabled>'[TRANSLATION_NEEDED]'</SelectItem>
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
                        <FormLabel>'[TRANSLATION_NEEDED]' *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedSubcategoryId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedSubcategoryId ? t('tickets.forms.create.first_select_subcategory') : t('tickets.forms.create.select_action')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedSubcategoryId ? (
                              <SelectItem value="no-subcategory" disabled>'[TRANSLATION_NEEDED]'</SelectItem>
                            ) : actions.length === 0 ? (
                              <SelectItem value="no-actions" disabled>'[TRANSLATION_NEEDED]'</SelectItem>
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

                  <div className=""
                    {/* 8. PRIORIDADE */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>'[TRANSLATION_NEEDED]' *</FormLabel>
                          <FormControl>
                            <DynamicSelect
                              fieldName="priority"
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder='[TRANSLATION_NEEDED]'
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
                          <FormLabel>'[TRANSLATION_NEEDED]' *</FormLabel>
                          <FormControl>
                            <DynamicSelect
                              fieldName="urgency"
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder='[TRANSLATION_NEEDED]'
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
                          <FormLabel className="text-sm font-medium">'[TRANSLATION_NEEDED]' *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='[TRANSLATION_NEEDED]'
                              className="min-h-[80px] max-h-[120px] resize-none"
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
                          <FormLabel className="text-sm font-medium">'[TRANSLATION_NEEDED]'</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='[TRANSLATION_NEEDED]'
                              className="min-h-[60px] max-h-[100px] resize-none"
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
                          <FormLabel className="text-sm font-medium">'[TRANSLATION_NEEDED]'</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='[TRANSLATION_NEEDED]'
                              className="min-h-[60px] max-h-[100px] resize-none"
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
                          <FormLabel className="text-sm font-medium">'[TRANSLATION_NEEDED]'</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='[TRANSLATION_NEEDED]'
                              className="min-h-[60px] max-h-[100px] resize-none"
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
                        <FormLabel>'[TRANSLATION_NEEDED]'</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">'[TRANSLATION_NEEDED]'</SelectItem>
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

                  </form>
                  </Form>
                </div>
                <div className=""
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    '[TRANSLATION_NEEDED]'
                  </Button>
                  <Button
                    type="button"
                    onClick={form.handleSubmit(onSubmit)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={createTicketMutation.isPending}
                  >
                    {createTicketMutation.isPending ? t('tickets.actions.creating') : t('tickets.actions.create')}
                  </Button>
                </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sistema de Visualizações de Tickets */}
      <div className=""
        <TicketViewSelector 
          currentViewId={currentViewId}
          onViewChange={handleViewChange}
        />
      </div>

      <div className=""
        {Array.isArray(ticketsList) && ticketsList.length > 0 ? (
          ticketsList.map((ticket: any) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("
            <CardContent className=""
              <div className=""
                <div className=""
                  <div className=""
                    <h3 className=""
                      #{ticket.number || ticket.id} - {ticket.subject || 'Sem título'}
                    </h3>
                    <div className=""
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
                  
                  <div className=""
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
                  <p className=""
                    {ticket.description ? 
                      (ticket.description.length > 150 ? 
                        ticket.description.substring(0, 150) + '...' : 
                        ticket.description
                      ).replace(/<[^>]*>/g, '') : 
                      'Sem descrição disponível'
                    }
                  </p>
                  <div className=""
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
                    navigate("
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
            <CardContent className=""
              <div className=""
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