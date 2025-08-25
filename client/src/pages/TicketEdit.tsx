import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, Save, Link as LinkIcon, Link2, Trash2, Paperclip, MessageSquare, Mail, FileCheck, History, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";
import TicketHierarchyView from "@/components/tickets/TicketHierarchyView";
import AttachmentsModal from "@/components/tickets/AttachmentsModal";
import InternalActionModal from "@/components/tickets/InternalActionModal";
import EmailHistoryModal from "@/components/tickets/EmailHistoryModal";
import TicketHistoryModal from "@/components/tickets/TicketHistoryModal";
import ApprovalRequestModal from "@/components/tickets/ApprovalRequestModal";
import { DynamicSelect } from "@/components/DynamicSelect";
import { UserGroupSelect } from "@/components/ui/UserGroupSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useTicketMetadata } from "@/hooks/useTicketMetadata";
import { CustomFieldsWrapper } from "@/components/layout/CustomFieldsWrapper";

// Form schema - Dynamic schema will be generated from metadata
const baseTicketFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  callerId: z.string().min(1, "Caller is required"),
  callerType: z.string().optional(),
  beneficiaryId: z.string().optional(),
  beneficiaryType: z.string().optional(),
  assignedToId: z.string().optional(),
  assignmentGroup: z.string().optional(),
  location: z.string().optional(),
  contactType: z.string().optional(),
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Company relationship
  customerCompanyId: z.string().optional(),
  // Template/Environment fields - Fixed field names to match database
  environment: z.string().optional(),
  templateName: z.string().optional(),
  templateAlternative: z.string().optional(),
  callerNameResponsible: z.string().optional(),
  callType: z.string().optional(),
  callUrl: z.string().optional(),
  environmentError: z.string().optional(),
  callNumber: z.string().optional(),
  groupField: z.string().optional(),
  serviceVersion: z.string().optional(),
  summary: z.string().optional(),
  // Assignment/Publication fields - Fixed field names to match database
  publicationPriority: z.string().optional(),
  responsibleTeam: z.string().optional(),
  infrastructure: z.string().optional(),
  environmentPublication: z.string().optional(),
  closeToPublish: z.boolean().default(false),
});

type TicketFormData = z.infer<typeof baseTicketFormSchema>;

