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

export default function TicketsTable() {
  const { t } = useTranslation();
  const { formatDate } = useLocalization();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentViewId, setCurrentViewId] = useState<string | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { getFieldColor, getFieldLabel, isLoading: colorsLoading } = useFieldColors();

  // Mapeamento de valores em inglês para português para compatibilidade com configurações
  const statusMapping: Record<string, string> = {
    'new': 'novo',
    'open': 'aberto', 
    'in_progress': 'em_andamento',
    'in progress': 'em_andamento',
    'resolved': 'resolvido',
    'closed': 'fechado',
    'cancelled': 'cancelado'
  };

  const priorityMapping: Record<string, string> = {
    'low': 'low',
    'medium': 'medium', 
    'high': 'high',
    'critical': 'critical'
  };

  // Funções de mapeamento
  const mapStatusValue = (value: string): string => {
    if (!value) return 'novo';
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

  // Force token setup - DEBUG ONLY
  useEffect(() => {
    const checkAndSetToken = async () => {
      let token = localStorage.getItem('accessToken');
      console.log('🔐 Current token in localStorage:', token ? 'EXISTS' : 'NOT_FOUND');
      
      if (!token) {
        console.log('🔄 No token found, attempting login...');
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@conductor.com', password: 'admin123' })
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            console.log('✅ Token set in localStorage');
            queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
          }
        } catch (error) {
          console.error('❌ Login failed:', error);
        }
      }
    };
    
    checkAndSetToken();
  }, [queryClient]);

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ["/api/tickets"],
    retry: false,
  });

  // Fetch customers for the dropdown
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response.json();
    },
    retry: false,
  });

  // Fetch companies using the existing hook
  const { companies } = useCompanyFilter();

  // Fetch locations for location dropdown
  const { data: locationsData } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations");
      return response.json();
    },
    retry: false,
  });

  // Fetch beneficiaries for dropdown
  const { data: beneficiariesData } = useQuery({
    queryKey: ["/api/favorecidos"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/favorecidos");
      return response.json();
    },
    retry: false,
  });

  const customers = customersData?.customers || customersData?.data || [];
  const locations = locationsData?.data || [];
  const beneficiaries = beneficiariesData?.data || [];

  console.log('Companies from hook:', companies);
  console.log('Customers data structure:', customersData);
  console.log('Locations data structure:', locationsData);
  console.log('Beneficiaries data structure:', beneficiariesData);

  // Form initialization
  const form = useForm<NewTicketModalData>({
    resolver: zodResolver(newTicketModalSchema),
    defaultValues: {
      companyId: "",
      customerId: "",
      subject: "",
      description: "",
      priority: "medium",
      urgency: "medium",
      category: "",
      subcategory: "",
      action: "",
      beneficiaryId: "",
      location: "",
      symptoms: "",
      businessImpact: "",
      workaround: ""
    },
  });

  // State for filtering customers by company
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // Filter customers when company changes
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
    
    // Transform data to match backend API format
    const ticketData = {
      customerId: data.customerId,
      companyId: data.companyId,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      urgency: data.urgency,
      category: data.category,
      subcategory: data.subcategory,
      action: data.action,
      beneficiaryId: data.beneficiaryId || null,
      location: data.location,
      symptoms: data.symptoms || null,
      businessImpact: data.businessImpact || null,
      workaround: data.workaround || null,
      callerId: data.customerId, // Map to backend field
      customerCompanyId: data.companyId, // Map to backend field
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

  if (isLoading || colorsLoading) {
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Parse consistente dos dados de tickets
  const ticketsList = (tickets as any)?.data?.tickets || [];
  const ticketsCount = Array.isArray(ticketsList) ? ticketsList.length : 0;

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

                  {/* Customer/Solicitante Selection - Filtered by Company */}
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
                                    : "Selecione o cliente/solicitante"
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
                            <SelectItem value="">Nenhum favorecido</SelectItem>
                            {beneficiaries.map((beneficiary: any) => (
                              <SelectItem key={beneficiary.id} value={beneficiary.id}>
                                {beneficiary.nome || beneficiary.name || 'Favorecido sem nome'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 4. ASSUNTO */}
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Assunto *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite o assunto/título do ticket"
                            {...field} 
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 5. CATEGORIA - 6. SUBCATEGORIA - 7. AÇÃO */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria *</FormLabel>
                          <FormControl>
                            <DynamicSelect
                              fieldName="category"
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Categoria"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategoria</FormLabel>
                          <FormControl>
                            <DynamicSelect
                              fieldName="subcategory"
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Subcategoria"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="action"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ação</FormLabel>
                          <FormControl>
                            <DynamicSelect
                              fieldName="action"
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Ação"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 8. PRIORIDADE - 9. URGÊNCIA */}
                  <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="">Nenhum local específico</SelectItem>
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
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      #{ticket.number || ticket.id} - {ticket.subject || 'Sem título'}
                    </h3>
                    <DynamicBadge 
                      fieldName="priority" 
                      value={mapPriorityValue(ticket.priority)}
                      colorHex={getFieldColor('priority', mapPriorityValue(ticket.priority))}
                    >
                      {getFieldLabel('priority', mapPriorityValue(ticket.priority))}
                    </DynamicBadge>
                    <DynamicBadge 
                      fieldName="status" 
                      value={mapStatusValue(ticket.status)}
                      colorHex={getFieldColor('status', mapStatusValue(ticket.status))}
                    >
                      {getFieldLabel('status', mapStatusValue(ticket.status))}
                    </DynamicBadge>
                    <DynamicBadge 
                      fieldName="category" 
                      value={mapCategoryValue(ticket.category)}
                      colorHex={getFieldColor('category', mapCategoryValue(ticket.category))}
                    >
                      {getFieldLabel('category', mapCategoryValue(ticket.category))}
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
                  Criar primeiro ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}