
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCallback } from "react";

export function useTicketRelationships(ticketId: string) {
  const queryClient = useQueryClient();

  const { data: relationships = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/ticket-relationships", ticketId, "relationships"],
    queryFn: async () => {
      console.log('🔗 [Hook] Fetching relationships for ticket:', ticketId);
      const response = await apiRequest("GET", `/api/ticket-relationships/${ticketId}/relationships`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        return data.data.map((relationship: any) => ({
          id: relationship.targetTicket?.id || relationship.id,
          relationshipId: relationship.id,
          number: relationship.targetTicket?.number || relationship.number || 'N/A',
          subject: relationship.targetTicket?.subject || relationship.subject || 'Sem assunto',
          status: relationship.targetTicket?.status || relationship.status || 'unknown',
          priority: relationship.targetTicket?.priority || relationship.priority || 'medium',
          relationshipType: relationship.relationshipType || relationship.relationship_type || 'related',
          description: relationship.description || '',
          createdAt: relationship.createdAt || relationship.created_at || new Date().toISOString(),
          targetTicket: relationship.targetTicket || {}
        }));
      }
      
      return [];
    },
    enabled: !!ticketId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const invalidateRelationships = useCallback(() => {
    console.log('🔗 [Hook] Invalidating relationships cache for ticket:', ticketId);
    
    // Invalidar múltiplas queries relacionadas
    queryClient.invalidateQueries({ 
      queryKey: ["/api/ticket-relationships", ticketId, "relationships"] 
    });
    
    queryClient.invalidateQueries({ 
      queryKey: ["/api/tickets", ticketId, "relationships"] 
    });
    
    // Forçar refetch imediato
    refetch();
  }, [queryClient, ticketId, refetch]);

  const refreshRelationships = useCallback(async () => {
    console.log('🔗 [Hook] Force refreshing relationships for ticket:', ticketId);
    await refetch();
  }, [refetch, ticketId]);

  return {
    relationships,
    isLoading,
    error,
    invalidateRelationships,
    refreshRelationships,
    refetch
  };
}
