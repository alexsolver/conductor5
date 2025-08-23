import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Settings, GripVertical, X, Undo, Redo, Bold, Italic, List, ListOrdered, ArrowLeft, Quote, Code, Heading1, Heading2, Heading3, Strikethrough, ChevronDown, ChevronUp, Link2, ArrowUpRight, ArrowDownRight, CornerDownRight, Copy, AlertTriangle, ArrowRight, GitBranch, Users } from "lucide-react";
import { DynamicSelect } from "@/components/DynamicSelect";
import { UserGroupSelect } from "@/components/ui/UserGroupSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { PersonSelector } from "@/components/PersonSelector";
import { useFieldColors } from "@/hooks/useFieldColors";
import { useCompanyNameResolver } from "@/hooks/useCompanyName";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";
import TicketHierarchyView from "@/components/tickets/TicketHierarchyView";
import { LoadingStateProvider } from "@/components/LoadingStateManager";
import { ResponsiveTicketsTable } from "@/components/tickets/ResponsiveTicketsTable";
import { OptimizedBadge } from "@/components/tickets/OptimizedBadge";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";

// ✅ SCHEMA DINÂMICO para ticket creation/editing - ServiceNow style
const ticketSchema = z.object({
  // Basic Fields
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  priority: z.string().refine(val => ['low', 'medium', 'high', 'critical'].includes(val), "Prioridade inválida"),
  impact: z.string().refine(val => ['low', 'medium', 'high', 'critical'].includes(val), "Impacto inválido").optional(),
  urgency: z.string().refine(val => ['low', 'medium', 'high'].includes(val), "Urgência inválida").optional(),
  state: z.string().refine(val => ['new', 'in_progress', 'resolved', 'closed', 'cancelled'].includes(val), "Estado inválido").optional(),

  // Assignment Fields - Enhanced for flexible person referencing
  companyId: z.string().min(1, "Empresa é obrigatória"),
  callerId: z.string().min(1, "Cliente é obrigatório"),
  callerType: z.string().refine(val => ["user", "customer"].includes(val), "Tipo de cliente inválido").default("customer"),
  beneficiaryId: z.string().optional(), // Optional - defaults to callerId
  beneficiaryType: z.string().refine(val => ["user", "customer"].includes(val), "Tipo de beneficiário inválido").optional(),

  assignedToId: z.string().optional(),
  assignmentGroup: z.string().optional(),
  location: z.string().optional(),

  // Communication Fields
  contactType: z.string().refine(val => ["email", "phone", "self_service", "chat"].includes(val), "Tipo de contato inválido").optional(),

  // Business Fields
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),

  // Using subject field directly - no legacy conversion needed
  subject: z.string().min(1, "Título do ticket é obrigatório"),
  status: z.string().refine(val => ["open", "in_progress", "resolved", "closed"].includes(val), "Status inválido").optional(),
  tags: z.array(z.string()).default([]),
});

type TicketFormData = z.infer<typeof ticketSchema>;

