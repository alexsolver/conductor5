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
  userId: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
  location?: string;
  isManualEntry?: boolean;
  status?: string;
  totalHours?: string;
  createdAt?: string;
  updatedAt?: string;
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

// Função para transformar dados do frontend para backend
const transformTimecardData = (frontendData: any) => {
  const now = new Date().toISOString();
  const payload: any = {
    isManualEntry: frontendData.deviceType !== 'web',
    notes: frontendData.notes
  };

  // Adicionar apenas o campo relevante baseado no tipo de registro
  switch (frontendData.recordType) {
    case 'clock_in':
      payload.checkIn = now;
      break;
    case 'clock_out':
      payload.checkOut = now;
      break;
    case 'break_start':
      payload.breakStart = now;
      break;
    case 'break_end':
      payload.breakEnd = now;
      break;
  }

  // Adicionar localização se disponível
  if (frontendData.location) {
    payload.location = JSON.stringify(frontendData.location);
  }

  return payload;
};

export default function Timecard() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus>({
    status: 'not_started',
    todayRecords: [],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obter status atual
  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['/api/timecard/current-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/current-status');
      const data = await response.json();
      return data;
    },
    enabled: true,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Atualizar estado local quando dados chegarem
  useEffect(() => {
    if (statusData) {
      console.log('[TIMECARD-DEBUG] Status data received:', statusData);
      setCurrentStatus(statusData);
    }
  }, [statusData]);

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

  // Mutation para registrar ponto
  const recordMutation = useMutation({
    mutationFn: async (data: { recordType: string; deviceType: string; location?: any; notes?: string }) => {
      // Transformar dados do frontend para formato backend
      const transformedData = transformTimecardData(data);
      console.log('[TIMECARD-DEBUG] Sending data:', transformedData);
      const response = await apiRequest('POST', '/api/timecard/timecard-entries', transformedData);
      const result = await response.json();
      console.log('[TIMECARD-DEBUG] Response:', result);
      return result;
    },
    onSuccess: (result: TimeRecord) => {
      console.log('Registro de ponto bem-sucedido:', result);
      toast({
        title: 'Ponto registrado com sucesso!',
        description: 'Seu registro foi salvo e processado.',
      });
      // Invalidar cache para atualizar dados automaticamente
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/current-status'] });
    },
    onError: (error: any) => {
      console.error('Erro ao registrar ponto:', error);
      let errorMessage = 'Tente novamente em alguns instantes.';
      
      // Tentar extrair mensagem de erro específica
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Erro ao registrar ponto',
        description: errorMessage,
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

  const getNextAction = (status: string, todayRecords: TimeRecord[] = []) => {
    // Verificar último registro do dia para determinar ação correta
    const lastRecord = todayRecords?.[todayRecords.length - 1];
    
    if (!lastRecord) {
      return { type: 'clock_in', label: 'Registrar Entrada', color: 'bg-green-600' };
    }
    
    // Se há saída registrada, pode registrar nova entrada
    if (lastRecord.checkOut && !lastRecord.checkIn) {
      return { type: 'clock_in', label: 'Registrar Nova Entrada', color: 'bg-green-600' };
    }
    
    // Se há entrada mas não saída, pode registrar saída
    if (lastRecord.checkIn && !lastRecord.checkOut) {
      return { type: 'clock_out', label: 'Registrar Saída', color: 'bg-red-600' };
    }
    
    // Se tem entrada e saída no último registro, nova entrada
    if (lastRecord.checkIn && lastRecord.checkOut) {
      return { type: 'clock_in', label: 'Registrar Nova Entrada', color: 'bg-green-600' };
    }
    
    // Padrão: registrar entrada
    return { type: 'clock_in', label: 'Registrar Entrada', color: 'bg-green-600' };
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    try {
      return format(new Date(dateString), 'HH:mm', { locale: ptBR });
    } catch (error) {
      console.warn('Error formatting time:', dateString, error);
      return '--:--';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--/----';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return '--/--/----';
    }
  };



  const status = currentStatus?.status || 'not_started';
  const nextAction = getNextAction(status, currentStatus?.todayRecords);

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
          {statusLoading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-pulse">Carregando registros...</div>
            </div>
          ) : statusError ? (
            <div className="text-center text-red-500 py-8">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar registros
              </div>
              <div className="text-sm mt-2">Tente recarregar a página</div>
            </div>
          ) : currentStatus?.todayRecords?.length > 0 ? (
            <div className="space-y-3">
              {currentStatus.todayRecords
                .sort((a, b) => {
                  // Ordenar por data de criação, mais recente primeiro
                  const dateA = new Date(a.createdAt || a.checkIn || a.checkOut || a.breakStart || a.breakEnd);
                  const dateB = new Date(b.createdAt || b.checkIn || b.checkOut || b.breakStart || b.breakEnd);
                  return dateB.getTime() - dateA.getTime();
                })
                .map((record: TimeRecord) => (
                <div key={record.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <div className="font-medium">
                      {record.checkIn && 'Entrada'}
                      {record.checkOut && 'Saída'}
                      {record.breakStart && 'Início da Pausa'}
                      {record.breakEnd && 'Fim da Pausa'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Status: {record.status || 'pending'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">
                      {formatTime(record.checkIn || record.checkOut || record.breakStart || record.breakEnd || record.createdAt)}
                    </div>
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
              <div className="mb-2">📝</div>
              <div className="font-medium">Nenhum registro para hoje</div>
              <div className="text-sm mt-1">
                Registre seu primeiro ponto do dia usando o botão acima
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status e Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horas Trabalhadas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8h 30m</div>
            <p className="text-xs text-gray-500">Meta: 8h</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Banco de Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+2h 15m</div>
            <p className="text-xs text-gray-500">Saldo positivo</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">OK</div>
            <p className="text-xs text-gray-500">CLT conforme</p>
          </CardContent>
        </Card>
      </div>

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