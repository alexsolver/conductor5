import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, Eye, Edit, Link2, MoreHorizontal, Filter, Search, Plus } from "lucide-react";
import { Link } from "wouter";
import { TicketViewSelector } from "@/components/TicketViewSelector";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useFieldColors } from "@/hooks/useFieldColors";
import { apiRequest } from "@/lib/queryClient";

export default function TicketsTable() {
  // Estado básico
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedViewId, setSelectedViewId] = useState("all");
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [ticketRelationships, setTicketRelationships] = useState<Record<string, any[]>>({});
  
  // Estado de redimensionamento
  const [columnWidths, setColumnWidths] = useState({
    number: 120,
    subject: 200,
    status: 110,
    priority: 110,
    category: 120,
    client: 180,
    date: 110
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  // Hooks
  const { getFieldColor, getFieldLabel } = useFieldColors();

  // Buscar tickets
  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      return response.json();
    },
    retry: false
  });

  const tickets = ticketsResponse?.success ? ticketsResponse.data?.tickets || [] : [];

  // Buscar clientes para enriquecer dados dos tickets
  const { data: customersResponse } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers");
      return response.json();
    },
    enabled: tickets.length > 0
  });

  const customers = customersResponse?.customers || customersResponse?.data || [];
  
  // Criar mapa de clientes para busca rápida
  const customersMap = useMemo(() => {
    const map = new Map();
    customers.forEach((customer: any) => {
      map.set(customer.id, customer);
    });
    return map;
  }, [customers]);

  // Enriquecer tickets com dados dos clientes
  const enrichedTickets = useMemo(() => {
    return tickets.map((ticket: any) => ({
      ...ticket,
      customer: ticket.customer_id ? customersMap.get(ticket.customer_id) : null
    }));
  }, [tickets, customersMap]);

  // Função de redimensionamento
  const handleMouseDown = useCallback((e: React.MouseEvent, column: string) => {
    console.log(`🖱️ Starting resize for column: ${column}`);
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizingColumn(column);
    
    const startX = e.clientX;
    const startWidth = columnWidths[column as keyof typeof columnWidths];
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(80, startWidth + diff);
      console.log(`🔄 Resizing ${column}: ${newWidth}px`);
      
      setColumnWidths(prev => ({
        ...prev,
        [column]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      console.log(`✅ Resize completed for column: ${column}`);
      setIsResizing(false);
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  // Função de expansão
  const toggleTicketExpansion = useCallback(async (ticketId: string) => {
    console.log(`🔄 Toggling expansion for ticket: ${ticketId}`);
    
    const isExpanded = expandedTickets.has(ticketId);
    
    if (isExpanded) {
      setExpandedTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
      console.log(`📦 Collapsed ticket: ${ticketId}`);
    } else {
      setExpandedTickets(prev => new Set(prev.add(ticketId)));
      console.log(`📂 Expanded ticket: ${ticketId}`);
      
      // Buscar relacionamentos
      if (!ticketRelationships[ticketId]) {
        try {
          const response = await apiRequest("GET", `/api/tickets/${ticketId}/relationships`);
          const data = await response.json();
          
          if (data && Array.isArray(data) && data.length > 0) {
            setTicketRelationships(prev => ({
              ...prev,
              [ticketId]: data
            }));
            console.log(`✅ Loaded ${data.length} relationships for ticket: ${ticketId}`);
          }
        } catch (error) {
          console.error(`Error fetching relationships for ticket ${ticketId}:`, error);
        }
      }
    }
  }, [expandedTickets, ticketRelationships]);

  // Filtrar tickets
  const filteredTickets = useMemo(() => {
    return enrichedTickets.filter((ticket: any) => {
      const matchesSearch = !searchTerm || 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [enrichedTickets, searchTerm, statusFilter, priorityFilter]);

  // Identificar tickets com relacionamentos (simulado para teste)
  const ticketsWithRelationships = useMemo(() => {
    // Para teste, vamos assumir que alguns tickets têm relacionamentos
    const ticketIds = enrichedTickets.map((t: any) => t.id);
    return new Set(ticketIds.slice(0, 3)); // Primeiros 3 tickets têm relacionamentos
  }, [enrichedTickets]);

  if (isLoading) {
    return <div className="p-6">Carregando tickets...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <div className="flex items-center gap-4">
          <Link href="/tickets/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Ticket
            </Button>
          </Link>
          <TicketViewSelector />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por número ou assunto..."
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

        <Button variant="outline" onClick={() => {
          setSearchTerm("");
          setStatusFilter("all");
          setPriorityFilter("all");
        }}>
          <Filter className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: columnWidths.number }} className="relative group">
                  <div className="flex items-center justify-between pr-2">
                    <span>Número</span>
                    <div 
                      className="w-2 h-6 bg-gray-300 hover:bg-gray-400 cursor-col-resize rounded"
                      onMouseDown={(e) => handleMouseDown(e, 'number')}
                      title="Arraste para redimensionar"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: columnWidths.subject }} className="relative group">
                  <div className="flex items-center justify-between pr-2">
                    <span>Assunto</span>
                    <div 
                      className="w-2 h-6 bg-gray-300 hover:bg-gray-400 cursor-col-resize rounded"
                      onMouseDown={(e) => handleMouseDown(e, 'subject')}
                      title="Arraste para redimensionar"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: columnWidths.status }} className="relative group">
                  <div className="flex items-center justify-between pr-2">
                    <span>Status</span>
                    <div 
                      className="w-2 h-6 bg-gray-300 hover:bg-gray-400 cursor-col-resize rounded"
                      onMouseDown={(e) => handleMouseDown(e, 'status')}
                      title="Arraste para redimensionar"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: columnWidths.priority }} className="relative group">
                  <div className="flex items-center justify-between pr-2">
                    <span>Prioridade</span>
                    <div 
                      className="w-2 h-6 bg-gray-300 hover:bg-gray-400 cursor-col-resize rounded"
                      onMouseDown={(e) => handleMouseDown(e, 'priority')}
                      title="Arraste para redimensionar"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: columnWidths.category }} className="relative group">
                  <div className="flex items-center justify-between pr-2">
                    <span>Categoria</span>
                    <div 
                      className="w-2 h-6 bg-gray-300 hover:bg-gray-400 cursor-col-resize rounded"
                      onMouseDown={(e) => handleMouseDown(e, 'category')}
                      title="Arraste para redimensionar"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: columnWidths.client }} className="relative group">
                  <div className="flex items-center justify-between pr-2">
                    <span>Cliente</span>
                    <div 
                      className="w-2 h-6 bg-gray-300 hover:bg-gray-400 cursor-col-resize rounded"
                      onMouseDown={(e) => handleMouseDown(e, 'client')}
                      title="Arraste para redimensionar"
                    />
                  </div>
                </TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket: any) => (
                <TableRow key={ticket.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {ticketsWithRelationships.has(ticket.id) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleTicketExpansion(ticket.id)}
                          className="h-6 w-6 p-0 hover:bg-blue-100"
                        >
                          {expandedTickets.has(ticket.id) ? (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-blue-600" />
                          )}
                        </Button>
                      )}
                      <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                        {ticket.number}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="truncate" title={ticket.subject}>
                        {ticket.subject}
                      </div>
                      {/* Relacionamentos expandidos */}
                      {expandedTickets.has(ticket.id) && ticketRelationships[ticket.id] && (
                        <div className="mt-2 p-3 bg-blue-50 rounded border-l-4 border-blue-200">
                          <div className="text-xs font-semibold text-blue-800 mb-2">Tickets relacionados:</div>
                          {ticketRelationships[ticket.id].map((rel: any, index: number) => (
                            <div key={rel.id || index} className="flex items-center gap-2 text-xs text-blue-700 py-1">
                              <span className="font-mono bg-blue-100 px-1 rounded">{rel.targetTicket?.number || `REL-${index + 1}`}</span>
                              <span className="text-gray-600">({rel.relationshipType || 'relacionado'})</span>
                              <span className="truncate">{rel.targetTicket?.subject || 'Ticket relacionado'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DynamicBadge 
                      fieldName="status"
                      value={ticket.status || 'new'}
                      colorHex={getFieldColor('status', ticket.status || 'new') || '#6b7280'}
                    >
                      {getFieldLabel('status', ticket.status || 'new') || ticket.status || 'Novo'}
                    </DynamicBadge>
                  </TableCell>
                  <TableCell>
                    <DynamicBadge 
                      fieldName="priority"
                      value={ticket.priority || 'medium'}
                      colorHex={getFieldColor('priority', ticket.priority || 'medium') || '#6b7280'}
                    >
                      {getFieldLabel('priority', ticket.priority || 'medium') || ticket.priority || 'Média'}
                    </DynamicBadge>
                  </TableCell>
                  <TableCell>
                    <DynamicBadge 
                      fieldName="category"
                      value={ticket.category || 'suporte_tecnico'}
                      colorHex={getFieldColor('category', ticket.category || 'suporte_tecnico') || '#6b7280'}
                    >
                      {getFieldLabel('category', ticket.category || 'suporte_tecnico') || ticket.category || 'Suporte Técnico'}
                    </DynamicBadge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {ticket.customer ? (
                        <div>
                          <div className="font-medium">
                            {ticket.customer.fullName || 
                             `${ticket.customer.firstName || ''} ${ticket.customer.lastName || ''}`.trim() ||
                             ticket.customer.email ||
                             'Cliente'}
                          </div>
                          {ticket.customer.email && ticket.customer.email !== (ticket.customer.fullName || `${ticket.customer.firstName || ''} ${ticket.customer.lastName || ''}`.trim()) && (
                            <div className="text-xs text-gray-500">{ticket.customer.email}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Cliente não encontrado</span>
                      )}
                    </div>
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
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
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
      
      {filteredTickets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum ticket encontrado com os filtros selecionados.
        </div>
      )}
    </div>
  );
}