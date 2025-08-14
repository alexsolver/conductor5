import React, { useState } from "react";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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

// Types
interface Ticket {
  id: string;
  number?: string;
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
}: ResponsiveTicketsTableProps) => {
  // Component loading state
  const isComponentLoading = isLoading || !tickets;

  return (
    <div className="rounded-md border overflow-hidden" role="region" aria-label="Tabela de tickets">
      <Table>
        <TableHeader>
          <TableRow role="row">
            <TableHead className="w-20" scope="col">Número</TableHead>
            <TableHead scope="col">Assunto</TableHead>
            <TableHead className="hidden lg:table-cell" scope="col">Empresa</TableHead>
            <TableHead className="hidden md:table-cell" scope="col">Cliente</TableHead>
            <TableHead className="hidden lg:table-cell" scope="col">Categoria</TableHead>
            <TableHead className="hidden lg:table-cell" scope="col">Status</TableHead>
            <TableHead className="hidden sm:table-cell" scope="col">Prioridade</TableHead>
            <TableHead className="w-12" scope="col">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
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
                aria-label={`Ticket ${ticket.number || ticket.id?.slice(0, 8)}: ${ticket.subject}`}
              >
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {ticketsWithRelationships.has(ticket.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleExpand?.(ticket.id)}
                          className="p-1 h-6 w-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                          aria-label={expandedTickets.has(ticket.id) ? "Recolher relacionamentos" : "Expandir relacionamentos"}
                          title="Expandir/Recolher tickets vinculados"
                        >
                          {expandedTickets.has(ticket.id) ?
                            <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" /> :
                            <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          }
                        </Button>
                      )}
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-mono text-blue-600 hover:text-blue-800 transition-colors"
                        aria-label={`Ver detalhes do ticket ${ticket.number || ticket.id?.slice(0, 8)}`}
                      >
                        #{ticket.number || ticket.id?.slice(0, 8)}
                      </Link>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-0">
                    <div className="truncate">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors block"
                        title={ticket.subject}
                      >
                        {ticket.subject}
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
                      value={ticket.category}
                      ariaLabel={`Categoria: ${ticket.category}`}
                    />
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <OptimizedBadge
                      fieldName="status"
                      value={ticket.status}
                      ariaLabel={`Status: ${ticket.status}`}
                    />
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <OptimizedBadge
                      fieldName="priority"
                      value={ticket.priority}
                      ariaLabel={`Prioridade: ${ticket.priority}`}
                    />
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label={`Ações para ticket ${ticket.number || ticket.id?.slice(0, 8)}`}
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
              
              /* Expanded relationships */
              expandedTickets.has(ticket.id) && ticketRelationships[ticket.id] && (
                <TableRow key={`relationships-${ticket.id}`} className="bg-blue-50">
                  <TableCell colSpan={8}>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Relacionamentos</span>
                      </div>
                      <div className="space-y-1">
                        {ticketRelationships[ticket.id].map((rel: any) => (
                          <div key={rel.relationshipId} className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500">{rel.relationshipType}:</span>
                            <Link
                              href={`/tickets/${rel.targetTicket?.id || rel.id}`}
                              className="font-mono text-blue-600 hover:underline"
                            >
                              #{rel.targetTicket?.number || rel.number}
                            </Link>
                            <span className="truncate">{rel.targetTicket?.subject || rel.subject}</span>
                            <OptimizedBadge
                              fieldName="status"
                              value={rel.targetTicket?.status || rel.status}
                              className="text-xs"
                              ariaLabel={`Status: ${rel.targetTicket?.status || rel.status}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
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