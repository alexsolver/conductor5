import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link2, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { OptimizedBadge } from './OptimizedBadge';

interface RelatedTicketsExpansionProps {
  ticketId: string;
}

interface RelatedTicket {
  id: string;
  number?: string;
  subject?: string;
  status?: string;
  priority?: string;
  relationshipType?: string;
  relationship_type?: string;
  targetTicket?: {
    id: string;
    number?: string;
    subject?: string;
    status?: string;
    priority?: string;
  };
}

export function RelatedTicketsExpansion({ ticketId }: RelatedTicketsExpansionProps) {
  // Fetch real related tickets data from API
  const { data: relatedTicketsData, isLoading, error } = useQuery({
    queryKey: ['/api/ticket-relationships', ticketId, 'relationships'],
    queryFn: async () => {
      console.log('🔗 [RELATED-TICKETS] Fetching relationships for ticket:', ticketId);
      const response = await apiRequest('GET', `/api/ticket-relationships/${ticketId}/relationships`);
      const data = await response.json();
      console.log('🔗 [RELATED-TICKETS] API response:', data);
      return data;
    },
    enabled: !!ticketId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Tickets Vinculados
        </h4>
        <div className="text-center py-4 text-gray-500 text-sm">
          Carregando tickets vinculados...
        </div>
      </div>
    );
  }

  if (error) {
    console.error('🔗 [RELATED-TICKETS] Error fetching relationships:', error);
    return (
      <div className="p-4 bg-gray-50 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Tickets Vinculados
        </h4>
        <div className="text-center py-4 text-red-500 text-sm">
          Erro ao carregar tickets vinculados: {error.message}
        </div>
      </div>
    );
  }

  // Add comprehensive debugging
  if (relatedTicketsData) {
    console.log('🔗 [RELATED-TICKETS] Full API response debug:', {
      dataType: typeof relatedTicketsData,
      isArray: Array.isArray(relatedTicketsData),
      keys: Object.keys(relatedTicketsData || {}),
      data: relatedTicketsData,
      dataProperty: relatedTicketsData?.data,
      relationshipsProperty: relatedTicketsData?.relationships,
      resultsProperty: relatedTicketsData?.results
    });
  }

  // Extract relationships from API response with better error handling
  let relationships = [];

  if (relatedTicketsData) {
    console.log('🔗 [RELATED-TICKETS] Raw data structure:', relatedTicketsData);

    // Try different possible data structures
    relationships = relatedTicketsData.data ||
                   relatedTicketsData.relationships ||
                   relatedTicketsData.results ||
                   (Array.isArray(relatedTicketsData) ? relatedTicketsData : []);
  }

  console.log('🔗 [RELATED-TICKETS] Processing relationships:', {
    hasData: !!relatedTicketsData,
    relationships,
    relationshipsLength: relationships.length || 0,
    firstRelationship: relationships[0] || null
  });

  return (
    <div className="p-4 bg-gray-50 border-t">
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4" />
        Tickets Vinculados ({relationships.length})
      </h4>

      {relationships.length > 0 ? (
        <div className="space-y-2">
          {relationships.map((rel: RelatedTicket, index: number) => {
            console.log('🔗 [RELATED-TICKETS] Processing relationship item:', rel);

            // Extract ticket data with improved fallbacks following 1qa.md patterns
            const relatedTicket = rel.targetTicket || rel.relatedTicket || rel;

            // ✅ [1QA-COMPLIANCE] Critical fix: Use actual ticket data, not relationship ID
            const ticketId = rel.relatedTicketId ||
                           rel.targetTicketId ||
                           relatedTicket.id ||
                           rel.target_ticket_id ||
                           rel.source_ticket_id;

            const ticketNumber = rel.relatedTicketNumber ||
                               rel.targetTicketNumber ||
                               relatedTicket.number ||
                               rel.number ||
                               rel.target_ticket_number ||
                               rel.source_ticket_number ||
                               `T-${String(ticketId || '').slice(0, 8) || 'UNKNOWN'}`;

            const ticketSubject = rel.relatedTicketSubject ||
                                rel.targetTicketSubject ||
                                relatedTicket.subject ||
                                rel.subject ||
                                rel.target_ticket_subject ||
                                rel.source_ticket_subject ||
                                'Ticket relacionado';

            const ticketStatus = rel.relatedTicketStatus ||
                               rel.targetTicketStatus ||
                               relatedTicket.status ||
                               rel.status ||
                               rel.target_ticket_status ||
                               rel.source_ticket_status ||
                               'open';

            const ticketPriority = rel.relatedTicketPriority ||
                                 rel.targetTicketPriority ||
                                 relatedTicket.priority ||
                                 rel.priority ||
                                 rel.target_ticket_priority ||
                                 rel.source_ticket_priority ||
                                 'medium';

            const relationshipType = rel.relationshipType ||
                                   rel.relationship_type ||
                                   rel.type ||
                                   'related';

            // Map relationship types to Portuguese following 1qa.md
            const getRelationshipLabel = (type: string) => {
              const typeMap: Record<string, string> = {
                'related': 'Relacionado',
                'blocks': 'Bloqueia',
                'blocked_by': 'Bloqueado por',
                'duplicates': 'Duplica',
                'duplicated_by': 'Duplicado por',
                'depends_on': 'Depende de',
                'dependency_of': 'Dependência de',
                'parent_child': 'Pai de',
                'child_parent': 'Filho de',
                'parent_of': 'Pai de',
                'child_of': 'Filho de',
                'follows': 'Segue',
                'precedes': 'Precede',
                'outgoing': 'Relacionado',
                'incoming': 'Relacionado'
              };
              return typeMap[type?.toLowerCase()] || type || 'Relacionado';
            };

            console.log('🔗 [RELATED-TICKETS] Rendering relationship:', {
              index,
              rel,
              relatedTicket,
              ticketId,
              ticketNumber,
              ticketSubject,
              ticketStatus,
              ticketPriority,
              relationshipType,
              finalData: {
                ticketId,
                ticketNumber,
                ticketSubject,
                ticketStatus,
                ticketPriority,
                relationshipType
              }
            });

            // Skip if we don't have minimum required data
            if (!ticketId && !ticketNumber) {
              console.warn('🔗 [RELATED-TICKETS] Skipping relationship due to missing data:', rel);
              return null;
            }

            return (
              <div
                key={`rel-${rel.id || relatedTicket.id || ticketId || index}`}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                    {getRelationshipLabel(relationshipType)}
                  </span>
                  <Link
                    href={`/tickets/${ticketId}`}
                    className="font-mono text-blue-600 hover:underline font-medium whitespace-nowrap"
                  >
                    #{ticketNumber}
                  </Link>
                  <span className="text-sm text-gray-700 truncate flex-1" title={ticketSubject}>
                    {ticketSubject}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <OptimizedBadge
                    fieldName="status"
                    value={ticketStatus}
                    className="text-xs"
                    aria-label={`Status: ${ticketStatus}`}
                  />
                  <OptimizedBadge
                    fieldName="priority"
                    value={ticketPriority}
                    className="text-xs"
                    aria-label={`Prioridade: ${ticketPriority}`}
                  />
                  <Link
                    href={`/tickets/${ticketId}`}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Abrir ticket"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          }).filter(Boolean)}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          Nenhum ticket vinculado encontrado
        </div>
      )}
    </div>
  );
}