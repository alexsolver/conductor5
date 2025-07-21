import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Play, Pause, Square, Timer, CalendarDays, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistance, format, formatDuration, intervalToDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Journey {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'completed';
  location?: string;
  notes?: string;
  totalHours?: number;
  breakMinutes?: number;
  overtimeHours?: number;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface JourneyCheckpoint {
  id: string;
  journeyId: string;
  type: 'check_in' | 'check_out' | 'break_start' | 'break_end' | 'location_update';
  timestamp: string;
  location?: string;
  notes?: string;
}

interface JourneyMetrics {
  totalWorkingHours: number;
  breakHours: number;
  overtimeHours: number;
  productivity: number;
  distanceTraveled?: number;
  ticketsCompleted: number;
  customerVisits: number;
}

export default function JourneyControl() {
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar jornada ativa do usuário
  const { data: currentJourney, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['/api/journey/current'],
  });

  // Query para buscar histórico de jornadas
  const { data: journeyHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/journey/history'],
  });

  // Query para buscar métricas do dia
  const { data: todayMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['/api/journey/metrics/today'],
  });

  // Mutation para iniciar jornada
  const startJourneyMutation = useMutation({
    mutationFn: (data: { location?: string; notes?: string }) =>
      apiRequest('POST', '/api/journey/start', data),
    onSuccess: () => {
      toast({
        title: 'Jornada iniciada',
        description: 'Sua jornada de trabalho foi iniciada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/history'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao iniciar jornada',
        variant: 'destructive',
      });
    },
  });

  // Mutation para pausar jornada
  const pauseJourneyMutation = useMutation({
    mutationFn: (data: { location?: string; notes?: string }) =>
      apiRequest('POST', '/api/journey/pause', data),
    onSuccess: () => {
      toast({
        title: 'Jornada pausada',
        description: 'Sua jornada foi pausada. Lembre-se de retomar quando voltar.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/current'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao pausar jornada',
        variant: 'destructive',
      });
    },
  });

  // Mutation para retomar jornada
  const resumeJourneyMutation = useMutation({
    mutationFn: (data: { location?: string; notes?: string }) =>
      apiRequest('POST', '/api/journey/resume', data),
    onSuccess: () => {
      toast({
        title: 'Jornada retomada',
        description: 'Sua jornada foi retomada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/current'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao retomar jornada',
        variant: 'destructive',
      });
    },
  });

  // Mutation para finalizar jornada
  const endJourneyMutation = useMutation({
    mutationFn: (data: { location?: string; notes?: string }) =>
      apiRequest('POST', '/api/journey/end', data),
    onSuccess: () => {
      toast({
        title: 'Jornada finalizada',
        description: 'Sua jornada foi finalizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/metrics/today'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao finalizar jornada',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar localização
  const updateLocationMutation = useMutation({
    mutationFn: (data: { location: string; notes?: string }) =>
      apiRequest('POST', '/api/journey/location', data),
    onSuccess: () => {
      toast({
        title: 'Localização atualizada',
        description: 'Sua localização foi atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/journey/current'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar localização',
        variant: 'destructive',
      });
    },
  });

  // Obter localização atual
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.warn('Erro ao obter localização:', error);
        }
      );
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Ativa</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 text-white">Pausada</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500 text-white">Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDurationFromHours = (hours: number) => {
    const duration = intervalToDuration({ start: 0, end: hours * 60 * 60 * 1000 });
    return formatDuration(duration, { locale: ptBR });
  };

  const getElapsedTime = (startTime: string) => {
    if (!startTime) return '--:--';
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return '--:--';
    const now = new Date();
    const duration = intervalToDuration({ start, end: now });
    return formatDuration(duration, { locale: ptBR });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de Jornadas</h1>
      </div>

      {/* Status da Jornada Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Jornada Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCurrent ? (
            <div>Carregando...</div>
          ) : currentJourney ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusBadge(currentJourney.status)}
                  <span className="text-sm text-gray-600">
                    Iniciada em {currentJourney.startTime ? format(new Date(currentJourney.startTime), 'HH:mm', { locale: ptBR }) : '--:--'}
                  </span>
                  <span className="font-medium">
                    Tempo decorrido: {getElapsedTime(currentJourney.startTime)}
                  </span>
                </div>
              </div>

              {currentJourney.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {currentJourney.location}
                </div>
              )}

              <div className="flex gap-2">
                {currentJourney.status === 'active' && (
                  <>
                    <Button
                      onClick={() => pauseJourneyMutation.mutate({ location: currentLocation })}
                      disabled={pauseJourneyMutation.isPending}
                      variant="outline"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                    <Button
                      onClick={() => endJourneyMutation.mutate({ location: currentLocation })}
                      disabled={endJourneyMutation.isPending}
                      variant="destructive"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Finalizar
                    </Button>
                  </>
                )}
                {currentJourney.status === 'paused' && (
                  <Button
                    onClick={() => resumeJourneyMutation.mutate({ location: currentLocation })}
                    disabled={resumeJourneyMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}
                <Button
                  onClick={() => updateLocationMutation.mutate({ location: currentLocation })}
                  disabled={updateLocationMutation.isPending}
                  variant="outline"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Atualizar Localização
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mb-4">
                <Clock className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">Nenhuma jornada ativa</p>
              <Button
                onClick={() => startJourneyMutation.mutate({ location: currentLocation })}
                disabled={startJourneyMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Jornada
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas do Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMetrics ? (
            <div>Carregando métricas...</div>
          ) : todayMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatDurationFromHours(todayMetrics.totalWorkingHours || 0)}
                </div>
                <div className="text-sm text-gray-600">Horas Trabalhadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((todayMetrics.breakHours || 0) * 60)}min
                </div>
                <div className="text-sm text-gray-600">Tempo de Pausa</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {todayMetrics.ticketsCompleted || 0}
                </div>
                <div className="text-sm text-gray-600">Tickets Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {todayMetrics.customerVisits || 0}
                </div>
                <div className="text-sm text-gray-600">Visitas a Clientes</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-600">
              Nenhuma métrica disponível para hoje
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Jornadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div>Carregando histórico...</div>
          ) : journeyHistory && journeyHistory.length > 0 ? (
            <div className="space-y-3">
              {journeyHistory.slice(0, 10).map((journey: Journey) => (
                <div key={journey.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(journey.status)}
                    <div>
                      <div className="font-medium">
                        {format(new Date(journey.startTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        {journey.endTime && (
                          <span className="text-gray-600">
                            {' '}- {format(new Date(journey.endTime), 'HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      {journey.location && (
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {journey.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {journey.totalHours && (
                      <div className="font-medium">
                        {formatDurationFromHours(journey.totalHours)}
                      </div>
                    )}
                    {journey.status === 'active' && (
                      <div className="text-sm text-green-600">Em andamento</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600">
              Nenhuma jornada encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}