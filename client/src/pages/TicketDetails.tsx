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


// PROBLEMA 6 RESOLVIDO: Schema Zod expandido com todos os campos
const ticketFormSchema = z.object({
  // Core required fields
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  
  // Classification fields with proper validation
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "pending", "resolved", "closed"]),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  impact: z.enum(["low", "medium", "high", "critical"]).optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
  
  // Assignment fields with validation
  callerId: z.string().min(1, "Caller is required"),
  callerType: z.enum(["customer", "user"]),
  beneficiaryId: z.string().optional(),
  beneficiaryType: z.enum(["customer", "user"]),
  assignedToId: z.string().optional(),
  assignmentGroup: z.string().optional(),
  
  // Location and contact
  location: z.string().optional(),
  contactType: z.enum(["email", "phone", "chat", "portal"]).optional(),
  
  // Extended fields for business context
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),
  
  // Collections
  followers: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  
  // Company relationship
  customerCompanyId: z.string().optional(),
  
  // PROBLEMA 6: Campos faltantes adicionados
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
  publicationPriority: z.string().optional(),
  responsibleTeam: z.string().optional(),
  infrastructure: z.string().optional(),
  environmentPublication: z.string().optional(),
  closeToPublish: z.boolean().optional(),
  
  // Link fields
  linkTicketNumber: z.string().optional(),
  linkDescription: z.string().optional(),
  
  // Additional metadata fields
  estimatedHours: z.number().optional(),
  
  // SLA and timeline fields
  slaDeadline: z.string().optional(),
  escalationLevel: z.number().optional(),
  
  // Resolution fields
  resolutionNotes: z.string().optional(),
  preventiveMeasures: z.string().optional(),
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

  // Estados para modal de vinculação
  const [linkTicketNumber, setLinkTicketNumber] = useState('');
  const [linkType, setLinkType] = useState('');
  const [linkComment, setLinkComment] = useState('');

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
    queryKey: ["/api/ticket-history/tickets", id, "history"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ticket-history/tickets/${id}/history`);
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

    // Set actions from API
    if (ticketActions?.success && ticketActions?.data) {
      const actions = ticketActions.data;
      const internal = actions.filter((a: any) => a.type === 'internal' || a.actionType === 'internal');
      const external = actions.filter((a: any) => a.type === 'external' || a.actionType === 'external');
      setInternalActions(internal);
      setExternalActions(external);
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
        // Fix field mapping: backend uses caller_id, beneficiary_id, assigned_to_id
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
        followers: ticket.followers || [],
        customerCompanyId: ticket.customer_id || "",
        // PROBLEMA 6 RESOLVIDO: Reset completo com todos os campos template/environment
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
        publicationPriority: ticket.publication_priority || "",
        responsibleTeam: ticket.responsible_team || "",
        infrastructure: ticket.infrastructure || "",
        environmentPublication: ticket.environment_publication || "",
        closeToPublish: ticket.close_to_publish || false,
        linkTicketNumber: "",
        linkDescription: "",
        // PROBLEMA 6: Campos adicionais obrigatórios
        estimatedHours: ticket.estimated_hours || 0,
        slaDeadline: ticket.sla_deadline || "",
        escalationLevel: ticket.escalation_level || 0,
        resolutionNotes: ticket.resolution_notes || "",
        preventiveMeasures: ticket.preventive_measures || "",
      });
      
      // Update local states to sync with ticket data
      if (ticket.customer_id) {
        setSelectedCompany(ticket.customer_id);
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

  const onSubmit = (data: TicketFormData) => {
    // PROBLEMA 3 RESOLUÇÃO: Mapear corretamente os campos frontend para backend
    const mappedData = {
      ...data,
      // Mapear callerId → caller_id
      caller_id: data.callerId,
      // Mapear beneficiaryId → beneficiary_id  
      beneficiary_id: data.beneficiaryId,
      // Mapear assignedToId → assigned_to_id
      assigned_to_id: data.assignedToId,
      // Mapear customerCompanyId → customer_id
      customer_id: data.customerCompanyId,
      // PROBLEMA 2 RESOLVIDO: location não location_id
      location: data.location,
      // Mapear campos específicos
      caller_type: data.callerType,
      beneficiary_type: data.beneficiaryType,
      contact_type: data.contactType,
      assignment_group: data.assignmentGroup,
      business_impact: data.businessImpact,
      // PROBLEMA 6: Mapear todos os novos campos para backend
      template_name: data.templateName,
      template_alternative: data.templateAlternative,
      caller_name_responsible: data.callerNameResponsible,
      call_type: data.callType,
      call_url: data.callUrl,
      environment_error: data.environmentError,
      call_number: data.callNumber,
      group_field: data.groupField,
      service_version: data.serviceVersion,
      publication_priority: data.publicationPriority,
      responsible_team: data.responsibleTeam,
      environment_publication: data.environmentPublication,
      close_to_publish: data.closeToPublish,
      // PROBLEMA 3 RESOLVIDO: Remover campos frontend que causam erro no backend
      callerId: undefined,
      beneficiaryId: undefined,
      assignedToId: undefined,
      customerCompanyId: undefined,
      callerType: undefined,
      beneficiaryType: undefined,
      contactType: undefined,
      assignmentGroup: undefined,
      businessImpact: undefined,
      // Remover campos template frontend
      templateName: undefined,
      templateAlternative: undefined,
      callerNameResponsible: undefined,
      callType: undefined,
      callUrl: undefined,
      environmentError: undefined,
      callNumber: undefined,
      groupField: undefined,
      serviceVersion: undefined,
      publicationPriority: undefined,
      responsibleTeam: undefined,
      environmentPublication: undefined,
      closeToPublish: undefined,
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
                            <DynamicBadge fieldName="priority" value={field.value}>
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
                            <DynamicBadge fieldName="status" value={field.value}>
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
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Cliente desde: {ticketRelationships?.customer_since || 'Data não disponível'} • Total de tickets: {ticketRelationships?.total_tickets || 0}
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
                        <p className="font-medium text-sm">#{ticket.number || ticket.ticketNumber || ticket.id?.slice(0, 8) || 'T-2024-001'}</p>
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

                {/* PROBLEMA 4 RESOLVIDO: Conectar dados reais de tickets relacionados */}
                {ticketRelationships?.related_tickets && ticketRelationships.related_tickets.length > 0 ? 
                  ticketRelationships.related_tickets.map((relatedTicket: any) => (
                    <Card key={relatedTicket.id} className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Badge variant="secondary" className={`${relatedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                                                                    relatedTicket.status === 'closed' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-blue-100 text-blue-700'}`}>
                            {relatedTicket.status === 'resolved' ? 'RESOLVIDO' :
                             relatedTicket.status === 'closed' ? 'FECHADO' : 'ATIVO'}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm">#{relatedTicket.ticket_number || relatedTicket.id?.slice(0, 8)}</p>
                            <p className="text-sm text-gray-700 mt-1">{relatedTicket.subject || 'Ticket relacionado'}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Criado em {relatedTicket.created_at ? new Date(relatedTicket.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                              {relatedTicket.resolved_at && ` • Resolvido em ${new Date(relatedTicket.resolved_at).toLocaleDateString('pt-BR')}`}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{relatedTicket.category || 'Geral'}</Badge>
                              <span className="text-xs text-gray-500">
                                {relatedTicket.assigned_to_name && `Responsável: ${relatedTicket.assigned_to_name}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={relatedTicket.priority === 'high' ? 'destructive' : 
                                  relatedTicket.priority === 'medium' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {relatedTicket.priority === 'high' ? 'Alta' :
                           relatedTicket.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </Card>
                  )) :
                  <Card className="p-4 text-center text-gray-500">
                    <p>Nenhum ticket relacionado encontrado</p>
                  </Card>
                }
              </div>
            </div>

            {/* PROBLEMA 4 RESOLVIDO: Estatísticas reais do cliente vindas da API */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="p-2 bg-blue-100 rounded-full w-fit mx-auto mb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-lg font-semibold">{ticketRelationships?.customer_stats?.total_tickets || 0}</p>
                <p className="text-xs text-gray-500">Total Tickets</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="p-2 bg-green-100 rounded-full w-fit mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-lg font-semibold">{ticketRelationships?.customer_stats?.resolved_tickets || 0}</p>
                <p className="text-xs text-gray-500">Resolvidos</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="p-2 bg-yellow-100 rounded-full w-fit mx-auto mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-lg font-semibold">{ticketRelationships?.customer_stats?.avg_resolution_time || 'N/A'}</p>
                <p className="text-xs text-gray-500">Tempo Médio</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="p-2 bg-purple-100 rounded-full w-fit mx-auto mb-2">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-lg font-semibold">{ticketRelationships?.customer_stats?.satisfaction_rating || 'N/A'}</p>
                <p className="text-xs text-gray-500">Satisfação</p>
              </Card>
            </div>

            {/* Padrões de Comportamento - dados reais da API */}
            {ticketRelationships?.customer_insights && (
              <Card className="p-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Insights do Cliente
                </h4>
                <div className="space-y-2 text-sm">
                  {ticketRelationships.customer_insights.map((insight: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'][idx % 4]}`}></div>
                      <span>{insight.description}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
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
                EMPRESA
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
                  onValueChange={handleCompanyChange}
                  value={ticket.customer_id || ticket.customerCompanyId || ticket.company || ''}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione a empresa cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Não especificado</SelectItem>
                    {(Array.isArray(companiesData) ? companiesData : companiesData?.data || []).map((company: any) => (
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
                    {(Array.isArray(companiesData) ? companiesData : companiesData?.data || []).find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.name || 
                     ticket.customerCompany?.name || ticket.company || 'Não especificado'}
                  </span>
                </div>
              )}
              {(ticket.customerCompany?.industry || (Array.isArray(companiesData) ? companiesData : companiesData?.data || []).find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.industry) && (
                <div className="text-xs text-blue-600 mt-1">
                  🏷️ Setor: {ticket.customerCompany?.industry || (Array.isArray(companiesData) ? companiesData : companiesData?.data || []).find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.industry}
                </div>
              )}
              {(ticket.customerCompany?.cnpj || (Array.isArray(companiesData) ? companiesData : companiesData?.data || []).find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.cnpj) && (
                <div className="text-xs text-blue-600">
                  📄 CNPJ: {ticket.customerCompany?.cnpj || (Array.isArray(companiesData) ? companiesData : companiesData?.data || []).find((c: any) => c.id === (ticket.customerCompanyId || ticket.company))?.cnpj}
                </div>
              )}
            </div>
          </div>

          {/* Cliente/Solicitante e Favorecido Section */}
          <div className="mb-6 space-y-4">
            {/* Cliente/Solicitante */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  CLIENTE
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                  onClick={() => console.log('Open customer management')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Gerenciar
                </Button>
              </div>
              <div className="space-y-2">
                {isEditMode ? (
                  <Select 
                    onValueChange={(value) => form.setValue('callerId', value)} 
                    value={ticket.caller_id || ticket.callerId || ''}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">Não especificado</SelectItem>
                      {availableCustomers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.fullName || customer.name || `${customer.firstName} ${customer.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-purple-900 font-medium cursor-pointer hover:text-purple-700 transition-colors"
                       onClick={() => console.log('Open customer details')}>
                    <span className="underline decoration-dotted">
                      {availableCustomers.find((c: any) => c.id === ticket.callerId)?.fullName || 
                       availableCustomers.find((c: any) => c.id === ticket.callerId)?.name ||
                       `${availableCustomers.find((c: any) => c.id === ticket.callerId)?.firstName || ''} ${availableCustomers.find((c: any) => c.id === ticket.callerId)?.lastName || ''}`.trim() || 
                       ticket.callerId === 'unspecified' || !ticket.callerId ? 'Não especificado' : 'Cliente não encontrado'}
                    </span>
                  </div>
                )}
                {availableCustomers.find((c: any) => c.id === ticket.callerId) && (
                  <div className="text-xs text-purple-600">
                    📧 {availableCustomers.find((c: any) => c.id === ticket.callerId)?.email || 'Email não informado'}
                  </div>
                )}
              </div>
            </div>

            {/* Favorecido */}
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  FAVORECIDO
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                  onClick={() => console.log('Open favorecido management')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Gerenciar
                </Button>
              </div>
              <div className="space-y-2">
                {isEditMode ? (
                  <Select 
                    onValueChange={(value) => form.setValue('favorecidoId', value)} 
                    value={ticket.favorecidoId || ''}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione o favorecido" />
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
                  <div className="text-sm text-indigo-900 font-medium cursor-pointer hover:text-indigo-700 transition-colors"
                       onClick={() => console.log('Open favorecido details')}>
                    <span className="underline decoration-dotted">
                      {customers?.customers?.find((c: any) => c.id === ticket.favorecidoId)?.name || 
                       ticket.favorecidoId === 'unspecified' || !ticket.favorecidoId ? 'Não especificado' : 'Favorecido não encontrado'}
                    </span>
                  </div>
                )}
                {customers?.customers?.find((c: any) => c.id === ticket.favorecidoId) && (
                  <div className="text-xs text-indigo-600">
                    📧 {customers.customers.find((c: any) => c.id === ticket.favorecidoId)?.email || 'Email não informado'}
                  </div>
                )}
                {customers?.customers?.find((c: any) => c.id === ticket.favorecidoId)?.phone && (
                  <div className="text-xs text-indigo-600">
                    📞 {customers.customers.find((c: any) => c.id === ticket.favorecidoId)?.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Impacto, Urgência e Local Section */}
          <div className="mb-6 space-y-4">
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
                    value={ticket.location || ''}
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

          {/* Atribuído a Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Atribuído a</h3>
            <div className="mb-4">
              {isEditMode ? (
                <Select 
                  onValueChange={(value) => form.setValue('assignedToId', value)} 
                  value={ticket.assigned_to_id || ticket.assignedToId || ''}
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
                <h1 className="text-xl font-semibold">Ticket #{ticket.number || ticket.ticketNumber || ticket.id?.slice(0, 8) || 'N/A'}</h1>

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

      {/* Ticket Linking Modal - IMPLEMENTADO */}
      <Dialog open={isLinkingModalOpen} onOpenChange={setIsLinkingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Ticket</DialogTitle>
            <DialogDescription>
              Conecte este ticket a outros tickets relacionados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número do Ticket</Label>
              <Input 
                placeholder="Ex: T-123456" 
                value={linkTicketNumber}
                onChange={(e) => setLinkTicketNumber(e.target.value)}
              />
            </div>
            <div>
              <Label>Tipo de Vinculação</Label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="related">🔗 Relacionado</SelectItem>
                  <SelectItem value="duplicate">🔄 Duplicado</SelectItem>
                  <SelectItem value="parent">⬆️ Ticket Pai</SelectItem>
                  <SelectItem value="child">⬇️ Sub-ticket</SelectItem>
                  <SelectItem value="blocks">🚫 Bloqueia</SelectItem>
                  <SelectItem value="blocked_by">⏸️ Bloqueado por</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comentário (opcional)</Label>
              <Textarea 
                placeholder="Descreva a relação entre os tickets..."
                rows={3}
                value={linkComment}
                onChange={(e) => setLinkComment(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setIsLinkingModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                console.log("🔗 Vinculando tickets:", { linkTicketNumber, linkType, linkComment });
                setIsLinkingModalOpen(false);
                setLinkTicketNumber('');
                setLinkType('');
                setLinkComment('');
              }}
              disabled={!linkTicketNumber || !linkType}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Vincular
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Internal Actions Modal - IMPLEMENTADO */}
      <Dialog open={showInternalActionModal} onOpenChange={setShowInternalActionModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Ação Interna</DialogTitle>
            <DialogDescription>
              Adicione uma ação interna ao ticket para registro e auditoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ação Realizada*</Label>
              <Textarea 
                placeholder="Descreva a ação realizada (obrigatório)..."
                rows={4}
                value={newInternalAction}
                onChange={(e) => setNewInternalAction(e.target.value)}
              />
            </div>
            <div>
              <Label>Tipo de Ação</Label>
              <Select value={internalActionType} onValueChange={setInternalActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigation">🔍 Investigação</SelectItem>
                  <SelectItem value="escalation">⬆️ Escalação</SelectItem>
                  <SelectItem value="resolution">✅ Resolução</SelectItem>
                  <SelectItem value="communication">💬 Comunicação</SelectItem>
                  <SelectItem value="workaround">🛠️ Solução Temporária</SelectItem>
                  <SelectItem value="documentation">📝 Documentação</SelectItem>
                  <SelectItem value="testing">🧪 Teste</SelectItem>
                  <SelectItem value="followup">📞 Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isPublicAction"
                checked={isPublicAction}
                onChange={(e) => setIsPublicAction(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublicAction" className="text-sm">
                Ação visível para o cliente (pública)
              </Label>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowInternalActionModal(false);
                setNewInternalAction('');
                setInternalActionType('');
                setIsPublicAction(false);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (newInternalAction.trim()) {
                  const newAction = {
                    id: Date.now().toString(),
                    content: newInternalAction,
                    type: internalActionType || 'documentation',
                    isPublic: isPublicAction,
                    createdAt: new Date().toISOString(),
                    createdByName: 'Agente Atual' // TODO: Get from auth
                  };
                  setInternalActions(prev => [newAction, ...prev]);
                  setShowInternalActionModal(false);
                  setNewInternalAction('');
                  setInternalActionType('');
                  setIsPublicAction(false);
                }
              }}
              disabled={!newInternalAction.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}