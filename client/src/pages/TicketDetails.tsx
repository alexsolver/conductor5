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
  Heading1, Heading2, Heading3, Undo, Redo, Strikethrough, AlertTriangle,
  Mail, PlusCircle, Activity, RefreshCw, Ticket, Link, EyeOff,
  CheckCircle, Star, TrendingUp, Building2, MapPin, BarChart3
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
import InternalActionModal from "@/components/tickets/InternalActionModal";


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
  const [relatedTickets, setRelatedTickets] = useState<any[]>([]);
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(false);


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

  // Fetch companies for client company selection
  const { data: companiesData } = useQuery({
    queryKey: ["/api/customers/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers/companies");
      return response.json();
    },
  });

  // Fetch field options for impact, urgency, and locations
  const { data: impactOptions } = useQuery({
    queryKey: ["/api/ticket-metadata/field-options", "impact"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ticket-metadata/field-options/impact");
      return response.json();
    },
  });

  const { data: urgencyOptions } = useQuery({
    queryKey: ["/api/ticket-metadata/field-options", "urgency"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ticket-metadata/field-options/urgency");
      return response.json();
    },
  });

  const { data: locationsData } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations");
      return response.json();
    },
  });

  // Fetch ticket relationships (attachments, notes, etc.)
  const { data: ticketRelationships } = useQuery({
    queryKey: ["/api/tickets", id, "relationships"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}/relationships`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch real ticket history data from API
  const { data: ticketHistoryData } = useQuery({
    queryKey: ["/api/ticket-history/tickets", id, "history"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ticket-history/tickets/${id}/history`);
      return response.json();
    },
    enabled: !!id,
  });

  const customers = Array.isArray(customersData?.customers) ? customersData.customers : [];

  // Initialize data from ticket relationships
  useEffect(() => {
    if (ticketRelationships) {
      setAttachments(ticketRelationships.attachments || []);
      setNotes(ticketRelationships.notes || []);
      setCommunications(ticketRelationships.communications || []);
      setRelatedTickets(ticketRelationships.related_tickets || []);
      setLatestInteractions(ticketRelationships.latest_interactions || []);
      setFollowers(ticket?.followers || []);
      setTags(ticket?.tags || []);
    }
  }, [ticketRelationships, ticket]);

  // Initialize real history data from API
  useEffect(() => {
    if (ticketHistoryData?.success && ticketHistoryData?.data) {
      setHistory(ticketHistoryData.data);
    }
  }, [ticketHistoryData]);

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

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await apiRequest("POST", `/api/tickets/${id}/notes`, {
        content: newNote,
        ticketId: id
      });
      const result = await response.json();

      setNotes(prev => [...prev, result]);
      setNewNote("");

      toast({
        title: "Nota adicionada",
        description: "A nota foi salva com sucesso.",
      });
    } catch (error) {
      console.error('Failed to add note:', error);
      // Fallback to local state
      const note = {
        id: Date.now(),
        content: newNote,
        createdAt: new Date(),
        createdBy: "Usuário Atual"
      };

      setNotes(prev => [...prev, note]);
      setNewNote("");
    }
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
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">📜 Histórico Completo</h2>
              <div className="flex gap-2">
                <Button
                  variant={historyViewMode === 'simple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryViewMode('simple')}
                >
                  Simples
                </Button>
                <Button
                  variant={historyViewMode === 'advanced' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryViewMode('advanced')}
                >
                  Detalhado
                </Button>
              </div>
            </div>

            {/* Timeline de Interações */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <History className="h-4 w-4" />
                {historyViewMode === 'simple' ? 'Todas as Interações' : 'Análise Técnica Detalhada'}
              </h3>

              <div className="space-y-3 border-l-2 border-gray-200 pl-4">
                {/* Real history data from API */}
                {history.length > 0 ? history.map((historyItem: any, index: number) => {
                  // Map action types to icons and colors
                  const getActionIcon = (actionType: string) => {
                    switch (actionType) {
                      case 'created': return { icon: PlusCircle, color: 'green' };
                      case 'assigned': 
                      case 'assignment': return { icon: User, color: 'blue' };
                      case 'status_changed':
                      case 'status_change': return { icon: RefreshCw, color: 'orange' };
                      case 'viewed': return { icon: Eye, color: 'purple' };
                      case 'email_sent': 
                      case 'email_received': return { icon: Mail, color: 'indigo' };
                      case 'communication': return { icon: MessageSquare, color: 'teal' };
                      case 'attachment_added': return { icon: Paperclip, color: 'pink' };
                      default: return { icon: Activity, color: 'gray' };
                    }
                  };

                  const { icon: Icon, color } = getActionIcon(historyItem.action_type);

                  return (
                    <div key={historyItem.id} className="relative">
                      <div className={`absolute -left-6 w-3 h-3 bg-${color}-500 rounded-full`}></div>
                      <Card className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 text-${color}-600`} />
                            <span className="font-medium text-sm">
                              {historyItem.action_type === 'created' && 'Ticket Criado'}
                              {historyItem.action_type === 'assigned' && 'Atribuição'}
                              {historyItem.action_type === 'assignment' && 'Atribuição'}
                              {historyItem.action_type === 'status_changed' && 'Status Alterado'}
                              {historyItem.action_type === 'status_change' && 'Status Alterado'}
                              {historyItem.action_type === 'viewed' && 'Visualização'}
                              {historyItem.action_type === 'email_sent' && 'Email Enviado'}
                              {historyItem.action_type === 'email_received' && 'Email Recebido'}
                              {historyItem.action_type === 'communication' && 'Comunicação'}
                              {historyItem.action_type === 'attachment_added' && 'Anexo Adicionado'}
                              {!['created', 'assigned', 'assignment', 'status_changed', 'status_change', 'viewed', 'email_sent', 'email_received', 'communication', 'attachment_added'].includes(historyItem.action_type) && 'Atividade'}
                            </span>
                            {historyViewMode === 'advanced' && (
                              <Badge variant="secondary" className="text-xs">
                                {historyItem.action_type.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(historyItem.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {historyItem.description || `Ação realizada por ${historyItem.performed_by_name}`}
                          {historyItem.field_name && historyItem.old_value && historyItem.new_value && (
                            ` - ${historyItem.field_name}: "${historyItem.old_value}" → "${historyItem.new_value}"`
                          )}
                        </p>
                        {historyViewMode === 'advanced' && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                            <p>User: {historyItem.performed_by_name} | IP: {historyItem.ip_address || 'N/A'}</p>
                            {historyItem.user_agent && (
                              <p>User-Agent: {historyItem.user_agent}</p>
                            )}
                            {historyItem.session_id && (
                              <p>Session: {historyItem.session_id}</p>
                            )}
                            {historyItem.metadata && (
                              <p>Metadata: {JSON.stringify(historyItem.metadata, null, 2)}</p>
                            )}
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                }) : (
                  <div className="text-center text-gray-500 py-8">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum histórico disponível</p>
                  </div>
                )}


              </div>
            </div>

            {/* Related Tickets - usando dados reais do ticketRelationships */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <Link className="h-4 w-4" />
                Tickets Relacionados
                <Badge variant="outline" className="text-xs">
                  {ticketRelationships?.related_tickets?.length || 0}
                </Badge>
              </h3>
              {ticketRelationships?.related_tickets && ticketRelationships.related_tickets.length > 0 ? 
                ticketRelationships.related_tickets.map((relTicket: any) => (
                  <Card key={relTicket.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={relTicket.status === 'open' ? 'destructive' : 
                                  relTicket.status === 'in_progress' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {relTicket.status === 'open' ? 'Aberto' :
                           relTicket.status === 'in_progress' ? 'Em Progresso' :
                           relTicket.status === 'resolved' ? 'Resolvido' : 'Fechado'}
                        </Badge>
                        <span className="font-medium">{relTicket.ticket_number}</span>
                      </div>
                      <Badge 
                        variant={relTicket.priority === 'high' ? 'destructive' : 
                                relTicket.priority === 'medium' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {relTicket.priority === 'high' ? 'Alta' :
                         relTicket.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-800 mt-2">{relTicket.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1">{relTicket.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>Categoria: {relTicket.category}</span>
                      <span>
                        {relTicket.resolved_at 
                          ? `Resolvido em ${new Date(relTicket.resolved_at).toLocaleDateString('pt-BR')}`
                          : `Criado em ${new Date(relTicket.created_at).toLocaleDateString('pt-BR')}`
                        }
                      </span>
                    </div>
                  </Card>
                )) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Nenhum ticket relacionado</p>
                  <p className="text-sm">Tickets similares aparecerão automaticamente aqui</p>
                </div>
              )}
            </div>
          </div>
        );

      case "internal-actions":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">⚙️ Ações Internas</h2>
              <Button 
                onClick={() => setShowInternalActionModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Ação
              </Button>
            </div>

            <div className="space-y-4">
              {internalActions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Nenhuma ação interna registrada</p>
                  <p className="text-xs text-gray-400">Use o botão "Nova Ação" para começar</p>
                </div>
              ) : (
                internalActions.map((action) => (
                  <Card key={action.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-sm">{action.createdByName}</span>
                            <Badge variant={action.isPublic ? 'default' : 'secondary'}>
                              {action.isPublic ? 'Público' : 'Privado'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(action.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap">{action.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );

      case "external-actions":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">🔗 Ações Externas</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline" className="h-16 justify-start">
                <ExternalLink className="h-5 w-5 mr-3" />
                Abrir no ServiceNow
              </Button>
              <Button variant="outline" className="h-16 justify-start">
                <MessageSquare className="h-5 w-5 mr-3" />
                Criar thread no Slack
              </Button>
              <Button variant="outline" className="h-16 justify-start">
                <Mail className="h-5 w-5 mr-3" />
                Enviar por email
              </Button>
            </div>
          </div>
        );

      case "latest-interactions":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">🕒 Últimas Interações</h2>
              <Badge variant="outline" className="text-xs">
                Histórico do Solicitante
              </Badge>
            </div>

            {/* Informações do Solicitante */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">{ticket.customerName || 'Cliente'}</h3>
                  <p className="text-sm text-blue-700">{ticket.customerEmail || ticket.contactEmail}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Cliente desde: Janeiro 2022 • Total de tickets: 8
                  </p>
                </div>
              </div>
            </Card>

            {/* Últimos Tickets do Solicitante */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <History className="h-4 w-4" />
                Últimos Tickets Abertos por {ticket.customerName || 'Este Cliente'}
              </h3>

              <div className="space-y-3">
                {/* Ticket Atual */}
                <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="bg-blue-600">
                        ATUAL
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">#{ticket.ticketNumber || 'T-2024-001'}</p>
                        <p className="text-sm text-gray-700 mt-1">{ticket.subject || 'Problema com sistema'}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Criado em {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pt-BR') : 'hoje'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={ticket.priority === 'high' ? 'destructive' : 
                              ticket.priority === 'medium' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {ticket.priority === 'high' ? 'Alta' :
                       ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </Card>

                {/* Tickets Anteriores */}
                <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        RESOLVIDO
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">#T-2024-087</p>
                        <p className="text-sm text-gray-700 mt-1">Erro de login no portal do cliente</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Criado em 15/01/2025 • Resolvido em 2h 30min
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Acesso</Badge>
                          <span className="text-xs text-gray-500">Responsável: Ana Silva</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">Média</Badge>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        RESOLVIDO
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">#T-2024-045</p>
                        <p className="text-sm text-gray-700 mt-1">Dúvida sobre funcionalidade de relatórios</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Criado em 08/01/2025 • Resolvido em 45min
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Dúvida</Badge>
                          <span className="text-xs text-gray-500">Responsável: João Santos</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">Baixa</Badge>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        FECHADO
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">#T-2023-298</p>
                        <p className="text-sm text-gray-700 mt-1">Solicitação de nova funcionalidade</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Criado em 28/12/2023 • Implementado em versão 2.1
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Feature Request</Badge>
                          <span className="text-xs text-gray-500">Responsável: Equipe Desenvolvimento</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">Média</Badge>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        RESOLVIDO
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">#T-2023-276</p>
                        <p className="text-sm text-gray-700 mt-1">Problema na sincronização de dados</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Criado em 20/12/2023 • Resolvido em 4h 15min
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Técnico</Badge>
                          <span className="text-xs text-gray-500">Responsável: Pedro Lima</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">Alta</Badge>
                  </div>
                </Card>
              </div>
            </div>

            {/* Estatísticas do Cliente */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="p-2 bg-blue-100 rounded-full w-fit mx-auto mb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-lg font-semibold">8</p>
                <p className="text-xs text-gray-500">Total Tickets</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="p-2 bg-green-100 rounded-full w-fit mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-lg font-semibold">7</p>
                <p className="text-xs text-gray-500">Resolvidos</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="p-2 bg-yellow-100 rounded-full w-fit mx-auto mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-lg font-semibold">2h 15min</p>
                <p className="text-xs text-gray-500">Tempo Médio</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="p-2 bg-purple-100 rounded-full w-fit mx-auto mb-2">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-lg font-semibold">4.8</p>
                <p className="text-xs text-gray-500">Satisfação</p>
              </Card>
            </div>

            {/* Padrões de Comportamento */}
            <Card className="p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Insights do Cliente
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Cliente experiente com alta taxa de resolução (87.5%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Preferencialmente abre tickets via email (75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Horário mais comum: Manhã (9h-11h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Categoria mais frequente: Dúvidas técnicas</span>
                </div>
              </div>
            </Card>
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

          {/* Empresa Cliente Section - Topo */}
          <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                EMPRESA CLIENTE
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                onClick={() => setIsCompanyDetailsOpen(true)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Ver Detalhes
              </Button>
            </div>
            <div className="space-y-2">
              {isEditMode ? (
                <Select 
                  onValueChange={(value) => form.setValue('customerCompanyId', value)} 
                  defaultValue={ticket.customerCompanyId || ticket.company || ''}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione a empresa cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Não especificado</SelectItem>
                    {companiesData?.data?.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm cursor-pointer hover:text-blue-700 transition-colors"
                     onClick={() => setIsCompanyDetailsOpen(true)}>
                  <span className="font-medium text-blue-900 underline decoration-dotted">
                    {companiesData?.data?.find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.name || 
                     ticket.customerCompany?.name || ticket.company || 'Não especificado'}
                  </span>
                </div>
              )}
              {(ticket.customerCompany?.industry || companiesData?.data?.find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.industry) && (
                <div className="text-xs text-blue-600 mt-1">
                  🏷️ Setor: {ticket.customerCompany?.industry || companiesData?.data?.find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.industry}
                </div>
              )}
              {(ticket.customerCompany?.cnpj || companiesData?.data?.find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.cnpj) && (
                <div className="text-xs text-blue-600">
                  📄 CNPJ: {ticket.customerCompany?.cnpj || companiesData?.data?.find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.cnpj}
                </div>
              )}
            </div>
          </div>

          {/* Impacto, Urgência e Local Section */}
          <div className="mb-6 space-y-4">
            {/* Impacto */}
            <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  IMPACTO
                </h3>
              </div>
              <div className="space-y-2">
                {isEditMode ? (
                  <Select 
                    onValueChange={(value) => form.setValue('impact', value)} 
                    defaultValue={ticket.impact || ''}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione o impacto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">Não especificado</SelectItem>
                      {impactOptions?.data?.map((option: any) => (
                        <SelectItem key={option.id} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-orange-900 font-medium">
                    {impactOptions?.data?.find((o: any) => o.value === ticket.impact)?.label || 
                     ticket.impact || 'Não especificado'}
                  </div>
                )}
              </div>
            </div>

            {/* Urgência */}
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  URGÊNCIA
                </h3>
              </div>
              <div className="space-y-2">
                {isEditMode ? (
                  <Select 
                    onValueChange={(value) => form.setValue('urgency', value)} 
                    defaultValue={ticket.urgency || ''}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">Não especificado</SelectItem>
                      {urgencyOptions?.data?.map((option: any) => (
                        <SelectItem key={option.id} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-yellow-900 font-medium">
                    {urgencyOptions?.data?.find((o: any) => o.value === ticket.urgency)?.label || 
                     ticket.urgency || 'Não especificado'}
                  </div>
                )}
              </div>
            </div>

            {/* Local */}
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  LOCAL
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-100"
                  onClick={() => console.log('Open locations management')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Gerenciar
                </Button>
              </div>
              <div className="space-y-2">
                {isEditMode ? (
                  <Select 
                    onValueChange={(value) => form.setValue('location', value)} 
                    defaultValue={ticket.location || ''}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">Não especificado</SelectItem>
                      {locationsData?.data?.map((location: any) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-green-900 font-medium cursor-pointer hover:text-green-700 transition-colors"
                       onClick={() => console.log('Open location details')}>
                    <span className="underline decoration-dotted">
                      {locationsData?.data?.find((l: any) => l.id === ticket.location)?.name || 
                       ticket.location || 'Não especificado'}
                    </span>
                  </div>
                )}
                {(ticket.locationDetails || locationsData?.data?.find((l: any) => l.id === ticket.location)) && (
                  <div className="text-xs text-green-600">
                    📍 {ticket.locationDetails?.address || 
                        locationsData?.data?.find((l: any) => l.id === ticket.location)?.address || 
                        'Endereço não informado'}
                  </div>
                )}
              </div>
            </div>
          </div>

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

      {/* Internal Action Modal */}
      <InternalActionModal 
        ticketId={id || ''} 
        isOpen={showInternalActionModal} 
        onClose={() => setShowInternalActionModal(false)} 
      />

      {/* Company Details Modal */}
      <Dialog open={isCompanyDetailsOpen} onOpenChange={setIsCompanyDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Detalhes da Empresa Cliente
            </DialogTitle>
            <DialogDescription>
              Informações completas e gestão da empresa vinculada ao ticket
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nome da Empresa</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      {ticket?.customerCompany?.name || ticket?.company || 'Empresa Não Especificada'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">CNPJ</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.cnpj || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Setor</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.industry || 'Não especificado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Porte</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.size || 'Não especificado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contatos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contatos Principais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Email Principal</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.email || 'contato@empresa.com'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.phone || '(11) 1234-5678'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Responsável Técnico</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.techContact || 'Não designado'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Gerente de Conta</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.accountManager || 'Não designado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Logradouro</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.address || 'Endereço não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">CEP</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.zipCode || '00000-000'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cidade</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.city || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Estado</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.state || 'SP'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">País</Label>
                    <p className="text-sm text-gray-900">
                      {ticket?.customerCompany?.country || 'Brasil'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas e Histórico */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Estatísticas de Suporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-xs text-gray-600">Total de Tickets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">9</p>
                    <p className="text-xs text-gray-600">Resolvidos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">2h 15min</p>
                    <p className="text-xs text-gray-600">Tempo Médio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">4.8/5</p>
                    <p className="text-xs text-gray-600">Satisfação</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => navigate("/customers")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Clientes
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/contracts")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Contratos
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/tickets?company=" + (ticket?.customerCompany?.id || ''))}
              >
                <Ticket className="h-4 w-4 mr-2" />
                Todos os Tickets
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open(`mailto:${ticket?.customerCompany?.email}`, '_blank')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsCompanyDetailsOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}