// Rich Text Editor Component
function RichTextEditor({ value, onChange, disabled = false }: { value: string, onChange: (value: string) => void, disabled?: boolean }) {
  const editor = useEditor({
    extensions: [StarterKit],
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

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced person referencing
  callerId: string;
  callerType: 'user' | 'customer';
  beneficiaryId?: string;
  beneficiaryType?: 'user' | 'customer';
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  // Related persons (populated by join)
  caller?: {
    id: string;
    type: 'user' | 'customer';
    email: string;
    fullName: string;
  };
  beneficiary?: {
    id: string;
    type: 'user' | 'customer';
    email: string;
    fullName: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const TicketsTable = React.memo(() => {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedViewId, setSelectedViewId] = useState("default");
  const [isNewViewDialogOpen, setIsNewViewDialogOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [activeTicketTab, setActiveTicketTab] = useState("informacoes");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // Estados para expansão de relacionamentos
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [ticketRelationships, setTicketRelationships] = useState<Record<string, any[]>>({});
  const [ticketsWithRelationships, setTicketsWithRelationships] = useState<Set<string>>(new Set());

  // Hook para buscar cores dos campos personalizados com estado aprimorado
  const { getFieldColor, getFieldLabel, isLoading: isFieldColorsLoading, isReady: isFieldColorsReady } = useFieldColors();

  // Hook para resolver nomes de empresas
  const { getCompanyName } = useCompanyNameResolver();

  // Debug das cores dos campos
  React.useEffect(() => {
    if (!isFieldColorsLoading) {
      console.log('🎨 Field colors hook status:', {
        isLoading: isFieldColorsLoading,
        getFieldColor: typeof getFieldColor,
        getFieldLabel: typeof getFieldLabel
      });

      // Testar algumas cores específicas
      const testPriorities = ['low', 'medium', 'high', 'critical'];
      const testStatuses = ['new', 'open', 'in_progress', 'resolved', 'closed'];
      const testCategories = ['support', 'hardware', 'software', 'network', 'access', 'other'];

      console.log('🎨 Testing priority colors:');
      testPriorities.forEach(p => {
        const color = getFieldColor('priority', p);
        const label = getFieldLabel('priority', p);
        console.log(`  ${p}: ${color} (${label})`);
      });

      console.log('🎨 Testing status colors:');
      testStatuses.forEach(s => {
        const color = getFieldColor('status', s);
        const label = getFieldLabel('status', s);
        console.log(`  ${s}: ${color} (${label})`);
      });

      console.log('🎨 Testing category colors:');
      testCategories.forEach(c => {
        const color = getFieldColor('category', c);
        const label = getFieldLabel('category', c);
        console.log(`  ${c}: ${color} (${label})`);
      });
    }
  }, [isFieldColorsLoading, getFieldColor, getFieldLabel]);

  // Status mapping simplificado - usar valores diretos do banco
  const statusMapping: Record<string, string> = {
    'new': 'new',
    'open': 'open',
    'in_progress': 'in_progress',
    'resolved': 'resolved',
    'closed': 'closed'
  };

  const priorityMapping: Record<string, string> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'critical'
  };

  const impactMapping: Record<string, string> = {
    'low': 'baixo',
    'medium': 'medio',
    'high': 'alto'
  };

  const urgencyMapping: Record<string, string> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high'
  };

  const categoryMapping: Record<string, string> = {
    'hardware': 'hardware',
    'software': 'software',
    'network': 'network',
    'access': 'access',
    'other': 'other',
    'support': 'support',
    'technical_support': 'technical_support',
    'customer_service': 'customer_service',
    'financial': 'financial',
    'infrastructure': 'infrastructure'
  };

  // Função helper para obter cor com fallback durante carregamento
  const getFieldColorWithFallback = (fieldName: string, value: string): string => {
    // 🚨 CORREÇÃO: Sempre tentar obter cor, mesmo durante carregamento
    const color = getFieldColor(fieldName, value);

    // Se encontrou cor nas configurações, usar ela
    if (color && color !== '#6b7280') {
      return color;
    }

    // Fallback para cores padrão da empresa Default (mesmo durante carregamento)
    const defaultColors: Record<string, Record<string, string>> = {
      category: {
        'suporte_tecnico': '#3b82f6',
        'atendimento_cliente': '#10b981',
        'financeiro': '#f59e0b',
        'support': '#3b82f6',
        'hardware': '#ef4444',
        'software': '#22c55e',
        'network': '#f97316',
        'access': '#84cc16',
        'other': '#64748b'
      },
      priority: {
        'low': '#10b981',
        'medium': '#22c55e',
        'high': '#9333ea',
        'critical': '#dc2626'
      },
      status: {
        'new': '#9333ea',
        'open': '#3b82f6',
        'in_progress': '#f59e0b',
        'resolved': '#10b981',
        'closed': '#6b7280'
      },
      urgency: {
        'low': '#10b981',
        'medium': '#f59e0b',
        'high': '#f97316',
        'critical': '#dc2626'
      }
    };

    return defaultColors[fieldName]?.[value] || '#6b7280';
  };

  // Serviço centralizado de mapeamento de dados
  const dataMapper = useMemo(() => ({
    status: (value: string): string => {
      if (!value) return 'new';
      // Manter valores do banco diretos - sem tradução
      return statusMapping[value.toLowerCase()] || value;
    },

    priority: (value: string): string => {
      if (!value) return 'medium';
      return priorityMapping[value.toLowerCase()] || value;
    },

    impact: (value: string): string => {
      if (!value) return 'low';
      return impactMapping[value.toLowerCase()] || value;
    },

    urgency: (value: string): string => {
      if (!value) return 'medium';
      return urgencyMapping[value.toLowerCase()] || value;
    },

    category: (value: string): string => {
      if (!value || value === null || value === 'null' || value === '' || typeof value !== 'string') {
        return 'support'; // Valor padrão
      }
      // Manter o valor original sem mapeamento para preservar as cores configuradas
      return value.toLowerCase();
    }
  }), [statusMapping, priorityMapping, impactMapping, urgencyMapping, categoryMapping]);

  // Função de mapeamento para status
  const mapStatusValue = (value: string): string => {
    return dataMapper.status(value);
  };

  // Função de mapeamento para prioridade
  const mapPriorityValue = (value: string): string => {
    return dataMapper.priority(value);
  };

  // Função de mapeamento para impacto
  const mapImpactValue = (value: string): string => {
    return dataMapper.impact(value);
  };

  // Função de mapeamento para urgência
  const mapUrgencyValue = (value: string): string => {
    return dataMapper.urgency(value);
  };

  // Função de mapeamento para categoria com fallback mais robusto
  const mapCategoryValue = (value: string): string => {
    if (!value || value === null || value === 'null' || value === '' || typeof value !== 'string') {
      return ''; // Retornar vazio ao invés de forçar suporte_tecnico
    }

    // Mapeamento de valores legados para valores configurados
    const categoryLegacyMapping: Record<string, string> = {
      'support': 'suporte_tecnico',
      'hardware': 'suporte_tecnico',
      'software': 'suporte_tecnico',
      'network': 'suporte_tecnico',
      'access': 'suporte_tecnico',
      'other': 'suporte_tecnico',
      'technical_support': 'suporte_tecnico',
      'customer_service': 'atendimento_cliente',
      'financial': 'financeiro',
      'infrastructure': 'suporte_tecnico'
    };

    const normalizedValue = value.toLowerCase().trim();
    return categoryLegacyMapping[normalizedValue] || normalizedValue;
  };

  // Estados para criação de visualização
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([
    "number", "subject", "customer", "category", "status", "priority", "created"
  ]);
  const [isPublicView, setIsPublicView] = useState(false);

  // Estados para gerenciar visualizações
  const [isManageViewsOpen, setIsManageViewsOpen] = useState(false);
  const [editingView, setEditingView] = useState<any>(null);
  const [columnsOrder, setColumnsOrder] = useState<any[]>([]);

  // Estados para redimensionamento de colunas
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  // Campos disponíveis para seleção em visualizações (expandido)
  const availableColumns = [
    { id: "number", label: "Número" },
    { id: "subject", label: "Assunto" },
    { id: "description", label: "Descrição" },
    { id: "customer", label: "Cliente" },
    { id: "company", label: "Empresa" },
    { id: "category", label: "Categoria" },
    { id: "subcategory", label: "Subcategoria" },
    { id: "status", label: "Status" },
    { id: "priority", label: "Prioridade" },
    { id: "impact", label: "Impacto" },
    { id: "urgency", label: "Urgência" },
    { id: "assigned_to", label: "Responsável" },
    { id: "created_by", label: "Criado por" },
    { id: "created", label: "Criado em" },
    { id: "updated", label: "Atualizado em" },
    { id: "due_date", label: "Prazo" },
    { id: "resolution_time", label: "Tempo de Resolução" },
    { id: "sla_status", label: "Status SLA" },
    { id: "tags", label: "Tags" },
    { id: "location", label: "Localização" },
    { id: "source", label: "Origem" },
    { id: "satisfaction", label: "Satisfação" }
  ];
  const itemsPerPage = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // 🔧 [1QA-COMPLIANCE] Queries seguindo Clean Architecture
  const {
    data: ticketsData,
    isLoading,
    error: ticketsError
  } = useOptimizedQuery({
    queryKey: ['/api/tickets', {
      page: currentPage,
      limit: itemsPerPage,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      search: searchTerm || undefined
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiRequest('GET', `/api/tickets?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  // 🔧 [1QA-COMPLIANCE] Query para views seguindo Clean Architecture
  const {
    data: ticketViews = [],
    refetch: refetchViews
  } = useOptimizedQuery({
    queryKey: ['/api/ticket-views'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ticket-views');
      if (!response.ok) throw new Error('Failed to fetch views');
      const data = await response.json();
      return data.views || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // 🔧 [1QA-COMPLIANCE] Query para usuários seguindo Clean Architecture
  const {
    data: users = []
  } = useOptimizedQuery({
    queryKey: ['/api/tenant-admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tenant-admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // 🔧 [1QA-COMPLIANCE] Query para empresas seguindo Clean Architecture
  const {
    data: companiesResponse = { companies: [] }
  } = useOptimizedQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      // O endpoint retorna { success: true, data: { companies: [...] } }
      if (data.success && data.data && data.data.companies) {
        return { companies: data.data.companies };
      }
      // Fallback para resposta direta como array
      return { companies: Array.isArray(data) ? data : [] };
    },
    staleTime: 5 * 60 * 1000,
  });

  const companies = companiesResponse?.companies || [];

  // 🔧 [1QA-COMPLIANCE] Processar dados de tickets seguindo Clean Architecture
  const tickets = useMemo(() => {
    if (!ticketsData) return [];

    console.log('🔍 [DEBUG] ticketsData structure:', JSON.stringify(ticketsData, null, 2));

    // ✅ CRITICAL FIX: Backend returns { success: true, data: [...] } directly
    if (ticketsData.success && Array.isArray(ticketsData.data)) {
      console.log('✅ [SUCCESS] Found tickets in ticketsData.data:', ticketsData.data.length);
      return ticketsData.data;
    }

    // Standard Clean Architecture response structure with nested tickets
    if (ticketsData.success && ticketsData.data?.tickets && Array.isArray(ticketsData.data.tickets)) {
      console.log('✅ [SUCCESS] Found tickets in ticketsData.data.tickets:', ticketsData.data.tickets.length);
      return ticketsData.data.tickets;
    }

    // Legacy support for direct data property
    if (ticketsData.data?.tickets && Array.isArray(ticketsData.data.tickets)) {
      console.log('✅ [SUCCESS] Found tickets in legacy data.tickets:', ticketsData.data.tickets.length);
      return ticketsData.data.tickets;
    }

    // Direct tickets array (fallback)
    if (ticketsData.tickets && Array.isArray(ticketsData.tickets)) {
      console.log('✅ [SUCCESS] Found tickets in direct tickets:', ticketsData.tickets.length);
      return ticketsData.tickets;
    }

    // Raw array (ultimate fallback)
    if (Array.isArray(ticketsData)) {
      console.log('✅ [SUCCESS] Found tickets as raw array:', ticketsData.length);
      return ticketsData;
    }

    console.log('❌ [ERROR] No tickets found in any expected format');
    return [];
  }, [ticketsData]);

  // 🔧 [1QA-COMPLIANCE] Paginação seguindo Clean Architecture
  const pagination = useMemo(() => {
    if (!ticketsData) return { total: 0, totalPages: 0 };

    const total = ticketsData.total || ticketsData.pagination?.total || tickets.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { total, totalPages };
  }, [ticketsData, tickets.length, itemsPerPage]);



  // 🔧 [1QA-COMPLIANCE] Verificar se um ticket tem relacionamentos - Clean Architecture
  // 🔧 [1QA-COMPLIANCE] Buscar relacionamentos seguindo Clean Architecture
  // 🔧 [1QA-COMPLIANCE] Função para expandir relacionamentos seguindo Clean Architecture
  const toggleTicketExpansion = useCallback(async (ticketId: string) => {
    if (expandedTickets.has(ticketId)) {
      // Se já está expandido, colapsa
      setExpandedTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
      return;
    }

    // Se não está expandido, expande e busca relacionamentos se necessário
    if (!ticketRelationships[ticketId]) {
      try {
        console.log(`🔄 [RELATIONSHIP-FETCH] Fetching relationships for ticket ${ticketId}`);
        const response = await apiRequest('GET', `/api/ticket-relationships/${ticketId}/relationships`);
        const data = await response.json();

        console.log(`📊 [RELATIONSHIP-FETCH] Response for ticket ${ticketId}:`, data);

        let relationships: any[] = [];
        if (data.success && Array.isArray(data.data)) {
          relationships = data.data;
        } else if (Array.isArray(data.relationships)) {
          relationships = data.relationships;
        } else if (Array.isArray(data)) {
          relationships = data;
        } else if (data.data && typeof data.data === 'object') {
          // Handle case where data.data is an object with ticket relationships
          relationships = Object.values(data.data).flat();
        }

        console.log(`✅ [RELATIONSHIP-FETCH] Processed ${relationships.length} relationships for ticket ${ticketId}`);

        setTicketRelationships(prev => ({
          ...prev,
          [ticketId]: relationships
        }));

        // Always update the relationships map, even if empty
        if (relationships.length > 0) {
          setTicketsWithRelationships(prev => new Set(Array.from(prev).concat([ticketId])));
          console.log(`✅ [RELATIONSHIP-DETECTION] Ticket ${ticketId} has ${relationships.length} relationships`);
        } else {
          console.log(`ℹ️ [RELATIONSHIP-DETECTION] Ticket ${ticketId} has no relationships`);
        }
      } catch (error) {
        console.error(`❌ [RELATIONSHIP-FETCH] Erro ao buscar relacionamentos para ticket ${ticketId}:`, error);
        // Mesmo em caso de erro, armazena array vazio para evitar novas tentativas
        setTicketRelationships(prev => ({
          ...prev,
          [ticketId]: []
        }));
      }
    }

    setExpandedTickets(prev => new Set(Array.from(prev).concat([ticketId])));
  }, [expandedTickets, ticketRelationships]);

  // 🔧 [1QA-COMPLIANCE] Inicialização de relacionamentos seguindo Clean Architecture
  useEffect(() => {
    if (tickets.length > 0) {
      console.log(`🔄 [RELATIONSHIP-INIT] Inicializando relacionamentos para ${tickets.length} tickets`);

      // ✅ Inicialização completa dos relacionamentos - removido cache para debug
      const batchResults: Record<string, any[]> = {};
      const ticketsWithRelationshipsSet = new Set<string>();

      Promise.all(
        tickets.map(async (ticket: any) => {
          try {
            console.log(`🔄 [RELATIONSHIP-INIT] Buscando relacionamentos para ticket ${ticket.id}`);
            const response = await apiRequest("GET", `/api/ticket-relationships/${ticket.id}/relationships`);
            const data = await response.json();

            let relationships: any[] = [];
            if (data?.success && Array.isArray(data.data)) {
              relationships = data.data;
            } else if (data?.relationships && Array.isArray(data.relationships)) {
              relationships = data.relationships;
            } else if (Array.isArray(data)) {
              relationships = data;
            }

            // Sempre atualizar o batch, mesmo se vazio
            batchResults[ticket.id] = relationships;

            if (relationships.length > 0) {
              console.log(`🔗 [RELATIONSHIP-INIT] Ticket ${ticket.id} tem ${relationships.length} relacionamentos`);
              ticketsWithRelationshipsSet.add(ticket.id);
            } else {
              console.log(`🔗 [RELATIONSHIP-INIT] Ticket ${ticket.id} não tem relacionamentos`);
            }
          } catch (error) {
            console.error(`❌ [RELATIONSHIP-INIT] Erro ao buscar relacionamentos para ${ticket.id}:`, error);
            batchResults[ticket.id] = []; // Inicializar vazio em caso de erro
          }
        })
      ).then(() => {
        // Atualizar estados em batch após todas as chamadas
        console.log(`💾 [RELATIONSHIP-INIT] Atualizando estados com ${Object.keys(batchResults).length} tickets`);
        setTicketRelationships(batchResults);
        setTicketsWithRelationships(ticketsWithRelationshipsSet);

        console.log(`🎯 [RELATIONSHIP-DEBUG] Tickets com relacionamentos:`, Array.from(ticketsWithRelationshipsSet));
        console.log(`🎯 [RELATIONSHIP-DEBUG] Batch results:`, Object.keys(batchResults).map(id => ({ id, count: batchResults[id].length })));

        // ✅ [1QA-COMPLIANCE] Debug final do estado
        console.log(`🔍 [RELATIONSHIP-STATE] ticketRelationships keys:`, Object.keys(batchResults));
        console.log(`🔍 [RELATIONSHIP-STATE] ticketsWithRelationships size:`, ticketsWithRelationshipsSet.size);
        console.log(`🔍 [RELATIONSHIP-STATE] Estado final:`, {
          hasRelationships: ticketsWithRelationshipsSet.size > 0,
          relationshipCount: Object.keys(batchResults).length,
          ticketsWithRelationships: Array.from(ticketsWithRelationshipsSet)
        });
      });
    }
  }, [tickets]);

  // Obter visualização ativa
  const activeView = ticketViews.find((view: any) => view.id === selectedViewId);
  const activeColumns = activeView?.columns || [
    { id: "number", label: "Número", visible: true, order: 1, width: 120 },
    { id: "subject", label: "Assunto", visible: true, order: 2, width: 300 },
    { id: "customer", label: "Cliente", visible: true, order: 3, width: 150 },
    { id: "company", label: "Empresa", visible: true, order: 4, width: 150 },
    { id: "category", label: "Categoria", visible: true, order: 5, width: 120 },
    { id: "status", label: "Status", visible: true, order: 6, width: 120 },
    { id: "priority", label: "Prioridade", visible: true, order: 7, width: 120 },
    { id: "urgency", label: "Urgência", visible: true, order: 8, width: 120 },
    { id: "created", label: "Criado", visible: true, order: 9, width: 150 }
  ];

  // Filtrar apenas colunas visíveis e ordenar
  const visibleColumns = activeColumns
    .filter((col: any) => col.visible)
    .sort((a: any, b: any) => a.order - b.order);

  // Componente de célula otimizado com React.memo e useMemo
  const TableCellComponent = memo(({ column, ticket }: { column: any, ticket: Ticket }) => {
    const cellStyle = useMemo(() => ({
      width: getColumnWidth(column.id),
      minWidth: getColumnWidth(column.id),
      maxWidth: getColumnWidth(column.id)
    }), [column.id, columnWidths]);

    const memoizedCellContent = useMemo(() => {
      switch (column.id) {
        case 'number':
          return (
            <TableCell className="font-mono text-sm overflow-hidden" style={cellStyle}>
              <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800 hover:underline truncate block">
                {(ticket as any).number || `#${ticket.id.slice(-8)}`}
              </Link>
            </TableCell>
          );
        case 'subject':
          return (
            <TableCell className="font-medium overflow-hidden" style={cellStyle}>
              <div className="truncate" title={ticket.subject}>
                {ticket.subject}
              </div>
            </TableCell>
          );
        case 'customer':
          // Novo mapeamento corrigido para clientes
          const customerName = (() => {
            // Tentar diferentes campos possíveis do backend
            if ((ticket as any).caller_name) {
              return (ticket as any).caller_name;
            }
            if ((ticket as any).customer_name) {
              return (ticket as any).customer_name;
            }
            if ((ticket as any).caller_first_name && (ticket as any).caller_last_name) {
              return `${(ticket as any).caller_first_name} ${(ticket as any).caller_last_name}`.trim();
            }
            if ((ticket as any).customer_first_name && (ticket as any).customer_last_name) {
              return `${(ticket as any).customer_first_name} ${(ticket as any).customer_last_name}`.trim();
            }
            // Fallbacks para objetos relacionados
            if (ticket.caller?.fullName) return ticket.caller.fullName;
            if (ticket.customer?.fullName) return ticket.customer.fullName;
            if ((ticket as any).caller_email) return (ticket as any).caller_email;
            return 'Cliente não informado';
          })();

          const customerEmail = (() => {
            if ((ticket as any).caller_email) return (ticket as any).caller_email;
            if ((ticket as any).customer_email) return (ticket as any).customer_email;
            if (ticket.caller?.email) return ticket.caller.email;
            if (ticket.customer?.email) return ticket.customer.email;
            return 'Email não informado';
          })();

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <div>
                <div className="font-medium truncate" title={customerName}>
                  {customerName}
                </div>
                <div className="text-sm text-gray-500 truncate" title={customerEmail}>
                  {customerEmail}
                </div>
              </div>
            </TableCell>
          );
        case 'company':
          // Novo mapeamento corrigido para empresas
          const companyName = (() => {
            // Tentar diferentes campos possíveis do backend
            if ((ticket as any).company_name) {
              return (ticket as any).company_name;
            }
            if ((ticket as any).caller_company_name) {
              return (ticket as any).caller_company_name;
            }
            if ((ticket as any).company_name) {
              return (ticket as any).company_name;
            }

            // Se temos um ID da empresa, resolver o nome
            const companyId = (ticket as any).company_id;
            if (companyId) {
              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
              if (isUuid) {
                const resolvedName = getCompanyName(companyId);
                if (resolvedName && resolvedName !== 'Empresa não encontrada') {
                  return resolvedName;
                }
              }
            }

            return 'Empresa não informada';
          })();

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <div className="font-medium truncate" title={companyName}>
                {companyName}
              </div>
            </TableCell>
          );
        case 'category':
          const rawCategoryValue = (ticket as any).category;

          // 🚨 CORREÇÃO CRÍTICA: Aguardar cores estarem prontas (não apenas loading)
          if (!isFieldColorsReady) {
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              </TableCell>
            );
          }

          const categoryValue = mapCategoryValue(rawCategoryValue);

          // Tentar buscar cor pelo valor original primeiro, depois pelo normalizado
          const categoryColor = getFieldColor('category', rawCategoryValue) ||
                               getFieldColor('category', categoryValue) ||
                               '#3b82f6';

          // Debug log para verificar se a cor está sendo encontrada
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Category color lookup: ${rawCategoryValue} = ${categoryColor}`);
          }

          const categoryLabel = getFieldLabel('category', rawCategoryValue) ||
                               getFieldLabel('category', categoryValue) ||
                               rawCategoryValue;



          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge
                fieldName="category"
                value={rawCategoryValue}
                colorHex={categoryColor}
                isLoading={isFieldColorsLoading}
              >
                {categoryLabel}
              </DynamicBadge>
            </TableCell>
          );
        case 'status':
          // 🚨 CORREÇÃO CRÍTICA: Aguardar cores estarem prontas
          if (!isFieldColorsReady) {
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              </TableCell>
            );
          }

          const statusValue = mapStatusValue((ticket as any).state || ticket.status);
          const statusColor = getFieldColorWithFallback('status', statusValue);
          const statusLabel = getFieldLabel('status', statusValue);

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge
                fieldName="status"
                value={statusValue}
                colorHex={statusColor}
                isLoading={isFieldColorsLoading}
              >
                {statusLabel}
              </DynamicBadge>
            </TableCell>
          );
        case 'priority':
          // 🚨 CORREÇÃO CRÍTICA: Aguardar cores estarem prontas
          if (!isFieldColorsReady) {
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              </TableCell>
            );
          }

          const priorityValue = mapPriorityValue(ticket.priority);
          const priorityColor = getFieldColorWithFallback('priority', priorityValue);
          const priorityLabel = getFieldLabel('priority', priorityValue);

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge
                fieldName="priority"
                value={priorityValue}
                colorHex={priorityColor}
                isLoading={false}
              >
                {priorityLabel}
              </DynamicBadge>
            </TableCell>
          );
        case 'impact':
          // 🚨 CORREÇÃO CRÍTICA: Aguardar cores estarem prontas
          if (!isFieldColorsReady) {
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              </TableCell>
            );
          }

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge
                fieldName="impact"
                value={mapImpactValue((ticket as any).impact)}
                colorHex={getFieldColorWithFallback('impact', mapImpactValue((ticket as any).impact))}
                isLoading={false}
              >
                {getFieldLabel('impact', mapImpactValue((ticket as any).impact))}
              </DynamicBadge>
            </TableCell>
          );
        case 'assigned_to':
          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              {ticket.assignedTo ? (
                <div>
                  <div className="font-medium truncate" title={`${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`}>
                    {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                  </div>
                  <div className="text-sm text-gray-500 truncate" title={ticket.assignedTo.email}>
                    {ticket.assignedTo.email}
                  </div>
                </div>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
            </TableCell>
          );
        case 'created':
          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <div className="text-sm">
                {(ticket.createdAt || (ticket as any).created_at || (ticket as any).opened_at)
                  ? new Date(ticket.createdAt || (ticket as any).created_at || (ticket as any).opened_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'N/A'
                }
              </div>
              <div className="text-xs text-gray-500">
                {(ticket.createdAt || (ticket as any).created_at || (ticket as any).opened_at)
                  ? new Date(ticket.createdAt || (ticket as any).created_at || (ticket as any).opened_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : ''
                }
              </div>
            </TableCell>
          );
        case 'description':
          return (
            <TableCell className="max-w-xs truncate">
              {ticket.description?.substring(0, 100) || '-'}
            </TableCell>
          );
        case 'subcategory':
          const rawSubcategoryValue = (ticket as any).subcategory;

          if (!rawSubcategoryValue) {
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <span className="text-gray-400 text-sm">-</span>
              </TableCell>
            );
          }

          // 🚨 CORREÇÃO CRÍTICA: Aguardar cores estarem prontas
          if (!isFieldColorsReady) {
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <div className="h-5 w-20 bg-gray-200 animate-pulse rounded"></div>
              </TableCell>
            );
          }

          const subcategoryColor = getFieldColor('subcategory', rawSubcategoryValue) || '#64748b';
          const subcategoryLabel = getFieldLabel('subcategory', rawSubcategoryValue) || rawSubcategoryValue;

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge
                fieldName="subcategory"
                value={rawSubcategoryValue}
                colorHex={subcategoryColor}
                isLoading={false}
              >
                {subcategoryLabel}
              </DynamicBadge>
            </TableCell>
          );
        case 'urgency':
          // 🚨 CORREÇÃO CRÍTICA: Aguardar cores estarem prontas
          if (!isFieldColorsReady) {
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              </TableCell>
            );
          }

          return (
            <TableCell>
              <DynamicBadge
                fieldName="urgency"
                value={mapUrgencyValue((ticket as any).urgency)}
                colorHex={getFieldColorWithFallback('urgency', mapUrgencyValue((ticket as any).urgency))}
                isLoading={false}
              >
                {getFieldLabel('urgency', mapUrgencyValue((ticket as any).urgency))}
              </DynamicBadge>
            </TableCell>
          );
        case 'created_by':
          return (
            <TableCell>
              {ticket.caller?.fullName || 'N/A'}
            </TableCell>
          );
        case 'updated':
          return (
            <TableCell>
              {(ticket.updatedAt || (ticket as any).updated_at)
                ? new Date(ticket.updatedAt || (ticket as any).updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                : 'N/A'
              }
            </TableCell>
          );
        case 'due_date':
          return (
            <TableCell>
              {(ticket as any).dueDate ? new Date((ticket as any).dueDate).toLocaleDateString() : '-'}
            </TableCell>
          );
        case 'resolution_time':
          return (
            <TableCell>
              {(ticket as any).resolutionTime || '-'}
            </TableCell>
          );
        case 'sla_status':
          return (
            <TableCell>
              <DynamicBadge
                fieldName="sla_status"
                value={(ticket as any).slaStatus || 'on_track'}
                colorHex={getFieldColorWithFallback('sla_status', (ticket as any).slaStatus || 'on_track')}
              >
                {getFieldLabel('sla_status', (ticket as any).slaStatus || 'on_track')}
              </DynamicBadge>
            </TableCell>
          );
        case 'tags':
          return (
            <TableCell>
              {(ticket as any).tags?.join(', ') || '-'}
            </TableCell>
          );
        case 'location':
          return (
            <TableCell>
              {(ticket as any).location || '-'}
            </TableCell>
          );
        case 'source':
          return (
            <TableCell>
              {(ticket as any).source || '-'}
            </TableCell>
          );
        case 'satisfaction':
          return (
            <TableCell>
              {(ticket as any).satisfaction ? `${(ticket as any).satisfaction}/5` : '-'}
            </TableCell>
          );

        default:
          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <div className="truncate">-</div>
            </TableCell>
          );
      }
    }, [column.id, ticket, cellStyle, getFieldColorWithFallback, getFieldLabel, mapCategoryValue, mapStatusValue, mapPriorityValue, mapImpactValue, mapUrgencyValue]);

    return memoizedCellContent;
  });

  // Função de renderização otimizada
  const renderCell = useCallback((ticket: any, key: string) => (
    <TableCellComponent key={key} column={{ id: key }} ticket={ticket} />
  ), []);

  // Otimizar comparação do TableCellComponent com comparação personalizada
  TableCellComponent.displayName = 'TableCellComponent';

  // Função de comparação personalizada aprimorada para evitar re-renders desnecessários
  const areEqual = (prevProps: any, nextProps: any) => {
    // Comparação rápida de referência primeiro
    if (prevProps === nextProps) return true;

    // Comparações específicas otimizadas
    const sameColumn = prevProps.column.id === nextProps.column.id;
    const sameTicket = prevProps.ticket.id === nextProps.ticket.id;
    const sameUpdatedAt = prevProps.ticket.updatedAt === nextProps.ticket.updatedAt;
    const sameStatus = prevProps.ticket.status === nextProps.ticket.status;
    const samePriority = prevProps.ticket.priority === nextProps.ticket.priority;
    const sameSubject = prevProps.ticket.subject === nextProps.ticket.subject;

    return sameColumn && sameTicket && sameUpdatedAt && sameStatus && samePriority && sameSubject;
  };

  const OptimizedTableCell = memo(TableCellComponent, areEqual);

  // Mutations para gerenciar visualizações
  const createViewMutation = useMutation({
    mutationFn: async (viewData: any) => {
      return apiRequest('POST', '/api/ticket-views', viewData);
    },
    onSuccess: () => {
      toast({
        title: "Visualização criada",
        description: "Nova visualização criada com sucesso"
      });
      refetchViews();
      setIsNewViewDialogOpen(false);
      resetNewViewForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar visualização",
        variant: "destructive"
      });
    }
  });

  const updateViewMutation = useMutation({
    mutationFn: async ({ id, viewData }: { id: string, viewData: any }) => {
      return apiRequest('PUT', `/api/ticket-views/${id}`, viewData);
    },
    onSuccess: () => {
      toast({
        title: "Visualização atualizada",
        description: "Visualização editada com sucesso"
      });
      refetchViews();
      setEditingView(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar visualização",
        variant: "destructive"
      });
    }
  });

  const deleteViewMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/ticket-views/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Visualização excluída",
        description: "Visualização removida com sucesso"
      });
      refetchViews();
      if (selectedViewId !== "default") {
        setSelectedViewId("default");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir visualização",
        variant: "destructive"
      });
    }
  });



  // Reset form para nova visualização
  const resetNewViewForm = () => {
    setNewViewName("");
    setNewViewDescription("");
    setSelectedColumns(["number", "subject", "customer", "category", "status", "priority", "urgency", "created"]);
    setIsPublicView(false);
  };

  // Handle create new view
  const handleCreateView = () => {
    if (!newViewName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da visualização é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Mapear colunas selecionadas para o formato esperado pelo schema
    const columnsData = [
      { id: "number", label: "Número", visible: selectedColumns.includes("number"), order: 1, width: 120 },
      { id: "subject", label: "Assunto", visible: selectedColumns.includes("subject"), order: 2, width: 300 },
      { id: "customer", label: "Cliente", visible: selectedColumns.includes("customer"), order: 3, width: 150 },
      { id: "category", label: "Categoria", visible: selectedColumns.includes("category"), order: 4, width: 120 },
      { id: "status", label: "Status", visible: selectedColumns.includes("status"), order: 5, width: 120 },
      { id: "priority", label: "Prioridade", visible: selectedColumns.includes("priority"), order: 6, width: 120 },
      { id: "urgency", label: "Urgência", visible: selectedColumns.includes("urgency"), order: 7, width: 120 },
      { id: "impact", label: "Impacto", visible: selectedColumns.includes("impact"), order: 8, width: 120 },
      { id: "assigned_to", label: "Responsável", visible: selectedColumns.includes("assigned_to"), order: 9, width: 150 },
      { id: "created", label: "Criado", visible: selectedColumns.includes("created"), order: 10, width: 150 }
    ];

    const viewData = {
      name: newViewName,
      description: newViewDescription || "",
      columns: columnsData,
      filters: [],
      sorting: [{ column: "createdAt", direction: "desc" }],
      isPublic: isPublicView,
      isDefault: false,
      pageSize: 25
    };

    if (editingView) {
      updateViewMutation.mutate({ id: editingView.id, viewData });
    } else {
      createViewMutation.mutate(viewData);
    }
  };

  // Handle edit existing view
  const handleEditView = (view: any) => {
    setEditingView(view);
    setIsManageViewsOpen(false);
    setIsNewViewDialogOpen(true);
    setNewViewName(view.name);
    setNewViewDescription(view.description || "");
    setSelectedColumns(view.columns?.map((col: any) => col.id) || []);
    setIsPublicView(view.isPublic || false);
  };

  // Handle delete view
  const handleDeleteView = (viewId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta visualização?")) {
      deleteViewMutation.mutate(viewId);
    }
  };

  // Handle column reordering
  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...selectedColumns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setSelectedColumns(newColumns);
  };

  // Reset dialog on close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingView(null);
      resetNewViewForm();
    }
    setIsNewViewDialogOpen(open);
  };

  // Funções para redimensionamento de colunas
  const getColumnWidth = (columnId: string) => {
    return columnWidths[columnId] || 150; // largura padrão
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnId);

    const startX = e.pageX;
    const startWidth = getColumnWidth(columnId);
    let rafId: number;
    let debounceTimeout: NodeJS.Timeout;
    let lastUpdateTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const now = Date.now();
        const newWidth = Math.max(80, startWidth + (e.pageX - startX));

        // Throttle de updates para melhor performance - máximo a cada 16ms
        if (now - lastUpdateTime >= 16) {
          setColumnWidths(prev => ({
            ...prev,
            [columnId]: newWidth
          }));
          lastUpdateTime = now;
        }

        // Debounce para localStorage - 300ms
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          localStorage.setItem(`column-width-${columnId}`, newWidth.toString());
          console.log(`✅ Resize completed for column: ${columnId}`);
        }, 300);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      if (rafId) cancelAnimationFrame(rafId);

      // Salvar no localStorage apenas no final
      const finalWidth = getColumnWidth(columnId);
      localStorage.setItem(`column-width-${columnId}`, finalWidth.toString());

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getColumnWidth, setColumnWidths, setIsResizing, setResizingColumn]);

  // Componente para handle de redimensionamento
  const ResizeHandle = ({ columnId }: { columnId: string }) => (
    <div
      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-300 hover:w-2 transition-all"
      onMouseDown={(e) => handleMouseDown(e, columnId)}
      style={{
        background: resizingColumn === columnId ? '#3b82f6' : 'transparent'
      }}
    />
  );

  // Debug logging
  console.log('TicketsTable - Data:', {
    ticketsError,
    isLoading,
    ticketsCount: tickets.length,
    rawTicketsData: ticketsData,
    ticketsStructure: ticketsData ? Object.keys(ticketsData) : 'null',
    actualTickets: tickets,
    customersCount: 0, // Legacy system removed
    usersCount: users?.length || 0,
    hasToken: !!localStorage.getItem('accessToken')
  });

  // Form setup
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      description: "",
      category: "",
      subcategory: "",
      priority: "medium",
      impact: "medium",
      urgency: "medium",
      state: "new",
      companyId: "",
      callerId: "",
      callerType: "customer",
      beneficiaryId: "",
      beneficiaryType: "customer",

      assignedToId: "unassigned",
      assignmentGroup: "",
      location: "",
      contactType: "email",
      businessImpact: "",
      symptoms: "",
      workaround: "",
      subject: "",
      status: "open",
      tags: [],
    },
  });

  // Remove synchronization logic - no longer needed

  // Mutação para criar ticket
  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🚀 Starting ticket creation with data:', data);
      try {
        const response = await apiRequest("POST", "/api/tickets", data);
        console.log('📡 API Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API Error Response:', errorData);
          throw new Error(errorData.message || "Erro ao criar ticket");
        }

        const result = await response.json();
        console.log('✅ API Success Response:', result);
        return result;
      } catch (error) {
        console.error('💥 Mutation Error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ Ticket criado com sucesso:", data);
      toast({
        title: "Sucesso",
        description: "Ticket criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsNewTicketModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("❌ Erro ao criar ticket:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar ticket",
        variant: "destructive",
      });
    },
  });



  const onSubmit = (data: TicketFormData) => {
    console.log('🚀 Form submission started with data:', data);

    // Remove legacy compatibility - using subject directly

    // Validate required fields
    if (!data.subject && !data.description) {
      console.error('❌ Subject or description is required');
      toast({
        title: "Erro de Validação",
        description: "Título ou descrição do ticket é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!data.companyId) {
      console.error('❌ Company is required');
      toast({
        title: "Erro de Validação",
        description: "Empresa é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!data.callerId) {
      console.error('❌ Customer is required');
      toast({
        title: "Erro de Validação",
        description: "Cliente é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Use subject field directly
    const subject = data.subject || data.description?.substring(0, 100) || "";

    const submitData = {
      // Core ticket fields (using ServiceNow-style naming)
      subject: subject,

      description: data.description,
      priority: data.priority,
      status: data.state || data.status || "open",
      state: data.state || "new",
      category: data.category || "",
      subcategory: data.subcategory || "",
      impact: data.impact || "medium",
      urgency: data.urgency || "medium",

      // People assignments
      customerId: data.callerId, // Map callerId to customerId for backend
      caller_id: data.callerId,
      caller_type: data.callerType || "customer",
      beneficiary_id: data.beneficiaryId || data.callerId,
      beneficiary_type: data.beneficiaryType || data.callerType || "customer",
      assigned_to_id: data.assignedToId === "unassigned" ? null : data.assignedToId,
      assignment_group: data.assignmentGroup || "",

      // Company relationship
      company_id: data.companyId,

      // Contact and location info
      contact_type: data.contactType || "email",
      location: data.location || "",

      // Business fields
      business_impact: data.businessImpact || "",
      symptoms: data.symptoms || "",
      workaround: data.workaround || "",

      // Additional fields
      tags: data.tags || [],
    };

    console.log('Submitting ticket data:', submitData);
    createTicketMutation.mutate(submitData);
  };

  const handleEdit = (ticket: any) => {
    console.log('Edit ticket:', ticket.id);
    navigate(`/tickets/${ticket.id}`);
  };

  const handleDelete = (ticketId: string) => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      // Redirect to the unified page where delete functionality is handled
      console.log("Delete ticket:", ticketId);
    }
  };



  // Reset page when filters change
  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return tickets;
  }, [searchTerm, statusFilter, priorityFilter]);

  const TicketForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error('❌ Form validation errors:', errors);

              // Extract specific error messages with better detail
              const errorMessages = [];
              if (errors.subject) {
                errorMessages.push(errors.subject.message || 'Título do ticket é obrigatório');
              }
              if (errors.description) {
                errorMessages.push(errors.description.message || 'Descrição é obrigatória');
              }
              if (errors.companyId) {
                errorMessages.push(errors.companyId.message || 'Empresa é obrigatória');
              }
              if (errors.callerId) {
                errorMessages.push(errors.callerId.message || 'Cliente é obrigatório');
              }

              const errorText = errorMessages.length > 0
                ? errorMessages.join('. ')
                : 'Por favor, preencha todos os campos obrigatórios';

              toast({
                title: "Erro de Validação",
                description: errorText,
                variant: "destructive",
              });
            })} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Description *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detailed description of the problem or request"
                    className="min-h-[100px]"
                    {...field}
                  />
                                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <DynamicSelect
                      fieldName="category"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select category"
                    />
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
                  <FormLabel>Subcategory</FormLabel>
                  <FormControl>
                    <Input placeholder="Specific subcategory" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Priority & Impact */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Priority & Impact</h3>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority *</FormLabel>
                  <FormControl>
                    <DynamicSelect
                      fieldName="priority"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select priority"
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
                  <FormLabel>Impact</FormLabel>
                  <FormControl>
                    <DynamicSelect
                      fieldName="impact"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select impact"
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
                  <FormLabel>Urgency</FormLabel>
                  <FormControl>
                    <DynamicSelect
                      fieldName="urgency"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select urgency"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Assignment */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Assignment</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="callerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (Caller) *</FormLabel>
                  <FormControl>
                    <PersonSelector
                      value={field.value}
                      onValueChange={(personId, personType) => {
                        field.onChange(personId);
                        form.setValue('callerType', personType);
                        // Auto-set legacy customer field if caller is customer
                        if (personType === 'customer') {
                          form.setValue('companyId', personId);
                        }
                        // Auto-set beneficiary to caller if not already set
                        if (!form.getValues('beneficiaryId')) {
                          form.setValue('beneficiaryId', personId);
                          form.setValue('beneficiaryType', personType);
                        }
                      }}
                      placeholder="Buscar cliente..."
                      allowedTypes={['user', 'customer']}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="beneficiaryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favorecido (Beneficiary)</FormLabel>
                  <FormControl>
                    <PersonSelector
                      value={field.value || ""}
                      onValueChange={(personId, personType) => {
                        field.onChange(personId);
                        form.setValue('beneficiaryType', personType);
                      }}
                      placeholder="Buscar favorecido (opcional)..."
                      allowedTypes={['user', 'customer']}
                    />
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
                  <FormLabel>Assign to Agent</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
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
                  <FormControl>
                    <UserGroupSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Selecione um grupo"
                    />
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
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Physical location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="self_service">Self Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Business Impact */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Business Impact & Analysis</h3>

          <FormField
            control={form.control}
            name="businessImpact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Impact</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the business impact"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symptoms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observed symptoms"
                      className="min-h-[80px]"
                      {...field}
                    />
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
                  <FormLabel>Workaround</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Temporary solution or workaround"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Legacy Fields (Hidden but mapped) */}
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <input
              type="hidden"
              {...field}
              value={form.watch("subject") || field.value || ""}
            />
          )}
        />



        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false);
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={createTicketMutation.isPending}
          >
            {createTicketMutation.isPending
              ? "Creating..."
              : "Create Ticket"
            }
          </Button>
        </div>
      </form>
    </Form>
  );



  return (
    <LoadingStateProvider>
      <div className="space-y-6" style={{
        userSelect: isResizing ? 'none' : 'auto',
        cursor: isResizing ? 'col-resize' : 'default'
      }}>
        {/* Header */}
        <div className="flex justify-between items-center ml-[20px] mr-[20px]">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('tickets.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('tickets.description')}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('tickets.new_ticket')}
            </Button>
          </div>
        </div>
      {/* Seletor de Visualizações */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col space-y-1.5 p-6 pt-[3px] pb-[3px]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('tickets.views.title')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsNewViewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('tickets.views.newView')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsManageViewsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                {t('tickets.views.manage')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-[0px] pb-[0px]">
          <div className="flex items-center gap-4 pt-[10px] pb-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('tickets.views.activeView')}:</span>
              <select
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                value={selectedViewId}
                onChange={(e) => setSelectedViewId(e.target.value)}
              >
                <option value="default">{t('tickets.views.defaultView')}</option>
                {ticketViews.map((view: any) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAdvancedFiltersOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              {t('tickets.views.advancedFilters')}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-col space-y-1.5 p-6 pt-[0px] pb-[0px]">
          <CardTitle className="text-lg">{t('common.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('tickets.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DynamicSelect
              fieldName="status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder={t('tickets.filter_by_status')}
              showAllOption={true}
            />
            <DynamicSelect
              fieldName="priority"
              value={priorityFilter}
              onValueChange={setPriorityFilter}
              placeholder={t('tickets.filter_by_priority')}
              showAllOption={true}
            />
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}>
              {t('tickets.clear_filters')}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('tickets.title')} ({pagination.total})</span>
            <span className="text-sm font-normal text-gray-500">
              {t('pagination.page')} {currentPage} {t('pagination.of')} {pagination.totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTicketsTable
            tickets={tickets}
            isLoading={isLoading || !isFieldColorsReady}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleExpand={toggleTicketExpansion}
            expandedTickets={expandedTickets}
            ticketRelationships={ticketRelationships}
            ticketsWithRelationships={ticketsWithRelationships}
            columnWidths={columnWidths}
            renderCell={renderCell}
            TableCellComponent={OptimizedTableCell}
            ResizeHandle={ResizeHandle}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('pagination.previous')}
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === pagination.totalPages}
        >
          {t('pagination.next')}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Modals */}
      <Dialog open={isNewTicketModalOpen} onOpenChange={setIsNewTicketModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('tickets.new_ticket')}</DialogTitle>
          </DialogHeader>
          <TicketForm />
        </DialogContent>
      </Dialog>

      {/* Modal para criar nova visualização */}
      <Dialog open={isNewViewDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingView ? "Editar Visualização" : "Criar Nova Visualização"}</DialogTitle>
            <DialogDescription>
              Configure sua visualização personalizada de tickets
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Nome da visualização */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Visualização</Label>
              <Input
                type="text"
                id="name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Digite o nome da visualização"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newViewDescription}
                onChange={(e) => setNewViewDescription(e.target.value)}
                placeholder="Descreva brevemente esta visualização"
                rows={3}
              />
            </div>

            {/* Seleção de colunas */}
            <div className="space-y-3">
              <Label>Colunas Visíveis</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                {availableColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={selectedColumns.includes(column.id)}
                      onChange={() => {
                        if (selectedColumns.includes(column.id)) {
                          setSelectedColumns(selectedColumns.filter((c) => c !== column.id));
                        } else {
                          setSelectedColumns([...selectedColumns, column.id]);
                        }
                      }}
                    />
                    <label htmlFor={`column-${column.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Opções adicionais */}
            <div className="space-y-3">
              <Label>Opções</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={isPublicView}
                  onChange={() => setIsPublicView(!isPublicView)}
                />
                <label htmlFor="public" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Tornar esta visualização pública (visível para outros usuários)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateView} disabled={!newViewName.trim()}>
              {editingView ? "Salvar Alterações" : "Criar Visualização"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para gerenciar visualizações */}
      <Dialog open={isManageViewsOpen} onOpenChange={() => setIsManageViewsOpen((open) => !open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Visualizações</DialogTitle>
            <DialogDescription>
              Gerencie e personalize suas visualizações de tickets.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-gray-200">
            {ticketViews.map((view: any) => (
              <div key={view.id} className="py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{view.name}</h3>
                  <p className="text-sm text-gray-500">{view.description || "Sem descrição"}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditView(view)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteView(view.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Filtros Avançados */}
      <Dialog open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('tickets.views.advancedFilters')}</DialogTitle>
            <DialogDescription>
              Configure filtros detalhados para refinar sua busca de tickets
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtro por Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Prioridade */}
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Empresa */}
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {companies.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name || company.displayName || 'Empresa sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value="" onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                    <SelectItem value="Atendimento ao Cliente">Atendimento ao Cliente</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Responsável */}
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value="" onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os responsáveis</SelectItem>
                    <SelectItem value="alex">Alex Silva</SelectItem>
                    <SelectItem value="ana">Ana Santos</SelectItem>
                    <SelectItem value="joao">João Oliveira</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Data de Criação */}
              <div className="space-y-2">
                <Label>Data de Criação</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="De"
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    placeholder="Até"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsAdvancedFiltersOpen(false)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setSelectedCompanyId("");
              setSearchTerm("");
              // Refrescar dados
              queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
            }}>
              Limpar Filtros
            </Button>
            <Button onClick={() => {
              // Aplicar filtros (em implementação futura)
              setIsAdvancedFiltersOpen(false);
              // Refrescar dados dos tickets
              queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
            }}>
              Aplicar Filtros
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Vinculação de Ticket */}
      <TicketLinkingModal
        isOpen={isLinkingModalOpen}
        onClose={() => setIsLinkingModalOpen(false)}
        currentTicket={undefined as any}
      />
      </div>
    </LoadingStateProvider>
  );
});

TicketsTable.displayName = 'TicketsTable';

export default TicketsTable;