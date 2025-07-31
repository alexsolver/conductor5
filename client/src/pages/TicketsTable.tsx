import { useState, useMemo, useCallback, memo, useEffect } from "react";
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
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Settings, GripVertical, X, Undo, Redo, Bold, Italic, List, ListOrdered, ArrowLeft, Quote, Code, Heading1, Heading2, Heading3, Strikethrough, ChevronDown, ChevronUp, Link2, ArrowUpRight, ArrowDownRight, CornerDownRight, Copy, AlertTriangle, ArrowRight, GitBranch, Users, AlertCircle } from "lucide-react";
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

interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  subcategory?: string;
  impact?: string;
  urgency?: string;
  state?: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  caller_id: string;
  assigned_to_id?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
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
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Estados para expansão de relacionamentos
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [ticketRelationships, setTicketRelationships] = useState<Record<string, any[]>>({});
  const [ticketsWithRelationships, setTicketsWithRelationships] = useState<Set<string>>(new Set());

  // Hook para buscar cores dos campos personalizados
  const { getFieldColor, getFieldLabel, isLoading: isFieldColorsLoading } = useFieldColors();
  const queryClient = useQueryClient();

  // Mapeamento de valores em inglês para português para compatibilidade com configurações
  const statusMapping: Record<string, string> = {
    'new': 'novo',
    'open': 'aberto', 
    'in_progress': 'em_andamento',
    'in progress': 'em_andamento',
    'resolved': 'resolvido',
    'closed': 'fechado',
    'cancelled': 'cancelado'
  };

  const priorityMapping: Record<string, string> = {
    'low': 'low',
    'medium': 'medium', 
    'high': 'high',
    'critical': 'critical'
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

  // Funções de mapeamento
  const mapStatusValue = (value: string): string => {
    if (!value) return 'novo';
    const mapped = statusMapping[value.toLowerCase()] || value;
    return mapped;
  };

  const mapPriorityValue = (value: string): string => {
    if (!value) return 'medium';
    return priorityMapping[value.toLowerCase()] || value;
  };

  const mapCategoryValue = (value: string): string => {
    // Lidar com valores null, undefined, string "null" ou vazios
    if (!value || value === null || value === 'null' || value === '' || typeof value !== 'string') {
      return 'suporte_tecnico'; // Use uma categoria que existe no sistema
    }
    const mapped = categoryMapping[value.toLowerCase()] || 'suporte_tecnico';
    return mapped;
  };

  // Fetch tickets data
  const { data: ticketsResponse, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      return response.json();
    },
  });

  const tickets = ticketsResponse?.success ? ticketsResponse.data?.tickets || [] : [];

  // Filter tickets based on search and filters
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket: Ticket) => {
      const matchesSearch = !searchTerm || 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  // Handle modal actions
  const handleEditTicket = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsEditModalOpen(true);
  }, []);

  const handleLinkTicket = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsLinkModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    setIsLinkModalOpen(false);
    setSelectedTicket(null);
    // Invalidate cache to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
  }, [queryClient]);

  // Loading state
  if (ticketsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (ticketsError) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar tickets. Tente novamente.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-gray-600">
            {filteredTickets.length} tickets encontrados
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="new">Novo</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket: Ticket) => (
                <TableRow key={ticket.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                      {ticket.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={ticket.subject}>
                      {ticket.subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DynamicBadge 
                      fieldName="status"
                      value={mapStatusValue(ticket.status)}
                      colorHex={getFieldColorWithFallback('status', mapStatusValue(ticket.status))}
                    >
                      {getFieldLabel('status', mapStatusValue(ticket.status))}
                    </DynamicBadge>
                  </TableCell>
                  <TableCell>
                    <DynamicBadge 
                      fieldName="priority"
                      value={mapPriorityValue(ticket.priority)}
                      colorHex={getFieldColorWithFallback('priority', mapPriorityValue(ticket.priority))}
                    >
                      {getFieldLabel('priority', mapPriorityValue(ticket.priority))}
                    </DynamicBadge>
                  </TableCell>
                  <TableCell>
                    {ticket.category ? (
                      <DynamicBadge 
                        fieldName="category"
                        value={mapCategoryValue(ticket.category)}
                        colorHex={getFieldColorWithFallback('category', mapCategoryValue(ticket.category))}
                      >
                        {getFieldLabel('category', mapCategoryValue(ticket.category))}
                      </DynamicBadge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {ticket.customer?.fullName || ticket.customer?.firstName + ' ' + ticket.customer?.lastName || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tickets/${ticket.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTicket(ticket)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleLinkTicket(ticket)}>
                          <Link2 className="h-4 w-4 mr-2" />
                          Vincular
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ticket</DialogTitle>
          </DialogHeader>
          {/* Edit form would go here */}
        </DialogContent>
      </Dialog>

      <TicketLinkingModal
        isOpen={isLinkModalOpen}
        onClose={handleModalClose}
        sourceTicketId={selectedTicket?.id}
        sourceTicketNumber={selectedTicket?.number}
      />
    </div>
  );
}