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
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus>({
    status: 'not_started',
    todayRecords: [],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obter status atual
  const { data: statusData } = useQuery({
    queryKey: ['/api/timecard/current-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/current-status');
      return await response.json();
    },
    enabled: true,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Atualizar estado local quando dados chegarem
  useEffect(() => {
    if (statusData) {
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
      const response = await apiRequest('POST', '/api/timecard/records', data);
      return await response.json();
    },
    onSuccess: (result) => {
      console.log('Registro de ponto bem-sucedido:', result);
      toast({
        title: 'Ponto registrado com sucesso!',
        description: 'Seu registro foi salvo e processado.',
      });
      // Atualizar status baseado no tipo de registro
      setCurrentStatus(prev => {
        let newStatus = prev.status;
        if (result.recordType === 'clock_in') {
          newStatus = 'working';
        } else if (result.recordType === 'break_start') {
          newStatus = 'on_break';
        } else if (result.recordType === 'break_end') {
          newStatus = 'working';
        } else if (result.recordType === 'clock_out') {
          newStatus = 'finished';
        }
        return {
          ...prev,
          status: newStatus,
          todayRecords: [...prev.todayRecords, result]
        };
      });
      // Invalidar cache para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/timecard/current-status'] });
    },
    onError: (error) => {
      console.error('Erro ao registrar ponto:', error);
      toast({
        title: 'Erro ao registrar ponto',
        description: error.message || 'Tente novamente em alguns instantes.',
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



  const status = currentStatus?.status || 'not_started';
  const nextAction = getNextAction(status);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de Jornadas - Registro de Ponto</h1>
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