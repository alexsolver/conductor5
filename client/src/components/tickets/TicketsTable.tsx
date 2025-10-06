import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Plus } from "lucide-react";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useFieldColors } from "@/hooks/useFieldColors";

interface TicketData {
  id: string;
  number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  company_name?: string;
  caller_name?: string;
  customer_name?: string;
}

interface TicketsTableProps {
  tickets: TicketData[];
  onCreateTicket: () => void;
}

// Status mapping - manter valores em inglês conforme banco de dados 
const statusMapping: Record<string, string> = {
  'new': 'new',
  'open': 'open', 
  'in_progress': 'in_progress',
  'in progress': 'in_progress',
  'resolved': 'resolved',
  'closed': 'closed',
  'cancelled': 'cancelled'
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

// Funções de mapeamento
const mapStatusValue = (value: string): string => {
  if (!value) return 'new';
  return statusMapping[value.toLowerCase()] || value;
};

const mapPriorityValue = (value: string): string => {
  if (!value) return 'medium';
  return priorityMapping[value.toLowerCase()] || value;
};

const mapCategoryValue = (value: string): string => {
  if (!value || value === null || value === 'null' || value === '' || typeof value !== 'string') {
    return 'suporte_tecnico';
  }
  const mapped = categoryMapping[value.toLowerCase()] || 'suporte_tecnico';
  return mapped;
};

export function TicketsTable({ tickets, onCreateTicket }: TicketsTableProps) {
  const [, navigate] = useLocation();
  const { getFieldLabel } = useFieldColors();
  
  // Column filters state
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState({
    number: "",
    subject: "",
    status: "",
    priority: "",
    category: "",
    caller: ""
  });

  // Filter tickets based on column filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesNumber = !columnFilters.number || 
      (ticket.number && ticket.number.toString().toLowerCase().includes(columnFilters.number.toLowerCase())) ||
      ticket.id.toLowerCase().includes(columnFilters.number.toLowerCase());
    const matchesSubject = !columnFilters.subject || 
      (ticket.subject && ticket.subject.toLowerCase().includes(columnFilters.subject.toLowerCase()));
    const matchesStatus = !columnFilters.status || 
      ticket.status === columnFilters.status;
    const matchesPriority = !columnFilters.priority || 
      ticket.priority === columnFilters.priority;
    const matchesCategory = !columnFilters.category || 
      (getFieldLabel('category', ticket.category).toLowerCase().includes(columnFilters.category.toLowerCase()));
    const matchesCaller = !columnFilters.caller || 
      (ticket.caller_name && ticket.caller_name.toLowerCase().includes(columnFilters.caller.toLowerCase())) ||
      (ticket.customer_name && ticket.customer_name.toLowerCase().includes(columnFilters.caller.toLowerCase()));
    
    return matchesNumber && matchesSubject && matchesStatus && matchesPriority && matchesCategory && matchesCaller;
  });

  return (
    <>
      {/* Botão de Pesquisa */}
      <div className="mb-4 flex justify-end relative z-10">
        <Button
          variant={showColumnFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowColumnFilters(!showColumnFilters)}
          className="shadow-md"
          data-testid="button-toggle-column-filters"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showColumnFilters ? "Ocultar Pesquisa" : "Pesquisar"}
        </Button>
      </div>

      {/* Tabela de Tickets */}
      <Card>
        <CardContent className="p-0">
          {Array.isArray(tickets) && tickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <div className="font-semibold">Número</div>
                    {showColumnFilters && (
                      <Input
                        placeholder="Filtrar..."
                        value={columnFilters.number}
                        onChange={(e) => setColumnFilters({...columnFilters, number: e.target.value})}
                        className="h-8 mt-2"
                        data-testid="filter-number"
                      />
                    )}
                  </TableHead>
                  <TableHead>
                    <div className="font-semibold">Assunto</div>
                    {showColumnFilters && (
                      <Input
                        placeholder="Filtrar..."
                        value={columnFilters.subject}
                        onChange={(e) => setColumnFilters({...columnFilters, subject: e.target.value})}
                        className="h-8 mt-2"
                        data-testid="filter-subject"
                      />
                    )}
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <div className="font-semibold">Empresa</div>
                  </TableHead>
                  <TableHead className="w-[130px]">
                    <div className="font-semibold">Status</div>
                    {showColumnFilters && (
                      <Select 
                        value={columnFilters.status} 
                        onValueChange={(value) => setColumnFilters({...columnFilters, status: value})}
                      >
                        <SelectTrigger className="h-8 mt-2" data-testid="filter-status">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="open">Aberto</SelectItem>
                          <SelectItem value="in_progress">Em Progresso</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableHead>
                  <TableHead className="w-[130px]">
                    <div className="font-semibold">Prioridade</div>
                    {showColumnFilters && (
                      <Select 
                        value={columnFilters.priority} 
                        onValueChange={(value) => setColumnFilters({...columnFilters, priority: value})}
                      >
                        <SelectTrigger className="h-8 mt-2" data-testid="filter-priority">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas</SelectItem>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <div className="font-semibold">Categoria</div>
                    {showColumnFilters && (
                      <Input
                        placeholder="Filtrar..."
                        value={columnFilters.category}
                        onChange={(e) => setColumnFilters({...columnFilters, category: e.target.value})}
                        className="h-8 mt-2"
                        data-testid="filter-category"
                      />
                    )}
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <div className="font-semibold">Solicitante</div>
                    {showColumnFilters && (
                      <Input
                        placeholder="Filtrar..."
                        value={columnFilters.caller}
                        onChange={(e) => setColumnFilters({...columnFilters, caller: e.target.value})}
                        className="h-8 mt-2"
                        data-testid="filter-caller"
                      />
                    )}
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id} 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    data-testid={`ticket-row-${ticket.id}`}
                  >
                    <TableCell className="font-medium">
                      #{ticket.number || ticket.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>{ticket.subject || 'Sem título'}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {ticket.company_name || '-'}
                    </TableCell>
                    <TableCell>
                      <DynamicBadge 
                        fieldName="status" 
                        value={mapStatusValue(ticket.status)}
                        showIcon={true}
                        size="sm"
                      >
                        {getFieldLabel('status', ticket.status || 'open')}
                      </DynamicBadge>
                    </TableCell>
                    <TableCell>
                      <DynamicBadge 
                        fieldName="priority" 
                        value={mapPriorityValue(ticket.priority)}
                        showIcon={true}
                        size="sm"
                      >
                        {getFieldLabel('priority', ticket.priority || 'medium')}
                      </DynamicBadge>
                    </TableCell>
                    <TableCell>
                      <DynamicBadge 
                        fieldName="category" 
                        value={mapCategoryValue(ticket.category)}
                        showIcon={false}
                        size="sm"
                      >
                        {getFieldLabel('category', ticket.category || 'suporte_tecnico')}
                      </DynamicBadge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {ticket.caller_name || ticket.customer_name || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tickets/${ticket.id}`);
                        }}
                        data-testid={`button-view-${ticket.id}`}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">📋 Nenhum ticket encontrado</div>
                <p className="text-sm mb-4">Não há tickets para exibir no momento.</p>
                <Button 
                  onClick={onCreateTicket}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Ticket
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
