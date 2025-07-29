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
  const [isAddingNote, setIsAddingNote] = useState(false);
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
      // Use the correct field mapping - customer_company_id is the main field
      const companyId = ticket?.customer_company_id || ticket?.customerCompanyId || ticket?.company;

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
  }, [ticket?.customer_company_id, ticket?.customerCompanyId, ticket?.company, selectedCompany]);

  // PROBLEMA 9 RESOLVIDO: Handle company change otimizado
  const handleCompanyChange = async (newCompanyId: string) => {
    console.log('🏢 Company change:', { newCompanyId, selectedCompany });

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
          console.log('✅ Customers loaded for company:', data.customers.length);
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

  // Handle customer selection with proper form updates
  const handleCustomerChange = (customerId: string, type: 'caller' | 'beneficiary') => {
    console.log('👤 Customer change:', { customerId, type });

    if (type === 'caller') {
      form.setValue('callerId', customerId);
      // Se não há beneficiário específico, usar o mesmo cliente
      if (!form.getValues('beneficiaryId')) {
        form.setValue('beneficiaryId', customerId);
      }
    } else {
      form.setValue('beneficiaryId', customerId);
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
      // Map the notes data to ensure consistent field names
      const mappedNotes = ticketNotes.data.map((note: any) => ({
        ...note,
        createdBy: note.author_name || note.createdBy || 'Sistema',
        createdAt: note.created_at || note.createdAt
      }));
      setNotes(mappedNotes);
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
    if (!newNote.trim() || isAddingNote) return;

    setIsAddingNote(true);

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
    } finally {
      setIsAddingNote(false);
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
        customerCompanyId: ticket.customer_company_id || ticket.customer_id || "",
      });

      // Update local states to sync with ticket data
      if (ticket.customer_company_id || ticket.customerCompanyId) {
        setSelectedCompany(ticket.customer_company_id || ticket.customerCompanyId);
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

            {/* Básico */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">BÁSICO</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Número do Ticket */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">Número do Ticket</label>
                  <div className="p-2 bg-gray-50 rounded border">
                    <span className="text-sm font-mono">{ticket?.number || "N/A"}</span>
                  </div>
                </div>

                {/* Tipo de Contato */}
                <FormField
                  control={form.control}
                  name="contactType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contato</FormLabel>
                      <Select disabled={!isEditMode} onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="chat">Chat</SelectItem>
                          <SelectItem value="onsite">Presencial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assunto - Coluna completa */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assunto *</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Solicitante */}
                <FormField
                  control={form.control}
                  name="callerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solicitante</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleCustomerChange(value, 'caller');
                            }}
                            defaultValue={field.value}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o solicitante" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCustomers.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-2 bg-gray-50 rounded">
                            {availableCustomers.find((c: any) => c.id === field.value)?.name || "Não especificado"}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Beneficiário */}
                <FormField
                  control={form.control}
                  name="beneficiaryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beneficiário</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleCustomerChange(value, 'beneficiary');
                            }}
                            defaultValue={field.value}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o beneficiário" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCustomers.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-2 bg-gray-50 rounded">
                            {availableCustomers.find((c: any) => c.id === field.value)?.name || "Não especificado"}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Empresa */}
                <FormField
                  control={form.control}
                  name="customerCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleCompanyChange(value);
                            }}
                            defaultValue={field.value}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a empresa" />
                            </SelectTrigger>
                            <SelectContent>
                              {companiesData?.companies?.map((company: any) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-2 bg-gray-50 rounded">
                            {companiesData?.companies?.find((c: any) => c.id === field.value)?.name || "Não especificado"}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Localização */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditMode} />
                      </FormControl>
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
                {/* Impacto */}
                <FormField
                  control={form.control}
                  name="impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impacto</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o impacto" />
                            </SelectTrigger>
                            <SelectContent>
                              {impactOptions?.options?.map((option: any) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-2 bg-gray-50 rounded">
                            {impactOptions?.options?.find((o: any) => o.value === field.value)?.label || "Não especificado"}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Urgência */}
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgência</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a urgência" />
                            </SelectTrigger>
                            <SelectContent>
                              {urgencyOptions?.options?.map((option: any) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-2 bg-gray-50 rounded">
                            {urgencyOptions?.options?.find((o: any) => o.value === field.value)?.label || "Não especificado"}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Descrição */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!isEditMode}
                      />
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
          <div>
            <h2 className="text-lg font-semibold mb-4">Anexos</h2>

            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-md p-4 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <p>Arraste e solte arquivos aqui ou <span className="text-blue-500 underline">clique para selecionar</span></p>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleFiles(e.target.files);
                  }
                }}
                className="hidden"
                ref={fileInputRef}
              />
            </div>

            {/* List of Attachments */}
            {attachments.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {attachments.map(attachment => (
                  <li key={attachment.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-gray-500" />
                      <span>{attachment.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeAttachment(attachment.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-gray-500">Nenhum anexo adicionado.</p>
            )}
          </div>
        );
      case "notes":
        return (
          <div>
            <h2 className="text-lg font-semibold mb-4">Notas</h2>

            {/* Add New Note */}
            <div className="flex flex-col mb-4">
              <Textarea
                placeholder="Adicione uma nova nota..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="mb-2"
              />
              <Button onClick={addNote} disabled={isAddingNote}>
                {isAddingNote ? "Adicionando..." : "Adicionar Nota"}
              </Button>
            </div>

            {/* List of Notes */}
            {notes.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {notes.map((note, index) => (
                  <li key={index} className="p-4 rounded-md bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold">{note.createdBy}</div>
                      <div className="text-sm text-gray-500">{new Date(note.createdAt).toLocaleString()}</div>
                    </div>
                    <p>{note.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-gray-500">Nenhuma nota adicionada.</p>
            )}
          </div>
        );
      case "communications":
        return (
          <div>
            <h2 className="text-lg font-semibold mb-4">Comunicações</h2>
            {communications.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {communications.map((communication: any) => (
                  <li key={communication.id} className="p-4 rounded-md bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold">{communication.author}</div>
                      <div className="text-sm text-gray-500">{new Date(communication.date).toLocaleString()}</div>
                    </div>
                    <p>{communication.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-gray-500">Nenhuma comunicação registrada.</p>
            )}
          </div>
        );
      case "history":
        return (
          <div>
            <h2 className="text-lg font-semibold mb-4">Histórico</h2>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-end mb-4">
              <Label htmlFor="history-view-mode" className="mr-2">Modo de Exibição:</Label>
              <Select onValueChange={(value) => setHistoryViewMode(value as 'simple' | 'advanced')} defaultValue={historyViewMode}>
                <SelectTrigger id="history-view-mode">
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simples</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* History List */}
            {history.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {history.map((event: any) => (
                  <li key={event.id} className="p-4 rounded-md bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold">{event.user}</div>
                      <div className="text-sm text-gray-500">{new Date(event.date).toLocaleString()}</div>
                    </div>
                    <p>{event.description}</p>
                    {historyViewMode === 'advanced' && (
                      <div className="mt-2">
                        <pre className="bg-gray-100 p-2 rounded-md text-sm">{JSON.stringify(event.details, null, 2)}</pre>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-gray-500">Nenhum histórico disponível.</p>
            )}
          </div>
        );
      case "internal-actions":
        return (
          <div>
            <h2 className="text-lg font-semibold mb-4">Ações Internas</h2>

            {/* Add New Internal Action */}
            <div className="flex flex-col mb-4">
              <Textarea
                placeholder="Adicione uma nova ação interna..."
                value={newInternalAction}
                onChange={(e) => setNewInternalAction(e.target.value)}
                className="mb-2"
              />
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="internal-action-type">Tipo:</Label>
                <Input
                  type="text"
                  id="internal-action-type"
                  placeholder="Tipo de ação"
                  value={internalActionType}
                  onChange={(e) => setInternalActionType(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Input
                  type="checkbox"
                  id="is-public-action"
                  checked={isPublicAction}
                  onChange={(e) => setIsPublicAction(e.target.checked)}
                />
                <Label htmlFor="is-public-action">Visível ao cliente</Label>
              </div>
              <Button onClick={() => setShowInternalActionModal(true)}>Adicionar Ação Interna</Button>
            </div>

            {/* List of Internal Actions */}
            {internalActions.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {internalActions.map((action: any) => (
                  <li key={action.id} className="p-4 rounded-md bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold">{action.user}</div>
                      <div className="text-sm text-gray-500">{new Date(action.date).toLocaleString()}</div>
                    </div>
                    <p>{action.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-gray-500">Nenhuma ação interna registrada.</p>
            )}
          </div>
        );
      default:
        return <p>Selecione uma aba para visualizar o conteúdo.</p>;
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket?.subject || "Carregando..."}</h1>
            <p className="text-gray-600">Ticket #{ticket?.number || "N/A"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button type="submit" form="ticket-form" onClick={form.handleSubmit(onSubmit)}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditMode(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <Tabs defaultValue="informacoes" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          {basicTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
          {specialTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="informacoes">
          {renderTabContent()}
        </TabsContent>
        <TabsContent value="attachments">
          {renderTabContent()}
        </TabsContent>
        <TabsContent value="notes">
          {renderTabContent()}
        </TabsContent>
        <TabsContent value="communications">
          {renderTabContent()}
        </TabsContent>
        <TabsContent value="history">
          {renderTabContent()}
        </TabsContent>
        <TabsContent value="internal-actions">
          {renderTabContent()}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TicketLinkingModal isOpen={isLinkingModalOpen} onClose={() => setIsLinkingModalOpen(false)} />
      <InternalActionModal isOpen={showInternalActionModal} onClose={() => setShowInternalActionModal(false)} />
    </div>
  );
}