import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, Save, Link2, Trash2, Paperclip, MessageSquare, Mail, FileCheck, History, Edit, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";
import TicketHierarchyView from "@/components/tickets/TicketHierarchyView";
import AttachmentsModal from "@/components/tickets/AttachmentsModal";
import InternalActionModal from "@/components/tickets/InternalActionModal";
import EmailHistoryModal from "@/components/tickets/EmailHistoryModal";
import TicketHistoryModal from "@/components/tickets/TicketHistoryModal";
import ApprovalRequestModal from "@/components/tickets/ApprovalRequestModal";

// Form schema - exactly same as TicketEdit
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

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isInternalActionModalOpen, setIsInternalActionModalOpen] = useState(false);
  const [isEmailHistoryModalOpen, setIsEmailHistoryModalOpen] = useState(false);
  const [isTicketHistoryModalOpen, setIsTicketHistoryModalOpen] = useState(false);
  const [isApprovalRequestModalOpen, setIsApprovalRequestModalOpen] = useState(false);

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

  // Form setup - identical to TicketEdit
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

  // Update form when ticket data loads - identical to TicketEdit
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
      setIsEditMode(false);
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
      {/* Header - identical to TicketEdit */}
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
              Ticket #{ticket.number || ticket.id?.slice(-8)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ticket.subject || ticket.short_description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditMode(false);
                  form.reset();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateTicketMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLinkingModalOpen(true)}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Vincular
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
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
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - identical layout to TicketEdit */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Ticket</CardTitle>
              <CardDescription>
                {isEditMode ? "Edite as informações do ticket" : "Visualize as informações do ticket"}
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
                    
                    {/* Tab 1: Basic Information - identical content */}
                    <TabsContent value="basic" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assunto</FormLabel>
                            <FormControl>
                              {isEditMode ? (
                                <Input placeholder="Descreva o problema brevemente" {...field} />
                              ) : (
                                <div className="px-3 py-2 border rounded-md bg-muted">
                                  {field.value || "Não informado"}
                                </div>
                              )}
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
                              {isEditMode ? (
                                <Textarea
                                  placeholder="Descreva o problema em detalhes"
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              ) : (
                                <div className="px-3 py-2 border rounded-md bg-muted min-h-[120px]">
                                  {field.value || "Não informado"}
                                </div>
                              )}
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
                              {isEditMode ? (
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
                              ) : (
                                <div className="px-3 py-2 border rounded-md bg-muted">
                                  <Badge variant="outline" className={
                                    field.value === "critical" ? "border-red-500 text-red-700" :
                                    field.value === "high" ? "border-orange-500 text-orange-700" :
                                    field.value === "medium" ? "border-yellow-500 text-yellow-700" :
                                    "border-green-500 text-green-700"
                                  }>
                                    {field.value === "critical" ? "Crítica" :
                                     field.value === "high" ? "Alta" :
                                     field.value === "medium" ? "Média" : "Baixa"}
                                  </Badge>
                                </div>
                              )}
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
                              {isEditMode ? (
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
                              ) : (
                                <div className="px-3 py-2 border rounded-md bg-muted">
                                  {field.value === "critical" ? "Crítica" :
                                   field.value === "high" ? "Alta" :
                                   field.value === "medium" ? "Média" : "Baixa"}
                                </div>
                              )}
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
                              {isEditMode ? (
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
                              ) : (
                                <div className="px-3 py-2 border rounded-md bg-muted">
                                  {field.value === "critical" ? "Crítico" :
                                   field.value === "high" ? "Alto" :
                                   field.value === "medium" ? "Médio" : "Baixo"}
                                </div>
                              )}
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
                            {isEditMode ? (
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
                            ) : (
                              <div className="px-3 py-2 border rounded-md bg-muted">
                                <Badge variant="outline" className={
                                  field.value === "closed" ? "border-gray-500 text-gray-700" :
                                  field.value === "resolved" ? "border-green-500 text-green-700" :
                                  field.value === "in_progress" ? "border-purple-500 text-purple-700" :
                                  "border-blue-500 text-blue-700"
                                }>
                                  {field.value === "closed" ? "Fechado" :
                                   field.value === "resolved" ? "Resolvido" :
                                   field.value === "in_progress" ? "Em Progresso" :
                                   field.value === "pending" ? "Pendente" : "Aberto"}
                                </Badge>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Additional tabs would be identical to TicketEdit but with conditional rendering based on isEditMode */}
                    <TabsContent value="template" className="space-y-6">
                      <p className="text-sm text-muted-foreground">
                        {isEditMode ? "Editar configurações de template e ambiente" : "Configurações de template e ambiente"}
                      </p>
                    </TabsContent>

                    <TabsContent value="assignment" className="space-y-6">
                      <p className="text-sm text-muted-foreground">
                        {isEditMode ? "Editar informações de atribuição" : "Informações de atribuição"}
                      </p>
                    </TabsContent>

                    <TabsContent value="classification" className="space-y-6">
                      <p className="text-sm text-muted-foreground">
                        {isEditMode ? "Editar classificação do ticket" : "Classificação do ticket"}
                      </p>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-6">
                      <p className="text-sm text-muted-foreground">
                        {isEditMode ? "Editar detalhes técnicos" : "Detalhes técnicos"}
                      </p>
                    </TabsContent>

                    <TabsContent value="people" className="space-y-6">
                      <p className="text-sm text-muted-foreground">
                        {isEditMode ? "Editar informações de pessoas envolvidas" : "Pessoas envolvidas no ticket"}
                      </p>
                    </TabsContent>
                  </Tabs>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - identical to TicketEdit */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status & Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono">{ticket.id?.slice(-8)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Criado:</span>
                  <span>{new Date(ticket.created_at || ticket.createdAt || Date.now()).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Atualizado:</span>
                  <span>{new Date(ticket.updated_at || ticket.updatedAt || Date.now()).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsAttachmentsModalOpen(true)}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Anexos
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsInternalActionModalOpen(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ação Interna
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsEmailHistoryModalOpen(true)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Histórico Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsApprovalRequestModalOpen(true)}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Solicitar Aprovação
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsTicketHistoryModalOpen(true)}
              >
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
            </CardContent>
          </Card>

          {/* Hierarchy View */}
          <TicketHierarchyView ticketId={id!} />
        </div>
      </div>

      {/* Modals - identical to TicketEdit */}
      <TicketLinkingModal
        isOpen={isLinkingModalOpen}
        onClose={() => setIsLinkingModalOpen(false)}
        ticketId={id!}
      />

      <AttachmentsModal
        isOpen={isAttachmentsModalOpen}
        onClose={() => setIsAttachmentsModalOpen(false)}
        ticketId={id!}
      />

      <InternalActionModal
        isOpen={isInternalActionModalOpen}
        onClose={() => setIsInternalActionModalOpen(false)}
        ticketId={id!}
      />

      <EmailHistoryModal
        isOpen={isEmailHistoryModalOpen}
        onClose={() => setIsEmailHistoryModalOpen(false)}
        ticketId={id!}
      />

      <TicketHistoryModal
        isOpen={isTicketHistoryModalOpen}
        onClose={() => setIsTicketHistoryModalOpen(false)}
        ticketId={id!}
      />

      <ApprovalRequestModal
        isOpen={isApprovalRequestModalOpen}
        onClose={() => setIsApprovalRequestModalOpen(false)}
        ticketId={id!}
      />
    </div>
  );
}