import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, Save, Link, Link2, Trash2, Paperclip, MessageSquare, Mail, FileCheck, History } from "lucide-react";

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

// Form schema
const ticketFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  impact: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "pending", "resolved", "closed"]),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  callerId: z.string().min(1, "Caller is required"),
  callerType: z.enum(["customer", "user"]),
  beneficiaryId: z.string().optional(),
  beneficiaryType: z.enum(["customer", "user"]),
  assignedToId: z.string().optional(),
  assignmentGroup: z.string().optional(),
  location: z.string().optional(),
  contactType: z.enum(["email", "phone", "chat", "portal"]),
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Template/Environment fields
  environment: z.string().optional(),
  template_name: z.string().optional(),
  template_alternative: z.string().optional(),
  caller_name_responsible: z.string().optional(),
  call_type: z.string().optional(),
  call_url: z.string().optional(),
  environment_error: z.string().optional(),
  call_number: z.string().optional(),
  group_field: z.string().optional(),
  service_version: z.string().optional(),
  summary: z.string().optional(),
  // Assignment/Publication fields
  publication_priority: z.string().optional(),
  responsible_team: z.string().optional(),
  infrastructure: z.string().optional(),
  environment_publication: z.string().optional(),
  close_to_publish: z.boolean().default(false),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

