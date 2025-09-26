import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationDiagnostic() {
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["diagnostic-users"],
    queryFn: () => apiRequest('GET', '/api/user-management/users/notifications'),
  });

  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: ["diagnostic-groups"],
    queryFn: () => apiRequest('GET', '/api/user-management/groups/notifications'),
  });

  return (
    <Card className="mt-4 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-sm">🔍 Diagnóstico de Notificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Usuários:</strong>
          {usersLoading && <span className="text-blue-600"> Carregando...</span>}
          {usersError && <span className="text-red-600"> Erro: {String(usersError)}</span>}
          {usersData && (
            <span className="text-green-600">
              {' '}✓ {usersData.success ? `${usersData.data?.length || 0} usuários carregados` : 'Falha na API'}
            </span>
          )}
        </div>
        <div>
          <strong>Grupos:</strong>
          {groupsLoading && <span className="text-blue-600"> Carregando...</span>}
          {groupsError && <span className="text-red-600"> Erro: {String(groupsError)}</span>}
          {groupsData && (
            <span className="text-green-600">
              {' '}✓ {groupsData.success ? `${groupsData.data?.length || 0} grupos carregados` : 'Falha na API'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}