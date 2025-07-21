import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, AlertTriangle, FileText, Calendar, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimeRecord {
  id: string;
  recordDateTime: string;
  recordType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  deviceType: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

interface CurrentStatus {
  status: 'not_started' | 'working' | 'on_break' | 'finished';
  todayRecords: TimeRecord[];
  timesheet?: any;
  lastRecord?: TimeRecord;
}

interface TimeAlert {
  id: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  createdAt: string;
}

export default function Timecard() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obter localização do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
        },
        (error) => {
          setLocationError('Não foi possível obter a localização');
          console.warn('Erro ao obter localização:', error);
        }
      );
    }
  }, []);

  // Buscar status atual
  const { data: currentStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/timecard/users/550e8400-e29b-41d4-a716-446655440001/status'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar alertas ativos
  const { data: alerts } = useQuery({
    queryKey: ['/api/timecard/alerts'],
    queryParams: { userId: '550e8400-e29b-41d4-a716-446655440001' },
  });

  // Mutation para registrar ponto
  const recordMutation = useMutation({
    mutationFn: async (data: { recordType: string; deviceType: string; location?: any; notes?: string }) => {
      return await apiRequest('POST', '/api/timecard/records', data);
    },
    onSuccess: () => {
      toast({
        title: 'Ponto registrado com sucesso!',
        description: 'Seu registro foi salvo e processado.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/users/550e8400-e29b-41d4-a716-446655440001/status'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar ponto',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    },
  });

  const handleTimeRecord = async (recordType: string) => {
    const locationData = location ? {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: undefined, // Poderia usar reverse geocoding aqui
    } : undefined;

    recordMutation.mutate({
      recordType,
      deviceType: 'web',
      location: locationData,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-500">Trabalhando</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-500">Em pausa</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500">Finalizado</Badge>;
      default:
        return <Badge variant="outline">Não iniciado</Badge>;
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'not_started':
        return { type: 'clock_in', label: 'Registrar Entrada', color: 'bg-green-600' };
      case 'working':
        return { type: 'break_start', label: 'Iniciar Pausa', color: 'bg-yellow-600' };
      case 'on_break':
        return { type: 'break_end', label: 'Finalizar Pausa', color: 'bg-blue-600' };
      default:
        return { type: 'clock_out', label: 'Registrar Saída', color: 'bg-red-600' };
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (statusLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const status = currentStatus?.status || 'not_started';
  const nextAction = getNextAction(status);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Registro de Ponto</h1>
        {getStatusBadge(status)}
      </div>

      {/* Card Principal - Registrar Ponto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registro de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-mono">
              {format(new Date(), 'HH:mm:ss', { locale: ptBR })}
            </div>
            <div className="text-gray-500">
              {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              Localização capturada: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </div>
          )}

          {locationError && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              {locationError}
            </div>
          )}

          <Button
            className={`w-full ${nextAction.color} hover:opacity-90 text-white`}
            size="lg"
            onClick={() => handleTimeRecord(nextAction.type)}
            disabled={recordMutation.isPending}
          >
            {recordMutation.isPending ? 'Registrando...' : nextAction.label}
          </Button>
        </CardContent>
      </Card>

      {/* Registros de Hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registros de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStatus?.todayRecords?.length > 0 ? (
            <div className="space-y-3">
              {currentStatus.todayRecords.map((record: TimeRecord) => (
                <div key={record.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <div className="font-medium">
                      {record.recordType === 'clock_in' && 'Entrada'}
                      {record.recordType === 'clock_out' && 'Saída'}
                      {record.recordType === 'break_start' && 'Início da Pausa'}
                      {record.recordType === 'break_end' && 'Fim da Pausa'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Dispositivo: {record.deviceType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{formatTime(record.recordDateTime)}</div>
                    {record.location && (
                      <div className="text-xs text-gray-400">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Geo localizado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum registro encontrado para hoje
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas Ativos */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert: TimeAlert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'high' ? 'text-orange-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{alert.title}</div>
                    {alert.description && (
                      <div className="text-sm text-gray-600 mt-1">{alert.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {formatDate(alert.createdAt)}
                    </div>
                  </div>
                  <Badge variant={
                    alert.severity === 'critical' ? 'destructive' :
                    alert.severity === 'high' ? 'destructive' : 'secondary'
                  }>
                    {alert.severity === 'critical' ? 'Crítico' :
                     alert.severity === 'high' ? 'Alto' :
                     alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="font-medium">Espelho de Ponto</div>
            <div className="text-sm text-gray-500">Ver registros mensais</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="font-medium">Banco de Horas</div>
            <div className="text-sm text-gray-500">Saldo e movimentações</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="font-medium">Relatórios</div>
            <div className="text-sm text-gray-500">Análises e compliance</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}