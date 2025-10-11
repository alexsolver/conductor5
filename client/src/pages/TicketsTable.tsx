import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { FilteredCustomerSelect } from "@/components/FilteredCustomerSelect";
import { FilteredBeneficiarySelect } from "@/components/FilteredBeneficiarySelect";

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
  beneficiaryType: z.string().refine(val => ["user", "customer"].includes(val), "Tipo de favorecido inválido").optional(),

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
  // Carregar última visualização selecionada do localStorage
  const [selectedViewId, setSelectedViewId] = useState(() => {
    const tenantId = localStorage.getItem("tenantId");
    const savedViewId = localStorage.getItem(`lastTicketView_${tenantId}`);
    return savedViewId || "default";
  });
  const [isNewViewDialogOpen, setIsNewViewDialogOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [activeTicketTab, setActiveTicketTab] = useState("informacoes");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Campos customizaveis e obrigatorios
  const [templateRequiredKeys, setTemplateRequiredKeys] = useState<string[]>([]);
  const [templateOptionalKeys, setTemplateOptionalKeys] = useState<string[]>([]);
  const [templateFieldOrder, setTemplateFieldOrder] = useState<string[]>([]);
  const [activeTemplateType, setActiveTemplateType] = useState<'creation' | 'edit' | string>('creation');
  const [activeCustomFields, setActiveCustomFields] = useState<any[]>([]);

  // Estados para pesquisa local por coluna
  const [showColumnSearch, setShowColumnSearch] = useState(false);
  const [columnSearchValues, setColumnSearchValues] = useState<Record<string, string>>({});

  // Estados para ordenação de colunas
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Estados para expansão de relacionamentos
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [ticketRelationships, setTicketRelationships] = useState<Record<string, any[]>>({});
  const [ticketsWithRelationships, setTicketsWithRelationships] = useState<Set<string>>(new Set());

  // Hook para buscar cores dos campos personalizados com estado aprimorado
  const { getFieldColor, getFieldLabel, isLoading: isFieldColorsLoading, isReady: isFieldColorsReady } = useFieldColors();

  // Hook para resolver nomes de empresas
  const { getCompanyName } = useCompanyNameResolver();

  // Query para buscar todos os favorecidos - sempre ativo para garantir lista atualizada
  const { data: beneficiariesData, refetch: refetchBeneficiaries } = useQuery({
    queryKey: ['/api/beneficiaries'],
    queryFn: async () => {
      console.log('[TicketsTable] 🔄 Fetching beneficiaries for ticket creation');
      const response = await apiRequest('GET', '/api/beneficiaries');
      const data = await response.json();
      console.log('[TicketsTable] 📊 Beneficiaries data for ticket creation:', data);
      return data;
    },
    enabled: true, // Sempre ativo para garantir lista atualizada
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache por 30 segundos
  });

  // Refetch beneficiaries when modal opens to ensure fresh data
  React.useEffect(() => {
    if (isCreateDialogOpen) {
      console.log('[TicketsTable] 🔓 Modal opened, ensuring fresh beneficiaries data');
      refetchBeneficiaries();
    }
  }, [isCreateDialogOpen, refetchBeneficiaries]);

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
      const testCategories = ['support', 'hardware', 'network', 'access', 'other'];

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


  // mapeia nomes vindos do template para suas keys de form
  const fieldMapping: Record<string, string> = {
    company: 'companyId',
    client: 'callerId',
    beneficiary: 'beneficiaryId',
    status: 'status',
    summary: 'subject',
    description: 'description',
    urgency: 'urgency',
    location: 'location',
    tags: 'tags',
    comments: 'comments',
    estimated_hours: 'estimated_hours',
    materials_services: 'materials_services',
    due_date: 'due_date',
    attachment: 'attachment',
    // se precisar: assignedTo -> assignedToId, etc.
  };

  // retorna arrays de obrigatórios/opcionais + ordem
  function extractTemplateInfo(tpl: any) {
    const req = Array.isArray(tpl?.required_fields) ? tpl.required_fields : [];
    const custom = Array.isArray(tpl?.custom_fields) ? tpl.custom_fields : [];

    const requiredKeys = req.map((f: any) => String(f.fieldName).trim()).filter(Boolean);
    const order = req
      .slice()
      .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999))
      .map((f: any) => String(f.fieldName).trim());

    // opcionais: (por hora, considere custom como opcionais)
    const optionalKeys = custom.map((cf: any) => cf.name).filter(Boolean);

    return { requiredKeys, optionalKeys, order };
  }

  // liga/desliga visibleFields conforme template
  function buildVisibleFlags(requiredKeys: string[], optionalKeys: string[]) {
    const flags: Record<string, boolean> = {};
    const uniqueSet = new Set([...requiredKeys, ...optionalKeys]);
    const allKeys = Array.from(uniqueSet);
    allKeys.forEach((k) => {
      if (!TEMPLATE_UI_EXCLUDE.has(k)) {
        flags[k] = true; // mostra só o que não está excluído
      }
    });
    return flags;
  }


  // aplica defaults caso venham no template (se usar defaultValue mais tarde)
  function applyDefaultsFromTemplate(tpl: any) {
    const req = Array.isArray(tpl?.required_fields) ? tpl.required_fields : [];
    req.forEach((f: any) => {
      const raw = f.fieldName?.trim();
      const mapped = fieldMapping[raw] || raw;
      if (f.defaultValue != null) {
        // tags pode precisar array
        form.setValue(mapped as any, mapped === 'tags' && typeof f.defaultValue === 'string'
          ? f.defaultValue.split(',').map((s: string) => s.trim()).filter(Boolean)
          : f.defaultValue);
      }
    });
    const custom = Array.isArray(tpl?.custom_fields) ? tpl.custom_fields : [];
    custom.forEach((cf: any) => {
      if (cf?.defaultValue != null) {
        form.setValue(cf.name as any, cf.defaultValue);
      }
    });
  }

  
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

  const itemsPerPage = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // 🔧 Query para campos customizados do módulo tickets
  const { data: customFieldsData = [] } = useOptimizedQuery({
    queryKey: ['/api/custom-fields/fields/tickets'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/custom-fields/fields/tickets');
        if (!response.ok) return [];
        const data = await response.json();
        const fields = data.data || data || [];
        console.log('🔍 [CUSTOM-FIELDS] Fetched custom fields:', fields);
        return Array.isArray(fields) ? fields : [];
      } catch (error) {
        console.error('❌ [CUSTOM-FIELDS] Error fetching:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Campos disponíveis para seleção em visualizações (incluindo campos customizados)
  const availableColumns = useMemo(() => {
    const standardColumns = [
      { id: "number", label: t("tickets.fields.number") || "Número" },
      { id: "subject", label: t("tickets.fields.subject") || "Assunto" },
      { id: "description", label: t("tickets.fields.description") || "Descrição" },
      { id: "customer", label: t("tickets.fields.customer") || "Cliente" },
      { id: "company", label: t("tickets.fields.company") || "Empresa" },
      { id: "category", label: t("tickets.fields.category") || "Categoria" },
      { id: "subcategory", label: t("tickets.fields.subcategory") || "Subcategoria" },
      { id: "status", label: t("tickets.fields.status") || "Status" },
      { id: "priority", label: t("tickets.fields.priority") || "Prioridade" },
      { id: "impact", label: t("tickets.fields.impact") || "Impacto" },
      { id: "urgency", label: t("tickets.fields.urgency") || "Urgência" },
      { id: "assigned_to", label: t("tickets.fields.assignedTo") || "Responsável" },
      { id: "created_by", label: t("tickets.fields.createdBy") || "Criado por" },
      { id: "created", label: t("tickets.fields.created") || "Criado em" },
      { id: "updated", label: t("tickets.fields.updated") || "Atualizado em" },
      { id: "due_date", label: t("tickets.fields.dueDate") || "Prazo" },
      { id: "resolution_time", label: t("tickets.fields.resolutionTime") || "Tempo de Resolução" },
      { id: "sla_status", label: t("tickets.fields.slaStatus") || "Status SLA" },
      { id: "tags", label: t("tickets.fields.tags") || "Tags" },
      { id: "location", label: t("tickets.fields.location") || "Localização" },
      { id: "source", label: t("tickets.fields.source") || "Origem" },
      { id: "satisfaction", label: t("tickets.fields.satisfaction") || "Satisfação" }
    ];

    // Adicionar campos customizados
    const customColumns = Array.isArray(customFieldsData) 
      ? customFieldsData.map((field: any) => ({
          id: `custom_${field.name}`,
          label: field.label || field.name,
          isCustom: true
        }))
      : [];

    console.log('🔍 [AVAILABLE-COLUMNS] Standard:', standardColumns.length, 'Custom:', customColumns.length);
    return [...standardColumns, ...customColumns];
  }, [customFieldsData, t]);

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
      console.log('🔍 [TICKET-VIEWS] Fetching ticket views...');
      const response = await apiRequest('GET', '/api/ticket-views');
      if (!response.ok) throw new Error('Failed to fetch views');
      const data = await response.json();
      console.log('🔍 [TICKET-VIEWS] Response:', data);
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Initialize selectedViewId to first view when views load
  useEffect(() => {
    if (ticketViews.length > 0 && selectedViewId === "default") {
      const firstViewId = ticketViews[0].id;
      console.log('🎯 [VIEW-INIT] Initializing selectedViewId to first view:', firstViewId, ticketViews[0].name);
      setSelectedViewId(firstViewId);
    }
  }, [ticketViews, selectedViewId]);

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

  // ✅ FETCH COMPANIES for company selection
  const { 
    data: companiesData, 
    isLoading: companiesLoading, 
    error: companiesError 
  } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      console.log('🏢 [COMPANIES-QUERY] Fetching companies...');
      const response = await apiRequest('GET', '/api/companies');
      const result = await response.json();
      console.log('🏢 [COMPANIES-QUERY] API response:', result);
      return result;
    },
    enabled: true, // Always fetch companies
    staleTime: 5 * 60 * 1000,
    select: (data: any) => {
      console.log('🏢 [COMPANIES-QUERY] Raw response:', data);

      // Handle different possible response formats
      let companies = [];

      if (Array.isArray(data)) {
        companies = data;
      } else if (data?.success && data?.data) {
        if (Array.isArray(data.data)) {
          companies = data.data;
        } else if (data.data?.companies) {
          companies = data.data.companies;
        }
      } else if (data?.companies) {
        companies = data.companies;
      }

      console.log('🏢 [COMPANIES-QUERY] Processed companies:', companies);

      // Filter out inactive companies if needed
      return companies.filter((company: any) => 
        company && 
        (company.isActive !== false) && 
        (company.status !== 'inactive')
      );
    }
  });

  // Extract companies array from the query result
  const companies = companiesData || [];


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

  // Obter visualização ativa (precisa estar antes de filteredTickets)
  const activeView = useMemo(() => {
    const view = ticketViews.find((v: any) => v.id === selectedViewId);
    console.log('🔍 [ACTIVE-VIEW-MEMO] Recalculating activeView for selectedViewId:', selectedViewId);
    console.log('🔍 [ACTIVE-VIEW-MEMO] Available views:', ticketViews.map((v: any) => ({ id: v.id, name: v.name })));
    console.log('🔍 [ACTIVE-VIEW-MEMO] Found view:', view);
    if (view) {
      console.log('🔍 [ACTIVE-VIEW-MEMO] View columns:', view.columns);
    }
    return view;
  }, [ticketViews, selectedViewId]);

  // Filtrar tickets localmente baseado nos valores de pesquisa por coluna E filtros da visualização ativa
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // 1. Aplicar filtros da visualização ativa
    if (activeView?.filters && Array.isArray(activeView.filters) && activeView.filters.length > 0) {
      filtered = filtered.filter((ticket: any) => {
        return activeView.filters.every((filter: any) => {
          const { field, operator, value } = filter;
          const ticketValue = ticket[field];

          switch (operator) {
            case 'equals':
            case 'eq':
              return ticketValue === value;
            
            case 'in':
              return Array.isArray(value) && value.includes(ticketValue);
            
            case 'contains':
              return String(ticketValue).toLowerCase().includes(String(value).toLowerCase());
            
            case 'not_equals':
            case 'ne':
              return ticketValue !== value;
            
            case 'gt':
              return ticketValue > value;
            
            case 'lt':
              return ticketValue < value;
            
            default:
              return true;
          }
        });
      });
    }

    // 2. Aplicar pesquisa por coluna (se ativa)
    if (showColumnSearch && Object.keys(columnSearchValues).length > 0) {
      filtered = filtered.filter((ticket: any) => {
        return Object.entries(columnSearchValues).every(([columnId, searchValue]) => {
          if (!searchValue || searchValue.trim() === '') return true;

          const searchLower = searchValue.toLowerCase();

          switch (columnId) {
            case 'number':
            case 'número':
            case 'ticketnumber':
            case 'ticketNumber':
              const ticketNumber = ticket.number || `#${ticket.id.slice(-8)}`;
              return ticketNumber.toLowerCase().includes(searchLower);
            
            case 'subject':
              return ticket.subject?.toLowerCase().includes(searchLower);
            
            case 'description':
              return ticket.description?.toLowerCase().includes(searchLower);
            
            case 'customer':
              const customerName = ticket.caller_name || ticket.customer_name || 
                `${ticket.caller_first_name || ''} ${ticket.caller_last_name || ''}`.trim() ||
                `${ticket.customer_first_name || ''} ${ticket.customer_last_name || ''}`.trim() ||
                ticket.caller?.fullName || ticket.customer?.fullName || '';
              return customerName.toLowerCase().includes(searchLower);
            
            case 'company':
              const companyName = ticket.company_name || ticket.caller_company_name || '';
              return companyName.toLowerCase().includes(searchLower);
            
            case 'category':
              return ticket.category?.toLowerCase().includes(searchLower);
            
            case 'subcategory':
              return ticket.subcategory?.toLowerCase().includes(searchLower);
            
            case 'status':
              return ticket.status?.toLowerCase().includes(searchLower);
            
            case 'priority':
              return ticket.priority?.toLowerCase().includes(searchLower);
            
            case 'impact':
              return ticket.impact?.toLowerCase().includes(searchLower);
            
            case 'urgency':
              return ticket.urgency?.toLowerCase().includes(searchLower);
            
            case 'assigned_to':
              const assignedName = ticket.assignedTo?.firstName && ticket.assignedTo?.lastName
                ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`.trim()
                : '';
              return assignedName.toLowerCase().includes(searchLower);
            
            case 'location':
              return ticket.location?.toLowerCase().includes(searchLower);
            
            case 'tags':
              const tags = Array.isArray(ticket.tags) ? ticket.tags.join(' ') : '';
              return tags.toLowerCase().includes(searchLower);
            
            default:
              return true;
          }
        });
      });
    }

    // 3. Aplicar ordenação (se ativa)
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case 'number':
          case 'número':
          case 'ticketnumber':
          case 'ticketNumber':
            aValue = a.number || `#${a.id.slice(-8)}`;
            bValue = b.number || `#${b.id.slice(-8)}`;
            break;
          
          case 'subject':
            aValue = a.subject || '';
            bValue = b.subject || '';
            break;
          
          case 'customer':
            aValue = a.caller_name || a.customer_name || '';
            bValue = b.caller_name || b.customer_name || '';
            break;
          
          case 'company':
            aValue = a.company_name || a.caller_company_name || '';
            bValue = b.company_name || b.caller_company_name || '';
            break;
          
          case 'category':
          case 'subcategory':
          case 'status':
          case 'priority':
          case 'impact':
          case 'urgency':
          case 'location':
            aValue = a[sortColumn] || '';
            bValue = b[sortColumn] || '';
            break;
          
          case 'created_at':
          case 'updated_at':
            aValue = a[sortColumn] ? new Date(a[sortColumn]).getTime() : 0;
            bValue = b[sortColumn] ? new Date(b[sortColumn]).getTime() : 0;
            break;
          
          default:
            aValue = a[sortColumn] || '';
            bValue = b[sortColumn] || '';
        }

        // Comparação
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [tickets, columnSearchValues, showColumnSearch, activeView, sortColumn, sortDirection]);

  // 🔧 [1QA-COMPLIANCE] Paginação seguindo Clean Architecture
  const pagination = useMemo(() => {
    if (!ticketsData) return { total: 0, totalPages: 0 };

    const total = ticketsData.total || ticketsData.pagination?.total || filteredTickets.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { total, totalPages };
  }, [ticketsData, filteredTickets.length, itemsPerPage]);



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

  // Processar colunas - aceitar tanto array de strings quanto array de objetos
  const activeColumns = useMemo(() => {
    let columns = activeView?.columns || [
      { id: "number", label: t("tickets.fields.ticket_number") || "Número", visible: true, order: 1, width: 120 },
      { id: "subject", label: t("tickets.fields.subject") || "Assunto", visible: true, order: 2, width: 300 },
      { id: "customer", label: t("tickets.fields.customer") || "Cliente", visible: true, order: 3, width: 150 },
      { id: "company", label: t("tickets.fields.company") || "Empresa", visible: true, order: 4, width: 150 },
      { id: "category", label: t("tickets.fields.category") || "Categoria", visible: true, order: 5, width: 120 },
      { id: "status", label: t("tickets.fields.status") || "Status", visible: true, order: 6, width: 120 },
      { id: "priority", label: t("tickets.fields.priority") || "Prioridade", visible: true, order: 7, width: 120 },
      { id: "urgency", label: t("tickets.fields.urgency") || "Urgência", visible: true, order: 8, width: 120 },
      { id: "created", label: t("tickets.fields.created") || "Criado", visible: true, order: 9, width: 150 }
    ];

    // Se as colunas são strings (formato antigo), converter para objetos
    if (columns.length > 0 && typeof columns[0] === 'string') {
      console.log('🔄 [COLUMNS-CONVERSION] Converting string array to objects:', columns);
      columns = columns.map((colId: string, index: number) => {
        const colDef = availableColumns.find(c => c.id === colId);
        return {
          id: colId,
          label: colDef?.label || colId,
          visible: true,
          order: index + 1,
          width: colId === 'subject' ? 300 : colId === 'description' ? 250 : 150
        };
      });
      console.log('✅ [COLUMNS-CONVERSION] Converted columns:', columns);
    }

    console.log('🔍 [ACTIVE-VIEW] Selected view ID:', selectedViewId);
    console.log('🔍 [ACTIVE-VIEW] Active view:', activeView);
    console.log('🔍 [ACTIVE-VIEW] Active columns:', columns);

    return columns;
  }, [activeView, availableColumns, selectedViewId, t]);

  // Filtrar apenas colunas visíveis e ordenar
  const visibleColumns = useMemo(() => {
    const visible = activeColumns
      .filter((col: any) => col.visible)
      .sort((a: any, b: any) => a.order - b.order);
    
    console.log('✅ [VISIBLE-COLUMNS] Updated! Count:', visible.length);
    console.log('✅ [VISIBLE-COLUMNS] Column IDs:', visible.map((c: any) => c.id));
    console.log('✅ [VISIBLE-COLUMNS] Full columns:', visible);
    
    return visible;
  }, [activeColumns]);

  // Componente de célula otimizado com useMemo
  const TableCellComponent = ({ column, ticket }: { column: any, ticket: Ticket }) => {
    const cellStyle = useMemo(() => ({
      width: getColumnWidth(column.id),
      minWidth: getColumnWidth(column.id),
      maxWidth: getColumnWidth(column.id)
    }), [column.id, columnWidths]);

    const memoizedCellContent = useMemo(() => {
      switch (column.id) {
        case 'number':
          const ticketNumber = (ticket as any).number || (ticket as any).ticket_number || `#${ticket.id.slice(-8)}`;
          console.log('🎫 [TICKET-NUMBER-DEBUG]', { 
            ticketId: ticket.id.slice(-8), 
            numberField: (ticket as any).number,
            ticket_numberField: (ticket as any).ticket_number,
            finalDisplay: ticketNumber 
          });
          return (
            <TableCell className="font-mono text-sm overflow-hidden" style={cellStyle}>
              <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800 hover:underline truncate block">
                {ticketNumber}
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
          
          // ✅ CORREÇÃO: Usar dados da categoria vindos do backend (JOIN)
          const categoryName = (ticket as any).category_name || rawCategoryValue;
          const categoryColorFromDB = (ticket as any).category_color;

          // 🚨 CORREÇÃO CRÍTICA: Aguardar cores estarem prontas (não apenas loading)
          if (!isFieldColorsReady) {
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              </TableCell>
            );
          }

          // Tentar buscar cor do banco de dados primeiro, depois do field options, senão usar fallback
          const categoryColor = categoryColorFromDB || 
                               getFieldColor('category', categoryName) ||
                               getFieldColor('category', rawCategoryValue) ||
                               '#3b82f6';

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge
                fieldName="category"
                value={rawCategoryValue}
                colorHex={categoryColor}
                isLoading={isFieldColorsLoading}
              >
                {categoryName}
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
          // Renderizar campos customizados
          if (column.id.startsWith('custom_')) {
            const fieldName = column.id.replace('custom_', '');
            const customValue = (ticket as any).customFieldsData?.[fieldName] || 
                               (ticket as any).metadata?.[fieldName] || 
                               (ticket as any)[fieldName];
            
            return (
              <TableCell className="overflow-hidden" style={cellStyle}>
                <div className="truncate" title={customValue?.toString() || ''}>
                  {customValue?.toString() || '-'}
                </div>
              </TableCell>
            );
          }
          
          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <div className="truncate">-</div>
            </TableCell>
          );
      }
    }, [column.id, ticket, cellStyle, getFieldColorWithFallback, getFieldLabel, mapCategoryValue, mapStatusValue, mapPriorityValue, mapImpactValue, mapUrgencyValue]);

    return memoizedCellContent;
  };

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

  const OptimizedTableCell = TableCellComponent;

  // Mutations para gerenciar visualizações
  const createViewMutation = useMutation({
    mutationFn: async (viewData: any) => {
      console.log('📡 [CREATE-MUTATION] Sending POST request with data:', viewData);
      const result = await apiRequest('POST', '/api/ticket-views', viewData);
      console.log('✅ [CREATE-MUTATION] Response received:', result);
      return result;
    },
    onSuccess: () => {
      console.log('🎉 [CREATE-MUTATION] Success callback triggered');
      toast({
        title: "Visualização criada",
        description: "Nova visualização criada com sucesso"
      });
      // Invalidar o cache para forçar uma nova busca
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-views'] });
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
      console.log('📡 [UPDATE-MUTATION] Sending PUT request to:', `/api/ticket-views/${id}`);
      console.log('📡 [UPDATE-MUTATION] With data:', viewData);
      const result = await apiRequest('PUT', `/api/ticket-views/${id}`, viewData);
      console.log('✅ [UPDATE-MUTATION] Response received:', result);
      return result;
    },
    onSuccess: () => {
      console.log('🎉 [UPDATE-MUTATION] Success callback triggered');
      toast({
        title: "Visualização atualizada",
        description: "Visualização editada com sucesso"
      });
      // Invalidar o cache para forçar uma nova busca
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-views'] });
      setIsNewViewDialogOpen(false);
      setEditingView(null);
      resetNewViewForm();
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
      // Invalidar o cache para forçar uma nova busca
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-views'] });
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
    console.log('🔘 [HANDLE-CREATE-VIEW] Function called', { 
      newViewName, 
      newViewDescription, 
      selectedColumns, 
      editingView: editingView?.id 
    });

    if (!newViewName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da visualização é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Mapear todas as colunas disponíveis (incluindo campos customizados)
    // IMPORTANTE: A ordem deve refletir a posição em selectedColumns
    const columnsData = availableColumns.map((column) => {
      const isVisible = selectedColumns.includes(column.id);
      const orderIndex = isVisible ? selectedColumns.indexOf(column.id) : 999; // Colunas não visíveis vão para o final
      
      return {
        id: column.id,
        label: column.label,
        visible: isVisible,
        order: orderIndex + 1, // order começa em 1
        width: column.id === 'subject' ? 300 : column.id === 'description' ? 250 : 150,
        isCustom: (column as any).isCustom || false
      };
    });

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

    console.log('💾 [SAVE-VIEW] Saving view with columns:', columnsData.filter(c => c.visible));
    console.log('💾 [SAVE-VIEW] Is editing?', !!editingView);
    console.log('💾 [SAVE-VIEW] View data:', viewData);

    if (editingView) {
      console.log('🔄 [UPDATE-MUTATION] Calling update mutation for ID:', editingView.id);
      updateViewMutation.mutate({ id: editingView.id, viewData });
    } else {
      console.log('➕ [CREATE-MUTATION] Calling create mutation');
      createViewMutation.mutate(viewData);
    }
  };

  // Handle edit existing view
  const handleEditView = (view: any) => {
    console.log('✏️ [EDIT-VIEW] Editing view:', view);
    console.log('✏️ [EDIT-VIEW] View columns:', view.columns);
    setEditingView(view);
    setIsManageViewsOpen(false);
    setIsNewViewDialogOpen(true);
    setNewViewName(view.name);
    console.log('✏️ [EDIT-VIEW] Set name to:', view.name);
    setNewViewDescription(view.description || "");
    
    // Pegar apenas as colunas VISÍVEIS e ordenar pela propriedade 'order'
    const visibleColumns = view.columns?.filter((col: any) => col.visible) || [];
    const sortedColumnIds = visibleColumns
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((col: any) => col.id);
    
    console.log('✏️ [EDIT-VIEW] Setting selected columns (visible only, sorted by order):', sortedColumnIds);
    setSelectedColumns(sortedColumnIds);
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

  // ✅ 1QA.MD: Template management state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [templatesData, setTemplatesData] = useState<any>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false); // State to disable company selection during creation
  
  // Dynamic field visibility based on template - Start with all hidden until template is selected
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    // já existentes
    category: false,
    subcategory: false,
    priority: false,
    impact: false,
    urgency: false,
    assignedToId: false,
    assignmentGroup: false,
    location: false,
    contactType: false,
    businessImpact: false,
    symptoms: false,
    workaround: false,

    // novos do template
    status: false,
    summary: false,             // mapeado para subject
    description: false,         // você já tem, mas mantenha o flag
    company: false,             // mapeado para companyId
    client: false,              // mapeado para callerId
    beneficiary: false,         // mapeado para beneficiaryId
    attachment: false,
    tags: false,
    comments: false,
    estimated_hours: false,
    materials_services: false,
    due_date: false,
  });

  
  const [templateSelected, setTemplateSelected] = useState<boolean>(false);
  const TEMPLATE_UI_EXCLUDE = new Set<string>(['client', 'beneficiary']);

  // ✅ 1QA.MD: Load templates following Clean Architecture patterns
  const loadTemplates = async () => {
    if (templatesData) return;
    try {
      setTemplatesLoading(true);
      const response = await apiRequest('GET', '/api/ticket-templates');
      const json = await response.json();

      const normalized = Array.isArray(json?.data?.templates)
        ? json.data.templates
        : Array.isArray(json?.templates)
          ? json.templates
          : Array.isArray(json)
            ? json
            : [];

      setTemplatesData({ success: true, templates: normalized });
    } catch (e) {
      console.error('Error loading templates:', e);
      setTemplatesData({ success: false, templates: [] });
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Form setup
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      description: '',
      category: '',
      subcategory: '',
      priority: 'medium', // Ensure priority always has default
      impact: 'medium',
      urgency: 'medium',
      state: 'new',
      companyId: '',
      callerId: '',
      callerType: 'customer',
      beneficiaryId: '',
      beneficiaryType: 'customer',
      assignedToId: '',
      assignmentGroup: '',
      location: '',
      contactType: '',
      businessImpact: '',
      symptoms: '',
      workaround: '',
      subject: '',
      status: 'open',
      tags: [],
    },
  });

  // Handle customer selection changes
  const handleCustomerChange = (customerId: string) => {
    form.setValue('callerId', customerId);
    // Reset beneficiary when caller changes
    form.setValue('beneficiaryId', '');
  };

  // Mutations for ticket creation
  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🚀 Starting ticket creation with data:', data);
      setIsCreatingTicket(true); // Set creating state
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
      } finally {
        setIsCreatingTicket(false); // Reset creating state
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
    const customFieldsValues = (form.getValues() as any).customFields || {};

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
      custom_fields_values: customFieldsValues,
      template_id: (selectedTemplateId && selectedTemplateId !== '__none__') ? selectedTemplateId : null,
    };

    console.log('Submitting ticket data:', submitData);

    if (templateSelected && templateRequiredKeys.length > 0) {
      let hasError = false;

      for (const raw of templateRequiredKeys) {
        const mapped = fieldMapping[raw] || raw;

        // pega do form (client->callerId, beneficiary->beneficiaryId)
        const v = (form.getValues() as any)[mapped];
        const isEmpty =
          v == null ||
          (typeof v === 'string' && v.trim() === '') ||
          (Array.isArray(v) && v.length === 0);

        if (isEmpty) {
          hasError = true;
          form.setError(mapped as any, { type: 'required', message: 'Campo obrigatório pelo template' });
        }
      }

      for (const cf of activeCustomFields) {
        if (cf.required) {
          const v = (form.getValues() as any)?.customFields?.[cf.name];
          const empty = v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
          if (empty) {
            form.setError(`customFields.${cf.name}` as any, { type: 'required', message: 'Campo obrigatório' });
            hasError = true;
          }
        }
      }
      /*
      if (hasError) {
        toast({ title: "Campos obrigatórios", description: "Preencha os campos exigidos pelo template.", variant: "destructive" });
        return;
      }
      */
    }

    
    
    createTicketMutation.mutate(submitData);
  };

  const handleEdit = (ticket: any) => {
    console.log('Edit ticket:', ticket.id);
    navigate(`/tickets/${ticket.id}?edit=true`);
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

  const renderTicketForm = () => (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(
          (data) => {
            console.log("✅ Submit ok", data);
            onSubmit(data);
          },
          (errors) => {
            console.log("❌ Submit bloqueado por erros", errors);
          }
        )}
        className="space-y-6 pl-[2px] pr-[2px] ml-[0px] mr-[0px]">

        {/* Company Selection - First field */}
        <div className="mb-4">
          <Label htmlFor="companyId" className="text-sm font-medium mb-2 block">
            Empresa *
          </Label>
          <Select
            onValueChange={(value) => {
              console.log('🏢 [COMPANY-SELECT] Company selected:', value);
              setSelectedCompanyId(value);
              form.setValue('companyId', value);

              // Reset dependent fields when company changes
              form.setValue('callerId', '');
              setSelectedCustomerId('');
              console.log('🔄 [COMPANY-SELECT] Reset dependent customer field');
            }}
            value={selectedCompanyId}
          >
            <SelectTrigger className="h-10 mt-1">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {companiesLoading ? (
                <SelectItem value="loading" disabled>Carregando empresas...</SelectItem>
              ) : companiesError ? (
                <SelectItem value="error" disabled>Erro ao carregar empresas</SelectItem>
              ) : companiesData && companiesData.length > 0 ? (
                companiesData.map((company: any) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.displayName || company.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-companies" disabled>Nenhuma empresa disponível</SelectItem>
              )}
            </SelectContent>
          </Select>
          {!selectedCompanyId && (
            <p className="text-sm text-red-500 mt-1">Empresa é obrigatória</p>
          )}
        </div>


        {/* Template Selection - moved to position 2 */}
        <div className="mb-4">
          <Label htmlFor="template" className="text-sm font-medium mb-2 block">
            Template (opcional)
          </Label>
          <Select
            onValueChange={(templateId) => {
              setSelectedTemplateId(templateId);

              if (templateId && templateId !== '__none__' && Array.isArray(templatesData?.templates)) {
                setTemplateSelected(true);

                const tpl = templatesData.templates.find((t: any) => t.id === templateId);
                if (!tpl) return;
                
                setActiveCustomFields(Array.isArray(tpl?.custom_fields) ? tpl.custom_fields : []);
                const custom = Array.isArray(tpl?.custom_fields) ? tpl.custom_fields : [];
                custom.forEach((cf: any) => {
                  if (cf?.defaultValue != null) {
                    form.setValue(`customFields.${cf.name}` as any, cf.defaultValue);
                  }
                });

                setActiveTemplateType(tpl.template_type || 'creation');

                const { requiredKeys, optionalKeys, order } = extractTemplateInfo(tpl);
                setTemplateRequiredKeys(requiredKeys);
                setTemplateOptionalKeys(optionalKeys);
                setTemplateFieldOrder(order);

                // zera flags e ativa só os citados
                setVisibleFields((prev) => {
                  const base = Object.fromEntries(Object.keys(prev).map(k => [k, false])) as typeof prev;
                  const flagsByTemplate = buildVisibleFlags(requiredKeys, optionalKeys);
                  return { ...base, ...flagsByTemplate };
                });

                // SALVAR valores atuais ANTES de qualquer operação
                const currentCompanyId = form.getValues('companyId');
                const currentCallerId = form.getValues('callerId');
                
                // limpar valores antigos dos campos controlados pelo template
                [...requiredKeys, ...optionalKeys].forEach((raw) => {
                  const mapped = fieldMapping[raw] || raw;
                  // não zere companyId/callerId se já estiverem setados e o template exigir
                  if (!['companyId','callerId'].includes(mapped)) {
                    form.setValue(mapped as any, '' as any);
                  }
                });

                // defaults se existirem
                applyDefaultsFromTemplate(tpl);
                
                // BUGFIX CRÍTICO: Restaurar empresa e cliente APÓS aplicar defaults
                // Isso garante que não sejam sobrescritos pelos defaults do template
                if (currentCompanyId) {
                  form.setValue('companyId', currentCompanyId);
                  console.log('✅ [TEMPLATE-APPLY] Empresa preservada APÓS defaults:', currentCompanyId);
                }
                if (currentCallerId) {
                  form.setValue('callerId', currentCallerId);
                  console.log('✅ [TEMPLATE-APPLY] Cliente preservado APÓS defaults:', currentCallerId);
                }

                if (templateRequiredKeys.includes('status') && !form.getValues('status')) {
                  form.setValue('status', 'open');
                }
                if (templateRequiredKeys.includes('urgency') && !form.getValues('urgency')) {
                  form.setValue('urgency', 'medium');
                }
                if (templateRequiredKeys.includes('summary') && !form.getValues('subject')) {
                  form.setValue('subject', '');
                }

                
                // se o template exige, garanta defaults mínimos coerentes
                if (requiredKeys.includes('status') && !form.getValues('status')) {
                  form.setValue('status', 'open');
                }
                if (requiredKeys.includes('urgency') && !form.getValues('urgency')) {
                  form.setValue('urgency', 'medium');
                }

                toast({
                  title: "Template aplicado",
                  description: `Template "${tpl.name}" configurado.`,
                });
              } else {
                // Reset (Sem template)
                console.log('🔄 [TEMPLATE-RESET] Voltando para sem template, preservando empresa:', selectedCompanyId);
                setTemplateSelected(false);
                setTemplateRequiredKeys([]);
                setTemplateOptionalKeys([]);
                setTemplateFieldOrder([]);
                setVisibleFields(Object.fromEntries(Object.keys(visibleFields).map(k => [k, false])) as any);
                // Mantenha campos essenciais
                form.setValue('priority', 'medium');
                // BUGFIX: Preservar empresa quando voltar para "sem template"
                if (selectedCompanyId) {
                  form.setValue('companyId', selectedCompanyId);
                  console.log('✅ [TEMPLATE-RESET] Empresa preservada no form:', selectedCompanyId);
                }
              }
            }}
            value={selectedTemplateId || '__none__'}
          >

            <SelectTrigger className="h-10 mt-1">
              <SelectValue placeholder="Selecione um template (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem template</SelectItem>
              {templatesLoading ? (
                <SelectItem value="loading" disabled>Carregando templates...</SelectItem>
              ) : (
                templatesData?.templates?.map((template: any) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} {template.status ? `(${template.status})` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>

          </Select>
        </div>

        {/* Cliente and Beneficiary Selection - moved to position 3 */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="callerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Cliente *</FormLabel>
                  <FormControl>
                    <FilteredCustomerSelect
                      value={field.value}
                      onChange={field.onChange}
                      selectedCompanyId={selectedCompanyId}
                      placeholder="Buscar cliente..."
                      disabled={!selectedCompanyId || selectedCompanyId === 'unspecified'}
                    />
                  </FormControl>
                  <div className="text-xs text-red-500 mt-1">
                    {!selectedCompanyId || selectedCompanyId === 'unspecified' ?
                      '' :
                      ''
                    }
                  </div>
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
                    <FilteredBeneficiarySelect
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                        // Set beneficiaryType to 'customer' by default when selecting from beneficiaries
                        if (value) {
                          form.setValue('beneficiaryType', 'customer');
                        }
                      }}
                      placeholder="Selecionar favorecido"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Status - added before ticket title */}
        <div className="mb-4">
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Título do ticket - moved to position 5 */}
        <div className="mb-4">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do ticket *</FormLabel>
                <FormControl>
                  <Input placeholder="Descreva brevemente o problema..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição - moved to position 6 */}
        <div className="mb-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tickets.fields.description") || "Descrição"} *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("tickets.placeholders.description") || "Descrição detalhada do problema ou solicitação"}
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />
        </div>

        {/* Visual separator after description */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Show message to select template if none is selected */}
        {!templateSelected && (
          <div className="text-center py-8 text-gray-500" data-testid="template-selection-message">
            <p className="text-lg font-medium mb-2">Selecione um template</p>
            <p className="text-sm">Escolha um template acima para configurar os campos específicos do ticket</p>
          </div>
        )}


        {/* Basic Information - Show only if template is selected and has these fields */}
        {templateSelected && (visibleFields.category || visibleFields.subcategory) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              {visibleFields.category && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tickets.fields.category") || "Categoria"}</FormLabel>
                      <FormControl>
                        <DynamicSelect
                          fieldName="category"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={t("common.selectCategory") || "Selecione a categoria"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {visibleFields.subcategory && (
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tickets.fields.subcategory") || "Subcategoria"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("tickets.placeholders.subcategory") || "Subcategoria específica"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        )}


        {/* Campos vindos do Template (na ordem informada) */}
        {/* {templateSelected && templateFieldOrder.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Campos do Template</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateFieldOrder.map((rawKey) => {
                if (TEMPLATE_UI_EXCLUDE.has(rawKey)) return null; // 👈 não renderiza client/beneficiary
                const mapped = fieldMapping[rawKey] || rawKey;
                const isRequired = templateRequiredKeys.includes(rawKey);
                const show = (visibleFields as any)[rawKey];
                if (!show) return null;

                switch (mapped) {
                  case 'companyId':
                    return (
                      <div key={rawKey} className="space-y-2">
                        <Label>Empresa {isRequired && <span className="text-red-500">*</span>}</Label>
                        <Select
                          onValueChange={(v) => {
                            setSelectedCompanyId(v);
                            form.setValue('companyId', v);
                            // ao trocar empresa, limpe o cliente
                            form.setValue('callerId', '');
                          }}
                          value={selectedCompanyId}
                        >
                          <SelectTrigger className="h-10 mt-1">
                            <SelectValue placeholder="Selecione uma empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {companiesLoading ? (
                              <SelectItem value="loading" disabled>Carregando empresas...</SelectItem>
                            ) : companiesError ? (
                              <SelectItem value="error" disabled>Erro ao carregar empresas</SelectItem>
                            ) : companies.length > 0 ? (
                              companies.map((company: any) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.displayName || company.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-companies" disabled>Nenhuma empresa disponível</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    );

                  case 'callerId': // client
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="callerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <FilteredCustomerSelect
                                value={field.value}
                                onChange={field.onChange}
                                selectedCompanyId={selectedCompanyId}
                                placeholder="Buscar cliente..."
                                disabled={!selectedCompanyId || selectedCompanyId === 'unspecified'}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'beneficiaryId':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="beneficiaryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beneficiário {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <PersonSelector
                                value={field.value || ""}
                                onValueChange={(personId, personType) => {
                                  field.onChange(personId);
                                  form.setValue('beneficiaryType', personType);
                                }}
                                placeholder="Buscar favorecido..."
                                allowedTypes={['user', 'customer']}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'status':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <DynamicSelect fieldName="status" value={field.value} onValueChange={field.onChange} placeholder="Selecione o status" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'subject': // summary
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resumo {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Input placeholder="Resumo do ticket..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'description':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descrição detalhada" className="min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'urgency':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="urgency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Urgência {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <DynamicSelect fieldName="urgency" value={field.value} onValueChange={field.onChange} placeholder="Selecione a urgência" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'location':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Localização {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Input placeholder="Endereço/local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'tags':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="tag1, tag2, tag3"
                                value={Array.isArray(field.value) ? field.value.join(', ') : (field.value || '')}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'comments':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="comments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Comentários {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Comentários" className="min-h-[80px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'estimated_hours':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="estimated_hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horas Estimadas {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="Ex.: 2.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'materials_services':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="materials_services"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Materiais e Serviços {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descreva materiais/serviços" className="min-h-[80px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'due_date':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Vencimento {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  case 'attachment':
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name="attachment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Anexos {isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="URL do anexo (exemplo simples)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );

                  default:
                    // fallback genérico (texto)
                    return (
                      <FormField
                        key={rawKey}
                        control={form.control}
                        name={mapped as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{rawKey}{isRequired && <span className="text-red-500">*</span>}</FormLabel>
                            <FormControl>
                              <Input placeholder={`Valor para ${rawKey}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                }
              })}
            </div>
          </div>
        )}
 */}
        {templateSelected && activeCustomFields.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Campos Personalizados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCustomFields
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
                .filter(cf => cf.showOnOpen)
                .map((cf) => {
                  const fieldName = `customFields.${cf.name}`;
                  const label = cf.label || cf.name;
                  const required = !!cf.required;
                  const placeholder = cf.placeholder || '';
                  // Tipagem simples por tipo
                  switch ((cf.type || 'text').toLowerCase()) {
                    case 'number':
                      return (
                        <FormField
                          key={cf.id || cf.name}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{label} {required && <span className="text-red-500">*</span>}</FormLabel>
                              <FormControl>
                                <Input type="number" step="any" placeholder={placeholder} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    case 'date':
                      return (
                        <FormField
                          key={cf.id || cf.name}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{label} {required && <span className="text-red-500">*</span>}</FormLabel>
                              <FormControl>
                                <Input type="date" placeholder={placeholder} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    case 'textarea':
                      return (
                        <FormField
                          key={cf.id || cf.name}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{label} {required && <span className="text-red-500">*</span>}</FormLabel>
                              <FormControl>
                                <Textarea placeholder={placeholder} className="min-h-[80px]" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    case 'checkbox':
                      return (
                        <FormField
                          key={cf.id || cf.name}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                              <FormLabel className="mb-0">{label}</FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    case 'select':
                      // se quiser suportar opções: cf.options = [{value,label}]
                      return (
                        <FormField
                          key={cf.id || cf.name}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{label} {required && <span className="text-red-500">*</span>}</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={placeholder || 'Selecione...'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(cf.options || []).map((opt: any) => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label || opt.value}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    default: // text
                      return (
                        <FormField
                          key={cf.id || cf.name}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{label} {required && <span className="text-red-500">*</span>}</FormLabel>
                              <FormControl>
                                <Input placeholder={placeholder} {...field} />
                              </FormControl>
                              {cf.helpText && <p className="text-xs text-gray-500">{cf.helpText}</p>}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                  }
                })}
            </div>
          </div>
        )}


        
        {/* Priority & Impact - Show only if template is selected and has these fields */}
        {templateSelected && (visibleFields.priority || visibleFields.impact || visibleFields.urgency) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Priority & Impact</h3>

            <div className="grid grid-cols-3 gap-4">
              {visibleFields.priority && (
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
                          placeholder={t("common.selectPriority") || "Selecione a prioridade"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {visibleFields.impact && (
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
                          placeholder={t("common.selectImpact") || "Selecione o impacto"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {visibleFields.urgency && (
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
                          placeholder={t("common.selectUrgency") || "Selecione a urgência"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        )}

        {/* Assignment - Show only if template is selected and has these fields */}
        {templateSelected && (visibleFields.assignedToId || visibleFields.assignmentGroup || visibleFields.location || visibleFields.contactType) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assignment</h3>

            <div className="grid grid-cols-2 gap-4">
              {visibleFields.assignedToId && (
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Agent</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select agent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users && Array.isArray(users) ? users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {visibleFields.assignmentGroup && (
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
              )}

              {visibleFields.location && (
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
              )}

              {visibleFields.contactType && (
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
              )}
            </div>
          </div>
        )}

        {/* Business Impact - Show only if template is selected and has these fields */}
        {templateSelected && (visibleFields.businessImpact || visibleFields.symptoms || visibleFields.workaround) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Business Impact & Analysis</h3>

            {visibleFields.businessImpact && (
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
            )}

            <div className="grid grid-cols-2 gap-4">
              {visibleFields.symptoms && (
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
              )}

              {visibleFields.workaround && (
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
              )}
            </div>
          </div>
        )}

        {/* Legacy Fields (Hidden but mapped) */}
        <FormField
          control={form.control}
          name="subject"          render={({ field }) => (
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
              setIsNewTicketModalOpen(false);
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const values = form.getValues(); // pega todos os valores atuais
              console.log("🚀 Ignorando validação, valores do form:", values);
              onSubmit(values); // chama direto sua função de submit
            }}
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
              onClick={() => {
                setIsNewTicketModalOpen(true);
                loadTemplates();
              }}
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
                onChange={(e) => {
                  const newViewId = e.target.value;
                  console.log('📋 [VIEW-CHANGE] Changing view from', selectedViewId, 'to', newViewId);
                  setSelectedViewId(newViewId);
                  
                  // Salvar no localStorage para persistir a última visualização
                  const tenantId = localStorage.getItem("tenantId");
                  if (tenantId) {
                    localStorage.setItem(`lastTicketView_${tenantId}`, newViewId);
                    console.log('💾 [VIEW-PERSIST] Saved last view:', newViewId, 'for tenant:', tenantId);
                  }
                }}
              >
                <option value="default">{t('tickets.views.defaultView')}</option>
                {ticketViews.map((view: any) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('tickets.title')} ({pagination.total})</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowColumnSearch(!showColumnSearch);
                  if (showColumnSearch) {
                    setColumnSearchValues({});
                  }
                }}
                data-testid="button-toggle-column-search"
              >
                <Search className="h-4 w-4 mr-2" />
                {showColumnSearch ? 'Ocultar Pesquisa' : 'Pesquisar'}
              </Button>
              <span className="text-sm font-normal text-gray-500">
                {t('pagination.page')} {currentPage} {t('pagination.of')} {pagination.totalPages}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTicketsTable
            tickets={filteredTickets}
            isLoading={isLoading || !isFieldColorsReady}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleExpand={toggleTicketExpansion}
            expandedTickets={expandedTickets}
            ticketRelationships={ticketRelationships}
            ticketsWithRelationships={ticketsWithRelationships}
            visibleColumns={visibleColumns}
            columnWidths={columnWidths}
            renderCell={renderCell}
            TableCellComponent={OptimizedTableCell}
            ResizeHandle={ResizeHandle}
            showColumnSearch={showColumnSearch}
            columnSearchValues={columnSearchValues}
            onColumnSearchChange={(columnId: string, value: string) => {
              setColumnSearchValues(prev => ({
                ...prev,
                [columnId]: value
              }));
            }}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortChange={(columnId: string, direction: 'asc' | 'desc') => {
              setSortColumn(columnId);
              setSortDirection(direction);
            }}
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
      <Dialog open={isNewTicketModalOpen} onOpenChange={(open) => {
        setIsNewTicketModalOpen(open);
        if (!open) {
          // Reset form and all states when modal closes
          console.log('🔄 [MODAL-CLOSE] Resetting form and states');
          form.reset();
          setSelectedCompanyId('');
          setSelectedCustomerId('');
          setSelectedTemplateId(undefined);
          setTemplateSelected(false);
          setTemplateRequiredKeys([]);
          setTemplateOptionalKeys([]);
          setTemplateFieldOrder([]);
          setActiveCustomFields([]);
          setVisibleFields(Object.fromEntries(Object.keys(visibleFields).map(k => [k, false])) as any);
        }
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle>{t('tickets.new_ticket')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
            {renderTicketForm()}
          </div>
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
              <Label>Colunas Disponíveis</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4 bg-gray-50">
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

            {/* Ordenação de colunas selecionadas */}
            {selectedColumns.length > 0 && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  Ordem das Colunas
                  <span className="text-xs text-gray-500 font-normal">(Arraste para reordenar)</span>
                </Label>
                <div className="border rounded-lg p-3 bg-gray-50 max-h-60 overflow-y-auto">
                  {selectedColumns.map((columnId, index) => {
                    const column = availableColumns.find((c) => c.id === columnId);
                    if (!column) return null;
                    
                    return (
                      <div
                        key={columnId}
                        className="flex items-center justify-between p-2 mb-2 bg-white border rounded-md hover:border-blue-400 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-0.5 cursor-move opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="w-4 h-0.5 bg-gray-400 rounded"></div>
                            <div className="w-4 h-0.5 bg-gray-400 rounded"></div>
                            <div className="w-4 h-0.5 bg-gray-400 rounded"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{column.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={index === 0}
                            onClick={() => {
                              const newOrder = [...selectedColumns];
                              [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                              setSelectedColumns(newOrder);
                            }}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={index === selectedColumns.length - 1}
                            onClick={() => {
                              const newOrder = [...selectedColumns];
                              [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                              setSelectedColumns(newOrder);
                            }}
                          >
                            ↓
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
            <Button 
              type="button" 
              onClick={() => {
                console.log('🔘 [BUTTON-CLICKED] Save button clicked!', {
                  newViewName,
                  isDisabled: !newViewName.trim(),
                  editingView: editingView?.id
                });
                handleCreateView();
              }} 
              disabled={!newViewName.trim()}
            >
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
            {ticketViews
              .filter((view: any) => !view.is_default)
              .map((view: any) => (
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