export default function TicketEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isInternalActionModalOpen, setIsInternalActionModalOpen] = useState(false);
  const [isEmailHistoryModalOpen, setIsEmailHistoryModalOpen] = useState(false);
  const [isTicketHistoryModalOpen, setIsTicketHistoryModalOpen] = useState(false);
  const [isApprovalRequestModalOpen, setIsApprovalRequestModalOpen] = useState(false);

  // Company filtering state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // Use metadata system
  const ticketMetadata = useTicketMetadata();
  const metadataLoading = false; // Simplified since metadata is not critical for this component

  // Fetch ticket data
  const { data: ticket, isLoading } = useQuery({
    queryKey: ["/api/tickets", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch customers for dropdowns
  const { data: customersData } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response.json();
    },
  });

  // Fetch companies for filtering
  const { data: companiesData } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/companies");
      return response.json();
    },
  });

  // Ensure customers is always an array
  const customers = Array.isArray(customersData?.customers) ? customersData.customers : [];
  
  // 🎯 [1QA-COMPLIANCE] Debug and fix companies data structure
  console.log('🔍 [TICKET-EDIT-DEBUG] companiesData raw:', companiesData);
  const companies = Array.isArray(companiesData) ? companiesData : [];
  console.log('✅ [TICKET-EDIT-DEBUG] companies processed:', companies.length, 'items');

  // Initialize company from ticket data
  useEffect(() => {
    if (ticket) {
      const companyId = ticket.customerCompanyId || ticket.company;
      if (companyId && companyId !== 'unspecified') {
        // Only set if it's different from current selection
        if (selectedCompanyId !== companyId) {
          setSelectedCompanyId(companyId);
        }
      }
    }
  }, [ticket]);

  // Filter customers based on selected company
  useEffect(() => {
    if (!selectedCompanyId) {
      setFilteredCustomers(customers);
      return;
    }

    // Filter customers by company association
    const fetchCustomersForCompany = async () => {
      try {
        console.log('TicketEdit: Fetching customers for company:', selectedCompanyId);
        const response = await apiRequest("GET", `/api/companies/${selectedCompanyId}/customers`);
        const data = await response.json();

        console.log('TicketEdit: Company customers response:', data);

        if (data.success && data.customers) {
          setFilteredCustomers(data.customers);
        } else {
          console.warn('TicketEdit: No customers found for company, using all customers');
          setFilteredCustomers(customers);
        }
      } catch (error) {
        console.error('Error fetching customers for company:', error);
        setFilteredCustomers(customers);
      }
    };

    fetchCustomersForCompany();
  }, [selectedCompanyId, customers]);

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json();
    },
  });

  // Form setup
  const form = useForm<TicketFormData>({
    resolver: zodResolver(baseTicketFormSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
      status: "open",
      category: "",
      subcategory: "",
      callerId: "",
      callerType: "customer",
      beneficiaryId: "",
      beneficiaryType: "customer",
      assignedToId: "",
      assignmentGroup: "",
      location: "",
      contactType: "email",
      businessImpact: "",
      symptoms: "",
      workaround: "",
      tags: [],
      // Company relationship
      customerCompanyId: "",
      // Template/Environment defaults
      environment: "",
      templateName: "",
      templateAlternative: "",
      callerNameResponsible: "",
      callType: "",
      callUrl: "",
      environmentError: "",
      callNumber: "",
      groupField: "",
      serviceVersion: "",
      summary: "",
      // Assignment/Publication defaults
      publicationPriority: "",
      responsibleTeam: "",
      infrastructure: "",
      environmentPublication: "",
      closeToPublish: false,
    },
  });

  // Update form when ticket data loads
  useEffect(() => {
    if (ticket) {
      form.reset({
        subject: ticket.subject || ticket.short_description || "",
        description: ticket.description || "",
        priority: ticket.priority || "medium",
        status: ticket.status || ticket.state || "open",
        category: ticket.category || "",
        subcategory: ticket.subcategory || "",
        callerId: ticket.caller_id || ticket.customer_id || "",
        callerType: ticket.caller_type || "customer",
        beneficiaryId: ticket.beneficiary_id || "",
        beneficiaryType: ticket.beneficiary_type || "customer",
        assignedToId: ticket.assigned_to_id || "",
        assignmentGroup: ticket.assignment_group || "",
        location: ticket.location || "",
        contactType: ticket.contact_type || "email",
        businessImpact: ticket.business_impact || "",
        symptoms: ticket.symptoms || "",
        workaround: ticket.workaround || "",
        tags: ticket.tags || [],
      // Company relationship
        customerCompanyId: ticket.customerCompanyId || ticket.company || "",
        // Template/Environment values
        environment: ticket.environment || "",
        templateName: ticket.template_name || "",
        templateAlternative: ticket.template_alternative || "",
        callerNameResponsible: ticket.caller_name_responsible || "",
        callType: ticket.call_type || "",
        callUrl: ticket.call_url || "",
        environmentError: ticket.environment_error || "",
        callNumber: ticket.call_number || "",
        groupField: ticket.group_field || "",
        serviceVersion: ticket.service_version || "",
        summary: ticket.summary || "",
        // Assignment/Publication values
        publicationPriority: ticket.publication_priority || "",
        responsibleTeam: ticket.responsible_team || "",
        infrastructure: ticket.infrastructure || "",
        environmentPublication: ticket.environment_publication || "",
        closeToPublish: ticket.close_to_publish || false,
      });
    }
  }, [ticket, form]);

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/tickets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tickets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });
      navigate("/tickets");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    // Map frontend camelCase field names to backend snake_case
    const mappedData = {
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      status: data.status,
      category: data.category,
      subcategory: data.subcategory,
      caller_id: data.callerId,
      caller_type: data.callerType,
      beneficiary_id: data.beneficiaryId,
      beneficiary_type: data.beneficiaryType,
      assigned_to_id: data.assignedToId,
      assignment_group: data.assignmentGroup,
      location: data.location,
      contact_type: data.contactType,
      business_impact: data.businessImpact,
      symptoms: data.symptoms,
      workaround: data.workaround,
      tags: data.tags,
      // Company relationship
      company_id: selectedCompanyId || data.customerCompanyId,
      // Template/Environment fields
      environment: data.environment,
      template_name: data.templateName,
      template_alternative: data.templateAlternative,
      caller_name_responsible: data.callerNameResponsible,
      call_type: data.callType,
      call_url: data.callUrl,
      environment_error: data.environmentError,
      call_number: data.callNumber,
      group_field: data.groupField,
      service_version: data.serviceVersion,
      summary: data.summary,
      // Assignment/Publication fields
      publication_priority: data.publicationPriority,
      responsible_team: data.responsibleTeam,
      infrastructure: data.infrastructure,
      environment_publication: data.environmentPublication,
      close_to_publish: data.closeToPublish,
    };

    updateTicketMutation.mutate(mappedData);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este ticket?")) {
      deleteTicketMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Ticket não encontrado
        </h2>
        <Button onClick={() => navigate("/tickets")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Tickets
        </Button>
      </div>
    );
  }

  console.log("🎫 TicketEdit renderizando com ticket:", ticket?.id, "isLinkingModalOpen:", isLinkingModalOpen);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/tickets")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Editar Ticket #{ticket.number || ticket.id?.slice(-8)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ticket.subject || ticket.short_description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("🔗 Botão Vincular clicado!");
              setIsLinkingModalOpen(true);
            }}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            style={{ backgroundColor: '#dbeafe', borderColor: '#93c5fd', color: '#1d4ed8' }}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Vincular
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteTicketMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Ticket</CardTitle>
              <CardDescription>
                Edite as informações do ticket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Wrap form content in CustomFieldsWrapper to provide form context */}
                  <CustomFieldsWrapper
                    moduleType="tickets"
                    pageType="edit"
                    form={form}
                    hasDesignPermission={true}
                    onFieldChange={(fieldKey, value) => {
                      console.log(`Campo ${fieldKey} alterado:`, value);
                    }}
                  >
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="template">Template/Ambiente</TabsTrigger>
                      <TabsTrigger value="assignment">Atribuição</TabsTrigger>
                      <TabsTrigger value="classification">Classificação</TabsTrigger>
                      <TabsTrigger value="details">Detalhes</TabsTrigger>
                      <TabsTrigger value="people">Pessoas</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Basic Information */}
                    <TabsContent value="basic" className="space-y-4">
                      {/* Classificação */}
                      <div className="border-t pt-4 mt-6">
                        <h3 className="text-sm font-semibold text-gray-600 mb-4">CLASSIFICAÇÃO</h3>
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
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status *</FormLabel>
                                <FormControl>
                                  <DynamicSelect
                                    fieldName="status"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Selecione o status"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assunto</FormLabel>
                            <FormControl>
                              <Input placeholder="Descreva o problema brevemente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva o problema em detalhes"
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Tab 2: Template/Environment */}
                    <TabsContent value="template" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Environment Section */}
                        <div>
                          <FormField
                            control={form.control}
                            name="environment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ambiente:</FormLabel>
                                <FormControl>
                                  <DynamicSelect
                                    fieldName="environment"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Template Section */}
                        <div>
                          <FormField
                            control={form.control}
                            name="templateName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Template:</FormLabel>
                                <FormControl>
                                  <DynamicSelect
                                    fieldName="templateName"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Publicação - Infra"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Template Alternative */}
                        <div>
                          <FormField
                            control={form.control}
                            name="templateAlternative"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Template Alternativo:</FormLabel>
                                <FormControl>
                                  <DynamicSelect
                                    fieldName="templateAlternative"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Publicação - Infra"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Caller Name/Responsible */}
                        <div>
                          <FormField
                            control={form.control}
                            name="callerNameResponsible"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do responsável:</FormLabel>
                                <FormControl>
                                  <Input placeholder="giovanna" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Call Type */}
                        <div>
                          <FormField
                            control={form.control}
                            name="callType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Chamado:</FormLabel>
                                <FormControl>
                                  <DynamicSelect
                                    fieldName="callType"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Solicitação"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* URL Field */}
                        <FormField
                          control={form.control}
                          name="callUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL do pull request:</FormLabel>
                              <FormControl>
                                <Input placeholder="https://bitbucket.org/repositories/motormac-pdfs/pull-requests/117" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Environment Error */}
                        <FormField
                          control={form.control}
                          name="environmentError"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alteração no env:</FormLabel>
                              <FormControl>
                                <Input placeholder="não" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Call Number */}
                        <div>
                          <FormField
                            control={form.control}
                            name="callNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número do chamado/tarefa:</FormLabel>
                                <FormControl>
                                  <Input placeholder="401461" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Group */}
                        <div>
                          <FormField
                            control={form.control}
                            name="groupField"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grupo:</FormLabel>
                                <FormControl>
                                  <DynamicSelect
                                    fieldName="groupField"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Service Version */}
                        <div>
                          <FormField
                            control={form.control}
                            name="serviceVersion"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número da versão publicada:</FormLabel>
                                <FormControl>
                                  <Input placeholder="0.8" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        {/* Summary/Resume */}
                        <FormField
                          control={form.control}
                          name="summary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Resumo:</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="21822 - ajuste parâmetro do fim de trabalho"
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Tab 3: Assignment */}
                    <TabsContent value="assignment" className="space-y-4">
                      {/* Company Selection */}
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="block text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Empresa Cliente
                        </label>
                        <select
                          value={selectedCompanyId}
                          onChange={(e) => {
                            const newCompanyId = e.target.value;
                            setSelectedCompanyId(newCompanyId);
                            // Update form and reset customer selections
                            form.setValue("customerCompanyId", newCompanyId);
                            form.setValue("callerId", "");
                            form.setValue("beneficiaryId", "");
                          }}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Selecione uma empresa</option>
                          <option value="unspecified">Não especificado</option>
                          {companies.map((company: any) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        {selectedCompanyId && (
                          <p className="text-xs text-blue-600 mt-1">
                            Clientes filtrados por esta empresa: {filteredCustomers.length}
                          </p>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="callerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o cliente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredCustomers.map((customer: any) => (
                                  <SelectItem key={customer.id} value={customer.id || `customer-${customer.id}`}>
                                    {customer.first_name} {customer.last_name}
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
                        name="beneficiaryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beneficiário</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o beneficiário (opcional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {filteredCustomers.map((customer: any) => (
                                  <SelectItem key={customer.id} value={customer.id || `customer-${customer.id}`}>
                                    {customer.first_name} {customer.last_name}
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
                        name="assignmentGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grupo de Atribuição</FormLabel>
                            <FormControl>
                              <UserGroupSelect
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Selecione um grupo"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="assignedToId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Atribuído a</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um agente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="unassigned">Não atribuído</SelectItem>
                                {users.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.username}
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
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Localização</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: São Paulo - Matriz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Publication Priority */}
                        <FormField
                          control={form.control}
                          name="publicationPriority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prioridade da publicação:</FormLabel>
                              <FormControl>
                                <DynamicSelect
                                  fieldName="publicationPriority"
                                  value={field.value}
                                  onValueChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Responsible */}
                        <FormField
                          control={form.control}
                          name="responsibleTeam"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Responsável:</FormLabel>
                              <FormControl>
                                <DynamicSelect
                                  fieldName="responsibleTeam"
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Tiago Canossa de Abreu Silva"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Infrastructure */}
                        <FormField
                          control={form.control}
                          name="infrastructure"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Infraestrutura:</FormLabel>
                              <FormControl>
                                <DynamicSelect
                                  fieldName="infrastructure"
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Infraestrutura"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Environment to Publish */}
                        <FormField
                          control={form.control}
                          name="environmentPublication"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ambiente a ser publicado:</FormLabel>
                              <FormControl>
                                <DynamicSelect
                                  fieldName="environmentPublication"
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Produção"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Close to Publish */}
                      <FormField
                        control={form.control}
                        name="closeToPublish"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Pronto para publicar?</FormLabel>
                              <FormDescription>
                                Marque se este ticket está pronto para ser publicado.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Tab 4: Classification */}
                    <TabsContent value="classification" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Incidente, Requisição" {...field} />
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
                              <Input placeholder="Ex: Hardware, Software" {...field} />
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
                            <FormLabel>Tipo de contato</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Telefone, Email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Tab 5: Details */}
                    <TabsContent value="details" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="businessImpact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Impacto no negócio</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descreva o impacto no negócio" {...field} />
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
                              <Textarea placeholder="Descreva os sintomas" {...field} />
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
                            <FormLabel>Workaround</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descreva o workaround" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Tab 6: People */}
                    <TabsContent value="people" className="space-y-4">
                    </TabsContent>
                  </Tabs>

                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  </CustomFieldsWrapper>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            {/* Ticket Relationships */}
            <Card>
              <CardHeader>
                <CardTitle>Relacionamentos</CardTitle>
                <CardDescription>
                  Visualize a hierarquia e links de tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketHierarchyView ticketId={id} />
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ações</CardTitle>
                <CardDescription>
                  Gerencie anexos, histórico e outras ações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setIsAttachmentsModalOpen(true)}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Anexos
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setIsInternalActionModalOpen(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ações Internas
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setIsEmailHistoryModalOpen(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Histórico de Email
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setIsTicketHistoryModalOpen(true)}
                >
                  <History className="w-4 h-4 mr-2" />
                  Histórico do Ticket
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setIsApprovalRequestModalOpen(true)}
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Solicitação de Aprovação
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <TicketLinkingModal
          isOpen={isLinkingModalOpen}
          onClose={() => setIsLinkingModalOpen(false)}
          currentTicket={ticket}
        />
        <AttachmentsModal
          isOpen={isAttachmentsModalOpen}
          onClose={() => setIsAttachmentsModalOpen(false)}
          ticketId={id}
        />
        <InternalActionModal
          isOpen={isInternalActionModalOpen}
          onClose={() => setIsInternalActionModalOpen(false)}
          ticketId={id}
        />
        <EmailHistoryModal
          isOpen={isEmailHistoryModalOpen}
          onClose={() => setIsEmailHistoryModalOpen(false)}
          ticketId={id}
        />
        <TicketHistoryModal
          isOpen={isTicketHistoryModalOpen}
          onClose={() => setIsTicketHistoryModalOpen(false)}
          ticketId={id}
        />
        <ApprovalRequestModal
          isOpen={isApprovalRequestModalOpen}
          onClose={() => setIsApprovalRequestModalOpen(false)}
          ticketId={id}
        />
      </div>
  );
}