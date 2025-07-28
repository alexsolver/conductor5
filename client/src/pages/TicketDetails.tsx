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


// 🚨 CORREÇÃO CRÍTICA: Usar schema unificado para consistência
import { ticketFormSchema, type TicketFormData } from "../../../shared/ticket-validation";

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



  // Estados para modal de ação interna
  const [newInternalAction, setNewInternalAction] = useState('');
  const [internalActionType, setInternalActionType] = useState('');
  const [isPublicAction, setIsPublicAction] = useState(false);


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

  // Fetch customers for selected company
  const [selectedCompanyCustomers, setSelectedCompanyCustomers] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  // PROBLEMA 9 RESOLVIDO: Otimizar fetch de customers - sem logs redundantes
  useEffect(() => {
    const fetchCompanyCustomers = async () => {
      const companyId = ticket?.customer_id || ticket?.customerCompanyId || ticket?.company;

      // Skip if no company or same as current
      if (!companyId || companyId === 'unspecified' || companyId === selectedCompany) {
        if (!companyId || companyId === 'unspecified') {
          setSelectedCompanyCustomers([]);
        }
        return;
      }

      setSelectedCompany(companyId);

      try {
        const response = await apiRequest("GET", `/api/companies/${companyId}/customers`);
        const data = await response.json();

        if (data.success && data.customers) {
          setSelectedCompanyCustomers(data.customers);
        } else {
          setSelectedCompanyCustomers([]);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setSelectedCompanyCustomers([]);
      }
    };

    if (ticket) {
      fetchCompanyCustomers();
    }
  }, [ticket?.customer_id, ticket?.customerCompanyId, ticket?.company, selectedCompany]);

  // PROBLEMA 9 RESOLVIDO: Handle company change otimizado
  const handleCompanyChange = async (newCompanyId: string) => {
    // Only proceed if company actually changed
    if (newCompanyId === selectedCompany) return;

    setSelectedCompany(newCompanyId);
    form.setValue('customerCompanyId', newCompanyId);

    // Reset customer selections only when changing company
    form.setValue('callerId', '');
    form.setValue('beneficiaryId', '');

    // Fetch new customers only if valid company selected
    if (newCompanyId && newCompanyId !== 'unspecified') {
      try {
        const response = await apiRequest("GET", `/api/companies/${newCompanyId}/customers`);
        const data = await response.json();

        if (data.success && data.customers) {
          setSelectedCompanyCustomers(data.customers);
        } else {
          setSelectedCompanyCustomers([]);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setSelectedCompanyCustomers([]);
      }
    } else {
      setSelectedCompanyCustomers([]);
    }
  };

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
    queryKey: ["/api/tickets", id, "history"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}/history`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch ticket communications from API
  const { data: ticketCommunications } = useQuery({
    queryKey: ["/api/tickets", id, "communications"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}/communications`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch ticket notes from API
  const { data: ticketNotes } = useQuery({
    queryKey: ["/api/tickets", id, "notes"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}/notes`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch ticket attachments from API
  const { data: ticketAttachments } = useQuery({
    queryKey: ["/api/tickets", id, "attachments"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}/attachments`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch ticket actions from API
  const { data: ticketActions } = useQuery({
    queryKey: ["/api/tickets", id, "actions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}/actions`);
      return response.json();
    },
    enabled: !!id,
  });

  const customers = Array.isArray(customersData?.customers) ? customersData.customers : [];

  // Use company-specific customers if available, otherwise fall back to all customers
  const availableCustomers = selectedCompanyCustomers.length > 0 ? selectedCompanyCustomers : customers;

  // Initialize data from API responses - NO MORE HARDCODED DATA
  useEffect(() => {
    // Set communications from API
    if (ticketCommunications?.success && ticketCommunications?.data) {
      setCommunications(ticketCommunications.data);
    } else if (ticketRelationships?.communications) {
      setCommunications(ticketRelationships.communications);
    } else {
      setCommunications([]);
    }

    // Set attachments from API
    if (ticketAttachments?.success && ticketAttachments?.data) {
      setAttachments(ticketAttachments.data);
    } else if (ticketRelationships?.attachments) {
      setAttachments(ticketRelationships.attachments);
    } else {
      setAttachments([]);
    }

    // Set notes from API
    if (ticketNotes?.success && ticketNotes?.data) {
      setNotes(ticketNotes.data);
    } else if (ticketRelationships?.notes) {
      setNotes(ticketRelationships.notes);
    } else {
      setNotes([]);
    }

    // Set actions from API - all actions are internal by default from ticket_actions table
    if (ticketActions?.success && ticketActions?.data) {
      const actions = ticketActions.data;
      // All actions from ticket_actions table are internal actions
      setInternalActions(actions);
      setExternalActions([]); // External actions would come from a different endpoint
    } else {
      setInternalActions([]);
      setExternalActions([]);
    }

    // Set related data from relationships
    if (ticketRelationships) {
      setRelatedTickets(ticketRelationships.related_tickets || []);
      setLatestInteractions(ticketRelationships.latest_interactions || []);
    }

    // Set ticket-specific data
    if (ticket) {
      setFollowers(ticket.followers || []);
      setTags(ticket.tags || []);
    }
  }, [ticketCommunications, ticketAttachments, ticketNotes, ticketActions, ticketRelationships, ticket]);

  // Initialize real history data from API
  useEffect(() => {
    if (ticketHistoryData?.success && ticketHistoryData?.data) {
      setHistory(ticketHistoryData.data);
    } else {
      setHistory([]);
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setNotes(prev => [...prev, result.data]);
        setNewNote("");

        toast({
          title: "Nota adicionada",
          description: "A nota foi salva com sucesso.",
        });
      } else {
        throw new Error(result.message || "Failed to add note");
      }
    } catch (error) {
      console.error('Failed to add note:', error);

      toast({
        title: "Erro",
        description: "Erro ao adicionar nota. Tente novamente.",
        variant: "destructive",
      });
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
      status: "open",
      callerId: "",
      callerType: "customer",
      beneficiaryType: "customer",
      contactType: "email",
    },
  });

  // PROBLEMA 6 RESOLVIDO: Reset form completo com todos os campos
  useEffect(() => {
    if (ticket) {
      form.reset({
        subject: ticket.subject || "",
        description: ticket.description || "",
        priority: ticket.priority || "medium",
        status: ticket.status || "open",
        category: ticket.category || "",
        subcategory: ticket.subcategory || "",
        impact: ticket.impact || "medium",
        urgency: ticket.urgency || "medium",
        // PROBLEMA 6 RESOLVIDO: Reset COMPLETO com todos os campos faltantes
        businessImpact: ticket.business_impact || "",
        symptoms: ticket.symptoms || "",
        workaround: ticket.workaround || "",
        resolution: ticket.resolution || "",
        environment: ticket.environment || "",
        templateName: ticket.template_name || "",
        templateAlternative: ticket.template_alternative || "",
        linkTicketNumber: ticket.link_ticket_number || "",
        linkType: ticket.link_type || "",
        linkComment: ticket.link_comment || "",
        estimatedHours: ticket.estimated_hours || 0,
        actualHours: ticket.actual_hours || 0,
        // CORRIGIDO: Field mapping consistente backend snake_case → frontend camelCase  
        callerId: ticket.caller_id || "",
        callerType: ticket.caller_type || "customer",
        beneficiaryId: ticket.beneficiary_id || "",
        beneficiaryType: ticket.beneficiary_type || "customer", 
        assignedToId: ticket.assigned_to_id || "",
        assignmentGroup: ticket.assignment_group || "",
        location: ticket.location || "",
        contactType: ticket.contact_type || "email",
        followers: ticket.followers || [],
        customerCompanyId: ticket.customer_company_id || "",
      });

      // Update local states to sync with ticket data
      if (ticket.customer_company_id) {
        setSelectedCompany(ticket.customer_company_id);
      }

      // Initialize followers from ticket data
      if (ticket.followers && Array.isArray(ticket.followers)) {
        setFollowers(ticket.followers);
      }

      // Communications data now handled by API integration above

      // History data now handled by API integration above

      // Internal actions, external actions, and latest interactions now handled by API integration above
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

  // PROBLEMA 3 RESOLVIDO: Mapeamento completo frontend-backend
  const onSubmit = (data: TicketFormData) => {
    const mappedData = {
      // Core fields - direto sem mapeamento
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      status: data.status,
      category: data.category,
      subcategory: data.subcategory,
      impact: data.impact,
      urgency: data.urgency,

      // Assignment mapping camelCase → snake_case
      caller_id: data.callerId,
      caller_type: data.callerType,
      beneficiary_id: data.beneficiaryId,
      beneficiary_type: data.beneficiaryType,
      assigned_to_id: data.assignedToId,
      assignment_group: data.assignmentGroup,

      // CORREÇÃO PROBLEMA 3: Location field consistency - usar apenas location (campo texto)
      // 🚨 CORREÇÃO: location é campo texto, não locationId (FK inexistente)
      location: data.location || '',  // Campo texto livre conforme schema do banco
      contact_type: data.contactType,

      // Business fields
      business_impact: data.businessImpact,
      symptoms: data.symptoms,
      workaround: data.workaround,
      resolution: data.resolution,

      // Time tracking
      estimated_hours: data.estimatedHours,
      actual_hours: data.actualHours,

      // Collections
      followers: data.followers || [],
      tags: data.tags || [],

      // CORRIGIDO: Company relationship - mapeamento consistente
      customer_company_id: data.customerCompanyId,

      // Environment
      environment: data.environment,

      // Linking
      link_ticket_number: data.linkTicketNumber,
      link_type: data.linkType,
      link_comment: data.linkComment,
    };

    updateTicketMutation.mutate(mappedData);
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

            {/* Classificação */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">CLASSIFICAÇÃO</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade *</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <DynamicSelect
                            fieldName="priority"
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione a prioridade"
                            disabled={!isEditMode}
                          />
                        ) : (
                          <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
                            <DynamicBadge value={field.value}>
                              {field.value}
                            </DynamicBadge>
                          </div>
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
                      <FormLabel>Status *</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <DynamicSelect
                            fieldName="status"
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione o status"
                            disabled={!isEditMode}
                          />
                        ) : (
                          <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
                            <DynamicBadge value={field.value}>
                              {field.value}
                            </DynamicBadge>
                          </div>
                        )}
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