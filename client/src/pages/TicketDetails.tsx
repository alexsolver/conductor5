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
  AlertTriangle, Mail, PlusCircle, Activity, RefreshCw, Ticket, Link, EyeOff,
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
import { RichTextEditor } from "@/components/knowledge-base/RichTextEditor";
import { DynamicSelect } from "@/components/DynamicSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useTicketMetadata } from "@/hooks/useTicketMetadata";
import { useFieldColors } from "@/hooks/useFieldColors";
import { UserSelect } from "@/components/ui/UserSelect";
import { UserMultiSelect } from "@/components/ui/UserMultiSelect";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";
import InternalActionModal from "@/components/tickets/InternalActionModal";
import EditInternalActionModal from "@/components/tickets/EditInternalActionModal";
import { TicketDescriptionEditor } from "@/components/TicketDescriptionEditor";
import { GroupSelect } from "@/components/GroupSelect";
import { FilteredUserSelect } from "@/components/FilteredUserSelect";
import { FilteredCustomerSelect } from "@/components/FilteredCustomerSelect";
import { FilteredBeneficiarySelect } from "@/components/FilteredBeneficiarySelect";

// 🚨 CORREÇÃO CRÍTICA: Usar schema unificado para consistência
import { ticketFormSchema, type TicketFormData } from "../../../shared/ticket-validation";

