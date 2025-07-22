import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, MoreHorizontal, Edit, Eye, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  callerId: string;
  callerType: 'user' | 'customer';
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function TicketsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch tickets
  const { data: ticketsData, isLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: () => apiRequest('GET', '/api/tickets'),
  });

  const tickets = (ticketsData as any)?.tickets || [];

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket: Ticket) => {
      const matchesSearch = 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${ticket.customer_first_name || ''} ${ticket.customer_last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent": 
      case "critical": 
        return "bg-red-100 text-red-800 border-red-200";
      case "high": 
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": 
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": 
        return "bg-green-100 text-green-800 border-green-200";
      default: 
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open": 
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": 
      case "in progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "resolved": 
        return "bg-green-100 text-green-800 border-green-200";
      case "closed": 
        return "bg-gray-100 text-gray-800 border-gray-200";
      default: 
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with filters - inspired by the image */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Filter buttons like in the image */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Todos os Chamados</span>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                Nova visualização
              </Button>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                <Filter className="h-4 w-4 mr-1" />
                Editar visualização
              </Button>
            </div>
            
            <div className="flex-1" />
            
            {/* Action buttons like in the image */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Listagem</span>
              <Button variant="outline" size="sm" className="bg-red-500 hover:bg-red-600 text-white border-red-500">
                Buscar
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500">
                Nova Chamada
              </Button>
              <Button variant="outline" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500">
                Editar
              </Button>
              <Button variant="outline" size="sm" className="bg-green-500 hover:bg-green-600 text-white border-green-500">
                Ações Múltiplas
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table - inspired by the image layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableHead className="w-20">Identificação</TableHead>
              <TableHead className="w-40">Data de criação</TableHead>
              <TableHead className="flex-1">Resumo</TableHead>
              <TableHead className="w-32">Ambiente</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24">Situação</TableHead>
              <TableHead className="w-24">Prioridade</TableHead>
              <TableHead className="w-32">Status SLA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Carregando chamados...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Nenhum chamado encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedTickets.map((ticket: Ticket, index: number) => (
                <TableRow 
                  key={ticket.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => navigate(`/tickets/edit/${ticket.id}`)}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {21867 + index}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{formatDate(ticket.createdAt)}</div>
                    <div className="text-gray-500">{formatTime(ticket.createdAt)}</div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-medium truncate">
                      {ticket.subject}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {ticket.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>LANGUAGE</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${getStatusColor(ticket.status)} text-xs px-2 py-1 rounded-full font-medium`}
                    >
                      {ticket.status === 'open' ? 'Aberto' :
                       ticket.status === 'in_progress' ? 'Em Andamento' :
                       ticket.status === 'resolved' ? 'Concluído' :
                       ticket.status === 'closed' ? 'Fechado' : ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">-</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${getPriorityColor(ticket.priority)} text-xs px-2 py-1 rounded-full font-medium`}
                    >
                      {ticket.priority === 'high' ? 'Média' :
                       ticket.priority === 'medium' ? 'Baixa' :
                       ticket.priority === 'low' ? 'Baixa' :
                       ticket.priority === 'urgent' ? 'Crítica' : ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">-</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination like in the image */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Exibindo 1 até {Math.min(itemsPerPage, filteredTickets.length)} de {filteredTickets.length} linhas
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage.toString()} onValueChange={(value) => console.log(value)}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700 dark:text-gray-300">registros por página</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <span className="text-sm text-gray-500">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="h-8 w-8 p-0"
                >
                  {totalPages}
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}