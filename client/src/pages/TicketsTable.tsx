import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Eye, Link, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TicketEdit from './TicketEdit';
import TicketLinkingModal from '@/components/tickets/TicketLinkingModal';
import { useTenantId } from '@/hooks/useTenantId';
import { useAuth } from '@/hooks/useAuth';

interface Ticket {
  id: string;
  number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  customer_id?: string;
  satisfaction?: number;
}

interface TicketRelationship {
  id: string;
  relationshipType: string;
  description?: string;
  targetTicket: {
    id: string;
    subject: string;
    status: string;
    priority: string;
    number: string;
  };
}

interface BatchRelationshipsResponse {
  success: boolean;
  data: Record<string, TicketRelationship[]>;
  message: string;
}

const TicketsTable = () => {
  const { token } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [ticketsWithRelationships, setTicketsWithRelationships] = useState<Set<string>>(new Set());

  // Fetch tickets with optimized query
  const { data: ticketsData, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ['tickets', tenantId, searchTerm],
    queryFn: async () => {
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/tickets${searchParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    },
    enabled: !!token && !!tenantId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  const tickets = ticketsData?.data?.tickets || [];

  // Batch fetch relationships for all tickets
  const { data: relationshipsData, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['ticket-relationships-batch', tickets.map((t: Ticket) => t.id)],
    queryFn: async (): Promise<BatchRelationshipsResponse> => {
      if (tickets.length === 0) {
        return { success: true, data: {}, message: 'No tickets to process' };
      }

      const ticketIds = tickets.map((t: Ticket) => t.id);
      const response = await fetch('/api/tickets/batch-relationships', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ticketIds })
      });

      if (!response.ok) {
        console.warn('Batch relationships failed, falling back to individual requests');
        return { success: true, data: {}, message: 'Fallback mode' };
      }

      return response.json();
    },
    enabled: !!token && !!tenantId && tickets.length > 0,
    staleTime: 300000, // 5 minutes for relationships
    retry: 1, // Only retry once for batch requests
  });

  // Update tickets with relationships when data changes
  useEffect(() => {
    if (relationshipsData?.success && relationshipsData.data) {
      const ticketsWithRels = new Set<string>();
      Object.entries(relationshipsData.data).forEach(([ticketId, relationships]) => {
        if (Array.isArray(relationships) && relationships.length > 0) {
          ticketsWithRels.add(ticketId);
        }
      });
      setTicketsWithRelationships(ticketsWithRels);
      console.log(`🎯 Batch loaded relationships for ${ticketsWithRels.size} tickets`);
    }
  }, [relationshipsData]);

  // Memoized filtered tickets for performance
  const filteredTickets = useMemo(() => {
    if (!searchTerm) return tickets;

    const term = searchTerm.toLowerCase();
    return tickets.filter((ticket: Ticket) =>
      ticket.subject?.toLowerCase().includes(term) ||
      ticket.number?.toLowerCase().includes(term) ||
      ticket.status?.toLowerCase().includes(term) ||
      ticket.priority?.toLowerCase().includes(term)
    );
  }, [tickets, searchTerm]);

  // Debounced search
  const debouncedSearch = useCallback(
    (value: string) => {
      const timeoutId = setTimeout(() => {
        setSearchTerm(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    []
  );

  // Priority color mapping with memoization
  const getPriorityColor = useMemo(() => {
    const colorMap: Record<string, string> = {
      'critical': 'bg-red-100 text-red-800 border-red-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };

    return (priority: string) => colorMap[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  // Status color mapping with memoization
  const getStatusColor = useMemo(() => {
    const colorMap: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800 border-blue-200',
      'novo': 'bg-blue-100 text-blue-800 border-blue-200',
      'open': 'bg-green-100 text-green-800 border-green-200',
      'aberto': 'bg-green-100 text-green-800 border-green-200',
      'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'em_andamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'resolved': 'bg-purple-100 text-purple-800 border-purple-200',
      'resolvido': 'bg-purple-100 text-purple-800 border-purple-200',
      'closed': 'bg-gray-100 text-gray-800 border-gray-200',
      'fechado': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (status: string) => colorMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

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
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['ticket-relationships-batch'] });
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
            {relationshipsLoading && <span className="ml-2 text-sm text-blue-600">(Carregando relacionamentos...)</span>}
          </p>
        </div>
        <Button onClick={() => {/* Add new ticket logic */}}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número, assunto, status ou prioridade..."
            className="pl-10"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Performance Stats */}
      {relationshipsData && (
        <div className="flex gap-4 text-sm text-gray-600">
          <span>📊 {tickets.length} tickets carregados</span>
          <span>🔗 {ticketsWithRelationships.size} com relacionamentos</span>
          <span>⚡ Carregamento otimizado: {relationshipsLoading ? 'Processando...' : 'Concluído'}</span>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Relacionamentos</TableHead>
                <TableHead>Satisfação</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket: Ticket) => (
                <TableRow key={ticket.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{ticket.number}</TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticketsWithRelationships.has(ticket.id) ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Link className="h-3 w-3 mr-1" />
                        Relacionado
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.satisfaction ? `${ticket.satisfaction}/5` : '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTicket(ticket)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkTicket(ticket)}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
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
          {selectedTicket && (
            <TicketEdit
              ticketId={selectedTicket.id}
              onSuccess={handleModalClose}
            />
          )}
        </DialogContent>
      </Dialog>

      <TicketLinkingModal
        isOpen={isLinkModalOpen}
        onClose={handleModalClose}
        ticketId={selectedTicket?.id}
        ticketNumber={selectedTicket?.number}
      />
    </div>
  );
};

export default TicketsTable;