const TicketDetails = React.memo(() => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const { getFieldColor, getFieldLabel } = useFieldColors();

  // Fetch user groups for displaying names
  const { data: userGroupsData } = useQuery({
    queryKey: ['/api/user-groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-groups');
      return response.json();
    },
  });

  // Sidebar sempre fixa e visível - tab padrão é informações
  const [activeTab, setActiveTab] = useState("informacoes");

  // Handle hash-based navigation for direct tab access
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['informacoes', 'attachments', 'notes', 'communications', 'history', 'internal-actions', 'links', 'latest-interactions'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);


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
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [isBeneficiaryDetailsOpen, setIsBeneficiaryDetailsOpen] = useState(false);
  const [selectedAssignmentGroup, setSelectedAssignmentGroup] = useState<string>('');



  // Estados para modal de ação interna
  const [newInternalAction, setNewInternalAction] = useState('');
  const [internalActionType, setInternalActionType] = useState('');
  const [isPublicAction, setIsPublicAction] = useState(false);
  
  // Estados para edição de ação interna
  const [editActionModalOpen, setEditActionModalOpen] = useState(false);
  const [actionToEdit, setActionToEdit] = useState<any>(null);


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

      // Skip if no company
      if (!companyId || companyId === 'unspecified') {
        setSelectedCompanyCustomers([]);
        setSelectedCompany('');
        return;
      }

      // Only update if company actually changed
      if (selectedCompany !== companyId) {
        setSelectedCompany(companyId);
      }

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
  }, [ticket?.customer_company_id, ticket?.customerCompanyId, ticket?.company]);

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
      // Se não há favorecido específico, usar o mesmo cliente
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
    staleTime: 30 * 1000, // 30 seconds - faster updates for relationship changes
    gcTime: 5 * 60 * 1000, // 5 minutes GC time
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
  const teamUsers = (usersData as any)?.users ? (usersData as any).users.map((user: any) => ({
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

      // Sync assignment group state with ticket data
      if (ticket.assignmentGroupId || ticket.assignment_group_id) {
        setSelectedAssignmentGroup(ticket.assignmentGroupId || ticket.assignment_group_id);
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
      callerType: ticket.caller_type || "customer",
      beneficiaryId: ticket.beneficiary_id || "",
      beneficiaryType: ticket.beneficiary_type || "customer", 
      responsibleId: ticket.assigned_to_id || "",
      assignmentGroup: ticket.assignment_group_id || ticket.assignmentGroupId || "",
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
    if (formDataMemo && ticket && !isEditMode) {
      console.log('🎫 Optimized form reset with memoized data (view mode only)');
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
  }, [formDataMemo, selectedCompany, followers, isEditMode]);



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

  // Delete internal action mutation
  const deleteInternalActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest("DELETE", `/api/tickets/${id}/actions/${actionId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ação interna excluída com sucesso",
      });

      // Invalidate queries to refresh the actions list and history
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id, "actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id, "history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir ação interna",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      console.log('🗑️ Deleting note:', noteId);
      const response = await apiRequest("DELETE", `/api/tickets/${id}/notes/${noteId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Nota excluída com sucesso",
      });

      // Invalidate queries to refresh the notes list and history
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id, "history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir nota",
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

  const onSubmit = useCallback((data: TicketFormData) => {
    
    const mappedData = {
      // Core fields - with proper status mapping
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      status: (statusMapping[data.status as keyof typeof statusMapping] || data.status) as "open" | "new" | "in_progress" | "resolved" | "closed" | "novo" | "aberto" | "em_andamento" | "resolvido" | "fechado",
      category: data.category,
      subcategory: data.subcategory,
      impact: data.impact,
      urgency: data.urgency,

      // Assignment mapping camelCase → snake_case
      caller_id: data.callerId,
      caller_type: data.callerType || 'customer',
      callerType: data.callerType || 'customer', // Add explicit field for type validation
      beneficiary_id: data.beneficiaryId,
      beneficiary_type: data.beneficiaryType || 'customer',
      beneficiaryType: data.beneficiaryType || 'customer', // Add explicit field for type validation
      assigned_to_id: data.assignedToId,
      assignment_group: data.assignmentGroup,

      // CORREÇÃO PROBLEMA 3: Location field consistency - usar apenas location (campo texto)
      // 🚨 CORREÇÃO: location é campo texto, não locationId (FK inexistente)
      location: data.location || '',  // Campo texto livre conforme schema do banco
      contact_type: data.contactType || 'email',
      contactType: data.contactType || 'email', // Add explicit field for type validation

      // Business fields
      business_impact: data.businessImpact,
      symptoms: data.symptoms,
      workaround: data.workaround,
      resolution: data.resolution,

      // Time tracking
      estimated_hours: data.estimatedHours,
      actual_hours: data.actualHours,

      // Collections - CORREÇÃO: Usar state ao invés de form data
      followers: followers.length > 0 ? followers : (data.followers || []),
      tags: tags.length > 0 ? tags : (data.tags || []),

      // CORRIGIDO: Company relationship - usar selectedCompany se customerCompanyId vazio
      customer_company_id: data.customerCompanyId || selectedCompany || null,

      // Environment
      environment: data.environment,

      // Linking
      link_ticket_number: data.linkTicketNumber,
      link_type: data.linkType,
      link_comment: data.linkComment,
    };

    console.log("💾 Sending mapped data to API:", mappedData);
    console.log("🔍 DEBUG - State values before sending:", {
      followersState: followers,
      selectedCompanyState: selectedCompany,
      dataFollowers: data.followers,
      dataCustomerCompanyId: data.customerCompanyId,
      finalFollowers: mappedData.followers,
      finalCustomerId: mappedData.customer_company_id
    });
    updateTicketMutation.mutate(mappedData);
  }, [statusMapping, followers, selectedCompany, updateTicketMutation]);

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
                  control={form.control as any}
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
                            <DynamicBadge 
                              fieldName="priority"
                              value={field.value}
                              colorHex={getFieldColor('priority', field.value)}
                            >
                              {getFieldLabel('priority', field.value)}
                            </DynamicBadge>
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
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
                            <DynamicBadge 
                              fieldName="status"
                              value={field.value}
                              colorHex={getFieldColor('status', field.value)}
                            >
                              {getFieldLabel('status', field.value)}
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
              control={form.control as any}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto *</FormLabel>
                  <FormControl>
                    {isEditMode ? (
                      <Input {...field} />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded">
                        {ticket?.subject || field.value || 'Não informado'}
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
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    {isEditMode ? (
                      <TicketDescriptionEditor 
                        content={field.value || ticket?.description || ''}
                        onChange={field.onChange}
                        placeholder="Digite a descrição do ticket..."
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded min-h-[100px] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ 
                        __html: ticket?.description || field.value || '<p>Não informado</p>' 
                      }} />
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

            {/* Campos Adicionais */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">INFORMAÇÕES ADICIONAIS</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Horas Estimadas */}
                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Estimadas</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input 
                            type="number" 
                            min="0" 
                            max="999" 
                            step="0.5"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="0"
                          />
                        ) : (
                          <div className="p-2 bg-gray-50 rounded">{field.value || 0}h</div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horas Reais */}
                <FormField
                  control={form.control}
                  name="actualHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Reais</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input 
                            type="number" 
                            min="0" 
                            max="999" 
                            step="0.5"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="0"
                          />
                        ) : (
                          <div className="p-2 bg-gray-50 rounded">{field.value || 0}h</div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Data de Vencimento */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Data de Vencimento</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Input 
                          type="datetime-local"
                          {...field}
                          placeholder="Não especificado"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">
                          {field.value ? new Date(field.value).toLocaleString('pt-BR') : 'Não especificado'}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ambiente */}
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Ambiente</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <DynamicSelect
                          fieldName="environment"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecione o ambiente"
                          disabled={!isEditMode}
                          allowCustomInput={true}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
                          <DynamicBadge 
                            fieldName="environment"
                            value={field.value}
                            colorHex={getFieldColor('environment', field.value || '')}
                          >
                            {getFieldLabel('environment', field.value || '') || field.value || 'Não especificado'}
                          </DynamicBadge>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Template Alternativo */}
              <FormField
                control={form.control}
                name="templateAlternative"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Template Alternativo</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Input {...field} placeholder="Não especificado" />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded">{field.value || 'Não especificado'}</div>
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
                          {formatFileSize(attachment.size)} • Adicionado em {
                            attachment.uploadedAt instanceof Date 
                              ? attachment.uploadedAt.toLocaleDateString('pt-BR')
                              : typeof attachment.uploadedAt === 'string'
                              ? new Date(attachment.uploadedAt).toLocaleDateString('pt-BR')
                              : 'Data não disponível'
                          }
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
                  <Button 
                    onClick={addNote} 
                    disabled={!newNote.trim() || isAddingNote}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isAddingNote ? "Salvando..." : "Adicionar Nota"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Notes Timeline */}
            {notes.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Timeline de Notas</h3>
                <div className="space-y-3">
                  {notes
                    .slice()
                    .sort((a: any, b: any) => {
                      const dateA = new Date(a.created_at || a.createdAt || 0);
                      const dateB = new Date(b.created_at || b.createdAt || 0);
                      return dateB.getTime() - dateA.getTime(); // Ordem decrescente (mais recente primeiro)
                    })
                    .map((note: any) => (
                    <Card key={note.id} className="p-4 border-l-4 border-l-blue-400">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {note.author_name || note.createdBy || 'Sistema'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {note.created_at ? new Date(note.created_at).toLocaleString('pt-BR') : 
                               note.createdAt ? new Date(note.createdAt).toLocaleString('pt-BR') : 
                               'Data não disponível'}
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta nota?")) {
                              deleteNoteMutation.mutate(note.id);
                            }
                          }}
                          disabled={deleteNoteMutation.isPending}
                          title="Excluir nota"
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
                          {comm.timestamp ? new Date(comm.timestamp).toLocaleString('pt-BR') : 'Data não disponível'}
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
                  type="button"
                  variant={historyViewMode === 'simple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setHistoryViewMode('simple');
                  }}
                >
                  Simples
                </Button>
                <Button
                  type="button"
                  variant={historyViewMode === 'advanced' ? 'default' : 'outline'}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setHistoryViewMode('advanced');
                  }}
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
                {/* Real history data from API - filter out generic entries */}
                {history.length > 0 ? history
                  .filter((historyItem: any) => {
                    // Filter out generic "ticket updated" entries without meaningful information
                    return !(
                      historyItem.action_type === 'ticket_updated' && 
                      historyItem.description === 'Ticket atualizado' &&
                      !historyItem.field_name &&
                      !historyItem.old_value &&
                      !historyItem.new_value
                    );
                  })
                  .map((historyItem: any, index: number) => {
                  // Map action types to icons and colors
                  const getActionIcon = (actionType: string) => {
                    switch (actionType) {
                      case 'created':
                      case 'ticket_created': return { icon: PlusCircle, color: 'green' };
                      case 'assigned': 
                      case 'assignment': return { icon: User, color: 'blue' };
                      case 'status_changed':
                      case 'status_change': return { icon: RefreshCw, color: 'orange' };
                      case 'viewed': return { icon: Eye, color: 'purple' };
                      case 'email_sent': 
                      case 'email_received': return { icon: Mail, color: 'indigo' };
                      case 'communication': return { icon: MessageSquare, color: 'teal' };
                      case 'attachment_added': return { icon: Paperclip, color: 'pink' };
                      case 'note_added':
                      case 'note_created': return { icon: FileText, color: 'blue' };
                      case 'note_deleted': return { icon: Trash2, color: 'red' };
                      case 'relationship_created': return { icon: Link2, color: 'green' };
                      case 'relationship_deleted': return { icon: Link2, color: 'red' };
                      case 'internal_action':
                      case 'internal_action_created': return { icon: Plus, color: 'purple' };
                      case 'internal_action_updated': return { icon: Edit, color: 'blue' };
                      case 'internal_action_deleted': return { icon: Trash2, color: 'red' };
                      case 'action_updated': return { icon: Edit, color: 'blue' };
                      case 'action_deleted': return { icon: Trash2, color: 'red' };
                      case 'resolution': return { icon: CheckCircle, color: 'green' };
                      case 'investigation': return { icon: AlertCircle, color: 'orange' };
                      case 'analysis': return { icon: BarChart3, color: 'blue' };
                      case 'work_log': return { icon: Clock, color: 'indigo' };
                      case 'documentation': return { icon: FileIcon, color: 'teal' };
                      case 'ação interna': return { icon: Settings, color: 'purple' };
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
                              {historyItem.action_type === 'ticket_created' && 'Ticket Criado'}
                              {historyItem.action_type === 'assigned' && 'Atribuição'}
                              {historyItem.action_type === 'assignment' && 'Atribuição'}
                              {historyItem.action_type === 'status_changed' && 'Status Alterado'}
                              {historyItem.action_type === 'status_change' && 'Status Alterado'}
                              {historyItem.action_type === 'viewed' && 'Visualização'}
                              {historyItem.action_type === 'email_sent' && 'Email Enviado'}
                              {historyItem.action_type === 'email_received' && 'Email Recebido'}
                              {historyItem.action_type === 'communication' && 'Comunicação'}
                              {historyItem.action_type === 'attachment_added' && 'Anexo Adicionado'}
                              {historyItem.action_type === 'internal_action' && 'Ação Interna'}
                              {historyItem.action_type === 'internal_action_created' && 'Ação Interna Criada'}
                              {historyItem.action_type === 'internal_action_updated' && 'Ação Interna Atualizada'}
                              {historyItem.action_type === 'internal_action_deleted' && 'Ação Interna Excluída'}
                              {historyItem.action_type === 'action_updated' && 'Ação Atualizada'}
                              {historyItem.action_type === 'action_deleted' && 'Ação Excluída'}
                              {historyItem.action_type === 'ação interna' && 'Ação Interna'}
                              {historyItem.action_type === 'note_added' && 'Nota Adicionada'}
                              {historyItem.action_type === 'note_created' && 'Nota Criada'}
                              {historyItem.action_type === 'note_deleted' && 'Nota Excluída'}
                              {historyItem.action_type === 'relationship_created' && 'Vínculo Criado'}
                              {historyItem.action_type === 'relationship_deleted' && 'Vínculo Removido'}
                              {historyItem.action_type === 'resolution' && 'Resolução'}
                              {historyItem.action_type === 'investigation' && 'Investigação'}
                              {historyItem.action_type === 'analysis' && 'Análise'}
                              {historyItem.action_type === 'work_log' && 'Log de Trabalho'}
                              {historyItem.action_type === 'documentation' && 'Documentação'}
                              {!['created', 'ticket_created', 'assigned', 'assignment', 'status_changed', 'status_change', 'viewed', 'email_sent', 'email_received', 'communication', 'attachment_added', 'internal_action', 'internal_action_created', 'internal_action_updated', 'internal_action_deleted', 'action_updated', 'action_deleted', 'ação interna', 'note_added', 'note_created', 'note_deleted', 'relationship_created', 'relationship_deleted', 'resolution', 'investigation', 'analysis', 'work_log', 'documentation'].includes(historyItem.action_type) && 'Atividade'}
                            </span>
                            {historyViewMode === 'advanced' && (
                              <Badge variant="secondary" className="text-xs">
                                {/* Para ações internas, mostrar o tipo específico da ação */}
                                {(historyItem.action_type === 'internal_action' || historyItem.action_type === 'ação interna') && historyItem.metadata?.action_type ? 
                                  historyItem.metadata.action_type.toUpperCase() : 
                                  historyItem.action_type.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {historyItem.created_at ? new Date(historyItem.created_at).toLocaleString('pt-BR') : 'Data não disponível'}
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
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <span className="text-gray-500">Usuário:</span>
                                <span className="ml-1 font-medium">{historyItem.performed_by_name || 'Sistema'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">IP:</span>
                                <span className="ml-1 font-medium text-blue-600">
                                  {historyItem.ip_address || historyItem.metadata?.ip_address || 'N/A'}
                                </span>
                              </div>
                            </div>
                            {(historyItem.user_agent || historyItem.metadata?.user_agent) && (
                              <div className="mb-2">
                                <span className="text-gray-500">User-Agent:</span>
                                <p className="text-xs break-all mt-1 text-gray-700">
                                  {historyItem.user_agent || historyItem.metadata?.user_agent}
                                </p>
                              </div>
                            )}
                            {(historyItem.session_id || historyItem.metadata?.session_id) && (
                              <div className="mb-2">
                                <span className="text-gray-500">Session ID:</span>
                                <span className="ml-1 font-mono text-xs">
                                  {historyItem.session_id || historyItem.metadata?.session_id}
                                </span>
                              </div>
                            )}
                            {historyItem.metadata && Object.keys(historyItem.metadata).length > 0 && (
                              <div className="border-t pt-2 mt-2">
                                <span className="text-gray-500">Metadados:</span>
                                <details className="mt-1">
                                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                    Ver detalhes técnicos
                                  </summary>
                                  <pre className="text-xs mt-2 p-2 bg-white border rounded overflow-x-auto">
                                    {JSON.stringify(historyItem.metadata, null, 2)}
                                  </pre>
                                </details>
                              </div>
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
                internalActions.map((action, index) => (
                  <Card key={`internal-action-${action.id}-${index}`} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Action Number Display */}
                          <div className="mb-2">
                            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border inline-block select-all">
                              Número: {action.action_number || action.actionNumber || action.id}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-sm">{action.createdByName || action.agent_name || 'Sistema'}</span>
                            <Badge variant="secondary" className="text-xs">
                              {action.actionType || action.type || 'Ação'}
                            </Badge>
                            <Badge variant={action.is_public ? 'default' : 'secondary'}>
                              {action.is_public ? 'Público' : 'Privado'}
                            </Badge>
                            <Badge variant={action.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {action.status === 'completed' ? 'Concluída' : 'Pendente'}
                            </Badge>
                            {action.assigned_to_name && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100"
                              >
                                <User className="w-3 h-3 mr-1" />
                                Responsável: {action.assigned_to_name}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {action.created_at ? new Date(action.created_at).toLocaleString('pt-BR') : 'Data não disponível'}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-gray-800 whitespace-pre-wrap">{action.content || action.description}</p>
                            {action.time_spent && action.time_spent !== '0:00:00:00' && (
                              <div className="text-xs text-gray-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Tempo gasto: {action.time_spent}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActionToEdit(action);
                                setEditActionModalOpen(true);
                              }}
                              className="h-7 w-7 p-0"
                              title="Editar ação interna"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir esta ação interna?")) {
                                  deleteInternalActionMutation.mutate(action.id);
                                }
                              }}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              disabled={deleteInternalActionMutation.isPending}
                              title="Excluir ação interna"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );

      case "links":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">🔗 Vínculos</h2>
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600">
                {relatedTickets.length} ticket(s) vinculado(s)
              </Badge>
            </div>

            <div className="space-y-4">
              {relatedTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Link className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Nenhum ticket vinculado</p>
                  <p className="text-xs text-gray-400">Use o botão "Vincular" para conectar tickets relacionados</p>
                </div>
              ) : (
                relatedTickets.map((linkedTicket) => {
                  // Obter ícone e cor baseado no tipo de relacionamento
                  const getRelationshipIcon = (type: string) => {
                    switch (type) {
                      case 'related':
                        return <Link2 className="h-4 w-4 text-gray-600" />;
                      case 'duplicates':
                        return <Copy className="h-4 w-4 text-orange-600" />;
                      case 'blocks':
                        return <AlertTriangle className="h-4 w-4 text-red-600" />;
                      case 'caused_by':
                        return <ArrowDown className="h-4 w-4 text-purple-600" />;
                      case 'parent_child':
                        return <Activity className="h-4 w-4 text-blue-600" />;
                      case 'follows':
                        return <Users className="h-4 w-4 text-green-600" />;
                      default:
                        return <Link2 className="h-4 w-4 text-gray-600" />;
                    }
                  };

                  const getRelationshipLabel = (type: string) => {
                    switch (type) {
                      case 'related':
                        return 'Relacionado';
                      case 'duplicates':
                        return 'Duplicado';
                      case 'blocks':
                        return 'Bloqueia';
                      case 'caused_by':
                        return 'Causado por';
                      case 'parent_child':
                        return 'Pai/Filho';
                      case 'follows':
                        return 'Segue';
                      default:
                        return 'Vinculado';
                    }
                  };

                  const getBorderColor = (type: string) => {
                    switch (type) {
                      case 'related':
                        return 'border-l-gray-500';
                      case 'duplicates':
                        return 'border-l-orange-500';
                      case 'blocks':
                        return 'border-l-red-500';
                      case 'caused_by':
                        return 'border-l-purple-500';
                      case 'parent_child':
                        return 'border-l-blue-500';
                      case 'follows':
                        return 'border-l-green-500';
                      default:
                        return 'border-l-gray-500';
                    }
                  };

                  return (
                    <Card key={`linked-${linkedTicket.id}-${linkedTicket.relationshipType}-${linkedTicket.targetTicket?.id || Math.random()}`} className={`border-l-4 ${getBorderColor(linkedTicket.relationshipType)} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              {/* Ícone visual do tipo de relacionamento */}
                              <div className="flex items-center gap-1">
                                {getRelationshipIcon(linkedTicket.relationshipType)}
                                <Badge variant="secondary" className="text-xs">
                                  {getRelationshipLabel(linkedTicket.relationshipType)}
                                </Badge>
                              </div>
                              
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 font-mono">
                                #{linkedTicket.targetTicket?.number || linkedTicket.number || 'T-000000'}
                              </Badge>
                              
                              <DynamicBadge 
                                fieldName="status"
                                value={linkedTicket.targetTicket?.status || linkedTicket.status}
                                colorHex={getFieldColor('status', linkedTicket.targetTicket?.status || linkedTicket.status)}
                              >
                                {getFieldLabel('status', linkedTicket.targetTicket?.status || linkedTicket.status)}
                              </DynamicBadge>
                              
                              <DynamicBadge 
                                fieldName="priority"
                                value={linkedTicket.targetTicket?.priority || linkedTicket.priority}
                                colorHex={getFieldColor('priority', linkedTicket.targetTicket?.priority || linkedTicket.priority)}
                              >
                                {getFieldLabel('priority', linkedTicket.targetTicket?.priority || linkedTicket.priority)}
                              </DynamicBadge>
                            </div>
                            
                            <h4 className="font-medium text-gray-800 mb-2">
                              {linkedTicket.targetTicket?.subject || linkedTicket.subject || 'Sem assunto definido'}
                            </h4>
                            
                            {(linkedTicket.targetTicket?.description || linkedTicket.description) && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {typeof (linkedTicket.targetTicket?.description || linkedTicket.description) === 'string' 
                                  ? (linkedTicket.targetTicket?.description || linkedTicket.description).replace(/<[^>]*>/g, '') 
                                  : 'Descrição não disponível'}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Criado em {(linkedTicket.targetTicket?.createdAt || linkedTicket.createdAt)
                                  ? new Date(linkedTicket.targetTicket?.createdAt || linkedTicket.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Data não disponível'}
                              </span>
                              
                              {linkedTicket.description && (
                                <span className="text-xs text-gray-400">
                                  Rel. criado em {new Date().toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-4 flex flex-col gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/tickets/${linkedTicket.targetTicket?.id || linkedTicket.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-700 p-2"
                              title="Abrir ticket em nova aba"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );

      case "external-actions":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">🔗 Ações Externas</h2>
              <Badge variant="outline" className="text-xs">
                {externalActions.length} ações disponíveis
              </Badge>
            </div>

            {/* 🚨 CORREÇÃO: Dados reais da API eliminando botões hardcoded */}
            <div className="space-y-4">
              {externalActions.length === 0 ? (
                <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                  <ExternalLink className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma ação externa configurada</h3>
                  <p className="text-gray-500 mb-4">
                    Configure integrações externas no módulo de administração para automatizar ações
                  </p>
                </Card>
              ) : (
                externalActions.map((action: any, index: number) => (
                  <Card key={`external-action-${action.id}-${index}`} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ExternalLink className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{action.title || action.action_type}</h4>
                          <p className="text-sm text-gray-600 mt-1">{action.description || action.summary}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {action.created_at ? new Date(action.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {action.status || 'pendente'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
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
                  ticketRelationships.related_tickets.map((relatedTicket: any, index: number) => (
                    <Card key={`related-${relatedTicket.id}-${index}`} className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
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
                    <div key={`insight-${idx}-${insight.type || insight.id || Math.random()}`} className="flex items-center gap-2">
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

  // 🚀 OTIMIZAÇÃO: Loading states específicos e informativos
  const isLoadingAnyData = isLoading || historyLoading || communicationsLoading || notesLoading || attachmentsLoading || actionsLoading;
  
  // Calculate loading progress
  const getLoadingProgress = () => {
    const states = [
      { name: 'Dados básicos', loading: isLoading },
      { name: 'Histórico', loading: historyLoading },
      { name: 'Comunicações', loading: communicationsLoading },
      { name: 'Notas', loading: notesLoading },
      { name: 'Anexos', loading: attachmentsLoading },
      { name: 'Ações', loading: actionsLoading }
    ];
    
    const completed = states.filter(s => !s.loading).length;
    const total = states.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { percentage, completed, total, states };
  };
  
  // Determine what is specifically loading
  const getLoadingMessage = () => {
    const progress = getLoadingProgress();
    const loadingItems = progress.states.filter(s => s.loading).map(s => s.name);
    
    if (loadingItems.length === 0) return "Carregamento concluído";
    if (loadingItems.length === 1) return `Carregando ${loadingItems[0].toLowerCase()}...`;
    return `Carregando ${loadingItems.length} itens... (${progress.percentage}%)`;
  };
  
  if (isLoadingAnyData) {
    const progress = getLoadingProgress();
    
    return (
      <div className="h-screen flex bg-gray-50">
        {/* Loading Sidebar */}
        <div className="w-72 bg-white border-r p-4">
          <div className="space-y-4" role="status" aria-live="polite">
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              ></div>
              <span className="text-sm text-gray-600" aria-label="Status de carregamento">
                {getLoadingMessage()}
              </span>
            </div>
            
            {/* Progress Bar Animado */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress.percentage}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
                aria-label={`Progresso: ${progress.percentage}%`}
              ></div>
            </div>
            
            <div className="text-xs text-gray-500 mb-2">
              {progress.completed}/{progress.total} componentes carregados
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {/* Loading progress indicators */}
            <div className="border-t pt-4">
              <div className="space-y-2 text-xs text-gray-500">
                <div className={`flex items-center gap-2 ${!isLoading ? 'text-green-600' : ''}`}>
                  {!isLoading ? '✅' : '⏳'} Dados básicos
                </div>
                <div className={`flex items-center gap-2 ${!historyLoading ? 'text-green-600' : ''}`}>
                  {!historyLoading ? '✅' : '⏳'} Histórico
                </div>
                <div className={`flex items-center gap-2 ${!notesLoading ? 'text-green-600' : ''}`}>
                  {!notesLoading ? '✅' : '⏳'} Notas
                </div>
                <div className={`flex items-center gap-2 ${!communicationsLoading ? 'text-green-600' : ''}`}>
                  {!communicationsLoading ? '✅' : '⏳'} Comunicações
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Loading Main Content */}
        <div className="flex-1 p-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="ml-4 flex items-center gap-2">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="text-sm text-gray-500">{getLoadingMessage()}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Loading Right Sidebar */}
        <div className="w-80 bg-white border-l p-4">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
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

          {/* Empresa Cliente Section - Badge Destacado */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Empresa</span>
            </div>
            
            {isEditMode ? (
              <div className="space-y-2">
                <Select 
                  onValueChange={(value) => {
                    console.log('🏢 Company change:', { newCompanyId: value, selectedCompany });
                    handleCompanyChange(value);
                    // Limpar cliente e favorecido quando empresa muda
                    form.setValue('callerId', '');
                    form.setValue('beneficiaryId', '');
                    // Atualizar estado imediatamente
                    setSelectedCompany(value);
                    console.log('✅ Company state updated:', { newSelectedCompany: value, formValueAfter: form.getValues('customerCompanyId') });
                  }}
                  value={selectedCompany || ''}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione a empresa cliente">
                      {(() => {
                        const currentValue = selectedCompany;
                        const companyData = (Array.isArray(companiesData) ? companiesData : companiesData?.data || []).find((c: any) => c.id === currentValue);
                        return companyData?.name || (currentValue && currentValue !== 'unspecified' ? 'Empresa não encontrada' : 'Selecione a empresa cliente');
                      })()}
                    </SelectValue>
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
                {(() => {
                  const companyId = ticket.customer_company_id || ticket.customerCompanyId || ticket.company;
                  const companyData = (Array.isArray(companiesData) ? companiesData : companiesData?.data || []).find((c: any) => c.id === companyId);
                  const industry = ticket.customerCompany?.industry || companyData?.industry;
                  const cnpj = ticket.customerCompany?.cnpj || companyData?.cnpj;
                  
                  return (
                    <>
                      {industry && (
                        <div className="text-xs text-blue-600 mt-1">
                          🏷️ Setor: {industry}
                        </div>
                      )}
                      {cnpj && (
                        <div className="text-xs text-blue-600">
                          📄 CNPJ: {cnpj}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <Badge 
                variant="outline" 
                className="px-3 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-md hover:shadow-lg transition-shadow duration-200 w-full justify-center cursor-pointer"
                onClick={() => setIsCompanyDetailsOpen(true)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {(() => {
                  const companyId = ticket.customer_company_id || ticket.customerCompanyId || ticket.company;
                  const companyData = (Array.isArray(companiesData) ? companiesData : companiesData?.data || []).find((c: any) => c.id === companyId);
                  return companyData?.name || ticket.customerCompany?.name || (companyId && companyId !== 'unspecified' ? 'Empresa não encontrada' : 'Não especificado');
                })()}
              </Badge>
            )}
          </div>

          {/* Cliente/Solicitante e Favorecido Section */}
          <div className="mb-6 space-y-4">
            {/* Cliente/Solicitante */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Cliente</span>
              </div>
              
              {true ? (
                <FilteredCustomerSelect
                  value={form.getValues('callerId') || ''}
                  onChange={(value) => {
                    console.log('🔄 Setting new customer:', { oldValue: form.getValues('callerId'), newValue: value });
                    form.setValue('callerId', value, { shouldValidate: true, shouldDirty: true });
                    form.setValue('beneficiaryId', '', { shouldValidate: true, shouldDirty: true });
                    form.trigger('callerId'); // Force form re-render
                    handleCustomerChange(value, 'caller');
                    console.log('👤 Customer change:', { customerId: value, type: 'caller', formValue: form.getValues('callerId') });
                  }}
                  selectedCompanyId={form.getValues('customerCompanyId') || '503389ff-7616-48e0-8759-c6b98faf5608'}
                  placeholder="Selecionar cliente"
                  disabled={false}
                  className="h-8 text-xs text-left"
                />
              ) : (
                <Badge 
                  variant="outline" 
                  className="px-3 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500 to-violet-600 text-white border-purple-500 shadow-md hover:shadow-lg transition-shadow duration-200 w-full justify-center cursor-pointer"
                  onClick={() => setIsClientDetailsOpen(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {(() => {
                    const callerId = ticket.caller_id || ticket.callerId;
                    const customer = availableCustomers.find((c: any) => c.id === callerId);
                    
                    if (!customer && callerId && callerId !== 'unspecified') {
                      const allCustomers = Array.isArray(customersData?.customers) ? customersData.customers : [];
                      const fallbackCustomer = allCustomers.find((c: any) => c.id === callerId);
                      if (fallbackCustomer) {
                        return fallbackCustomer.fullName || fallbackCustomer.name || 
                               `${fallbackCustomer.firstName || ''} ${fallbackCustomer.lastName || ''}`.trim() || 
                               fallbackCustomer.email || 'Cliente encontrado';
                      }
                      return 'Cliente não encontrado';
                    }
                    
                    if (!customer) {
                      return (callerId === 'unspecified' || !callerId) ? 'Não especificado' : 'Cliente não encontrado';
                    }
                    
                    return customer.fullName || customer.name || 
                           `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 
                           customer.email || 'Cliente sem nome';
                  })()}
                </Badge>
              )}
            </div>

            {/* Favorecido */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Favorecido</span>
              </div>
              
              {true ? (
                <FilteredBeneficiarySelect
                  value={form.getValues('beneficiaryId') || ''}
                  onChange={(value) => {
                    console.log('🔄 Setting new beneficiary:', { oldValue: form.getValues('beneficiaryId'), newValue: value });
                    form.setValue('beneficiaryId', value, { shouldValidate: true, shouldDirty: true });
                    form.trigger('beneficiaryId'); // Force form re-render
                    handleCustomerChange(value, 'beneficiary');
                  }}
                  selectedCustomerId={form.getValues('callerId') || ''}
                  placeholder="Selecionar favorecido"
                  disabled={false}
                  className="h-8 text-xs text-left"
                />
              ) : (
                <Badge 
                  variant="outline" 
                  className="px-3 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-indigo-500 shadow-md hover:shadow-lg transition-shadow duration-200 w-full justify-center cursor-pointer"
                  onClick={() => setIsBeneficiaryDetailsOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {(() => {
                    const beneficiaryId = ticket.beneficiary_id || ticket.beneficiaryId;
                    const beneficiary = availableCustomers.find((c: any) => c.id === beneficiaryId) || 
                                      (Array.isArray(customersData?.customers) ? customersData.customers : []).find((c: any) => c.id === beneficiaryId);
                    
                    if (!beneficiary) {
                      return (beneficiaryId === 'unspecified' || !beneficiaryId) ? 'Não especificado' : 'Favorecido não encontrado';
                    }
                    
                    return beneficiary.fullName || beneficiary.name || 
                           `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim() || 
                           beneficiary.email || 'Favorecido sem nome';
                  })()}
                </Badge>
              )}
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
                    value={form.getValues('location') || ticket.location || ''}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione o local">
                        {(() => {
                          const currentValue = form.getValues('location') || ticket.location;
                          const location = locationsData?.data?.locations?.find((l: any) => l.id === currentValue);
                          return location?.name || (currentValue && currentValue !== 'unspecified' ? currentValue : 'Selecione o local');
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">Não especificado</SelectItem>
                      {locationsData?.data?.locations?.map((location: any) => (
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
                      {locationsData?.data?.locations?.find((l: any) => l.id === ticket.location)?.name || 
                       ticket.location || 'Não especificado'}
                    </span>
                  </div>
                )}
                {(ticket.locationDetails || locationsData?.data?.locations?.find((l: any) => l.id === ticket.location)) && (
                  <div className="text-xs text-green-600">
                    📍 {ticket.locationDetails?.address || 
                        locationsData?.data?.locations?.find((l: any) => l.id === ticket.location)?.address || 
                        'Endereço não informado'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Responsável Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">RESPONSÁVEL</h3>
            
            {/* Grupo de Atribuição */}
            <div className="mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Grupo de Atribuição</label>
                {isEditMode ? (
                  <GroupSelect
                    value={selectedAssignmentGroup || form.getValues('assignmentGroup') || ticket.assignment_group_id || ''}
                    onChange={(value) => {
                      setSelectedAssignmentGroup(value);
                      form.setValue('assignmentGroup', value);
                      // Limpar responsável quando grupo muda
                      form.setValue('responsibleId', '');
                    }}
                    placeholder="Selecione o grupo"
                    disabled={!isEditMode}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {(() => {
                      const groupId = form.getValues('assignmentGroup') || ticket.assignment_group;
                      if (!groupId) return <span className="text-gray-500">Não especificado</span>;
                      const groups = userGroupsData?.data || [];
                      const group = groups.find((g: any) => g.id === groupId);
                      return <span>{group?.name || groupId}</span>;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Responsável */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Responsável</label>
              {isEditMode ? (
                <FilteredUserSelect
                  value={form.getValues('responsibleId') || ticket.assigned_to_id || ticket.responsibleId || ''}
                  onChange={(value) => form.setValue('responsibleId', value)}
                  selectedGroupId={selectedAssignmentGroup || form.getValues('assignmentGroup') || ticket.assignment_group_id}
                  placeholder="Selecionar responsável"
                  disabled={!isEditMode}
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded text-sm">
                  {ticket.assigned_to_name || 'Não especificado'}
                </div>
              )}
            </div>
          </div>

          {/* Seguidores Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">SEGUIDORES</h3>
            <div className="mb-4">
              <UserMultiSelect
                value={form.getValues('followers') || ticket.followers || []}
                onChange={(value) => {
                  console.log('👥 UserMultiSelect onChange called with:', value);
                  setFollowers(value);
                  form.setValue('followers', value);
                  console.log('✅ Followers state updated:', { 
                    newFollowers: value,
                    formValueAfter: form.getValues('followers')
                  });
                }}
                users={teamUsers}
                placeholder="Selecionar seguidores da equipe"
                disabled={!isEditMode}
              />
            </div>
          </div>

          {/* Campos Customizados Section - temporarily hidden */}
          <div className="mb-6" style={{ display: 'none' }}>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">SEGUIDORES ANTIGO (oculto)</h3>
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
                <h1 className="text-xl font-semibold">Ticket #{ticket?.number || ticket?.ticketNumber || ticket?.id?.slice(0, 8) || 'N/A'}</h1>
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
                    onClick={() => {
                      console.log("💾 Botão Salvar clicado!");
                      console.log("📋 Form valid:", form.formState.isValid);
                      console.log("❌ Form errors:", form.formState.errors);
                      console.log("📝 Form values:", form.getValues());
                      console.log("🔧 Form dirty fields:", form.formState.dirtyFields);
                      console.log("📮 Form touched fields:", form.formState.touchedFields);
                      
                      // Force a manual validation first
                      const formData = form.getValues();
                      console.log("🧪 Manual validation attempt on:", formData);
                      
                      // Try to trigger validation manually
                      form.trigger().then((isValid) => {
                        console.log("🧪 Manual trigger validation result:", isValid);
                        console.log("🧪 After trigger - errors:", form.formState.errors);
                        
                        if (isValid) {
                          console.log("✅ Form is valid, proceeding with onSubmit");
                          onSubmit(formData);
                        } else {
                          console.log("❌ Form validation failed");
                          const errorMessages = Object.entries(form.formState.errors)
                            .map(([field, error]) => `${field}: ${error?.message || 'Erro de validação'}`)
                            .join('\n');
                          
                          toast({
                            title: "Erro de Validação",
                            description: errorMessages ? `Por favor, corrija os seguintes erros:\n${errorMessages}` : "Dados do formulário são inválidos. Verifique todos os campos.",
                            variant: "destructive",
                          });
                        }
                      });
                    }}
                    disabled={updateTicketMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateTicketMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="h-full bg-white rounded-lg border p-6">
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()}>
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
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "communications" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Comunicação</span>
            </div>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-600">
              {communications?.length || 0}
            </Badge>
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
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "notes" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Notas</span>
            </div>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
              {notes?.length || 0}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("internal-actions")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "internal-actions" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Ações Internas</span>
            </div>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600">
              {internalActions?.length || 0}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("external-actions")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "external-actions" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm font-medium">Ações Externas</span>
            </div>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
              {externalActions.length}
            </Badge>
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
            onClick={() => setActiveTab("links")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "links" 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Link className="h-4 w-4" />
              <span className="text-sm font-medium">Vínculos</span>
            </div>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600">
              {relatedTickets.length}
            </Badge>
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
                          <span className="font-medium">{agentPassword.length > 0 ? 'Dados protegidos' : '••••••••••'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">CPF/CNPJ:</span>
                          <span className="font-medium">{agentPassword.length > 0 ? 'Dados protegidos' : '•••••••••••••••'}</span>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-1 text-xs">
                {(() => {
                  const beneficiaryId = ticket.beneficiary_id || ticket.beneficiaryId;
                  const beneficiary = availableCustomers.find((c: any) => c.id === beneficiaryId) || 
                                    (Array.isArray(customersData?.customers) ? customersData.customers : []).find((c: any) => c.id === beneficiaryId);
                  
                  const name = beneficiary ? (beneficiary.fullName || beneficiary.name || 
                             `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim() || 'Nome não informado') : 'Não especificado';
                  const email = beneficiary?.email || 'Não informado';
                  const phone = beneficiary?.phone || beneficiary?.mobilePhone || 'Não informado';
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nome:</span>
                        <span className="text-gray-900 font-medium truncate ml-2">{name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">E-mail:</span>
                        <span className="text-gray-900 font-medium truncate ml-2">{email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Telefone:</span>
                        <span className="text-gray-900 font-medium">{phone}</span>
                      </div>
                    </>
                  );
                })()}
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
                          <span className="font-medium">{agentPassword.length > 0 ? 'Dados protegidos' : '••••••••••'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">CPF/CNPJ:</span>
                          <span className="font-medium">{agentPassword.length > 0 ? 'Dados protegidos' : '•••••••••••••••'}</span>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-1 text-xs">
                {(() => {
                  const callerId = ticket.caller_id || ticket.callerId;
                  const caller = availableCustomers.find((c: any) => c.id === callerId) || 
                               (Array.isArray(customersData?.customers) ? customersData.customers : []).find((c: any) => c.id === callerId);
                  
                  const name = caller ? (caller.fullName || caller.name || 
                             `${caller.firstName || ''} ${caller.lastName || ''}`.trim() || 'Nome não informado') : 'Não especificado';
                  const email = caller?.email || 'Não informado';
                  const address = caller?.address || 'Não informado';
                  const addressNumber = caller?.addressNumber || '';
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nome:</span>
                        <span className="text-gray-900 font-medium truncate ml-2">{name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">E-mail:</span>
                        <span className="text-gray-900 font-medium truncate ml-2">{email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Endereço:</span>
                        <span className="text-gray-900 font-medium truncate ml-2">{address}{addressNumber && `, ${addressNumber}`}</span>
                      </div>
                    </>
                  );
                })()}
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

      {/* Client Details Modal */}
      <Dialog open={isClientDetailsOpen} onOpenChange={setIsClientDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const callerId = ticket.caller_id || ticket.callerId;
              const customer = availableCustomers.find((c: any) => c.id === callerId) || 
                             (Array.isArray(customersData?.customers) ? customersData.customers : []).find((c: any) => c.id === callerId);
              
              if (!customer && (!callerId || callerId === 'unspecified')) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum cliente especificado</p>
                  </div>
                );
              }
              
              if (!customer) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Cliente não encontrado</p>
                  </div>
                );
              }
              
              const customerName = customer.fullName || customer.name || 
                                 `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 
                                 customer.email || 'Cliente sem nome';
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg">
                    <User className="h-6 w-6 mr-2" />
                    <span className="font-semibold">{customerName}</span>
                  </div>
                  
                  {customer.email && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{customer.email}</span>
                    </div>
                  )}
                  
                  {customer.phone && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Telefone:</span>
                      <span className="text-sm text-gray-900">{customer.phone}</span>
                    </div>
                  )}
                  
                  {customer.cpf && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">CPF:</span>
                      <span className="text-sm text-gray-900">{customer.cpf}</span>
                    </div>
                  )}
                  
                  {customer.address && (
                    <div className="gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 block mb-1">Endereço:</span>
                      <span className="text-sm text-gray-900">{customer.address}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsClientDetailsOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Beneficiary Details Modal */}
      <Dialog open={isBeneficiaryDetailsOpen} onOpenChange={setIsBeneficiaryDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Detalhes do Favorecido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const beneficiaryId = ticket.beneficiary_id || ticket.beneficiaryId;
              const beneficiary = availableCustomers.find((c: any) => c.id === beneficiaryId) || 
                                (Array.isArray(customersData?.customers) ? customersData.customers : []).find((c: any) => c.id === beneficiaryId);
              
              if (!beneficiary && (!beneficiaryId || beneficiaryId === 'unspecified')) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum favorecido especificado</p>
                  </div>
                );
              }
              
              if (!beneficiary) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Favorecido não encontrado</p>
                  </div>
                );
              }
              
              const beneficiaryName = beneficiary.fullName || beneficiary.name || 
                                     `${beneficiary.firstName || ''} ${beneficiary.lastName || ''}`.trim() || 
                                     beneficiary.email || 'Favorecido sem nome';
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-center p-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg">
                    <Users className="h-6 w-6 mr-2" />
                    <span className="font-semibold">{beneficiaryName}</span>
                  </div>
                  
                  {beneficiary.email && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{beneficiary.email}</span>
                    </div>
                  )}
                  
                  {beneficiary.phone && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Telefone:</span>
                      <span className="text-sm text-gray-900">{beneficiary.phone}</span>
                    </div>
                  )}
                  
                  {beneficiary.cpf && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">CPF:</span>
                      <span className="text-sm text-gray-900">{beneficiary.cpf}</span>
                    </div>
                  )}
                  
                  {beneficiary.address && (
                    <div className="gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 block mb-1">Endereço:</span>
                      <span className="text-sm text-gray-900">{beneficiary.address}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsBeneficiaryDetailsOpen(false)}
            >
              Fechar
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

      {/* Edit Internal Action Modal */}
      <EditInternalActionModal
        ticketId={id || ''}
        action={actionToEdit}
        isOpen={editActionModalOpen}
        onClose={() => {
          setEditActionModalOpen(false);
          setActionToEdit(null);
        }}
      />

    </div>
  );
});

TicketDetails.displayName = 'TicketDetails';

export default TicketDetails;