import { useState, useMemo, useCallback, memo } from "react";
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
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Settings, GripVertical, X, Undo, Redo, Bold, Italic, List, ListOrdered, ArrowLeft, Quote, Code, Heading1, Heading2, Heading3, Strikethrough } from "lucide-react";
import { DynamicSelect } from "@/components/DynamicSelect";
import { DynamicBadge } from "@/components/DynamicBadge";
import { PersonSelector } from "@/components/PersonSelector";
import TicketLinkingModal from "@/components/tickets/TicketLinkingModal";
import TicketHierarchyView from "@/components/tickets/TicketHierarchyView";

// Schema for ticket creation/editing - ServiceNow style
const ticketSchema = z.object({
  // Basic Fields
  shortDescription: z.string().min(1, "Short description is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  impact: z.enum(["low", "medium", "high"]).optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  state: z.enum(["new", "in_progress", "resolved", "closed", "cancelled"]).optional(),

  // Assignment Fields - Enhanced for flexible person referencing
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

  // Legacy compatibility
  subject: z.string().min(1, "Subject is required"),
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

  // Fetch tickets with pagination and filters
  const { data: ticketsData, isLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets"],
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

      const response = await apiRequest('GET', `/api/tickets?${params.toString()}`);
      return response.json();
    },
    retry: 3,
  });

  // Legacy customer system removed - using PersonSelector for modern person management

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ["/api/tenant-admin/users"],
    retry: 3,
  });

  // Fetch ticket views from backend
  const { data: ticketViewsData, refetch: refetchViews } = useQuery({
    queryKey: ["/api/ticket-views"],
    retry: 3,
  });

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination || { total: 0, totalPages: 0 };
  // Legacy customers array removed
  const users = usersData?.users || [];
  const ticketViews = ticketViewsData?.data || [];

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

  // Componente de célula otimizado com React.memo
  const TableCellComponent = memo(({ column, ticket }: { column: any, ticket: Ticket }) => {
    switch (column.id) {
      case 'number':
        return (
          <TableCell className="font-mono text-sm">
            <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
              {(ticket as any).number || `#${ticket.id.slice(-8)}`}
            </Link>
          </TableCell>
        );
      case 'subject':
        return (
          <TableCell className="font-medium max-w-xs truncate">
            {(ticket as any).shortDescription || ticket.subject}
          </TableCell>
        );
      case 'customer':
        return (
          <TableCell>
            <div>
              <div className="font-medium">
                {ticket.customer?.fullName || 'N/A'}
              </div>
              <div className="text-sm text-gray-500">
                {ticket.customer?.email || 'N/A'}
              </div>
            </div>
          </TableCell>
        );
      case 'category':
        return (
          <TableCell>
            <DynamicBadge fieldName="category" value={(ticket as any).category || 'other'}>
              {(ticket as any).category || 'Other'}
            </DynamicBadge>
          </TableCell>
        );
      case 'status':
        return (
          <TableCell>
            <DynamicBadge fieldName="status" value={((ticket as any).state || ticket.status).replace('_', ' ')} />
          </TableCell>
        );
      case 'priority':
        return (
          <TableCell>
            <DynamicBadge fieldName="priority" value={ticket.priority} />
          </TableCell>
        );
      case 'impact':
        return (
          <TableCell>
            <DynamicBadge fieldName="impact" value={(ticket as any).impact || 'medium'}>
              {(ticket as any).impact || 'Medium'}
            </DynamicBadge>
          </TableCell>
        );
      case 'assigned_to':
        return (
          <TableCell>
            {ticket.assignedTo ? (
              <div>
                <div className="font-medium">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</div>
                <div className="text-sm text-gray-500">{ticket.assignedTo.email}</div>
              </div>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </TableCell>
        );
      case 'created':
        return (
          <TableCell>
            {new Date(ticket.createdAt).toLocaleDateString()}
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
            <DynamicBadge fieldName="urgency" value={(ticket as any).urgency || 'medium'}>
              {(ticket as any).urgency || 'Medium'}
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
            <DynamicBadge fieldName="sla_status" value={(ticket as any).slaStatus || 'on_track'}>
              {(ticket as any).slaStatus || 'On Track'}
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
        return <TableCell>-</TableCell>;
    }
  });

  // Função de renderização otimizada
  const renderCell = useCallback((column: any, ticket: Ticket) => (
    <TableCellComponent key={`${ticket.id}-${column.id}`} column={column} ticket={ticket} />
  ), []);

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

  // Debug logging
  console.log('TicketsTable - Data:', {
    ticketsError,
    isLoading,
    ticketsCount: tickets.length,
    customersCount: 0, // Legacy system removed
    usersCount: users.length,
    hasToken: !!localStorage.getItem('accessToken')
  });

  // Form setup
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      shortDescription: "",
      description: "",
      category: "",
      subcategory: "",
      priority: "medium",
      impact: "medium",
      urgency: "medium",
      state: "new",
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

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const submitData = {
        ...data,
        assignedToId: data.assignedToId === "unassigned" ? undefined : data.assignedToId,
        // Ensure beneficiary defaults to caller if not set
        beneficiaryId: data.beneficiaryId || data.callerId,
        beneficiaryType: data.beneficiaryType || data.callerType,
      };
      const response = await apiRequest("POST", "/api/tickets", submitData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    },
  });



  const onSubmit = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description *</FormLabel>
                <FormControl>
                  <Input placeholder="Brief summary of the issue" {...field} />
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
                <FormLabel>Detailed Description *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Detailed description of the problem or request"
                    className="min-h-[100px]"
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
                          form.setValue('customerId', personId);
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
                      value={field.value}
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
                        <SelectValue placeholder="Select agent" />
```text

                      </SelectTrigger>
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
            <input type="hidden" {...field} value={form.watch("shortDescription")} />
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
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket (Old)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">Create New Ticket</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  form.reset();
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </DialogHeader>
            <div className="mt-4">
              <TicketForm />
            </div>
          </DialogContent>
          </Dialog>
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
                  {visibleColumns.map((column: any) => (
                    <TableHead key={column.id} style={{ width: column.width }}>
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-2">Loading tickets...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-gray-500">
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
                ) : tickets.map((ticket: Ticket) => (
                  <TableRow key={ticket.id}>
                    {visibleColumns.map((column: any) => 
                      renderCell(column, ticket)
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Layout principal idêntico ao TicketDetails - sem sidebar direita */}
              <div className="space-y-6">

                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações Básicas</h3>

                    <FormField
                      control={form.control}
                      name="shortDescription"
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
                      name="callerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Solicitante *</FormLabel>
                          <FormControl>
                            <PersonSelector
                              value={field.value}
                              onChange={field.onChange}
                              onTypeChange={(type) => form.setValue('callerType', type)}
                              placeholder="Selecione o solicitante"
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