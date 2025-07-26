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
  Clock, Download, ExternalLink, Filter, MoreVertical, Trash, Link2,
  Bold, Italic, Underline, List, ListOrdered, Quote, Code, 
  Heading1, Heading2, Heading3, Undo, Redo, Strikethrough
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
import { DynamicSelect } from "@/components/DynamicSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useTicketMetadata } from "@/hooks/useTicketMetadata";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";

// Form schema
const ticketFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  impact: z.enum(["low", "medium", "high", "critical"]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
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
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
          {/* Undo/Redo */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
            title="Título 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
            title="Título 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Text Formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-gray-200' : ''}
            title="Riscado"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'bg-gray-200' : ''}
            title="Código"
          >
            <Code className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Lists */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            title="Lista com marcadores"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Quote */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="min-h-[100px] p-3">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none focus:outline-none"
        />
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
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);

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
        followers: ticket.followers || [],
      });
      
      // Initialize followers from ticket data
      if (ticket.followers && Array.isArray(ticket.followers)) {
        setFollowers(ticket.followers);
      }
      
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



  // First check if ticket exists
  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Ticket não encontrado</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/tickets")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Tickets
          </Button>
        </div>
      </div>
    );
  }

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
                    <FormControl>
                      <DynamicSelect
                        fieldName="status"
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Selecione o status"
                        disabled={!isEditMode}
                      />
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
                    <FormControl>
                      <DynamicSelect
                        fieldName="category" 
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Selecione a categoria"
                        disabled={!isEditMode}
                      />
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <FormControl>
                        <DynamicSelect
                          fieldName="priority"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecione a prioridade"
                          disabled={!isEditMode}
                        />
                      </FormControl>
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
                      <FormControl>
                        <DynamicSelect
                          fieldName="impact"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecione o impacto"
                          disabled={!isEditMode}
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
                      <FormLabel>Urgência</FormLabel>
                      <FormControl>
                        <DynamicSelect
                          fieldName="urgency"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecione a urgência"
                          disabled={!isEditMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <DynamicSelect
                          fieldName="status"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecione o status"
                          disabled={!isEditMode}
                        />
                      </FormControl>
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
                      <FormControl>
                        <DynamicSelect
                          fieldName="location"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecione a localização"
                          disabled={!isEditMode}
                        />
                      </FormControl>
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
              {isEditMode ? (
                <Select 
                  onValueChange={(value) => form.setValue('callerId', value)} 
                  defaultValue={ticket.callerId || ''}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione o solicitante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Não especificado</SelectItem>
                    {customers?.customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-700">
                  {ticket.callerId === 'unspecified' || !ticket.callerId ? 'Não especificado' : 
                   customers?.customers?.find((c: any) => c.id === ticket.callerId)?.name || 'Não especificado'}
                </div>
              )}
            </div>

            {/* Atribuído a */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Atribuído a</h4>
              {isEditMode ? (
                <Select 
                  onValueChange={(value) => form.setValue('assignedToId', value)} 
                  defaultValue={ticket.assignedToId || ''}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                    {users?.users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-700">
                  {ticket.assignedToId === 'unassigned' || !ticket.assignedToId ? 'Não atribuído' : 
                   users?.users?.find((u: any) => u.id === ticket.assignedToId)?.name || 'Não atribuído'}
                </div>
              )}
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
                      {isEditMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const newFollowers = followers.filter((_, i) => i !== index);
                            setFollowers(newFollowers);
                            form.setValue('followers', newFollowers);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">Nenhum seguidor</div>
              )}
              
              {isEditMode && (
                <Select onValueChange={(value) => {
                  if (value && !followers.includes(value)) {
                    const newFollowers = [...followers, value];
                    setFollowers(newFollowers);
                    form.setValue('followers', newFollowers);
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
              )}
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
                    <DynamicSelect
                      fieldName="priority"
                      value={ticket.priority}
                      onValueChange={(value) => form.setValue('priority', value as any)}
                      className="w-24 h-8"
                    />
                    
                    <DynamicSelect
                      fieldName="status"
                      value={ticket.status}
                      onValueChange={(value) => form.setValue('status', value as any)}
                      className="w-32 h-8"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <DynamicBadge fieldName="priority" value={ticket.priority}>
                      {ticket.priority}
                    </DynamicBadge>
                    <DynamicBadge fieldName="status" value={ticket.status}>
                      {ticket.status}
                    </DynamicBadge>
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
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      console.log("🔗 Botão Vincular clicado!");
                      setIsLinkingModalOpen(true);
                    }}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    style={{ backgroundColor: '#dbeafe', borderColor: '#93c5fd', color: '#1d4ed8' }}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Vincular
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
                <h4 className="text-xs font-semibold text-gray-700">CLIENTE</h4>
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
                        Digite sua senha para acessar dados sensíveis do cliente
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
      
      {/* TicketLinkingModal */}
      <TicketLinkingModal
        isOpen={isLinkingModalOpen}
        onClose={() => setIsLinkingModalOpen(false)}
        currentTicket={ticket}
      />
    </div>
  );
}
