import React, { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  GitBranch,
} from "lucide-react";
import { OptimizedBadge } from "@/components/tickets/OptimizedBadge";
import { RelatedTicketsExpansion } from "./RelatedTicketsExpansion";
import { SlaLed, SlaRealTimeMonitor } from '../SlaLed';

// Types
interface Ticket {
  id: string;
  number: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  company_name?: string;
  caller_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface TicketRelationship {
  relationshipId: string;
  relationshipType: string;
  targetTicket?: {
    id: string;
    number?: string;
    subject: string;
    status: string;
    priority: string;
  };
  id?: string;
  number?: string;
  subject?: string;
  status?: string;
}

interface ResponsiveTicketsTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticketId: string) => void;
  onToggleExpand?: (ticketId: string) => void;
  expandedTickets?: Set<string>;
  ticketsWithRelationships?: Set<string>;
  ticketRelationships?: Record<string, TicketRelationship[]>;
  visibleColumns?: any[];
  columnWidths?: Record<string, number>;
  renderCell?: (ticket: any, key: string) => React.ReactNode;
  TableCellComponent?: React.ComponentType<any>;
  ResizeHandle?: React.ComponentType<any>;
  showColumnSearch?: boolean;
  columnSearchValues?: Record<string, string>;
  onColumnSearchChange?: (columnId: string, value: string) => void;
}

// Loading Skeleton Component
const TicketRowSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
  </TableRow>
);

