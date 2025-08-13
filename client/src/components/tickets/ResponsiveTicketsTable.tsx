import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { MoreHorizontal, Eye, Edit, Trash2, ChevronDown, ChevronRight, GitBranch } from "lucide-react";
import { DynamicBadge } from "@/components/DynamicBadge";
import { useComponentLoading } from "@/components/LoadingStateManager";
import { AccessibilityIndicator } from "@/components/AccessibilityIndicator";
import { useFieldColors } from "@/hooks/useFieldColors";

interface ResponsiveTicketsTableProps {
  tickets: any[];
  isLoading: boolean;
  onEdit: (ticket: any) => void;
  onDelete: (ticketId: string) => void;
  onToggleExpand?: (ticketId: string) => void;
  expandedTickets?: Set<string>;
  ticketRelationships?: Record<string, any[]>;
  ticketsWithRelationships?: Set<string>;
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
}

// Enhanced skeleton with proper loading states
const TicketRowSkeleton: React.FC = () => (
  <TableRow className="animate-pulse" role="row" aria-label="Carregando ticket">
    <TableCell className="w-20">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </TableCell>
    <TableCell>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </TableCell>
    <TableCell className="hidden md:table-cell">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </TableCell>
    <TableCell className="hidden lg:table-cell">
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
    </TableCell>
    <TableCell className="hidden lg:table-cell">
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
    </TableCell>
    <TableCell className="hidden sm:table-cell">
      <div className="h-6 bg-gray-200 rounded-full w-18"></div>
    </TableCell>
    <TableCell>
      <div className="h-8 bg-gray-200 rounded w-8"></div>
    </TableCell>
  </TableRow>
);

