import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
import { useLocalization } from '@/hooks/useLocalization';
  GitBranch, 
  ChevronRight, 
  Plus,
  ExternalLink
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  number?: string;
  hierarchyLevel: number;
  parentTicketId?: string;
  rootTicketId?: string;
}

interface TicketHierarchyViewProps {
  ticketId: string;
  onCreateChild?: (parentId: string) => void;
  onViewTicket?: (ticketId: string) => void;
}

export default function TicketHierarchyView({
  const { t } = useLocalization();
 
  ticketId, 
  onCreateChild, 
  onViewTicket 
}: TicketHierarchyViewProps) {
  const { data: hierarchy = [] } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", ticketId, "hierarchy"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/hierarchy`);
      return response.json();
    },
  });

  if (hierarchy.length === 0) {
    return null;
  }

  const renderTicketNode = (ticket: Ticket, children: Ticket[] = []) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'critical': return 'bg-red-100 text-red-800 border-red-200';
        case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
        case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div key={ticket.id} className="space-y-2">
        <Card className={`${ticket.id === ticketId ? 'ring-2 ring-blue-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {ticket.hierarchyLevel > 0 && (
                    <div className="flex items-center text-gray-400">
                      {Array.from({ length: ticket.hierarchyLevel }).map((_, i) => (
                        <ChevronRight key={i} className="h-4 w-4" />
                      ))}
                    </div>
                  )}
                  <GitBranch className="h-4 w-4 text-gray-500" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">
                      {ticket.number || ticket.id.slice(0, 8)}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(ticket.priority)}
                    >
                      {ticket.priority}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(ticket.status)}
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {ticket.subject}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onViewTicket && ticket.id !== ticketId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewTicket(ticket.id)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                
                {onCreateChild && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateChild(ticket.id)}
                    title={t('tickets.criarChamadoFilho')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render children */}
        {children.length > 0 && (
          <div className="ml-6 space-y-2">
            {children.map(child => {
              const grandChildren = hierarchy.filter(t => t.parentTicketId === child.id);
              return renderTicketNode(child, grandChildren);
            })}
          </div>
        )}
      </div>
    );
  };

  // Build hierarchy tree
  const rootTickets = hierarchy.filter(t => t.hierarchyLevel === 0);
  const buildTree = (parentId?: string) => {
    return hierarchy.filter(t => t.parentTicketId === parentId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <GitBranch className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Hierarquia de Chamados</h3>
      </div>

      <div className="space-y-2">
        {rootTickets.map(root => {
          const children = buildTree(root.id);
          return renderTicketNode(root, children);
        })}
      </div>
    </div>
  );
}