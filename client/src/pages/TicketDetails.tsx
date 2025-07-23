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
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

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

// Rich Text Editor Component
function RichTextEditor({ value, onChange, disabled = false }: { value: string, onChange: (value: string) => void, disabled?: boolean }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-md ${disabled ? 'bg-gray-50' : 'bg-white'}`}>
      {!disabled && (
        <div className="flex gap-2 p-2 border-b bg-gray-50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
          >
            <strong>B</strong>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
          >
            <em>I</em>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
          >
            • Lista
          </Button>
        </div>
      )}
      <div className="min-h-[100px] p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

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
  const [externalActions, setExternalActions] = useState<any[]>([]);
  const [showExternalActionModal, setShowExternalActionModal] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState<'simple' | 'advanced'>('simple');
  const [latestInteractions, setLatestInteractions] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState<{open: boolean, field: string, type: 'rg' | 'cpf'}>({open: false, field: '', type: 'rg'});
  const [agentPassword, setAgentPassword] = useState("");
  const [newTag, setNewTag] = useState("");
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

      // Simulate external actions data
      setExternalActions([
        {
          id: "EXT-2025-001",
          type: "vendor_contact",
          agent: "Pedro Costa",
          vendor: "Microsoft Support",
          status: "completed",
          description: "Contato com suporte da Microsoft para resolução de problema de licenciamento",
          timeSpent: "1.5",
          startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString('pt-BR'),
          endTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleString('pt-BR'),
          linkedItems: "Licença #MS-456",
          hasFile: true,
          contactMethod: "phone"
        },
        {
          id: "EXT-2025-002",
          type: "customer_followup",
          agent: "Ana Silva",
          vendor: "Cliente Externo",
          status: "pending",
          description: "Follow-up com cliente sobre validação da solução implementada",
          timeSpent: "0.5",
          startTime: new Date(Date.now() - 30 * 60 * 1000).toLocaleString('pt-BR'),
          linkedItems: "Email #789",
          hasFile: false,
          contactMethod: "email"
        }
      ]);

      // Simulate latest interactions from the same requester
      setLatestInteractions([
        {
          id: "ticket-001",
          ticketNumber: "TKT-2025-001",
          subject: "Problema de acesso ao sistema de RH",
          status: "resolved",
          priority: "medium",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
          resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
          category: "Acesso",
          description: "Usuário relatou dificuldades para acessar o portal de RH para consultar holerites"
        },
        {
          id: "ticket-002",
          ticketNumber: "TKT-2025-015",
          subject: "Solicitação de novo equipamento",
          status: "closed",
          priority: "low",
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 dias atrás
          resolvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 dias atrás
          category: "Equipamento",
          description: "Solicitação de novo monitor para workstation"
        },
        {
          id: "ticket-003",
          ticketNumber: "TKT-2024-234",
          subject: "Erro na impressora da sala 301",
          status: "closed",
          priority: "high",
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 dias atrás
          resolvedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 dias atrás
          category: "Hardware",
          description: "Impressora apresentando falhas recorrentes de papel atolado"
        },
        {
          id: "ticket-004",
          ticketNumber: "TKT-2024-198",
          subject: "Dúvida sobre procedimento de backup",
          status: "closed",
          priority: "low",
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 dias atrás
          resolvedAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000), // 33 dias atrás
          category: "Procedimento",
          description: "Solicitação de esclarecimento sobre processo de backup de arquivos importantes"
        },
        {
          id: "ticket-005",
          ticketNumber: "TKT-2024-156",
          subject: "Instalação de software específico",
          status: "closed",
          priority: "medium",
          createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 dias atrás
          resolvedAt: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000), // 47 dias atrás
          category: "Software",
          description: "Necessidade de instalação do Adobe Creative Suite para projeto específico"
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
                      <RichTextEditor 
                        value={field.value || ''}
                        onChange={field.onChange}
                        disabled={false}
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded min-h-[100px] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: field.value || '' }} />
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
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {tags.length > 0 ? (
                              tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-1"
                                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </Badge>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">Nenhuma tag</div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Input
                              type="text"
                              placeholder="Nova tag"
                              className="h-7 text-xs"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && newTag.trim() && !tags.includes(newTag.trim())) {
                                  setTags([...tags, newTag.trim()]);
                                  setNewTag('');
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                if (newTag.trim() && !tags.includes(newTag.trim())) {
                                  setTags([...tags, newTag.trim()]);
                                  setNewTag('');
                                }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </FormControl>
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

            {/* Categoria */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">CATEGORIA</h3>
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
                        <SelectItem value="not_specified">Não especificada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Classificação */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">CLASSIFICAÇÃO</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
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


              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
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
                          <SelectItem value="not_specified">Não especificado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sintomas */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">SINTOMAS</h3>
              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sintomas</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Textarea {...field} rows={3} placeholder="Não especificado" />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded min-h-[80px]">{field.value || 'Não especificado'}</div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Solução Temporária */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">SOLUÇÃO TEMPORÁRIA</h3>
              <FormField
                control={form.control}
                name="workaround"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solução Temporária</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Textarea {...field} rows={3} placeholder="Não especificado" />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded min-h-[80px]">{field.value || 'Não especificado'}</div>
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






          

          

          {/* Solicitante e Atribuído Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Atribuição</h3>
            
            {/* Solicitante */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Solicitante</h4>
              <div className="text-sm text-gray-700">
                {customers?.customers?.find((c: any) => c.id === ticket.callerId)?.name || 'Não especificado'}
              </div>
            </div>

            {/* Atribuído a */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Atribuído a</h4>
              <div className="text-sm text-gray-700">
                {users?.users?.find((u: any) => u.id === ticket.assignedToId)?.name || 'Não atribuído'}
              </div>
            </div>
          </div>

          {/* Seguidores Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Seguidores</h3>
            <div className="space-y-2">
              {followers.length > 0 ? (
                followers.map((followerId, index) => {
                  const user = users?.users?.find((u: any) => u.id === followerId);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {user?.name || followerId}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setFollowers(followers.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">Nenhum seguidor</div>
              )}
              
              <Select onValueChange={(value) => {
                if (value && !followers.includes(value)) {
                  setFollowers([...followers, value]);
                }
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="+ Adicionar agente" />
                </SelectTrigger>
                <SelectContent>
                  {users?.users?.filter((user: any) => !followers.includes(user.id)).map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Tags</h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {tags.length > 0 ? (
                  tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => setTags(tags.filter((_, i) => i !== index))}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Nenhuma tag</div>
                )}
              </div>
              
              <div className="flex gap-1">
                <Input
                  type="text"
                  placeholder="Nova tag"
                  className="h-7 text-xs"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTag.trim() && !tags.includes(newTag.trim())) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    if (newTag.trim() && !tags.includes(newTag.trim())) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
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
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Ticket #{ticket.ticketNumber}</h1>
                
                {/* Priority and Status Fields */}
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => form.setValue('priority', value)} defaultValue={ticket.priority}>
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">low</SelectItem>
                        <SelectItem value="medium">medium</SelectItem>
                        <SelectItem value="high">high</SelectItem>
                        <SelectItem value="critical">critical</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select onValueChange={(value) => form.setValue('status', value)} defaultValue={ticket.status}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">open</SelectItem>
                        <SelectItem value="in_progress">in_progress</SelectItem>
                        <SelectItem value="pending">pending</SelectItem>
                        <SelectItem value="resolved">resolved</SelectItem>
                        <SelectItem value="closed">closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                )}
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
          <h3 className="font-semibold text-lg">Explorar</h3>
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
            <span className="text-sm font-medium">Detalhes</span>
          </button>

          {/* Campos Especiais - Nova ordem */}
          <button
            onClick={() => setActiveTab("communications")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "communications" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Comunicação</span>
          </button>

          <button
            onClick={() => setActiveTab("attachments")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "attachments" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <Paperclip className="h-4 w-4" />
            <span className="text-sm font-medium">Anexos</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "notes" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Notas</span>
          </button>

          <button
            onClick={() => setActiveTab("internal-actions")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "internal-actions" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Ações Internas</span>
          </button>

          <button
            onClick={() => setActiveTab("external-actions")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "external-actions" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm font-medium">Ações Externas</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "history" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <History className="h-4 w-4" />
            <span className="text-sm font-medium">Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab("latest-interactions")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "latest-interactions" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Últimas Interações</span>
          </button>
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
                      <RichTextEditor 
                        value={field.value || ''}
                        onChange={field.onChange}
                        disabled={false}
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded min-h-[100px] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: field.value || '' }} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            



            {/* Classificação */}
            <div className="grid grid-cols-2 gap-4">
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

              {communications.slice().reverse().map((comm: any) => (
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
              {history.slice().reverse().map((entry: any, index: number) => (
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

      case "external-actions":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">🌐 Ações Externas</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {externalActions.length} ação(ões)
                </Badge>
                <Dialog open={showExternalActionModal} onOpenChange={setShowExternalActionModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Ação Externa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Ação Externa</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-4">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="external-action-id">ID da Ação *</Label>
                          <Input id="external-action-id" placeholder="EXT-2025-001" />
                        </div>

                        <div>
                          <Label htmlFor="external-action-type">Tipo de Ação *</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vendor_contact">Contato com Fornecedor</SelectItem>
                              <SelectItem value="customer_followup">Follow-up Cliente</SelectItem>
                              <SelectItem value="partner_coordination">Coordenação Parceiro</SelectItem>
                              <SelectItem value="external_validation">Validação Externa</SelectItem>
                              <SelectItem value="compliance_check">Verificação Compliance</SelectItem>
                              <SelectItem value="regulatory_contact">Contato Regulatório</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="external-action-agent">Agente Responsável *</Label>
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
                          <Label htmlFor="external-vendor">Fornecedor/Parceiro</Label>
                          <Input id="external-vendor" placeholder="Nome do fornecedor ou parceiro" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="external-start-time">Início *</Label>
                            <Input id="external-start-time" type="datetime-local" />
                          </div>
                          <div>
                            <Label htmlFor="external-end-time">Fim</Label>
                            <Input id="external-end-time" type="datetime-local" />
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="external-contact-method">Método de Contato</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Como foi o contato?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Telefone</SelectItem>
                              <SelectItem value="meeting">Reunião</SelectItem>
                              <SelectItem value="portal">Portal</SelectItem>
                              <SelectItem value="chat">Chat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="external-linked-items">Itens Relacionados</Label>
                          <Textarea 
                            id="external-linked-items" 
                            placeholder="Ex: Contrato #123, Email #456"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label htmlFor="external-time-spent">Tempo Gasto (horas)</Label>
                          <Input 
                            id="external-time-spent" 
                            type="number" 
                            step="0.5" 
                            placeholder="Ex: 1.5"
                          />
                        </div>

                        <div>
                          <Label htmlFor="external-action-status">Status *</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="in-progress">Em Progresso</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                              <SelectItem value="waiting-response">Aguardando Resposta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="external-action-file">Arquivo de Apoio</Label>
                          <Input id="external-action-file" type="file" />
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo 50MB. Contratos, emails, evidências
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="external-action-description">Descrição da Ação *</Label>
                          <Textarea 
                            id="external-action-description" 
                            placeholder="Descreva detalhadamente a ação externa realizada..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setShowExternalActionModal(false)}>
                        Cancelar
                      </Button>
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Ação Externa
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* External Actions List */}
            {externalActions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Ações Externas Registradas</h3>
                {externalActions.map((action: any) => (
                  <Card key={action.id} className="p-4 border-l-4 border-l-orange-400">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {action.id}
                          </Badge>
                          <Badge className="text-xs bg-orange-100 text-orange-800">
                            {action.type}
                          </Badge>
                          <Badge 
                            variant={action.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {action.status}
                          </Badge>
                          {action.contactMethod && (
                            <Badge variant="outline" className="text-xs">
                              📞 {action.contactMethod}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-800">{action.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>👤 {action.agent}</span>
                          <span>🏢 {action.vendor}</span>
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

            {externalActions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ExternalLink className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>Nenhuma ação externa registrada ainda</p>
                <p className="text-sm">Use o botão "Nova Ação Externa" para adicionar a primeira ação</p>
              </div>
            )}
          </div>
        );

      case "latest-interactions":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">🕒 Últimas Interações</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {latestInteractions.length} ticket(s) do solicitante
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {ticket?.customer?.name || 'Solicitante'}
                </Badge>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-400">
              📋 <strong>Histórico de tickets:</strong> Mostra todos os tickets anteriores deste solicitante em ordem cronológica decrescente
            </div>

            {/* Timeline de Tickets */}
            <div className="space-y-4">
              {latestInteractions.length > 0 ? (
                latestInteractions.map((interaction: any, index: number) => (
                  <div key={interaction.id} className="flex gap-4">
                    {/* Timeline Indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${
                        interaction.status === 'resolved' ? 'bg-green-500' :
                        interaction.status === 'closed' ? 'bg-gray-500' :
                        interaction.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`} />
                      {index < latestInteractions.length - 1 && (
                        <div className="w-0.5 bg-gray-200 flex-1 mt-2 min-h-[60px]" />
                      )}
                    </div>

                    {/* Ticket Content */}
                    <Card className="flex-1 p-4 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-blue-600">
                              #{interaction.ticketNumber}
                            </span>
                            <Badge 
                              variant={interaction.status === 'resolved' || interaction.status === 'closed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {interaction.status === 'resolved' ? 'Resolvido' :
                               interaction.status === 'closed' ? 'Fechado' :
                               interaction.status === 'in_progress' ? 'Em Progresso' :
                               interaction.status === 'open' ? 'Aberto' : interaction.status}
                            </Badge>
                            <Badge 
                              className={`text-xs ${getPriorityColor(interaction.priority)}`}
                            >
                              {interaction.priority === 'high' ? 'Alta' :
                               interaction.priority === 'medium' ? 'Média' :
                               interaction.priority === 'low' ? 'Baixa' :
                               interaction.priority === 'critical' ? 'Crítica' : interaction.priority}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Subject */}
                        <h3 className="font-medium text-gray-800">
                          {interaction.subject}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {interaction.description}
                        </p>

                        {/* Meta Information */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>📅 Criado: {interaction.createdAt.toLocaleDateString('pt-BR')}</span>
                            {interaction.resolvedAt && (
                              <span>✅ Resolvido: {interaction.resolvedAt.toLocaleDateString('pt-BR')}</span>
                            )}
                            <span>🏷️ {interaction.category}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {interaction.resolvedAt && (
                              <span className="text-green-600">
                                ⏱️ {Math.ceil((interaction.resolvedAt - interaction.createdAt) / (1000 * 60 * 60 * 24))} dia(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Nenhum ticket anterior encontrado</p>
                  <p className="text-sm">Este é o primeiro ticket deste solicitante</p>
                </div>
              )}
            </div>

            {/* Summary Statistics */}
            {latestInteractions.length > 0 && (
              <Card className="p-4 bg-gray-50">
                <h4 className="font-medium text-gray-800 mb-3">📊 Resumo Estatístico</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-600">
                      {latestInteractions.length}
                    </div>
                    <div className="text-gray-600">Total de Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-600">
                      {latestInteractions.filter(t => t.status === 'resolved' || t.status === 'closed').length}
                    </div>
                    <div className="text-gray-600">Resolvidos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-orange-600">
                      {latestInteractions.filter(t => t.priority === 'high' || t.priority === 'critical').length}
                    </div>
                    <div className="text-gray-600">Alta/Crítica</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-purple-600">
                      {Math.round(latestInteractions
                        .filter(t => t.resolvedAt)
                        .reduce((acc, t) => acc + Math.ceil((t.resolvedAt - t.createdAt) / (1000 * 60 * 60 * 24)), 0) / 
                        latestInteractions.filter(t => t.resolvedAt).length) || 0}d
                    </div>
                    <div className="text-gray-600">Tempo Médio</div>
                  </div>
                </div>
              </Card>
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
