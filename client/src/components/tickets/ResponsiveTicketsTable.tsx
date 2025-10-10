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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
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
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (columnId: string, direction: 'asc' | 'desc') => void;
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
  sortColumn,
  sortDirection,
  onSortChange,
}: ResponsiveTicketsTableProps) => {
  console.log('🎯 [ResponsiveTicketsTable] Received visibleColumns:', visibleColumns.length, 'columns');
  const { t } = useTranslation();
  // Component loading state
  const isComponentLoading = isLoading || !tickets;

  // Use a local state to manage expanded rows if not provided via props
  const [localExpandedTickets, setLocalExpandedTickets] = useState<Set<string>>(new Set());
  
  // Estado local temporário para valores de pesquisa (atualiza visualmente)
  const [tempSearchValues, setTempSearchValues] = useState<Record<string, string>>({});
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
            <TableRow role="row" className="bg-gray-50 dark:bg-gray-800">
              {columnsToRender.map((column: any) => {
                const columnId = column.id || column.label?.toLowerCase().replace(/\s+/g, '_');
                const isActiveSort = sortColumn === columnId;
                
                return (
                  <TableHead key={`search-${columnId}`} className="py-2">
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Filtrar (pressione Enter)"
                        value={tempSearchValues[columnId] ?? columnSearchValues[columnId] ?? ''}
                        onChange={(e) => {
                          setTempSearchValues(prev => ({
                            ...prev,
                            [columnId]: e.target.value
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = e.currentTarget.value;
                            onColumnSearchChange?.(columnId, value);
                            // Limpa o valor temporário após executar a pesquisa
                            setTempSearchValues(prev => {
                              const newValues = { ...prev };
                              delete newValues[columnId];
                              return newValues;
                            });
                          }
                        }}
                        className="h-8 text-sm flex-1"
                        data-testid={`input-column-search-${columnId}`}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`button-sort-${columnId}`}
                          >
                            {isActiveSort ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4 text-blue-600" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-blue-600" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onSortChange?.(columnId, 'asc')}
                            className="cursor-pointer"
                          >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Crescente
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onSortChange?.(columnId, 'desc')}
                            className="cursor-pointer"
                          >
                            <ArrowDown className="h-4 w-4 mr-2" />
                            Decrescente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                );
              })}
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
                {columnsToRender.map((column: any, idx: number) => {
                  const columnId = column.id || column.label?.toLowerCase().replace(/\s+/g, '_');
                  
                  // Render cell based on column type
                  switch (columnId) {
                    case 'number':
                    case 'ticketNumber':
                    case 'ticketnumber':
                      return (
                        <TableCell key={columnId} className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            {columnId === 'number' && ticketsWithRelationships.has(ticket.id) && (
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
                              {ticket.number || `#${ticket.id.slice(-8)}`}
                            </Link>
                          </div>
                        </TableCell>
                      );

                    case 'subject':
                      return (
                        <TableCell key={columnId} className="max-w-0">
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
                      );

                    case 'company':
                      return (
                        <TableCell key={columnId} className="text-sm text-gray-600">
                          {ticket.company_name || (ticket as any).company_display_name || 'N/A'}
                        </TableCell>
                      );

                    case 'customer':
                    case 'caller':
                      return (
                        <TableCell key={columnId} className="text-sm text-gray-600">
                          {ticket.caller_name || (ticket as any).customer_name || 'N/A'}
                        </TableCell>
                      );

                    case 'category':
                      return (
                        <TableCell key={columnId}>
                          <OptimizedBadge
                            fieldName="category"
                            value={ticket.category || ''}
                            aria-label={`Categoria: ${ticket.category}`}
                          />
                        </TableCell>
                      );

                    case 'status':
                      return (
                        <TableCell key={columnId}>
                          <OptimizedBadge
                            fieldName="status"
                            value={ticket.status}
                            aria-label={`Status: ${ticket.status}`}
                          />
                        </TableCell>
                      );

                    case 'priority':
                      return (
                        <TableCell key={columnId}>
                          <OptimizedBadge
                            fieldName="priority"
                            value={ticket.priority}
                            aria-label={`Prioridade: ${ticket.priority}`}
                          />
                        </TableCell>
                      );

                    case 'created':
                    case 'created_at':
                      return (
                        <TableCell key={columnId} className="text-sm">
                          {(ticket.created_at || (ticket as any).createdAt)
                            ? new Date(ticket.created_at || (ticket as any).createdAt).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </TableCell>
                      );

                    case 'updated':
                    case 'updated_at':
                      return (
                        <TableCell key={columnId} className="text-sm">
                          {(ticket.updated_at || (ticket as any).updatedAt)
                            ? new Date(ticket.updated_at || (ticket as any).updatedAt).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </TableCell>
                      );

                    case 'description':
                      return (
                        <TableCell key={columnId} className="max-w-xs">
                          <div className="truncate" title={(ticket as any).description}>
                            {(ticket as any).description?.substring(0, 50) || '-'}
                          </div>
                        </TableCell>
                      );

                    case 'assigned_to':
                      return (
                        <TableCell key={columnId} className="text-sm">
                          {(ticket as any).assigned_to_name || 'Não atribuído'}
                        </TableCell>
                      );

                    default:
                      // For any other column, try to display the value
                      const value = (ticket as any)[columnId] || (ticket as any)[column.id] || '-';
                      return (
                        <TableCell key={columnId} className="text-sm">
                          {value?.toString() || '-'}
                        </TableCell>
                      );
                  }
                })}

                {/* Actions column - always shown */}
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
                  <TableCell colSpan={columnsToRender.length + 1} className="p-0">
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