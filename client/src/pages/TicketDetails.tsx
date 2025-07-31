import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { z } from "zod";
import React from "react";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
import { 
  ArrowLeft, Edit, Save, X, Trash2, Eye, ChevronRight, ChevronLeft,
  Paperclip, FileText, MessageSquare, History, Settings,
  User, Users, Tag, AlertCircle, FileIcon, Upload, Plus, Send,
  Clock, Download, ExternalLink, Filter, MoreVertical, Trash, Link2,
  Bold, Italic, Underline, List, ListOrdered, Quote, Code, 
  Heading1, Heading2, Heading3, Undo, Redo, Strikethrough, AlertTriangle,
  Mail, PlusCircle, Activity, RefreshCw, Ticket, Link, EyeOff,
  CheckCircle, Star, TrendingUp, Building2, MapPin, BarChart3,
  Copy, ArrowDown, ArrowUp, Calendar
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
import { useFieldColors } from "@/hooks/useFieldColors";
import { UserSelect } from "@/components/ui/UserSelect";
import { UserMultiSelect } from "@/components/ui/UserMultiSelect";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";
import InternalActionModal from "@/components/tickets/InternalActionModal";


// 🚨 CORREÇÃO CRÍTICA: Usar schema unificado para consistência
import { ticketFormSchema, type TicketFormData } from "../../../shared/ticket-validation";

// 🚀 OTIMIZAÇÃO: Rich Text Editor Component com memoização
const RichTextEditor = React.memo(({ value, onChange, disabled = false }: { value: string, onChange: (value: string) => void, disabled?: boolean }) => {
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
});

const TicketDetails = React.memo(() => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const { getFieldColor, getFieldLabel } = useFieldColors();

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
  // Move history view mode state outside form context to prevent unwanted updates
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
    { id: "links", label: "Vínculos", icon: Link },
  ];

  // 🚀 OTIMIZAÇÃO: Parallel queries com cache inteligente
  const { data: ticketResponse, isLoading } = useQuery({
    queryKey: ["/api/tickets", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}`);
      const data = await response.json();
      return data;
    },
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes cache - extended
    gcTime: 45 * 60 * 1000, // 45 minutes garbage collection - extended
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false, // Disable automatic refetch
    refetchIntervalInBackground: false,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    retry: 2, // Reduce retry attempts
  });

  // Extract ticket from response data
  const ticket = ticketResponse?.success ? ticketResponse.data : null;

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

  // PROBLEMA 9 RESOLVIDO: Handle company change otimizado com debounce
  const handleCompanyChange = useCallback(
    debounce(async (newCompanyId: string) => {
      console.log('🏢 Company change:', { newCompanyId, selectedCompany });

      // Only proceed if company actually changed
      if (newCompanyId === selectedCompany) {
        console.log('⚠️ Company already selected, skipping');
        return;
      }

    // Otimização: Update UI primeiro, depois fetch data
    setSelectedCompany(newCompanyId);
    form.setValue('customerCompanyId', newCompanyId);

    console.log('✅ Company state updated:', { 
      newSelectedCompany: newCompanyId,
      formValueAfter: form.getValues('customerCompanyId')
    });

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
  }, 300), // 300ms debounce
  [selectedCompany]
);

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
    staleTime: 30 * 60 * 1000, // 30 minutos cache
    gcTime: 60 * 60 * 1000, // 1 hora garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: urgencyOptions } = useQuery({
    queryKey: ["/api/ticket-metadata/field-options", "urgency"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ticket-metadata/field-options/urgency");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutos cache
    gcTime: 60 * 60 * 1000, // 1 hora garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: locationsData } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations");
      return response.json();
    },
  });

  // Fetch ticket relationships (linked tickets) with optimized caching
  const { data: ticketRelationships } = useQuery({
    queryKey: ["/api/ticket-relationships", id, "relationships"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ticket-relationships/${id}/relationships`);
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
    retry: 2, // Reduce retry attempts for faster failure detection
  });

  // 🚀 OTIMIZAÇÃO: Individual queries with proper error handling and data extraction
  const { data: ticketHistoryData, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ["/api/tickets", id, "history"],
    queryFn: async () => {
      console.log('🗂️ Fetching ticket history for:', id);
      const response = await apiRequest("GET", `/api/tickets/${id}/history`);
      const data = await response.json();
      console.log('🗂️ History API response:', data);
      return data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes - history changes less frequently
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: ticketCommunications, isLoading: communicationsLoading, error: communicationsError } = useQuery({
    queryKey: ["/api/tickets", id, "communications"],
    queryFn: async () => {
      console.log('💬 Fetching ticket communications for:', id);
      const response = await apiRequest("GET", `/api/tickets/${id}/communications`);
      const data = await response.json();
      console.log('💬 Communications API response:', data);
      return data;
    },
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes - communications change moderately
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: ticketNotes, isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ["/api/tickets", id, "notes"],
    queryFn: async () => {
      console.log('📝 Fetching ticket notes for:', id);
      const response = await apiRequest("GET", `/api/tickets/${id}/notes`);
      const data = await response.json();
      console.log('📝 Notes API response:', data);
      return data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - notes change frequently
    gcTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: ticketAttachments, isLoading: attachmentsLoading, error: attachmentsError } = useQuery({
    queryKey: ["/api/tickets", id, "attachments"],
    queryFn: async () => {
      console.log('📎 Fetching ticket attachments for:', id);
      const response = await apiRequest("GET", `/api/tickets/${id}/attachments`);
      const data = await response.json();
      console.log('📎 Attachments API response:', data);
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: ticketActions, isLoading: actionsLoading, error: actionsError } = useQuery({
    queryKey: ["/api/tickets", id, "actions"],
    queryFn: async () => {
      console.log('⚙️ Fetching ticket actions for:', id);
      const response = await apiRequest("GET", `/api/tickets/${id}/actions`);
      const data = await response.json();
      console.log('⚙️ Actions API response:', data);
      return data;
    },
    enabled: !!id,
    staleTime: 90 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch team users/members for assignments and followers
  const { data: usersData } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
  });

  const customers = Array.isArray(customersData?.customers) ? customersData.customers : [];

  // Use company-specific customers if available, otherwise fall back to all customers
  const availableCustomers = selectedCompanyCustomers.length > 0 ? selectedCompanyCustomers : customers;

  // Transform users data for UserSelect and UserMultiSelect components
  const teamUsers = usersData?.users ? usersData.users.map((user: any) => ({
    id: user.id,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email,
    role: user.role || 'Usuário'
  })) : [];

  // Initialize data from API responses with comprehensive error handling and logging
  useEffect(() => {
    console.log('🔄 Initializing ticket data:', {
      ticketId: id,
      hasCommunications: !!ticketCommunications,
      hasNotes: !!ticketNotes,
      hasActions: !!ticketActions,
      hasAttachments: !!ticketAttachments,
      hasRelationships: !!ticketRelationships
    });

    // Set communications from API with fallback
    if (ticketCommunications?.success && Array.isArray(ticketCommunications.data)) {
      console.log('💬 Setting communications:', ticketCommunications.data.length, 'items');
      setCommunications(ticketCommunications.data);
    } else if (ticketCommunications?.data && Array.isArray(ticketCommunications.data)) {
      console.log('💬 Setting communications (no success flag):', ticketCommunications.data.length, 'items');
      setCommunications(ticketCommunications.data);
    } else if (ticketRelationships?.communications && Array.isArray(ticketRelationships.communications)) {
      console.log('💬 Setting communications from relationships:', ticketRelationships.communications.length, 'items');
      setCommunications(ticketRelationships.communications);
    } else {
      console.log('💬 No communications found, setting empty array');
      setCommunications([]);
    }

    // Set attachments from API with fallback
    if (ticketAttachments?.success && Array.isArray(ticketAttachments.data)) {
      console.log('📎 Setting attachments:', ticketAttachments.data.length, 'items');
      setAttachments(ticketAttachments.data);
    } else if (ticketAttachments?.data && Array.isArray(ticketAttachments.data)) {
      console.log('📎 Setting attachments (no success flag):', ticketAttachments.data.length, 'items');
      setAttachments(ticketAttachments.data);
    } else if (ticketRelationships?.attachments && Array.isArray(ticketRelationships.attachments)) {
      console.log('📎 Setting attachments from relationships:', ticketRelationships.attachments.length, 'items');
      setAttachments(ticketRelationships.attachments);
    } else {
      console.log('📎 No attachments found, setting empty array');
      setAttachments([]);
    }

    // Set notes from API with comprehensive mapping and fallback
    if (ticketNotes?.success && Array.isArray(ticketNotes.data)) {
      console.log('📝 Setting notes from API success:', ticketNotes.data.length, 'items');
      const mappedNotes = ticketNotes.data.map((note: any) => ({
        ...note,
        id: note.id || `note-${Date.now()}-${Math.random()}`,
        createdBy: note.author_name || note.created_by_name || note.createdBy || 'Sistema',
        createdByName: note.author_name || note.created_by_name || note.createdByName || 'Sistema',
        createdAt: note.created_at || note.createdAt || new Date().toISOString(),
        content: note.content || note.description || note.text || 'Sem conteúdo'
      }));
      setNotes(mappedNotes);
    } else if (ticketNotes?.data && Array.isArray(ticketNotes.data)) {
      console.log('📝 Setting notes from API (no success flag):', ticketNotes.data.length, 'items');
      const mappedNotes = ticketNotes.data.map((note: any) => ({
        ...note,
        id: note.id || `note-${Date.now()}-${Math.random()}`,
        createdBy: note.author_name || note.created_by_name || note.createdBy || 'Sistema',
        createdByName: note.author_name || note.created_by_name || note.createdByName || 'Sistema',
        createdAt: note.created_at || note.createdAt || new Date().toISOString(),
        content: note.content || note.description || note.text || 'Sem conteúdo'
      }));
      setNotes(mappedNotes);
    } else if (ticketRelationships?.notes && Array.isArray(ticketRelationships.notes)) {
      console.log('📝 Setting notes from relationships:', ticketRelationships.notes.length, 'items');
      setNotes(ticketRelationships.notes);
    } else {
      console.log('📝 No notes found, setting empty array');
      setNotes([]);
    }

    // Set actions from API with comprehensive mapping for internal actions
    if (ticketActions?.success && Array.isArray(ticketActions.data)) {
      console.log('⚙️ Setting actions from API success:', ticketActions.data.length, 'items');
      const mappedActions = ticketActions.data.map((action: any) => ({
        ...action,
        id: action.id || `action-${Date.now()}-${Math.random()}`,
        createdByName: action.agent_name || action.created_by_name || action.createdByName || action.performed_by_name || 'Sistema',
        actionType: action.action_type || action.actionType || action.type || 'Ação',
        content: action.content || action.description || action.summary || 'Sem descrição',
        is_public: action.is_public !== undefined ? action.is_public : action.isPublic !== undefined ? action.isPublic : false,
        created_at: action.created_at || action.createdAt || new Date().toISOString(),
        time_spent: action.time_spent || action.timeSpent || '0:00:00:00'
      }));
      setInternalActions(mappedActions);
      setExternalActions([]); // External actions would come from different endpoint
    } else if (ticketActions?.data && Array.isArray(ticketActions.data)) {
      console.log('⚙️ Setting actions from API (no success flag):', ticketActions.data.length, 'items');
      const mappedActions = ticketActions.data.map((action: any) => ({
        ...action,
        id: action.id || `action-${Date.now()}-${Math.random()}`,
        createdByName: action.agent_name || action.created_by_name || action.createdByName || action.performed_by_name || 'Sistema',
        actionType: action.action_type || action.actionType || action.type || 'Ação',
        content: action.content || action.description || action.summary || 'Sem descrição',
        is_public: action.is_public !== undefined ? action.is_public : action.isPublic !== undefined ? action.isPublic : false,
        created_at: action.created_at || action.createdAt || new Date().toISOString(),
        time_spent: action.time_spent || action.timeSpent || '0:00:00:00'
      }));
      setInternalActions(mappedActions);
      setExternalActions([]);
    } else {
      console.log('⚙️ No actions found, setting empty arrays');
      setInternalActions([]);
      setExternalActions([]);
    }

    // Set related tickets from relationships API
    if (ticketRelationships?.success && Array.isArray(ticketRelationships.data)) {
      console.log('🔗 Setting related tickets from relationships:', ticketRelationships.data.length, 'items');
      const transformedTickets = ticketRelationships.data.map((relationship: any) => ({
        id: relationship.targetTicket?.id || relationship.id,
        number: relationship.targetTicket?.number || relationship.number || 'N/A',
        subject: relationship.targetTicket?.subject || relationship.subject || 'Sem assunto',
        status: relationship.targetTicket?.status || relationship.status || 'unknown',
        priority: relationship.targetTicket?.priority || relationship.priority || 'medium',
        relationshipType: relationship.relationshipType || relationship.relationship_type || 'related',
        description: relationship.description || '',
        createdAt: relationship.createdAt || relationship.created_at || new Date().toISOString(),
        targetTicket: relationship.targetTicket || {}
      }));
      setRelatedTickets(transformedTickets);
    } else {
      console.log('🔗 No related tickets found, setting empty array');
      setRelatedTickets([]);
    }

    // Set ticket-specific data
    if (ticket) {
      console.log('🎫 Setting ticket-specific data:', {
        hasFollowers: Array.isArray(ticket.followers),
        hasTags: Array.isArray(ticket.tags),
        followersCount: ticket.followers?.length || 0,
        tagsCount: ticket.tags?.length || 0
      });

      if (Array.isArray(ticket.followers)) {
        setFollowers(ticket.followers);
      }

      if (Array.isArray(ticket.tags)) {
        setTags(ticket.tags);
      }
    }
  }, [ticketCommunications, ticketAttachments, ticketNotes, ticketActions, ticketRelationships, ticket]);

  // Initialize real history data from API with comprehensive mapping
  useEffect(() => {
    console.log('🗂️ Initializing history data:', {
      hasHistoryData: !!ticketHistoryData,
      historySuccess: ticketHistoryData?.success,
      historyDataType: typeof ticketHistoryData?.data,
      historyIsArray: Array.isArray(ticketHistoryData?.data),
      historyLength: ticketHistoryData?.data?.length || 0,
      historyError: historyError,
      historyLoading: historyLoading
    });

    if (ticketHistoryData?.success && Array.isArray(ticketHistoryData.data)) {
      console.log('🗂️ Setting history from API success:', ticketHistoryData.data.length, 'items');
      const mappedHistory = ticketHistoryData.data.map((item: any) => ({
        ...item,
        id: item.id || `history-${Date.now()}-${Math.random()}`,
        action_type: item.action_type || item.actionType || item.type || 'activity',
        performed_by_name: item.performed_by_name || item.performedByName || item.actor_name || item.createdBy || 'Sistema',
        created_at: item.created_at || item.createdAt || new Date().toISOString(),
        description: item.description || item.summary || item.content || 'Atividade registrada',
        field_name: item.field_name || item.fieldName || null,
        old_value: item.old_value || item.oldValue || null,
        new_value: item.new_value || item.newValue || null,
        metadata: item.metadata || {},
        ip_address: item.ip_address || item.ipAddress || item.metadata?.ip_address || null,
        user_agent: item.user_agent || item.userAgent || item.metadata?.user_agent || null,
        session_id: item.session_id || item.sessionId || item.metadata?.session_id || null
      }));
      setHistory(mappedHistory);
    } else if (ticketHistoryData?.data && Array.isArray(ticketHistoryData.data)) {
      console.log('🗂️ Setting history from API (no success flag):', ticketHistoryData.data.length, 'items');
      const mappedHistory = ticketHistoryData.data.map((item: any) => ({
        ...item,
        id: item.id || `history-${Date.now()}-${Math.random()}`,
        action_type: item.action_type || item.actionType || item.type || 'activity',
        performed_by_name: item.performed_by_name || item.performedByName || item.actor_name || item.createdBy || 'Sistema',
        created_at: item.created_at || item.createdAt || new Date().toISOString(),
        description: item.description || item.summary || item.content || 'Atividade registrada',
        field_name: item.field_name || item.fieldName || null,
        old_value: item.old_value || item.oldValue || null,
        new_value: item.new_value || item.newValue || null,
        metadata: item.metadata || {},
        ip_address: item.ip_address || item.ipAddress || item.metadata?.ip_address || null,
        user_agent: item.user_agent || item.userAgent || item.metadata?.user_agent || null,
        session_id: item.session_id || item.sessionId || item.metadata?.session_id || null
      }));
      setHistory(mappedHistory);
    } else {
      console.log('🗂️ No history found, setting empty array');
      setHistory([]);
    }
  }, [ticketHistoryData, historyError, historyLoading]);

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
        uploadedAt: new Date().toISOString(),
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



  // Form setup with memoized default values
  const defaultValues = useMemo(() => ({
    subject: "",
    description: "",
    priority: "medium" as const,
    status: "open" as const,
    callerId: "",
    callerType: "customer" as const,
    beneficiaryType: "customer" as const,
    contactType: "email" as const,
  }), []);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues,
  });

  // 🚀 OTIMIZAÇÃO: Form reset otimizado com shallow comparison e memoização
  const formDataMemo = useMemo(() => {
    if (!ticket) return null;

    return {
      subject: ticket.subject || ticket.short_description || "",
      description: ticket.description || "",
      priority: ticket.priority || "medium",
      status: ticket.status || "new", // Use backend values (new, open, in_progress, etc)
      category: ticket.category || "",
      subcategory: ticket.subcategory || "",
      impact: ticket.impact || "medium",
      urgency: ticket.urgency || "medium",
      businessImpact: ticket.business_impact || "",
      symptoms: ticket.symptoms || "",
      workaround: ticket.workaround || "",
      resolution: ticket.resolution || "",
      environment: ticket.environment || "",
      templateAlternative: ticket.template_alternative || "",
      linkTicketNumber: ticket.link_ticket_number || "",
      linkType: ticket.link_type || "",
      linkComment: ticket.link_comment || "",
      estimatedHours: ticket.estimated_hours || 0,
      actualHours: ticket.actual_hours || 0,
      callerId: ticket.caller_id || "",
      callerType: ticket.callerType || "customer",
      beneficiaryId: ticket.beneficiary_id || "",
      beneficiaryType: ticket.beneficiary_type || "customer", 
      assignedToId: ticket.assigned_to_id || "",
      assignmentGroup: ticket.assignment_group || "",
      location: ticket.location || "",
      contactType: ticket.contact_type || "email",
      followers: ticket.followers || [],
      customerCompanyId: ticket.customer_company_id || "",
    };
  }, [
    ticket?.id, 
    ticket?.subject, 
    ticket?.status, 
    ticket?.priority,
    ticket?.updated_at, // Adiciona timestamp para detectar mudanças
    ticket?.caller_id,
    ticket?.assigned_to_id,
    ticket?.customer_company_id,
  ]); // Dependency array expandida para capturar mudanças importantes

  useEffect(() => {
    if (formDataMemo && ticket) {
      console.log('🎫 Optimized form reset with memoized data');
      form.reset(formDataMemo);

      // Update local states only if changed
      const newCompany = ticket.customer_company_id || ticket.customerCompanyId;
      if (newCompany && newCompany !== selectedCompany) {
        setSelectedCompany(newCompany);
      }

      // Initialize followers only if different
      if (ticket.followers && Array.isArray(ticket.followers) && 
          JSON.stringify(ticket.followers) !== JSON.stringify(followers)) {
        setFollowers(ticket.followers);
      }
    }
  }, [formDataMemo, selectedCompany, followers]);

  // Update mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      console.log("🚀 Mutation started, sending PUT request to:", `/api/tickets/${id}`);
      console.log("📤 Request payload:", data);

      const response = await apiRequest("PUT", `/api/tickets/${id}`, data);
      console.log("📥 Response status:", response.status);

      const result = await response.json();
      console.log("📥 Response data:", result);

      return result;
    },
    onSuccess: (data) => {
      console.log("✅ Mutation success:", data);
      toast({
        title: "Sucesso",
        description: "Ticket atualizado com sucesso",
      });

      // 🚀 OTIMIZAÇÃO: Invalidação ultra-seletiva e inteligente
      const formData = form.getValues();
      const changedFields = Object.keys(formData).filter(key => 
        formData[key as keyof typeof formData] !== ticket?.[key as keyof typeof ticket]
      );

      // Update cache optimistically primeiro
      queryClient.setQueryData(["/api/tickets", id], (oldData: any) => ({
        ...oldData,
        data: { ...ticket, ...formData }
      }));

      // Batch invalidations para reduzir network requests
      const criticalFields = ['status', 'priority', 'assigned_to_id'];
      const hasCriticalChanges = changedFields.some(field => criticalFields.includes(field));

      if (hasCriticalChanges) {
        // Invalidar apenas após 500ms para agrupar mudanças
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/tickets"],
            exact: false 
          });
        }, 500);
      }

      // Skip history invalidation for minor changes
      const contentFields = ['description', 'subject'];
      const hasContentChanges = changedFields.some(field => contentFields.includes(field));

      if (hasContentChanges) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/tickets", id, "history"] 
        });
      }

      // Invalidate relationships if linking fields changed
      if (formData.linkTicketNumber || formData.linkType) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/ticket-relationships", id] 
        });
      }

      // Don't invalidate history/notes/communications unless content fields changed
      const contentChanged = formData.description !== ticket?.description || 
                           formData.subject !== ticket?.subject;

      if (contentChanged) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/tickets", id, "history"] 
        });
      }

      setIsEditMode(false);
    },
    onError: (error) => {
      console.error("❌ Mutation error:", error);
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
  // Memoizar mapeamento de status para evitar recriação
  const statusMapping = useMemo(() => ({
    'new': 'new',
    'novo': 'new',
    'open': 'open', 
    'aberto': 'open',
    'in_progress': 'in_progress',
    'em_andamento': 'in_progress',
    'resolved': 'resolved',
    'resolvido': 'resolved',
    'closed': 'closed',
    'fechado': 'closed'
  }), []);