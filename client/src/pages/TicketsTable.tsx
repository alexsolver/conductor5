import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Settings, GripVertical, X, Undo, Redo, Bold, Italic, List, ListOrdered, ArrowLeft, Quote, Code, Heading1, Heading2, Heading3, Strikethrough, ChevronDown, ChevronUp, Link2, ArrowUpRight, ArrowDownRight, CornerDownRight, Copy, AlertTriangle, ArrowRight, GitBranch, Users } from "lucide-react";
import { DynamicSelect } from "@/components/DynamicSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { PersonSelector } from "@/components/PersonSelector";
import { useFieldColors } from "@/hooks/useFieldColors";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";
import TicketHierarchyView from "@/components/tickets/TicketHierarchyView";

// Schema for ticket creation/editing - ServiceNow style
const ticketSchema = z.object({
  // Basic Fields
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  impact: z.enum(["low", "medium", "high"]).optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  state: z.enum(["new", "in_progress", "resolved", "closed", "cancelled"]).optional(),

  // Assignment Fields - Enhanced for flexible person referencing
  companyId: z.string().min(1, "Empresa é obrigatória"),
  callerId: z.string().min(1, "Solicitante é obrigatório"),
  callerType: z.enum(["user", "customer"]).default("customer"),
  beneficiaryId: z.string().optional(), // Optional - defaults to callerId
  beneficiaryType: z.enum(["user", "customer"]).optional(),

  assignedToId: z.string().optional(),
  assignmentGroup: z.string().optional(),
  location: z.string().optional(),

  // Communication Fields
  contactType: z.enum(["email", "phone", "self_service", "chat"]).optional(),

  // Business Fields
  businessImpact: z.string().optional(),
  symptoms: z.string().optional(),
  workaround: z.string().optional(),

  // Using subject field directly - no legacy conversion needed
  subject: z.string().min(1, "Título do ticket é obrigatório"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
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

export default function TicketsTable() {
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

  // Hook para buscar cores dos campos personalizados
  const { getFieldColor, getFieldLabel, isLoading: isFieldColorsLoading } = useFieldColors();

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
    'hardware': 'infraestrutura',
    'software': 'suporte_tecnico', 
    'network': 'infraestrutura',
    'access': 'suporte_tecnico',
    'other': 'suporte_tecnico',
    'technical_support': 'suporte_tecnico',
    'customer_service': 'atendimento_cliente',
    'financial': 'financeiro',
    'infrastructure': 'infraestrutura'
  };

  // Função helper para obter cor com fallback durante carregamento
  const getFieldColorWithFallback = (fieldName: string, value: string): string => {
    if (isFieldColorsLoading) {
      return '#6b7280'; // Cor neutra (gray-500) durante carregamento
    }
    return getFieldColor(fieldName, value) || '#6b7280';
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
        return 'support'; // Valor padrão em inglês
      }
      return categoryMapping[value.toLowerCase()] || 'support';
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

  // Função de mapeamento para categoria
  const mapCategoryValue = (value: string): string => {
    return dataMapper.category(value);
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
    { id: "category", label: "Categoria" },
    { id: "subcategory", label: "Subcategoria" },
    { id: "status", label: "Status" },
    { id: "priority", label: "Prioridade" },
    { id: "impact", label: "Impacto" },
    { id: "urgency", label: "Urgência" },
    { id: "assigned_to", label: "Atribuído a" },
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

  // Função para buscar relacionamentos de tickets
  const fetchTicketRelationships = async (ticketId: string) => {
    try {
      const response = await apiRequest("GET", `/api/ticket-relationships/${ticketId}/relationships`);
      const data = await response.json();

      if (data.success) {
        // Transform the data to match the expected format
        const transformedRelationships = data.data.map((relationship: any) => ({
          id: relationship.targetTicket.id,
          number: relationship.targetTicket.number || 'N/A',
          subject: relationship.targetTicket.subject || 'Sem assunto',
          status: relationship.targetTicket.status || 'unknown',
          priority: relationship.targetTicket.priority || 'medium',
          relationshipType: relationship.relationshipType,
          description: relationship.description || '',
          createdAt: relationship.createdAt
        }));

        setTicketRelationships(prev => ({
          ...prev,
          [ticketId]: transformedRelationships
        }));

        // Marcar ticket como tendo relacionamentos se houver dados
        if (transformedRelationships.length > 0) {
          setTicketsWithRelationships(prev => new Set([...Array.from(prev), ticketId]));
        }

        return transformedRelationships;
      }
    } catch (error) {
      console.error('Error fetching ticket relationships:', error);
      return [];
    }
  };

  // Função para alternar expansão de ticket
  const toggleTicketExpansion = async (ticketId: string) => {
    const newExpanded = new Set(expandedTickets);

    if (expandedTickets.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
      // Buscar relacionamentos se não existirem no cache
      if (!ticketRelationships[ticketId]) {
        await fetchTicketRelationships(ticketId);
      }
    }

    setExpandedTickets(newExpanded);
  };

  // Função para obter o ícone do tipo de relacionamento
  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'related':
        return <Link2 className="h-4 w-4 text-gray-500" />;
      case 'duplicates':
        return <Copy className="h-4 w-4 text-orange-500" />;
      case 'blocks':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'caused_by':
        return <ArrowRight className="h-4 w-4 text-purple-500" />;
      case 'parent_child':
        return <GitBranch className="h-4 w-4 text-blue-500" />;
      case 'follows':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Link2 className="h-4 w-4 text-gray-500" />;
    }
  };

  // Função para obter o rótulo do tipo de relacionamento
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

  // Fetch tickets with pagination and filters - OTIMIZADO
  const { data: ticketsData, isLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets", currentPage, statusFilter, priorityFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (priorityFilter !== "all") {
        params.append("priority", priorityFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await apiRequest('GET', `/api/tickets?${params.toString()}`);
      return response.json();
    },
    retry: 3,
    staleTime: 30000, // Cache por 30 segundos
    cacheTime: 300000, // Manter em cache por 5 minutos
  });

  // Legacy customer system removed - using PersonSelector for modern person management

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
    retry: 3,
  });

  // Fetch companies for dropdown
  const { data: companiesData } = useQuery({
    queryKey: ["/api/customers/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers/companies");
      return response.json();
    },
    retry: 3,
  });

  // Fetch ticket views from backend
  const { data: ticketViewsData, refetch: refetchViews } = useQuery({
    queryKey: ["/api/ticket-views"],
    retry: 3,
  });

  // 🚨 CORREÇÃO CRÍTICA: API retorna {success: true, data: {tickets: []}}
  const tickets = ticketsData?.data?.tickets || [];
  const pagination = ticketsData?.data?.pagination || { total: 0, totalPages: 0 };
  // Legacy customers array removed
  const users = (usersData as any)?.users || [];
  const companies = Array.isArray((companiesData as any)?.companies) ? (companiesData as any).companies : 
                   Array.isArray((companiesData as any)?.data) ? (companiesData as any).data :
                   Array.isArray(companiesData) ? companiesData : [];
  const ticketViews = (ticketViewsData as any)?.data || [];

  // Função para verificar se um ticket tem relacionamentos via API
  const checkTicketRelationships = async (ticketId: string) => {
    try {
      const response = await apiRequest('GET', `/api/tickets/${ticketId}/relationships`);
      const data = await response.json();

      // A API pode retornar {success: true, data: [...]} ou {relationships: [...]}
      let relationships = data.relationships || data.data || [];

      // Se data é um array diretamente
      if (Array.isArray(data)) {
        relationships = data;
      }

      const hasRelationships = relationships && relationships.length > 0;
      console.log(`🔗 Ticket ${ticketId} relationships:`, {
        hasRelationships,
        count: relationships?.length || 0,
        rawResponse: data,
        relationships: relationships
      });

      // Log especial para tickets que sabemos que deveriam ter relacionamentos
      if (ticketId === '6fdae7d3-67cd-49f3-99d1-8ddd3efcb653') {
        console.log(`🚨 IMPORTANTE: Ticket T-1753756629339-G5WE deveria ter relacionamentos:`, {
          ticketId,
          hasRelationships,
          dataType: typeof data,
          isDataArray: Array.isArray(data),
          dataKeys: data ? Object.keys(data) : 'null',
          relationships,
          relationshipsLength: relationships?.length
        });
      }

      return hasRelationships;
    } catch (error) {
      console.error('Error checking ticket relationships:', error);
      return false;
    }
  };

  // Inicializar indicadores de relacionamentos - ULTRA OTIMIZADO
  useEffect(() => {
    if (tickets.length > 0) {
      console.log('🔄 useEffect triggered - tickets.length:', tickets.length);
      
      // Debounce inteligente com cleanup
      const timeoutId = setTimeout(() => {
        const checkAllTicketRelationships = async () => {
          try {
            const ticketIds = tickets.map((ticket: any) => ticket.id);
            console.log('🔍 Starting relationship check for', ticketIds.length, 'tickets');
            
            // Log individual para debugging
            ticketIds.forEach((id: string, index: number) => {
              const ticket = tickets[index];
              console.log(`🔗 Checking relationships for ticket: ${id} (${ticket.number || 'N/A'})`);
            });
            
            const response = await apiRequest('POST', '/api/tickets/batch-relationships', { ticketIds });
            const data = await response.json();

            const ticketsWithRels = new Set<string>();
            let totalRelationships = 0;
            
            if (data.success && data.data) {
              Object.entries(data.data).forEach(([ticketId, relationships]: [string, any]) => {
                if (relationships && relationships.length > 0) {
                  ticketsWithRels.add(ticketId);
                  totalRelationships += relationships.length;
                  console.log(`✅ Ticket ${ticketId} HAS relationships`);
                } else {
                  console.log(`❌ Ticket ${ticketId} has NO relationships`);
                }
              });
            }

            console.log('🎯 Final tickets with relationships:', Array.from(ticketsWithRels));
            console.log('🎯 Total tickets checked:', ticketIds.length, ', with relationships:', ticketsWithRels.size);
            
            setTicketsWithRelationships(ticketsWithRels);
            setTicketRelationships(data.data || {});
            
          } catch (error) {
            console.error('Error checking batch relationships:', error);
            // Fallback vazio em caso de erro
            setTicketsWithRelationships(new Set());
          }
        };

        checkAllTicketRelationships();
      }, 100); // Debounce de 100ms

      return () => clearTimeout(timeoutId);
    }
  }, [tickets]);

  // Obter visualização ativa
  const activeView = ticketViews.find((view: any) => view.id === selectedViewId);
  const activeColumns = activeView?.columns || [
    { id: "number", label: "Número", visible: true, order: 1, width: 120 },
    { id: "subject", label: "Assunto", visible: true, order: 2, width: 300 },
    { id: "customer", label: "Cliente", visible: true, order: 3, width: 150 },
    { id: "category", label: "Categoria", visible: true, order: 4, width: 120 },
    { id: "status", label: "Status", visible: true, order: 5, width: 120 },
    { id: "priority", label: "Prioridade", visible: true, order: 6, width: 120 },
    { id: "created", label: "Criado", visible: true, order: 7, width: 150 }
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
          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <div>
                <div className="font-medium truncate" title={
                  (ticket as any).customer_first_name && (ticket as any).customer_last_name 
                    ? `${(ticket as any).customer_first_name} ${(ticket as any).customer_last_name}`
                    : ticket.customer?.fullName || ticket.caller?.fullName || (ticket as any).caller_name || 'N/A'
                }>
                  {(ticket as any).customer_first_name && (ticket as any).customer_last_name 
                    ? `${(ticket as any).customer_first_name} ${(ticket as any).customer_last_name}`
                    : ticket.customer?.fullName || ticket.caller?.fullName || (ticket as any).caller_name || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 truncate" title={
                  (ticket as any).customer_email || ticket.customer?.email || ticket.caller?.email || 'N/A'
                }>
                  {(ticket as any).customer_email || ticket.customer?.email || ticket.caller?.email || 'N/A'}
                </div>
              </div>
            </TableCell>
          );
        case 'category':
          const categoryValue = mapCategoryValue((ticket as any).category);
          const categoryColor = getFieldColorWithFallback('category', categoryValue);
          const categoryLabel = getFieldLabel('category', categoryValue);

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge 
                fieldName="category"
                value={categoryValue}
                colorHex={categoryColor}
              >
                {categoryLabel}
              </DynamicBadge>
            </TableCell>
          );
        case 'status':
          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge 
                fieldName="status"
                value={mapStatusValue((ticket as any).state || ticket.status)}
                colorHex={getFieldColorWithFallback('status', mapStatusValue((ticket as any).state || ticket.status))}
              >
                {getFieldLabel('status', mapStatusValue((ticket as any).state || ticket.status))}
              </DynamicBadge>
            </TableCell>
          );
        case 'priority':
          const priorityValue = mapPriorityValue(ticket.priority);
          const priorityColor = getFieldColorWithFallback('priority', priorityValue);
          const priorityLabel = getFieldLabel('priority', priorityValue);

          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge 
                fieldName="priority"
                value={priorityValue}
                colorHex={priorityColor}
              >
                {priorityLabel}
              </DynamicBadge>
            </TableCell>
          );
        case 'impact':
          return (
            <TableCell className="overflow-hidden" style={cellStyle}>
              <DynamicBadge 
                fieldName="impact"
                value={mapImpactValue((ticket as any).impact)}
                colorHex={getFieldColorWithFallback('impact', mapImpactValue((ticket as any).impact))}
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
          return (
            <TableCell>
              {(ticket as any).subcategory || '-'}
            </TableCell>
          );
        case 'urgency':
          return (
            <TableCell>
              <DynamicBadge 
                fieldName="urgency" 
                value={mapUrgencyValue((ticket as any).urgency)}
                colorHex={getFieldColorWithFallback('urgency', mapUrgencyValue((ticket as any).urgency))}
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
              {new Date(ticket.updatedAt).toLocaleDateString()}
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
  const renderCell = useCallback((column: any, ticket: Ticket, key?: string) => (
    <TableCellComponent key={key || `${ticket.id}-${column.id}`} column={column} ticket={ticket} />
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
    setSelectedColumns(["number", "subject", "customer", "category", "status", "priority", "created"]);
    setIsPublicView(false);
  };

  // Handle create new view
  const handleCreateView = () => {
    if (!newViewName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da visualização é obrigatório",
        variant: "destructive"
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
      { id: "impact", label: "Impacto", visible: selectedColumns.includes("impact"), order: 7, width: 120 },
      { id: "assigned_to", label: "Atribuído", visible: selectedColumns.includes("assigned_to"), order: 8, width: 150 },
      { id: "created", label: "Criado", visible: selectedColumns.includes("created"), order: 9, width: 150 }
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
    usersCount: users.length,
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
      customer_company_id: data.companyId,

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
                  <FormLabel>Solicitante (Caller) *</FormLabel>
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
                      placeholder="Buscar solicitante..."
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
                  <FormLabel>Assignment Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="level1">Level 1 Support</SelectItem>
                      <SelectItem value="level2">Level 2 Support</SelectItem>
                      <SelectItem value="level3">Level 3 Support</SelectItem>
                      <SelectItem value="network">Network Team</SelectItem>
                      <SelectItem value="security">Security Team</SelectItem>
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 p-6 bg-white rounded-lg shadow-sm border">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-800">Carregando Sistema de Tickets</div>
            <div className="text-sm text-gray-600">
              {isFieldColorsLoading 
                ? "⚙️ Carregando configurações de campos personalizados..." 
                : tickets.length > 0 
                  ? `🔗 Verificando relacionamentos para ${tickets.length} tickets...`
                  : "📋 Conectando com PostgreSQL via Neon..."
              }
            </div>
            <div className="text-xs text-gray-500">
              {tickets.length > 0 
                ? `${ticketsWithRelationships.size} tickets com vínculos detectados`
                : "Primeira carga pode levar alguns segundos"
              }
            </div>
            {/* Progress indicator melhorado */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                style={{ 
                  width: tickets.length > 0 
                    ? `${Math.min(85, (ticketsWithRelationships.size / tickets.length) * 100)}%`
                    : '25%'
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {tickets.length > 0 
                ? `Carregados ${tickets.length} tickets - Verificando vínculos...`
                : "Conectando com PostgreSQL via Neon..."
              }
            </div>
            {/* Progress indicator */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: tickets.length > 0 ? '70%' : '30%' 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Progress skeleton melhorado */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700 font-medium">
            {tickets.length > 0 
              ? `Processando ${tickets.length} tickets encontrados...`
              : "Conectando com o servidor..."
            }
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Primeira carga pode levar alguns segundos
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{
      userSelect: isResizing ? 'none' : 'auto',
      cursor: isResizing ? 'col-resize' : 'default'
    }}>
      {/* Header */}
      <div className="flex justify-between items-center ml-[20px] mr-[20px]">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track customer support requests</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsNewTicketModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Ticket
          </Button>
        </div>
      </div>
      {/* Seletor de Visualizações */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col space-y-1.5 p-6 pt-[3px] pb-[3px]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Visualizações de Tickets
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsNewViewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Visualização
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsManageViewsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-[0px] pb-[0px]">
          <div className="flex items-center gap-4 pt-[10px] pb-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Visualização Ativa:</span>
              <select 
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                value={selectedViewId}
                onChange={(e) => setSelectedViewId(e.target.value)}
              >
                <option value="default">Visualização Padrão</option>
                {ticketViews.map((view: any) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAdvancedFiltersOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-col space-y-1.5 p-6 pt-[0px] pb-[0px]">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DynamicSelect
              fieldName="status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Filter by status"
              showAllOption={true}
            />
            <DynamicSelect
              fieldName="priority"
              value={priorityFilter}
              onValueChange={setPriorityFilter}
              placeholder="Filter by priority"
              showAllOption={true}
            />
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tickets ({pagination.total})</span>
            <span className="text-sm font-normal text-gray-500">
              Page {currentPage} of {pagination.totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  {visibleColumns.map((column: any) => (
                    <TableHead 
                      key={column.id} 
                      className="relative select-none"
                      style={{ 
                        width: getColumnWidth(column.id),
                        minWidth: getColumnWidth(column.id)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{column.label}</span>
                        <ResizeHandle columnId={column.id} />
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-2">Loading tickets...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8 text-gray-500">
                      {ticketsError ? (
                        <div>
                          <p>Error loading tickets: {ticketsError.message}</p>
                          <p className="text-sm mt-1">Check console for details</p>
                        </div>
                      ) : (
                        "No tickets found"
                      )}
                    </TableCell>
                  </TableRow>
                ) : tickets.map((ticket: Ticket, ticketIndex: number) => (
                  <React.Fragment key={ticket.id}>
                    <TableRow>
                      <TableCell className="w-10">
                        <div className="flex items-center">
                          {/* Indicador visual melhorado para tickets com vínculos */}
                          {ticketsWithRelationships.has(ticket.id) && (
                            <>
                              <div className="mr-1">
                                <div className="animate-pulse bg-blue-100 rounded-full p-1" title="Possui vínculos">
                                  <Link2 className="h-3 w-3 text-blue-600" />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 transition-all duration-200 ${
                                  expandedTickets.has(ticket.id) 
                                    ? 'bg-blue-100 text-blue-600' 
                                    : 'hover:bg-gray-100'
                                }`}
                                onClick={() => toggleTicketExpansion(ticket.id)}
                                title={expandedTickets.has(ticket.id) ? "Recolher vínculos" : "Expandir vínculos"}
                              >
                                {expandedTickets.has(ticket.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      {visibleColumns.map((column: any) => 
                        renderCell(column, ticket, `${ticket.id}-${column.id}`)
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/tickets/${ticket.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => handleDelete(ticket.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Linha expandida para relacionamentos */}
                    {expandedTickets.has(ticket.id) && (
                      <TableRow>
                        <TableCell colSpan={visibleColumns.length + 2} className="p-0">
                          <div className="border-t bg-gray-50/50 p-4">
                            <div className="text-sm font-medium text-gray-700 mb-3">
                              Tickets vinculados:
                            </div>
                            {ticketRelationships[ticket.id] && ticketRelationships[ticket.id].length > 0 ? (
                              <div className="space-y-2">
                                {ticketRelationships[ticket.id].map((relationship: any) => (
                                  <div key={relationship.id} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      {getRelationshipIcon(relationship.relationshipType)}
                                      <Badge variant="outline" className="text-xs">
                                        {getRelationshipLabel(relationship.relationshipType)}
                                      </Badge>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <Link
                                          to={`/tickets/${relationship.id}`}
                                          className="font-medium text-blue-600 hover:text-blue-800"
                                        >
                                          {relationship.number}
                                        </Link>
                                        <span className="text-gray-600">{relationship.subject}</span>
                                      </div>
                                      {relationship.description && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {relationship.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <DynamicBadge
                                        fieldName="status"
                                        value={relationship.status}
                                      >
                                        {getFieldLabel('status', relationship.status)}
                                      </DynamicBadge>
                                      <DynamicBadge
                                        fieldName="priority"
                                        value={relationship.priority}
                                      >
                                        {getFieldLabel('priority', relationship.priority)}
                                      </DynamicBadge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                Carregando relacionamentos...
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Modal Nova/Editar Visualização */}
      <Dialog open={isNewViewDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingView ? 'Editar Visualização de Tickets' : 'Nova Visualização de Tickets'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Visualização *</label>
              <Input 
                placeholder="Ex: Meus Tickets Urgentes" 
                className="mt-1"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input 
                placeholder="Descrição opcional da visualização" 
                className="mt-1"
                value={newViewDescription}
                onChange={(e) => setNewViewDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Colunas a Exibir</label>
              <div className="mt-2 space-y-2">
                <div className="text-xs text-gray-500 mb-2">Clique para selecionar/desmarcar colunas. Arraste para reordenar.</div>
                <div className="grid grid-cols-2 gap-2">
                  {availableColumns.map((col) => (
                    <label key={col.id} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedColumns.includes(col.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColumns([...selectedColumns, col.id]);
                          } else {
                            setSelectedColumns(selectedColumns.filter(c => c !== col.id));
                          }
                        }}
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>

                {/* Ordem das Colunas Selecionadas */}
                {selectedColumns.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="text-sm font-medium mb-2">Ordem das Colunas:</div>
                    <div className="space-y-1">
                      {selectedColumns.map((columnId, index) => {
                        const column = availableColumns.find(col => col.id === columnId);
                        return (
                          <div key={columnId} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded border">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            <span className="text-sm flex-1">{column?.label}</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => index > 0 && moveColumn(index, index - 1)}
                                disabled={index === 0}
                                className="h-6 w-6 p-0"
                              >
                                ↑
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => index < selectedColumns.length - 1 && moveColumn(index, index + 1)}
                                disabled={index === selectedColumns.length - 1}
                                className="h-6 w-6 p-0"
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
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="public" 
                className="rounded"
                checked={isPublicView}
                onChange={(e) => setIsPublicView(e.target.checked)}
              />
              <label htmlFor="public" className="text-sm">
                Tornar visualização pública (visível para outros usuários)
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsNewViewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateView}
              disabled={createViewMutation.isPending || updateViewMutation.isPending}
            >
              {editingView 
                ? (updateViewMutation.isPending ? "Salvando..." : "Salvar Alterações")
                : (createViewMutation.isPending ? "Criando..." : "Criar Visualização")
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Gerenciar Visualizações */}
      <Dialog open={isManageViewsOpen} onOpenChange={setIsManageViewsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gerenciar Visualizações
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {ticketViews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma visualização personalizada criada ainda.</p>
                <p className="text-sm">Clique em "Nova Visualização" para criar sua primeira visualização.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ticketViews.map((view: any) => (
                  <div key={view.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{view.name}</h3>
                        <div className="flex gap-2">
                          {view.isPublic && (
                            <Badge variant="secondary" className="text-xs">Pública</Badge>
                          )}
                          {view.isDefault && (
                            <Badge variant="default" className="text-xs">Padrão</Badge>
                          )}
                          {selectedViewId === view.id && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600">Ativa</Badge>
                          )}
                        </div>
                      </div>
                      {view.description && (
                        <p className="text-sm text-gray-600 mt-1">{view.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {view.columns?.length || 0} colunas • 
                        Criada em {new Date(view.createdAt).toLocaleDateString()} •
                        {view.isPublic ? 'Visível para todos' : 'Apenas para você'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedViewId(view.id)}
                        disabled={selectedViewId === view.id}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedViewId === view.id ? 'Ativa' : 'Ativar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditView(view)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteView(view.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-500">
              {ticketViews.length} visualização(ões) criada(s)
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsNewViewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Visualização
              </Button>
              <Button variant="default" onClick={() => setIsManageViewsOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Filtros Avançados */}
      <Dialog open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Filtros Avançados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data de Criação</label>
                <div className="flex space-x-2 mt-1">
                  <Input type="date" placeholder="De" />
                  <Input type="date" placeholder="Até" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Data de Resolução</label>
                <div className="flex space-x-2 mt-1">
                  <Input type="date" placeholder="De" />
                  <Input type="date" placeholder="Até" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Atribuído a</label>
                <select className="w-full px-3 py-2 border rounded-md mt-1">
                  <option value="">Todos os usuários</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <Input placeholder="Nome ou email do cliente" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <DynamicSelect
                  fieldName="category"
                  value=""
                  onValueChange={() => {}}
                  placeholder="Todas as categorias"
                  showAllOption={true}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <DynamicSelect
                  fieldName="status"
                  value=""
                  onValueChange={() => {}}
                  placeholder="Todos os status"
                  showAllOption={true}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <DynamicSelect
                  fieldName="priority"
                  value=""
                  onValueChange={() => {}}
                  placeholder="Todas as prioridades"
                  showAllOption={true}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <Input placeholder="Ex: urgente, cliente-vip, bug" className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsAdvancedFiltersOpen(false)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => {
              // TODO: Implementar limpeza de filtros
            }}>
              Limpar Filtros
            </Button>
            <Button onClick={() => {
              // TODO: Implementar aplicação de filtros avançados
              setIsAdvancedFiltersOpen(false);
            }}>
              Aplicar Filtros
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação de Novo Ticket */}
      <Dialog open={isNewTicketModalOpen} onOpenChange={setIsNewTicketModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5" />
              Novo Ticket
            </DialogTitle>
          </DialogHeader>

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

              {/* Layout principal idêntico ao TicketDetails - sem sidebar direita */}
              <div className="space-y-6">

                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações Básicas</h3>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título do Ticket *</FormLabel>
                          <FormControl>
                            <Input placeholder="Resumo breve do problema ou solicitação" {...field} />
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
                            <FormControl>
                              <DynamicSelect
                                fieldName="priority"
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Selecione a prioridade"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Atribuição e Contato */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Atribuição e Contato</h3>

                    <FormField
                      control={form.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa *</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                // Don't allow unspecified for required field
                                if (value === "unspecified") return;

                                field.onChange(value);
                                setSelectedCompanyId(value);
                                // Reset customer selection when company changes
                                form.setValue("callerId", "");
                                form.setValue("callerType", "customer");
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma empresa" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.length === 0 ? (
                                  <SelectItem value="no-companies" disabled>
                                    Nenhuma empresa encontrada
                                  </SelectItem>
                                ) : (
                                  companies.map((company: any) => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.name || company.company_name || company.displayName}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="callerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente *</FormLabel>
                          <FormControl>
                            <PersonSelector
                              value={field.value}
                              onValueChange={(personId, personType) => {
                                field.onChange(personId);
                                form.setValue('callerType', personType);
                              }}
                              placeholder="Selecione o cliente"
                              allowedTypes={['customer']}
                              companyFilter={form.watch('companyId')}
                              disabled={!form.watch('companyId') || form.watch('companyId') === 'unspecified'}
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
                          <FormLabel>Atribuído a</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um usuário" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Não atribuído</SelectItem>
                                {users.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                          <FormLabel>Tipo de Contato</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Como foi solicitado?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Telefone</SelectItem>
                                <SelectItem value="chat">Chat</SelectItem>
                                <SelectItem value="self_service">Portal de Autoatendimento</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <Input placeholder="Local físico ou departamento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Descrição Detalhada */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Descrição Detalhada</h3>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição do Problema/Solicitação *</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Informações Adicionais */}
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sintomas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva os sintomas observados" 
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
                    name="businessImpact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impacto no Negócio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Como isso afeta as operações?" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Workaround */}
                <FormField
                  control={form.control}
                  name="workaround"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solução Temporária</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Existe alguma solução temporária disponível?" 
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewTicketModalOpen(false)}
                                    disabled={createTicketMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTicketMutation.isPending}
                  className="min-w-[120px]"
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}