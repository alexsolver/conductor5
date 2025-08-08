import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, RefreshCcw, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DynamicBadge } from '@/components/DynamicBadge';
import { TicketViewSelector } from '@/components/TicketViewSelector';
import { useNavigate } from 'react-router-dom';
import { validateTicketForm } from '@shared/ticket-validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalization } from "@/hooks/useLocalization";
import { useFieldColors } from "@/hooks/useFieldColors";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { NewTicketModalData, newTicketModalSchema } from "../../../shared/ticket-validation";


// Memoized Ticket Table Row Component
const TicketTableRow = React.memo(({ ticket, onViewTicket }) => {
  const { t } = useTranslation();
  const { formatDate } = useLocalization();

  const mapStatusValue = (value) => {
    if (!value) return 'new';
    const statusMapping = {
      'new': 'new', 'open': 'open', 'in_progress': 'in_progress', 'in progress': 'in_progress',
      'resolved': 'resolved', 'closed': 'closed', 'cancelled': 'cancelled'
    };
    return statusMapping[value.toLowerCase()] || value;
  };

  const mapPriorityValue = (value) => {
    if (!value) return 'medium';
    const priorityMapping = { 'low': 'low', 'medium': 'medium', 'high': 'high', 'critical': 'critical' };
    return priorityMapping[value.toLowerCase()] || value;
  };

  const mapCategoryValue = (value) => {
    if (!value || value === null || value === 'null' || value === '' || typeof value !== 'string') {
      return 'suporte_tecnico';
    }
    const categoryMapping = {
      'hardware': 'infraestrutura', 'software': 'suporte_tecnico', 'network': 'infraestrutura',
      'access': 'suporte_tecnico', 'other': 'suporte_tecnico', 'technical_support': 'suporte_tecnico',
      'customer_service': 'atendimento_cliente', 'financial': 'financeiro', 'infrastructure': 'infraestrutura'
    };
    return categoryMapping[value.toLowerCase()] || 'suporte_tecnico';
  };

  return (
    <TableRow
      key={ticket.id}
      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={() => onViewTicket(ticket.id)}
    >
      <TableCell className="font-medium">
        {ticket.number || ticket.id}
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="truncate" title={ticket.subject || 'Sem título'}>
          {ticket.subject || 'Sem título'}
        </div>
      </TableCell>
      <TableCell>
        <DynamicBadge
          fieldName="status"
          value={mapStatusValue(ticket.status)}
          showIcon={true}
          className="font-medium"
          size="sm"
        />
      </TableCell>
      <TableCell>
        <DynamicBadge
          fieldName="priority"
          value={mapPriorityValue(ticket.priority)}
          showIcon={true}
          className="font-medium"
          size="sm"
        />
      </TableCell>
      <TableCell>
        {ticket.customer_name || 'N/A'}
      </TableCell>
      <TableCell>
        {ticket.assigned_to_name || 'Não atribuído'}
      </TableCell>
      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
        {formatDate(ticket.created_at || ticket.opened_at)}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewTicket(ticket.id);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

TicketTableRow.displayName = 'TicketTableRow';


export default function Tickets() {
  const { t } = useTranslation();
  const { formatDate } = useLocalization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { getFieldColor, getFieldLabel, isLoading: isFieldColorsLoading, isReady } = useFieldColors();
  const { user } = useAuth(); // Assuming useAuth provides user context

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentViewId, setCurrentViewId] = useState(undefined);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });

  // Status mapping - manter valores em inglês conforme banco de dados
  const statusMapping = useMemo(() => ({
    'new': 'new', 'open': 'open', 'in_progress': 'in_progress', 'in progress': 'in_progress',
    'resolved': 'resolved', 'closed': 'closed', 'cancelled': 'cancelled'
  }), []);

  const priorityMapping = useMemo(() => ({
    'low': 'low', 'medium': 'medium', 'high': 'high', 'critical': 'critical'
  }), []);

  const mapStatusValue = useCallback((value) => {
    if (!value) return 'new';
    return statusMapping[value.toLowerCase()] || value;
  }, [statusMapping]);

  const mapPriorityValue = useCallback((value) => {
    if (!value) return 'medium';
    return priorityMapping[value.toLowerCase()] || value;
  }, [priorityMapping]);

  const categoryMapping = useMemo(() => ({
    'hardware': 'infraestrutura', 'software': 'suporte_tecnico', 'network': 'infraestrutura',
    'access': 'suporte_tecnico', 'other': 'suporte_tecnico', 'technical_support': 'suporte_tecnico',
    'customer_service': 'atendimento_cliente', 'financial': 'financeiro', 'infrastructure': 'infraestrutura'
  }), []);

  const mapCategoryValue = useCallback((value) => {
    if (!value || value === null || value === 'null' || value === '' || typeof value !== 'string') {
      return 'suporte_tecnico';
    }
    const mapped = categoryMapping[value.toLowerCase()] || 'suporte_tecnico';
    return mapped;
  }, [categoryMapping]);

  // Fetch tickets with filters and error handling
  const fetchTickets = async () => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    // Add other filters as needed

    const response = await apiRequest("GET", `/api/tickets?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const { data: ticketsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: fetchTickets,
    staleTime: 30000, // 30 seconds
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  const tickets = ticketsData?.data?.tickets || [];
  const ticketsCount = tickets.length;

  // Memoized filter handler
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Memoized search handler with debounce
  const handleSearchChange = useCallback((searchTerm) => {
    const debounceTimer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, []);


  // Fetch customers for the dropdown
  const { data: customersData, isLoading: customersLoading, isError: customersError } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch companies for filtering
  const { data: companiesData, isError: companiesError } = useQuery({
    queryKey: ["/api/customers/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
    retry: false,
  });

  // Fetch users for assignment
  const { data: usersData, isError: usersError } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tenant-admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    retry: false,
  });

  // Fetch favorecidos (beneficiaries)
  const { data: favorecidosData, isError: favorecidosError } = useQuery({
    queryKey: ["/api/beneficiaries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/beneficiaries");
      if (!response.ok) throw new Error("Failed to fetch beneficiaries");
      return response.json();
    },
    retry: false,
  });

  // Fetch locations
  const { data: locationsData, isError: locationsError } = useQuery({
    queryKey: ["/api/locations-new/local"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations-new/local");
      if (!response.ok) throw new Error("Failed to fetch locations");
      return response.json();
    },
    retry: false,
  });

  // Fetch hierarchical categories
  const { data: categoriesData, isError: categoriesError } = useQuery({
    queryKey: ["/api/ticket-hierarchy/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ticket-hierarchy/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
    retry: false,
  });

  // Fetch subcategories based on selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const { data: subcategoriesData, isError: subcategoriesError } = useQuery({
    queryKey: ["/api/ticket-hierarchy/subcategories", selectedCategoryId],
    enabled: !!selectedCategoryId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ticket-hierarchy/subcategories?category_id=${selectedCategoryId}`);
      if (!response.ok) throw new Error("Failed to fetch subcategories");
      return response.json();
    },
    retry: false,
  });

  // Fetch actions based on selected subcategory
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const { data: actionsData, isError: actionsError } = useQuery({
    queryKey: ["/api/ticket-hierarchy/actions", selectedSubcategoryId],
    enabled: !!selectedSubcategoryId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ticket-hierarchy/actions?subcategory_id=${selectedSubcategoryId}`);
      if (!response.ok) throw new Error("Failed to fetch actions");
      return response.json();
    },
    retry: false,
  });

  // Extract customers with proper error handling
  const customers = customersData?.customers || [];

  // Filter companies directly removing Default if inactive
  const rawCompanies = companiesData || [];
  const companies = useMemo(() => {
    return rawCompanies
      .filter((company) => {
        const isDefaultCompany = company.name?.toLowerCase().includes('default');
        if (isDefaultCompany && (company.status === 'inactive' || company.is_active === false)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.name || a.displayName || '').localeCompare(b.name || b.displayName || ''));
  }, [rawCompanies]);

  const users = usersData?.users || [];
  const favorecidos = favorecidosData?.data?.beneficiaries || favorecidosData?.favorecidos || [];
  const locations = locationsData?.data?.locations || locationsData?.data || [];
  const categories = categoriesData?.data || [];
  const subcategories = subcategoriesData?.data || [];
  const actions = actionsData?.data || [];

  // Form setup with new schema
  const form = useForm({
    resolver: zodResolver(newTicketModalSchema),
    defaultValues: {
      companyId: "",
      customerId: "",
      beneficiaryId: "",
      subject: "",
      category: "",
      subcategory: "",
      action: "",
      priority: "medium",
      urgency: "medium",
      description: "",
      symptoms: "",
      businessImpact: "",
      workaround: "",
      location: "",
      assignmentGroup: "", // Added assignmentGroup
    },
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Filter customers based on selected company
  useEffect(() => {
    if (!selectedCompanyId) {
      setFilteredCustomers(customers);
      return;
    }

    const fetchCustomersForCompany = async () => {
      try {
        const response = await apiRequest("GET", `/api/companies/${selectedCompanyId}/customers`);
        if (!response.ok) throw new Error("Failed to fetch customers for company");
        const data = await response.json();

        if (data.success && data.customers) {
          setFilteredCustomers(data.customers);
        } else {
          setFilteredCustomers(customers); // Fallback
        }
      } catch (error) {
        console.error('Error fetching customers for company:', error);
        setFilteredCustomers(customers); // Fallback on error
      }
    };

    fetchCustomersForCompany();
  }, [selectedCompanyId, customers]);

  // Reset subcategory and action when category changes
  useEffect(() => {
    form.setValue("subcategory", "");
    form.setValue("action", "");
    setSelectedSubcategoryId("");
    if (selectedCategoryId) {
      // Fetch subcategories when category changes
    }
  }, [selectedCategoryId, form]);

  // Reset action when subcategory changes
  useEffect(() => {
    form.setValue("action", "");
    if (selectedSubcategoryId) {
      // Fetch actions when subcategory changes
    }
  }, [selectedSubcategoryId, form]);

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      // Map form data to backend expected format
      const ticketData = {
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        urgency: data.urgency,
        category: data.category,
        subcategory: data.subcategory,
        action: data.action,
        caller_id: data.customerId,
        beneficiary_id: data.beneficiaryId === "__none__" ? null : data.beneficiaryId,
        customer_company_id: data.companyId,
        location: data.location === "__none__" ? null : data.location,
        symptoms: data.symptoms || null,
        business_impact: data.businessImpact || null,
        workaround: data.workaround || null,
        assignment_group_id: data.assignmentGroup, // Assuming assignmentGroup maps to assignment_group_id
      };

      const response = await apiRequest("POST", "/api/tickets", ticketData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao criar ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Ticket criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["tickets", filters] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); // Assuming this is relevant
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar ticket.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    console.log('Submitting ticket data:', data);
    createTicketMutation.mutate(data);
  };

  const handleViewTicket = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleViewChange = (viewId) => {
    setCurrentViewId(viewId);
    // Logic to apply filters or columns based on the view
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando tickets...</p>
          <div className="mt-2 text-sm text-gray-400">
            Aguarde enquanto carregamos os dados
          </div>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Erro ao carregar tickets</p>
              <p className="text-sm">
                {error?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
              </p>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
                            form.setValue("customerId", ""); // Reset customer
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecione uma empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companiesError ? (
                              <SelectItem value="error" disabled>Erro ao carregar empresas</SelectItem>
                            ) : companies.length === 0 ? (
                              <SelectItem value="no-companies" disabled>Nenhuma empresa encontrada</SelectItem>
                            ) : (
                              companies.map((company) => (
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

                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Cliente *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedCompanyId || customersLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue
                                placeholder={
                                  !selectedCompanyId ? "Primeiro selecione uma empresa"
                                  : customersLoading ? "Carregando clientes..."
                                  : "Selecione o cliente"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedCompanyId ? (
                              <SelectItem value="no-company" disabled>Selecione uma empresa primeiro</SelectItem>
                            ) : customersLoading ? (
                              <SelectItem value="loading" disabled>Carregando clientes...</SelectItem>
                            ) : filteredCustomers.length === 0 ? (
                              <SelectItem value="no-customers" disabled>Nenhum cliente encontrado para esta empresa</SelectItem>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name || customer.fullName || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email}
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
                            {favorecidos.map((favorecido) => (
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
                            {categoriesError ? (
                              <SelectItem value="error" disabled>Erro ao carregar categorias</SelectItem>
                            ) : categories.length === 0 ? (
                              <SelectItem value="no-categories" disabled>Nenhuma categoria encontrada</SelectItem>
                            ) : (
                              categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                          disabled={!selectedCategoryId || subcategoriesError}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedCategoryId ? "Primeiro selecione uma categoria" : subcategoriesError ? "Erro ao carregar subcategorias" : "Selecione a subcategoria"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedCategoryId ? (
                              <SelectItem value="no-category" disabled>Selecione uma categoria primeiro</SelectItem>
                            ) : subcategoriesError ? (
                              <SelectItem value="error" disabled>Erro ao carregar subcategorias</SelectItem>
                            ) : subcategories.length === 0 ? (
                              <SelectItem value="no-subcategories" disabled>Nenhuma subcategoria encontrada</SelectItem>
                            ) : (
                              subcategories.map((subcategory) => (
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

                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ação *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedSubcategoryId || actionsError}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedSubcategoryId ? "Primeiro selecione uma subcategoria" : actionsError ? "Erro ao carregar ações" : "Selecione a ação"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedSubcategoryId ? (
                              <SelectItem value="no-subcategory" disabled>Selecione uma subcategoria primeiro</SelectItem>
                            ) : actionsError ? (
                              <SelectItem value="error" disabled>Erro ao carregar ações</SelectItem>
                            ) : actions.length === 0 ? (
                              <SelectItem value="no-actions" disabled>Nenhuma ação encontrada</SelectItem>
                            ) : (
                              actions.map((action) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              options={[{ value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' }, { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' }]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              options={[{ value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' }, { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' }]}
                            />
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
                            {locationsError ? (
                              <SelectItem value="error" disabled>Erro ao carregar locais</SelectItem>
                            ) : locations.length === 0 ? (
                              <SelectItem value="no-locations" disabled>Nenhum local encontrado</SelectItem>
                            ) : (
                              locations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name || location.nome}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Assignment Group - Example field, adjust as needed */}
                  <FormField
                    control={form.control}
                    name="assignmentGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo de Atribuição</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o grupo de atribuição (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Nenhum</SelectItem>
                              {users.map((user) => ( // Assuming users can represent assignment groups or fetch actual groups
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name || user.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
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

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full md:w-auto">
          <Input
            placeholder="Buscar por assunto, descrição ou ID..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          <TicketViewSelector
            currentViewId={currentViewId}
            onViewChange={handleViewChange}
          />
          {/* Add Filter component here if needed */}
          <Button variant="outline" className="flex items-center gap-1">
            <Filter className="h-4 w-4" /> Filtrar
          </Button>
          <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCcw className="h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">📋 Nenhum ticket encontrado</div>
                <p className="text-sm mb-4">
                  Não há tickets que correspondam aos seus filtros atuais.
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Ticket
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead className="max-w-xs">Assunto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Atribuído a</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TicketTableRow
                    key={ticket.id}
                    ticket={ticket}
                    onViewTicket={handleViewTicket}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}