export default function TicketEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

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

  // Ensure customers is always an array
  const customers = Array.isArray(customersData?.customers) ? customersData.customers : [];

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
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
      urgency: "medium",
      impact: "medium",
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
      // Template/Environment defaults
      environment: "",
      template_name: "",
      template_alternative: "",
      caller_name_responsible: "",
      call_type: "",
      call_url: "",
      environment_error: "",
      call_number: "",
      group_field: "",
      service_version: "",
      summary: "",
      // Assignment/Publication defaults
      publication_priority: "",
      responsible_team: "",
      infrastructure: "",
      environment_publication: "",
      close_to_publish: false,
    },
  });

  // Update form when ticket data loads
  useEffect(() => {
    if (ticket) {
      form.reset({
        subject: ticket.subject || ticket.short_description || "",
        description: ticket.description || "",
        priority: ticket.priority || "medium",
        urgency: ticket.urgency || "medium",
        impact: ticket.impact || "medium",
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
        // Template/Environment values
        environment: ticket.environment || "",
        template_name: ticket.template_name || "",
        template_alternative: ticket.template_alternative || "",
        caller_name_responsible: ticket.caller_name_responsible || "",
        call_type: ticket.call_type || "",
        call_url: ticket.call_url || "",
        environment_error: ticket.environment_error || "",
        call_number: ticket.call_number || "",
        group_field: ticket.group_field || "",
        service_version: ticket.service_version || "",
        summary: ticket.summary || "",
        // Assignment/Publication values
        publication_priority: ticket.publication_priority || "",
        responsible_team: ticket.responsible_team || "",
        infrastructure: ticket.infrastructure || "",
        environment_publication: ticket.environment_publication || "",
        close_to_publish: ticket.close_to_publish || false,
      });
    }
  }, [ticket, form]);

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
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
    updateTicketMutation.mutate(data);
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
            onClick={() => setIsLinkingModalOpen(true)}
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prioridade</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Baixa</SelectItem>
                                  <SelectItem value="medium">Média</SelectItem>
                                  <SelectItem value="high">Alta</SelectItem>
                                  <SelectItem value="critical">Crítica</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="urgency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Urgência</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Baixa</SelectItem>
                                  <SelectItem value="medium">Média</SelectItem>
                                  <SelectItem value="high">Alta</SelectItem>
                                  <SelectItem value="critical">Crítica</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="impact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Impacto</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Baixo</SelectItem>
                                  <SelectItem value="medium">Médio</SelectItem>
                                  <SelectItem value="high">Alto</SelectItem>
                                  <SelectItem value="critical">Crítico</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

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
                                <SelectItem value="open">Aberto</SelectItem>
                                <SelectItem value="in_progress">Em Progresso</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="resolved">Resolvido</SelectItem>
                                <SelectItem value="closed">Fechado</SelectItem>
                              </SelectContent>
                            </Select>
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
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="LANSOLVER" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="lansolver">LANSOLVER</SelectItem>
                                    <SelectItem value="production">PRODUÇÃO</SelectItem>
                                    <SelectItem value="development">DESENVOLVIMENTO</SelectItem>
                                    <SelectItem value="staging">HOMOLOGAÇÃO</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Template Section */}
                        <div>
                          <FormField
                            control={form.control}
                            name="template_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Template:</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Publicação - Infra" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="publicacao-infra">Publicação - Infra</SelectItem>
                                    <SelectItem value="manutencao">Manutenção</SelectItem>
                                    <SelectItem value="incidente">Incidente</SelectItem>
                                    <SelectItem value="requisicao">Requisição</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Template Alternative */}
                        <div>
                          <FormField
                            control={form.control}
                            name="template_alternative"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Template Alternativo:</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Publicação - Infra" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="publicacao-infra">Publicação - Infra</SelectItem>
                                    <SelectItem value="manutencao">Manutenção</SelectItem>
                                    <SelectItem value="incidente">Incidente</SelectItem>
                                  </SelectContent>
                                </Select>
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
                            name="caller_name_responsible"
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
                            name="call_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Chamado:</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Solicitação" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="solicitacao">Solicitação</SelectItem>
                                    <SelectItem value="incidente">Incidente</SelectItem>
                                    <SelectItem value="problema">Problema</SelectItem>
                                    <SelectItem value="mudanca">Mudança</SelectItem>
                                  </SelectContent>
                                </Select>
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
                          name="call_url"
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
                          name="environment_error"
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
                            name="call_number"
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
                            name="group_field"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grupo:</FormLabel>
                                <Select>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Infraestrutura" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                                    <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                                    <SelectItem value="suporte">Suporte</SelectItem>
                                    <SelectItem value="qualidade">Qualidade</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Service Version */}
                        <div>
                          <FormField
                            control={form.control}
                            name="service_version"
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
                      <FormField
                        control={form.control}
                        name="callerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Solicitante</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o solicitante" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {customers.map((customer) => (
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
                                {customers.map((customer) => (
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
                                {users.map((user) => (
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
                        name="assignmentGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grupo de Atribuição</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Suporte N1, Infraestrutura" {...field} />
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
                          name="publication_priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prioridade da publicação:</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="4 - Crítico - até 30 minutos" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1-baixa">1 - Baixa - até 7 dias</SelectItem>
                                  <SelectItem value="2-normal">2 - Normal - até 3 dias</SelectItem>
                                  <SelectItem value="3-alta">3 - Alta - até 1 dia</SelectItem>
                                  <SelectItem value="4-critica">4 - Crítico - até 30 minutos</SelectItem>
                                  <SelectItem value="5-emergencial">5 - Emergencial - imediato</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Responsible */}
                        <FormField
                          control={form.control}
                          name="responsible_team"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Responsável:</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tiago Canossa de Abreu Silva" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="tiago-canossa">Tiago Canossa de Abreu Silva</SelectItem>
                                  <SelectItem value="giovanna-jovina">Giovanna Jovina</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                              </Select>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Infraestrutura" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                                  <SelectItem value="aplicacao">Aplicação</SelectItem>
                                  <SelectItem value="banco-dados">Banco de Dados</SelectItem>
                                  <SelectItem value="rede">Rede</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Environment to Publish */}
                        <FormField
                          control={form.control}
                          name="environment_publication"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ambiente a ser publicado:</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Produção" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="producao">Produção</SelectItem>
                                  <SelectItem value="homologacao">Homologação</SelectItem>
                                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                                  <SelectItem value="staging">Staging</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Close to Publish Checkbox */}
                      <div>
                        <FormField
                          control={form.control}
                          name="close_to_publish"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Próximo a ser publicado
                                </FormLabel>
                                <FormDescription>
                                  Marque se este item deve ser publicado prioritariamente
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Tab 3: Classification */}
                    <TabsContent value="classification" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Hardware, Software, Rede" {...field} />
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
                                <Input placeholder="Ex: Impressora, Sistema ERP" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="contactType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Contato</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Como o ticket foi criado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Telefone</SelectItem>
                                <SelectItem value="chat">Chat</SelectItem>
                                <SelectItem value="portal">Portal</SelectItem>
                              </SelectContent>
                            </Select>
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
                                placeholder="Descreva como isso afeta as operações da empresa"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Tab 4: Technical Details */}
                    <TabsContent value="details" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="symptoms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sintomas</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva os sintomas observados"
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
                                placeholder="Descreva alguma solução temporária aplicada"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Tab 5: People Information */}
                    <TabsContent value="people" className="space-y-6">
                      {/* Solicitante Information */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-blue-900 mb-4">Informações do Solicitante:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome:</label>
                            <div className="text-sm text-gray-900">giovanna jovina</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail:</label>
                            <div className="text-sm text-gray-900">giovanna.santos@lansolver.com</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                        </div>
                      </div>

                      {/* Favorecido Information */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-green-900 mb-4">Informações do Favorecido:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome:</label>
                            <div className="text-sm text-gray-900">MTM - Motormac</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RG:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Celular:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Integração:</label>
                            <div className="text-sm text-gray-900">MTM - Motormac</div>
                          </div>
                        </div>
                      </div>

                      {/* Date/Time Information */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-purple-900 mb-4">Data/Hora</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Criação:</label>
                            <div className="text-sm text-gray-900">18/07/2025 14:52</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data/hora vencimento original:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento Acionamento:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Resolução:</label>
                            <div className="text-sm text-gray-900">[Campo vazio]</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento:</label>
                            <div className="text-sm text-gray-900">18/07/2025 15:03</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dia(s) no status:</label>
                            <div className="text-sm text-gray-900">0</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Action Icons Section */}
                  <div className="bg-gray-50 p-4 rounded-lg border mt-6">
                    <div className="flex items-center justify-center space-x-8">
                      <button
                        type="button"
                        className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Anexos"
                      >
                        <Paperclip className="w-6 h-6 text-blue-600" />
                        <span className="text-xs text-gray-700">Anexos</span>
                      </button>
                      
                      <button
                        type="button"
                        className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Ação Interna"
                      >
                        <MessageSquare className="w-6 h-6 text-green-600" />
                        <span className="text-xs text-gray-700">Ação Interna</span>
                      </button>
                      
                      <button
                        type="button"
                        className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                        title="E-mail"
                      >
                        <Mail className="w-6 h-6 text-purple-600" />
                        <span className="text-xs text-gray-700">E-mail</span>
                      </button>
                      
                      <button
                        type="button"
                        className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Pedidos de aprovação"
                      >
                        <FileCheck className="w-6 h-6 text-orange-600" />
                        <span className="text-xs text-gray-700">Pedidos de aprovação</span>
                      </button>
                      
                      <button
                        type="button"
                        className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Histórico"
                      >
                        <History className="w-6 h-6 text-indigo-600" />
                        <span className="text-xs text-gray-700">Histórico</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="outline"
                      type="button"
                      className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    >
                      Voltar à lista
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={updateTicketMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateTicketMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Número:</span>
                <Badge variant="outline">#{ticket.number || ticket.id?.slice(-8)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Criado em:</span>
                <span className="text-sm">
                  {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Atualizado em:</span>
                <span className="text-sm">
                  {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Hierarchy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hierarquia</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLinkingModalOpen(true)}
                className="text-xs"
              >
                <Link className="w-3 h-3 mr-1" />
                Vincular
              </Button>
            </CardHeader>
            <CardContent>
              <TicketHierarchyView ticketId={id!} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Linking Modal */}
      <TicketLinkingModal
        isOpen={isLinkingModalOpen}
        onClose={() => setIsLinkingModalOpen(false)}
        currentTicket={ticket}
      />
    </div>
  );
}