import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { 
  ArrowLeft, Edit, Save, X, Trash2, Eye, ChevronRight, ChevronLeft,
  Paperclip, FileText, MessageSquare, History, Settings,
  User, Users, Tag, AlertCircle, FileIcon, Upload, Plus, Send,
  Clock, Download, ExternalLink, Filter, MoreVertical, Trash
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema
const ticketFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
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
  followers: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);

  // Sidebar sempre fixa e visível - tab padrão é informações
  const [activeTab, setActiveTab] = useState("informacoes");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [communications, setCommunications] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [internalActions, setInternalActions] = useState<any[]>([]);
  const [showInternalActionModal, setShowInternalActionModal] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState<'simple' | 'advanced'>('simple');
  const [followers, setFollowers] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState<{open: boolean, field: string, type: 'rg' | 'cpf'}>({open: false, field: '', type: 'rg'});
  const [agentPassword, setAgentPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic information - consolidated into single tab
  const basicTabs = [
    { id: "basico", label: "Informações", icon: FileText },
  ];

  // Special functionality tabs
  const specialTabs = [
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

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.size > 200 * 1024 * 1024) { // 200MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 200MB",
          variant: "destructive",
        });
        return;
      }
      
      const newAttachment = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        description: "",
        file: file
      };
      
      setAttachments(prev => [...prev, newAttachment]);
    });
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note = {
      id: Date.now(),
      content: newNote,
      createdAt: new Date(),
      createdBy: "Usuário Atual"
    };
    
    setNotes(prev => [...prev, note]);
    setNewNote("");
  };

  const removeAttachment = (id: number) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
      
      // Simulate communication data
      setCommunications([
        {
          id: 1,
          type: "email",
          channel: "Email",
          from: "cliente@empresa.com",
          to: "suporte@conductor.com",
          subject: "Problema no sistema",
          content: "Estou enfrentando dificuldades para acessar o sistema. Poderia me ajudar?",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: "received"
        },
        {
          id: 2,
          type: "whatsapp",
          channel: "WhatsApp",
          from: "Suporte Conductor",
          to: "Cliente",
          content: "Oi! Recebemos seu email sobre o problema de acesso. Vamos verificar isso para você.",
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          status: "sent"
        },
        {
          id: 3,
          type: "call",
          channel: "Telefone",
          from: "Suporte Conductor",
          to: "Cliente",
          content: "Ligação de 15 minutos para diagnóstico do problema",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          status: "completed"
        }
      ]);

      // Simulate history data
      setHistory([
        {
          id: 1,
          action: "Ticket criado",
          user: "Sistema",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          type: "system",
          details: "Ticket aberto automaticamente via email",
          changes: {
            status: { from: null, to: "open" },
            priority: { from: null, to: "medium" }
          }
        },
        {
          id: 2,
          action: "Atribuído ao agente",
          user: "João Silva",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: "human",
          details: "Ticket atribuído para análise técnica"
        },
        {
          id: 3,
          action: "Status alterado",
          user: "Maria Santos",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          type: "human",
          details: "Mudança de status para em progresso",
          changes: {
            status: { from: "open", to: "in_progress" }
          }
        }
      ]);

      // Simulate internal actions data
      setInternalActions([
        {
          id: "ACT-2025-001",
          type: "investigation",
          agent: "João Silva",
          group: "Suporte Técnico",
          status: "completed",
          description: "Investigação completa do problema de conectividade com análise de logs do sistema",
          timeSpent: "3.5",
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('pt-BR'),
          endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toLocaleString('pt-BR'),
          linkedItems: "Ticket #456, Log #789",
          hasFile: true
        },
        {
          id: "ACT-2025-002",
          type: "repair",
          agent: "Maria Santos",
          group: "Infraestrutura",
          status: "in-progress",
          description: "Reparo da configuração de rede e reinstalação de drivers",
          timeSpent: "2.0",
          startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleString('pt-BR'),
          linkedItems: "Equipamento #123",
          hasFile: false
        }
      ]);
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

  // Render tab content based on activeTab
  function renderTabContent() {
    switch (activeTab) {
      case "informacoes":
        return (
          <div className="space-y-4">
            
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
                  <FormLabel>Descrição *</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
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
                name="followerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seguidor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um agente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Não atribuído</SelectItem>
                        {users?.users?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
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

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Input 
                          {...field} 
                          placeholder="Digite as tags separadas por vírgula"
                          onChange={(e) => {
                            const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                            field.onChange(tags);
                            setTags(tags);
                          }}
                          value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded min-h-[40px] flex flex-wrap gap-1">
                          {(Array.isArray(field.value) ? field.value : []).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(!field.value || field.value.length === 0) && (
                            <span className="text-gray-500 text-sm">Nenhuma tag</span>
                          )}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Classificação */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">CLASSIFICAÇÃO</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="network">Rede</SelectItem>
                          <SelectItem value="access">Acesso</SelectItem>
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
                      <FormLabel>Subcategoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="printer">Impressora</SelectItem>
                          <SelectItem value="computer">Computador</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="system">Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contato</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de contato" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="chat">Chat</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Detalhes */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">DETALHES</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sintomas</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Textarea {...field} rows={3} placeholder="Descreva os sintomas..." />
                        ) : (
                          <div className="p-2 bg-gray-50 rounded min-h-[80px]">{field.value || 'Não informado'}</div>
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
                          <Textarea {...field} rows={3} placeholder="Descreva a solução temporária..." />
                        ) : (
                          <div className="p-2 bg-gray-50 rounded min-h-[80px]">{field.value || 'Não informado'}</div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="businessImpact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impacto no Negócio</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Textarea {...field} rows={2} placeholder="Descreva o impacto no negócio..." />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded min-h-[60px]">{field.value || 'Não informado'}</div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Atribuição */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">ATRIBUIÇÃO</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Não atribuído</SelectItem>
                          {users?.users?.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grupo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="support">Suporte Técnico</SelectItem>
                          <SelectItem value="network">Infraestrutura</SelectItem>
                          <SelectItem value="security">Segurança</SelectItem>
                          <SelectItem value="development">Desenvolvimento</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a localização" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="matriz">Matriz</SelectItem>
                          <SelectItem value="filial1">Filial 1</SelectItem>
                          <SelectItem value="filial2">Filial 2</SelectItem>
                          <SelectItem value="remoto">Remoto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>


          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Funcionalidade em desenvolvimento</h2>
            <p>Esta aba ainda está sendo desenvolvida.</p>
          </div>
        );
    }
  }

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
      {/* Left Sidebar - Fixa */}
      <div className="w-72 bg-white border-r flex-shrink-0 h-full overflow-y-auto">
        <div className="p-4 h-full">
          {/* Ticket Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">SEGUIDORES</h3>
            <div className="space-y-2">
              {followers.length > 0 ? (
                followers.map((followerId, index) => {
                  const user = users?.users?.find((u: any) => u.id === followerId);
                  return (
                    <div key={index} className="text-sm text-gray-700">
                      {user?.name || followerId}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">Nenhum seguidor</div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {tags.length > 0 ? (
                tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))
              ) : (
                <div className="text-sm text-gray-500">Nenhuma tag</div>
              )}
            </div>
          </div>

          {/* Priority Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Prioridade</h3>
            <div className="text-sm">
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </div>
          </div>

          {/* Status Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Status de aprovação</h3>
            <div className="text-sm text-gray-700">Normal</div>
            <div className="mt-2 p-2 bg-teal-50 rounded text-xs text-teal-700">
              ✓ Configurado em 2 minutos
            </div>
          </div>

          {/* Custom Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Personalize as informações do seu ticket</h3>
            <p className="text-xs text-gray-500 mb-3">
              Use os campos de dados do ticket para calcular facilmente detalhes importantes.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                Ativar
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Descartar
              </Button>
            </div>
          </div>

          {/* Skills Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Habilidades</h3>
            <div className="text-xs text-gray-500">Aplicar macro</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
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

      {/* Right Sidebar - Navigation Tabs */}
      <div className="w-80 bg-white border-l flex-shrink-0 h-full overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Navegação</h3>
        </div>
        <div className="p-2 space-y-1">
          {/* Informações Tab */}
          <button
            onClick={() => setActiveTab("informacoes")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "informacoes" 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Informações</span>
          </button>

          {/* Campos Especiais */}
          {specialTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quadro Informativo */}
        <div className="border-t mt-4">
          <div className="p-3 bg-gray-50 rounded-b-lg">
            {/* Datas/Tempo - Destacado */}
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                DATAS E TEMPO
              </h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-700">Criação:</span>
                  <span className="text-blue-900 font-medium">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Vencimento:</span>
                  <span className="text-blue-900 font-medium">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Status:</span>
                  <Badge variant="outline" className="text-xs h-4">
                    {ticket.status} - {ticket.daysInStatus || 0}d
                  </Badge>
                </div>
              </div>
            </div>

            {/* Favorecido - Compacto */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-gray-700">FAVORECIDO</h4>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 text-xs text-red-600 hover:text-red-700">
                      🔐 Dados Sensíveis
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Verificação de Segurança</DialogTitle>
                      <DialogDescription>
                        Digite sua senha para acessar dados sensíveis do favorecido
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="password"
                        placeholder="Digite sua senha"
                        value={agentPassword}
                        onChange={(e) => setAgentPassword(e.target.value)}
                      />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">RG:</span>
                          <span className="font-medium">{agentPassword.length > 0 ? (ticket.favorecido?.rg || 'Não informado') : '••••••••••'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">CPF/CNPJ:</span>
                          <span className="font-medium">{agentPassword.length > 0 ? (ticket.favorecido?.cpf || 'Não informado') : '•••••••••••••••'}</span>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="text-gray-900 font-medium truncate ml-2">{ticket.favorecido?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">E-mail:</span>
                  <span className="text-gray-900 font-medium truncate ml-2">{ticket.favorecido?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefone:</span>
                  <span className="text-gray-900 font-medium">{ticket.favorecido?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Solicitante - Compacto */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-gray-700">SOLICITANTE</h4>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 text-xs text-red-600 hover:text-red-700">
                      🔐 Dados Sensíveis
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Verificação de Segurança</DialogTitle>
                      <DialogDescription>
                        Digite sua senha para acessar dados sensíveis do solicitante
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="password"
                        placeholder="Digite sua senha"
                        value={agentPassword}
                        onChange={(e) => setAgentPassword(e.target.value)}
                      />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">RG:</span>
                          <span className="font-medium">{agentPassword.length > 0 ? (ticket.customer?.rg || 'Não informado') : '••••••••••'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">CPF/CNPJ:</span>
                          <span className="font-medium">{agentPassword.length > 0 ? (ticket.customer?.cpf || 'Não informado') : '•••••••••••••••'}</span>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="text-gray-900 font-medium truncate ml-2">{ticket.customer?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">E-mail:</span>
                  <span className="text-gray-900 font-medium truncate ml-2">{ticket.customer?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Endereço:</span>
                  <span className="text-gray-900 font-medium truncate ml-2">{ticket.customer?.address || 'N/A'}, {ticket.customer?.addressNumber || ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Password Dialog for Sensitive Fields */}
      <Dialog open={showPasswordDialog.open} onOpenChange={(open) => setShowPasswordDialog({...showPasswordDialog, open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificação de Segurança</DialogTitle>
            <DialogDescription>
              Para visualizar informações sensíveis ({showPasswordDialog.type === 'rg' ? 'RG' : 'CPF/CNPJ'}), digite sua senha de agente:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent-password">Senha do Agente</Label>
              <Input
                id="agent-password"
                type="password"
                value={agentPassword}
                onChange={(e) => setAgentPassword(e.target.value)}
                placeholder="Digite sua senha"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordDialog({open: false, field: '', type: 'rg'});
                setAgentPassword('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                // Aqui você faria a verificação da senha
                // Por enquanto, apenas fechamos o modal
                if (agentPassword) {
                  alert(`Dados sensíveis revelados para o campo: ${showPasswordDialog.field}`);
                  setShowPasswordDialog({open: false, field: '', type: 'rg'});
                  setAgentPassword('');
                } else {
                  alert('Digite sua senha');
                }
              }}
            >
              Verificar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render tab content based on activeTab
  function renderTabContent() {
    switch (activeTab) {
      case "informacoes":
        return (
          <div className="space-y-4">
            
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

            <div className="grid grid-cols-2 gap-4">
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

            {/* Seguidor e TAGs */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="followers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seguidor</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Select 
                          value={followers.length > 0 ? followers[0] : ""} 
                          onValueChange={(value) => setFollowers(value ? [value] : [])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um agente" />
                          </SelectTrigger>
                          <SelectContent>
                            {(users?.users || []).map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">
                          {followers.length > 0 ? (
                            <Badge variant="outline">{users?.users?.find((u: any) => u.id === followers[0])?.name || followers[0]}</Badge>
                          ) : (
                            "Nenhum seguidor"
                          )}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TAGs</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Input 
                          placeholder="Digite tags separadas por vírgula"
                          value={tags.join(", ")}
                          onChange={(e) => setTags(e.target.value.split(",").map(tag => tag.trim()).filter(Boolean))}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded flex items-center gap-2 flex-wrap">
                          {tags.length > 0 ? tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          )) : "Nenhuma tag"}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Atribuição */}
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
                            {(customers?.customers || []).map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">
                          {customers?.customers?.find((c: any) => c.id === field.value)?.name || field.value}
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
                    <FormLabel>Atribuído a</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Não atribuído</SelectItem>
                            {(users?.users || []).map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">
                          {users?.users?.find((u: any) => u.id === field.value)?.name || field.value || "Não atribuído"}
                        </div>
                      )}
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
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hardware">Hardware</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="rede">Rede</SelectItem>
                            <SelectItem value="acesso">Acesso</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">{field.value || "Não especificada"}</div>
                      )}
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
                      {isEditMode ? (
                        <Input {...field} placeholder="Digite a localização" />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">{field.value || "Não especificada"}</div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sintomas e Solução Temporária */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sintomas</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Textarea {...field} rows={3} placeholder="Descreva os sintomas do problema" />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded min-h-[80px]">{field.value || "Não especificado"}</div>
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
                        <Textarea {...field} rows={3} placeholder="Descreva alguma solução temporária" />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded min-h-[80px]">{field.value || "Não especificado"}</div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case "attachments":
        return (
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4 cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Arraste arquivos aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Máximo 200MB por arquivo. Todos os formatos aceitos.
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Anexos ({attachments.length})</h3>
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">{attachment.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(attachment.size)} • Adicionado em {attachment.uploadedAt}
                        </p>
                        {attachment.description && (
                          <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "notes":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">📝 Notas</h2>
              <Badge variant="outline" className="text-xs">
                {notes.length} nota(s)
              </Badge>
            </div>

            {/* Add New Note */}
            <Card className="p-4">
              <h3 className="font-medium text-gray-700 mb-3">Adicionar Nova Nota</h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Digite sua nota aqui..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button onClick={addNote} disabled={!newNote.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Nota
                  </Button>
                </div>
              </div>
            </Card>

            {/* Notes Timeline */}
            {notes.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Timeline de Notas</h3>
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <Card key={note.id} className="p-4 border-l-4 border-l-blue-400">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {note.createdBy}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {note.createdAt.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {notes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>Nenhuma nota adicionada ainda</p>
                <p className="text-sm">Use o formulário acima para adicionar a primeira nota</p>
              </div>
            )}
          </div>
        );

      case "communications":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">💬 Comunicação</h2>
              <Badge variant="outline" className="text-xs">
                {communications.length} interação(ões)
              </Badge>
            </div>

            {/* Communication Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-medium text-gray-700">Timeline de Comunicação</h3>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">Email</Badge>
                  <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                  <Badge variant="secondary" className="text-xs">Telefone</Badge>
                </div>
              </div>

              {communications.map((comm: any) => (
                <Card key={comm.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Channel Icon */}
                    <div className={`p-2 rounded-full ${
                      comm.type === 'email' ? 'bg-blue-100 text-blue-600' :
                      comm.type === 'whatsapp' ? 'bg-green-100 text-green-600' :
                      comm.type === 'call' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {comm.type === 'email' && <MessageSquare className="h-4 w-4" />}
                      {comm.type === 'whatsapp' && <Send className="h-4 w-4" />}
                      {comm.type === 'call' && <Clock className="h-4 w-4" />}
                    </div>

                    {/* Communication Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {comm.channel}
                          </Badge>
                          <span className="text-sm font-medium text-gray-800">
                            {comm.from} → {comm.to}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {comm.timestamp.toLocaleString('pt-BR')}
                        </span>
                      </div>

                      {comm.subject && (
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Assunto: {comm.subject}
                        </p>
                      )}

                      <p className="text-gray-800 text-sm mb-2">{comm.content}</p>

                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={comm.status === 'sent' ? 'default' : 
                                  comm.status === 'received' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {comm.status === 'sent' ? 'Enviado' :
                           comm.status === 'received' ? 'Recebido' :
                           comm.status === 'completed' ? 'Concluído' : comm.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Quick Reply Section */}
              <Card className="p-4 border-dashed border-2">
                <h4 className="font-medium text-gray-700 mb-3">Resposta Rápida</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Ligar
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Digite sua mensagem aqui..."
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {communications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>Nenhuma comunicação registrada ainda</p>
                <p className="text-sm">As interações aparecerão aqui automaticamente</p>
              </div>
            )}
          </div>
        );

      case "history":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">📜 Histórico</h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {history.length} ação(ões)
                </Badge>
                <div className="flex rounded-lg border p-1">
                  <Button
                    variant={historyViewMode === 'simple' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setHistoryViewMode('simple')}
                    className="text-xs px-3 py-1"
                  >
                    Simples
                  </Button>
                  <Button
                    variant={historyViewMode === 'advanced' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setHistoryViewMode('advanced')}
                    className="text-xs px-3 py-1"
                  >
                    Avançado
                  </Button>
                </div>
              </div>
            </div>

            {/* History Timeline */}
            <div className="space-y-4">
              {history.map((entry: any, index: number) => (
                <div key={entry.id} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.type === 'system' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    {index < history.length - 1 && (
                      <div className="w-0.5 bg-gray-200 flex-1 mt-2" />
                    )}
                  </div>

                  {/* Entry Content */}
                  <Card className="flex-1 p-4">
                    {historyViewMode === 'simple' ? (
                      /* Simple View */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{entry.action}</span>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={entry.type === 'system' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {entry.user}
                          </Badge>
                          {entry.details && (
                            <span className="text-sm text-gray-600">{entry.details}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Advanced View */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{entry.action}</span>
                            <Badge 
                              variant={entry.type === 'system' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {entry.type === 'system' ? '🤖 Sistema' : '👤 Humano'}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Por:</span>
                          <Badge variant="outline" className="text-xs">
                            {entry.user}
                          </Badge>
                        </div>

                        {entry.details && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {entry.details}
                          </p>
                        )}

                        {entry.changes && (
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-gray-600">Alterações:</span>
                            {Object.entries(entry.changes).map(([field, change]: [string, any]) => (
                              <div key={field} className="text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                                <strong>{field}:</strong> 
                                {change.from ? (
                                  <span className="ml-1">
                                    <span className="text-red-600">"{change.from}"</span> → <span className="text-green-600">"{change.to}"</span>
                                  </span>
                                ) : (
                                  <span className="ml-1 text-green-600">"{change.to}"</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>

            {history.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>Nenhum histórico disponível ainda</p>
                <p className="text-sm">As ações aparecerão aqui automaticamente</p>
              </div>
            )}
          </div>
        );

      case "internal-actions":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">⚙️ Ações Internas</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {internalActions.length} ação(ões)
                </Badge>
                <Dialog open={showInternalActionModal} onOpenChange={setShowInternalActionModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Ação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Ação Interna</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-4">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="action-id">ID da Ação *</Label>
                          <Input id="action-id" placeholder="ACT-2025-001" />
                        </div>

                        <div>
                          <Label htmlFor="action-type">Tipo de Ação *</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="investigation">Investigação</SelectItem>
                              <SelectItem value="repair">Reparo</SelectItem>
                              <SelectItem value="analysis">Análise</SelectItem>
                              <SelectItem value="documentation">Documentação</SelectItem>
                              <SelectItem value="escalation">Escalação</SelectItem>
                              <SelectItem value="follow-up">Follow-up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="action-agent">Agente Responsável *</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o agente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agent1">João Silva</SelectItem>
                              <SelectItem value="agent2">Maria Santos</SelectItem>
                              <SelectItem value="agent3">Pedro Costa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="action-group">Grupo Responsável</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o grupo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="support">Suporte Técnico</SelectItem>
                              <SelectItem value="network">Infraestrutura</SelectItem>
                              <SelectItem value="security">Segurança</SelectItem>
                              <SelectItem value="development">Desenvolvimento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="start-time">Início *</Label>
                            <Input id="start-time" type="datetime-local" />
                          </div>
                          <div>
                            <Label htmlFor="end-time">Fim</Label>
                            <Input id="end-time" type="datetime-local" />
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="linked-items">Itens Relacionados</Label>
                          <Textarea 
                            id="linked-items" 
                            placeholder="Ex: Ticket #123, Problema #456"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label htmlFor="time-spent">Tempo Gasto (horas)</Label>
                          <Input 
                            id="time-spent" 
                            type="number" 
                            step="0.5" 
                            placeholder="Ex: 2.5"
                          />
                        </div>

                        <div>
                          <Label htmlFor="action-status">Status *</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="in-progress">Em Progresso</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                              <SelectItem value="on-hold">Em Espera</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="action-file">Arquivo de Apoio</Label>
                          <Input id="action-file" type="file" />
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo 50MB. Formatos: PDF, DOC, XLS, IMG
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="action-description">Descrição da Ação *</Label>
                          <Textarea 
                            id="action-description" 
                            placeholder="Descreva detalhadamente a ação realizada..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setShowInternalActionModal(false)}>
                        Cancelar
                      </Button>
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Ação
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Actions List */}
            {internalActions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Ações Registradas</h3>
                {internalActions.map((action: any) => (
                  <Card key={action.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {action.id}
                          </Badge>
                          <Badge className="text-xs">
                            {action.type}
                          </Badge>
                          <Badge 
                            variant={action.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {action.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-800">{action.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>👤 {action.agent}</span>
                          <span>⏱️ {action.timeSpent}h</span>
                          <span>📅 {action.startTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {internalActions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>Nenhuma ação interna registrada ainda</p>
                <p className="text-sm">Use o botão "Nova Ação" para adicionar a primeira ação</p>
              </div>
            )}
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