// Main Component
export const ResponsiveTicketsTable = ({
  tickets = [],
  isLoading = false,
  onEdit,
  onDelete,
  onToggleExpand,
  expandedTickets = new Set(),
  ticketsWithRelationships = new Set(),
  ticketRelationships = {},
  visibleColumns = [],
  showColumnSearch = false,
  columnSearchValues = {},
  onColumnSearchChange,
}: ResponsiveTicketsTableProps) => {
  console.log('🎯 [ResponsiveTicketsTable] Received visibleColumns:', visibleColumns.length, 'columns');
  const { t } = useTranslation();
  // Component loading state
  const isComponentLoading = isLoading || !tickets;

  // Use a local state to manage expanded rows if not provided via props
  const [localExpandedTickets, setLocalExpandedTickets] = useState<Set<string>>(new Set());
  const currentExpandedTickets = expandedTickets.size > 0 ? expandedTickets : localExpandedTickets;
  const handleToggleExpand = (ticketId: string) => {
    if (onToggleExpand) {
      onToggleExpand(ticketId);
    } else {
      setLocalExpandedTickets((prev) => {
        const next = new Set(prev);
        if (next.has(ticketId)) {
          next.delete(ticketId);
        } else {
          next.add(ticketId);
        }
        return next;
      });
    }
  };


  // Use visibleColumns if provided, otherwise use default columns
  const columnsToRender = visibleColumns && visibleColumns.length > 0 
    ? visibleColumns 
    : [
        { id: 'number', label: 'Número' },
        { id: 'subject', label: 'Assunto' },
        { id: 'company', label: 'Empresa' },
        { id: 'customer', label: 'Cliente' },
        { id: 'category', label: t('tickets.category') },
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Prioridade' }
      ];

  console.log('📊 [ResponsiveTicketsTable] Rendering columns:', columnsToRender.map((c: any) => c.id || c.label));

  return (
    <div className="rounded-md border overflow-hidden" role="region" aria-label="Tabela de tickets">
      <Table>
        <TableHeader>
          <TableRow role="row">
            {columnsToRender.map((column: any) => (
              <TableHead key={column.id} className={column.id === 'number' ? 'w-20' : ''} scope="col">
                {column.label}
              </TableHead>
            ))}
            <TableHead className="w-12" scope="col">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
          {showColumnSearch && (
            <TableRow role="row" className="bg-gray-50">
              <TableHead className="w-20 py-2">
                <Input
                  placeholder="Filtrar"
                  value={columnSearchValues['number'] || ''}
                  onChange={(e) => onColumnSearchChange?.('number', e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-column-search-number"
                />
              </TableHead>
              <TableHead className="py-2">
                <Input
                  placeholder="Filtrar"
                  value={columnSearchValues['subject'] || ''}
                  onChange={(e) => onColumnSearchChange?.('subject', e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-column-search-subject"
                />
              </TableHead>
              <TableHead className="hidden lg:table-cell py-2">
                <Input
                  placeholder="Filtrar"
                  value={columnSearchValues['company'] || ''}
                  onChange={(e) => onColumnSearchChange?.('company', e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-column-search-company"
                />
              </TableHead>
              <TableHead className="hidden md:table-cell py-2">
                <Input
                  placeholder="Filtrar"
                  value={columnSearchValues['customer'] || ''}
                  onChange={(e) => onColumnSearchChange?.('customer', e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-column-search-customer"
                />
              </TableHead>
              <TableHead className="hidden lg:table-cell py-2">
                <Input
                  placeholder="Filtrar"
                  value={columnSearchValues['category'] || ''}
                  onChange={(e) => onColumnSearchChange?.('category', e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-column-search-category"
                />
              </TableHead>
              <TableHead className="hidden lg:table-cell py-2">
                <Input
                  placeholder="Filtrar"
                  value={columnSearchValues['status'] || ''}
                  onChange={(e) => onColumnSearchChange?.('status', e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-column-search-status"
                />
              </TableHead>
              <TableHead className="hidden sm:table-cell py-2">
                <Input
                  placeholder="Filtrar"
                  value={columnSearchValues['priority'] || ''}
                  onChange={(e) => onColumnSearchChange?.('priority', e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-column-search-priority"
                />
              </TableHead>
              <TableHead className="w-12 py-2">
                {/* Empty cell for actions column */}
              </TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {isComponentLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TicketRowSkeleton key={i} />)
          ) : tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="text-gray-500">
                  <p>Nenhum ticket encontrado</p>
                  <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => [
              <TableRow
                key={`ticket-${ticket.id}`}
                className="hover:bg-gray-50 transition-colors"
                role="row"
                aria-label={`Ticket ${ticket.number}: ${ticket.subject}`}
              >
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {ticketsWithRelationships.has(ticket.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleExpand(ticket.id)}
                          className="p-1 h-6 w-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                          aria-label={`${currentExpandedTickets.has(ticket.id) ? "Recolher" : "Expandir"} relacionamentos do ticket ${ticket.number}`}
                          title="Expandir/Recolher tickets vinculados"
                        >
                          {currentExpandedTickets.has(ticket.id) ?
                            <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" /> :
                            <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          }
                        </Button>
                      )}
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-mono text-blue-600 hover:text-blue-800 transition-colors"
                        aria-label={`Ver detalhes do ticket ${ticket.number}`}
                      >
                        {ticket.number}
                      </Link>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-0">
                    <div className="truncate">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors block"
                        title={ticket.subject || (ticket as any).description || 'Sem título'}
                      >
                        {ticket.subject || (ticket as any).description?.substring(0, 60) + (((ticket as any).description?.length > 60) ? '...' : '') || 'Sem título'}
                      </Link>
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                    {ticket.company_name || 'N/A'}
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-sm text-gray-600">
                    {ticket.caller_name || 'N/A'}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <OptimizedBadge
                      fieldName="category"
                      value={ticket.category || ''}
                      aria-label={`Categoria: ${ticket.category}`}
                    />
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <OptimizedBadge
                      fieldName="status"
                      value={ticket.status}
                      aria-label={`Status: ${ticket.status}`}
                    />
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <OptimizedBadge
                      fieldName="priority"
                      value={ticket.priority}
                      aria-label={`Prioridade: ${ticket.priority}`}
                    />
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label={`Ações para ticket ${ticket.number}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tickets/${ticket.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(ticket)} className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(ticket.id)} className="flex items-center gap-2 text-red-600">
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
              </TableRow>,

              /* Expanded relationships - using RelatedTicketsExpansion component for real data */
              currentExpandedTickets.has(ticket.id) && (
                <TableRow key={`relationships-${ticket.id}`} className="bg-blue-50">
                  <TableCell colSpan={9} className="p-0">
                    <RelatedTicketsExpansion ticketId={ticket.id} />
                  </TableCell>
                </TableRow>
              )
            ].filter(Boolean)
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResponsiveTicketsTable;