
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TicketTemplate } from '@/components/TicketTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: [`/api/tickets/${id}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tickets/${id}`);
      const data = await response.json();
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Erro ao carregar detalhes do chamado</p>
            <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Detalhes do Chamado</h1>
      </div>

      <TicketTemplate ticket={ticket} />
    </div>
  );
}