// Mobile card view for better responsiveness
const MobileTicketCard: React.FC<{ 
  ticket: any; 
  onEdit: (ticket: any) => void; 
  onDelete: (ticketId: string) => void;
  hasRelationships?: boolean;
  onToggleExpand?: (ticketId: string) => void;
  isExpanded?: boolean;
}> = ({ ticket, onEdit, onDelete, hasRelationships, onToggleExpand, isExpanded }) => {
  const { getFieldColor, isLoading: isFieldColorsLoading } = useFieldColors();

  return (
    <Card className="mb-4 border-l-4" style={{ borderLeftColor: getFieldColor('priority', ticket.priority) || '#6b7280' }}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with ticket number and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link 
                href={`/tickets/${ticket.id}`}
                className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                aria-label={`Ver detalhes do ticket ${ticket.number || ticket.id?.slice(0, 8)}`}
              >
                #{ticket.number || ticket.id?.slice(0, 8)}
              </Link>
              {hasRelationships && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpand?.(ticket.id)}
                  className="p-1 h-6 w-6"
                  aria-label={isExpanded ? "Recolher relacionamentos" : "Expandir relacionamentos"}
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Ações para ticket ${ticket.number || ticket.id?.slice(0, 8)}`}>
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
          </div>

          {/* Title and description */}
          <div>
            <h3 className="font-medium text-sm mb-1 line-clamp-2">
              {ticket.subject || ticket.short_description || "Sem título"}
            </h3>
            {ticket.description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {ticket.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
              </p>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <DynamicBadge
              fieldName="priority"
              value={ticket.priority}
              className="text-xs"
              aria-label={`Prioridade: ${ticket.priority}`}
            >
              {ticket.priority}
            </DynamicBadge>
            <DynamicBadge
              fieldName="status"
              value={ticket.status}
              className="text-xs"
              aria-label={`Status: ${ticket.status}`}
            >
              {ticket.status}
            </DynamicBadge>
            {ticket.category && (
              <DynamicBadge
                fieldName="category"
                value={ticket.category}
                className="text-xs"
                aria-label={`Categoria: ${ticket.category}`}
              >
                {ticket.category}
              </DynamicBadge>
            )}
          </div>

          {/* Company, Customer and dates */}
          <div className="text-xs text-gray-500 space-y-1">
            {ticket.company_name && (
              <div><span className="font-medium">Empresa:</span> {ticket.company_name}</div>
            )}
            {ticket.beneficiary_name && (
              <div><span className="font-medium">Beneficiário:</span> {ticket.beneficiary_name}</div>
            )}
            {ticket.caller_name && ticket.caller_name !== ticket.beneficiary_name && (
              <div><span className="font-medium">Cliente:</span> {ticket.caller_name}</div>
            )}
            <div><span className="font-medium">Criado:</span> {new Date(ticket.created_at).toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ResponsiveTicketsTable: React.FC<ResponsiveTicketsTableProps> = ({
  tickets,
  isLoading,
  onEdit,
  onDelete,
  onToggleExpand,
  expandedTickets = new Set(),
  ticketRelationships = {},
  ticketsWithRelationships = new Set(),
  columnOrder = [],
  columnWidths = {}
}) => {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const { isLoading: isComponentLoading, setComponentLoading } = useComponentLoading('tickets-table');
  const { isReady: isFieldColorsReady } = useFieldColors();

  // Listen for window resize
  React.useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync loading states
  React.useEffect(() => {
    setComponentLoading(isLoading || !isFieldColorsReady);
  }, [isLoading, isFieldColorsReady, setComponentLoading]);

  // Mobile view rendering
  if (isMobileView) {
    return (
      <div className="space-y-4" role="region" aria-label="Lista de tickets (visualização móvel)">
        {isComponentLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-6"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex gap-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          tickets.map((ticket) => (
            <MobileTicketCard
              key={ticket.id}
              ticket={ticket}
              onEdit={onEdit}
              onDelete={onDelete}
              hasRelationships={ticketsWithRelationships.has(ticket.id)}
              onToggleExpand={onToggleExpand}
              isExpanded={expandedTickets.has(ticket.id)}
            />
          ))
        )}
      </div>
    );
  }

  // Desktop table view
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
            tickets.map((ticket) => (
              <React.Fragment key={ticket.id}>
                <TableRow 
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
                          className="p-0 h-4 w-4"
                          aria-label={expandedTickets.has(ticket.id) ? "Recolher relacionamentos" : "Expandir relacionamentos"}
                        >
                          {expandedTickets.has(ticket.id) ? 
                            <ChevronDown className="h-3 w-3" /> : 
                            <ChevronRight className="h-3 w-3" />
                          }
                        </Button>
                      )}
                      <Link 
                        href={`/tickets/${ticket.id}`}
                        className="font-mono text-blue-600 hover:text-blue-800 hover:underline transition-colors"
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
                        className="font-medium hover:text-blue-600 transition-colors"
                        aria-label={`Ver detalhes do ticket: ${ticket.subject}`}
                      >
                        {ticket.subject || ticket.short_description || "Sem título"}
                      </Link>
                      {ticket.description && (
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {ticket.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">
                      {ticket.company_name || "Empresa não informada"}
                    </span>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      <div className="font-medium">
                        {ticket.beneficiary_name || "Beneficiário não identificado"}
                      </div>
                      {ticket.caller_name && ticket.caller_name !== ticket.beneficiary_name && (
                        <div className="text-xs text-gray-500 mt-1">
                          Cliente: {ticket.caller_name}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    {ticket.category ? (
                      <DynamicBadge
                        fieldName="category"
                        value={ticket.category}
                        aria-label={`Categoria: ${ticket.category}`}
                      >
                        {ticket.category}
                      </DynamicBadge>
                    ) : (
                      <span className="text-gray-400">Não categorizado</span>
                    )}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <DynamicBadge
                      fieldName="status"
                      value={ticket.status}
                      aria-label={`Status: ${ticket.status}`}
                    >
                      {ticket.status}
                    </DynamicBadge>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <DynamicBadge
                      fieldName="priority"
                      value={ticket.priority}
                      aria-label={`Prioridade: ${ticket.priority}`}
                    >
                      {ticket.priority}
                    </DynamicBadge>
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
                </TableRow>

                {/* Expanded relationships */}
                {expandedTickets.has(ticket.id) && ticketRelationships[ticket.id] && (
                  <TableRow className="bg-blue-50">
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
                              <DynamicBadge 
                                fieldName="status" 
                                value={rel.targetTicket?.status || rel.status} 
                                className="text-xs"
                              >
                                {rel.targetTicket?.status || rel.status}
                              </DynamicBadge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};