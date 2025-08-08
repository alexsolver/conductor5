
import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { DynamicBadge } from '@/components/DynamicBadge';

interface TicketTableRowProps {
  ticket: any;
  onViewTicket: (id: string) => void;
}

export const TicketTableRow = React.memo(({ ticket, onViewTicket }: TicketTableRowProps) => {
  const handleRowClick = React.useCallback(() => {
    onViewTicket(ticket.id);
  }, [ticket.id, onViewTicket]);

  const handleViewClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewTicket(ticket.id);
  }, [ticket.id, onViewTicket]);

  return (
    <TableRow 
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleRowClick}
    >
      <TableCell className="font-medium">
        {ticket.number}
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="truncate" title={ticket.subject}>
          {ticket.subject}
        </div>
      </TableCell>
      <TableCell>
        <DynamicBadge 
          fieldName="status" 
          value={ticket.status} 
        />
      </TableCell>
      <TableCell>
        <DynamicBadge 
          fieldName="priority" 
          value={ticket.priority} 
        />
      </TableCell>
      <TableCell>
        {ticket.customer_name || 'N/A'}
      </TableCell>
      <TableCell>
        {ticket.assigned_to_name || 'Não atribuído'}
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewClick}
          className="hover:bg-blue-50"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

TicketTableRow.displayName = 'TicketTableRow';
