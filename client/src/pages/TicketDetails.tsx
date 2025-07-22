import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { 
  ArrowLeft, Edit, Save, X, Trash2, Eye, ChevronRight, ChevronLeft,
  Paperclip, FileText, MessageSquare, History, Settings,
  User, Users, Tag, AlertCircle, FileIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("basico");

  // Tab configuration
  const tabs = [
    { id: "basico", label: "Básico", icon: FileText },
    { id: "assignment", label: "Atribuição", icon: User },
    { id: "classification", label: "Classificação", icon: Tag },
    { id: "details", label: "Detalhes", icon: AlertCircle },
    { id: "people", label: "Pessoas", icon: Users },
    { id: "attachments", label: "Anexos", icon: Paperclip },
    { id: "notes", label: "Notas", icon: FileText },
    { id: "communications", label: "Comunicação", icon: MessageSquare },
    { id: "history", label: "Histórico", icon: History },
    { id: "internal-actions", label: "Ações Internas", icon: Settings },
  ];

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

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json();
    },
  });

  const customers = Array.isArray(customersData?.customers) ? customersData.customers : [];

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
      callerId: "",
      callerType: "customer",
      beneficiaryType: "customer",
      contactType: "email",
    },
  });

  // Reset form when ticket data changes
  useEffect(() => {
    if (ticket) {
      form.reset({
        subject: ticket.subject || "",
        description: ticket.description || "",
        priority: ticket.priority || "medium",
        urgency: ticket.urgency || "medium",
        impact: ticket.impact || "medium",
        status: ticket.status || "open",
        category: ticket.category || "",
        subcategory: ticket.subcategory || "",
        callerId: ticket.callerId || "",
        callerType: ticket.callerType || "customer",
        beneficiaryId: ticket.beneficiaryId || "",
        beneficiaryType: ticket.beneficiaryType || "customer",
        assignedToId: ticket.assignedToId || "",
        assignmentGroup: ticket.assignmentGroup || "",
        location: ticket.location || "",
        contactType: ticket.contactType || "email",
        businessImpact: ticket.businessImpact || "",
        symptoms: ticket.symptoms || "",
        workaround: ticket.workaround || "",
      });
    }
  }, [ticket, form]);

  // Update mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const response = await apiRequest("PUT", `/api/tickets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ticket atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setIsEditMode(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar ticket",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/tickets/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ticket excluído com sucesso",
      });
      navigate("/tickets");
    },
    onError: () => {
      toast({
        title: "Erro", 
        description: "Erro ao excluir ticket",
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div>Ticket não encontrado</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-80' : 'mr-0'}`}>
        <div className="p-4 h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">#{ticket.id?.slice(-8) || 'N/A'}</h1>
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              
              {!isEditMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={updateTicketMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="h-full bg-white rounded-lg border p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {renderTabContent()}
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`fixed right-0 top-0 h-full bg-white border-l transition-all duration-300 ${
        sidebarOpen ? 'w-80 translate-x-0' : 'w-80 translate-x-full'
      }`}>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Navegação</h3>
        </div>
        <div className="p-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Render tab content based on activeTab
  function renderTabContent() {
    switch (activeTab) {
      case "basico":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
            
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Ticket #{ticket.ticketNumber}</span>
              <div className="flex gap-2">
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto *</FormLabel>
                  <FormControl>
                    {isEditMode ? (
                      <Input {...field} />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded">{field.value}</div>
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
                      <Textarea {...field} rows={4} />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded min-h-[100px]">{field.value}</div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">{field.value}</div>
                      )}
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
                    <FormLabel>Urgência</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">{field.value}</div>
                      )}
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
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Aberto</SelectItem>
                            <SelectItem value="in_progress">Em Progresso</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="resolved">Resolvido</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">
                          <Badge className={getStatusColor(field.value)}>
                            {field.value}
                          </Badge>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case "assignment":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Atribuição</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="callerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitante *</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o solicitante" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} ({customer.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">
                          {customers.find((c: any) => c.id === field.value)?.name || field.value}
                        </div>
                      )}
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
                    <FormLabel>Atribuído Para</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Não atribuído</SelectItem>
                            {Array.isArray(users) && users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">
                          {field.value ? 
                            (Array.isArray(users) && users.find((u: any) => u.id === field.value)?.name) || field.value 
                            : "Não atribuído"
                          }
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <FormControl>
                    {isEditMode ? (
                      <Input {...field} />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded">{field.value}</div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "classification":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Classificação</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Input {...field} />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">{field.value}</div>
                      )}
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
                      {isEditMode ? (
                        <Input {...field} />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">{field.value}</div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impacto no Negócio</FormLabel>
                  <FormControl>
                    {isEditMode ? (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                          <SelectItem value="critical">Crítico</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded">{field.value}</div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "details":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Detalhes Técnicos</h2>
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sintomas</FormLabel>
                  <FormControl>
                    {isEditMode ? (
                      <Textarea {...field} rows={3} />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded min-h-[80px]">{field.value}</div>
                    )}
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
                    {isEditMode ? (
                      <Textarea {...field} rows={3} />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded min-h-[80px]">{field.value}</div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "people":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Informações de Pessoas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-800">Informações do Solicitante</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome:</label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {customers.find((c: any) => c.id === ticket.callerId)?.name || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email:</label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {customers.find((c: any) => c.id === ticket.callerId)?.email || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Telefone:</label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {customers.find((c: any) => c.id === ticket.callerId)?.phone || "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-purple-800">Datas e Controle</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Criado em:</label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('pt-BR') : "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Última atualização:</label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('pt-BR') : "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "attachments":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Anexos</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Paperclip className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Funcionalidade de anexos em desenvolvimento</p>
              <p className="text-sm text-gray-400">Suporte para uploads até 200MB</p>
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Notas</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Sistema de notas em desenvolvimento</p>
              <p className="text-sm text-gray-400">Notas múltiplas com categorização</p>
            </div>
          </div>
        );

      case "communications":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Comunicação</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Timeline de comunicação em desenvolvimento</p>
              <p className="text-sm text-gray-400">Email, WhatsApp, telefone e chat</p>
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Histórico</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Histórico completo em desenvolvimento</p>
              <p className="text-sm text-gray-400">Timeline de todas as ações</p>
            </div>
          </div>
        );

      case "internal-actions":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Ações Internas</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Sistema de ações internas em desenvolvimento</p>
              <p className="text-sm text-gray-400">Formulários complexos com relacionamentos</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
            <p>Conteúdo da aba não encontrado.</p>
          </div>
        );
    }
  }
}
