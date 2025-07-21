
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { Clock, MapPin, Play, Pause, Square, Coffee, Navigation } from 'lucide-react';

interface Journey {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  totalHours?: number;
  breakMinutes?: number;
  overtimeHours?: number;
}

interface JourneyCheckpoint {
  id: string;
  type: 'check_in' | 'check_out' | 'break_start' | 'break_end' | 'location_update';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

export default function JourneyManagement() {
  const [currentJourney, setCurrentJourney] = useState<Journey | null>(null);
  const [journeyHistory, setJourneyHistory] = useState<Journey[]>([]);
  const [checkpoints, setCheckpoints] = useState<JourneyCheckpoint[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentJourney();
    loadJourneyHistory();
  }, []);

  const loadCurrentJourney = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/journey/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentJourney(data.journey);
      }
    } catch (error) {
      console.error('Erro ao carregar jornada atual:', error);
    }
  };

  const loadJourneyHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/journey/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJourneyHistory(data.journeys || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const startJourney = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/journey/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          notes
        })
      });

      if (response.ok) {
        toast({
          title: "Jornada iniciada",
          description: "Sua jornada de trabalho foi iniciada com sucesso!",
        });
        loadCurrentJourney();
        setNotes('');
      } else {
        throw new Error('Erro ao iniciar jornada');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a jornada. Verifique suas permissões de localização.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pauseJourney = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/journey/pause', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        toast({
          title: "Jornada pausada",
          description: "Sua jornada foi pausada com sucesso!",
        });
        loadCurrentJourney();
        setNotes('');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível pausar a jornada.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resumeJourney = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/journey/resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          notes
        })
      });

      if (response.ok) {
        toast({
          title: "Jornada retomada",
          description: "Sua jornada foi retomada com sucesso!",
        });
        loadCurrentJourney();
        setNotes('');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível retomar a jornada.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const endJourney = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/journey/end', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          notes
        })
      });

      if (response.ok) {
        toast({
          title: "Jornada finalizada",
          description: "Sua jornada foi finalizada com sucesso!",
        });
        setCurrentJourney(null);
        loadJourneyHistory();
        setNotes('');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a jornada.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async () => {
    try {
      const position = await getCurrentPosition();
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/journey/location', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        })
      });

      if (response.ok) {
        toast({
          title: "Localização atualizada",
          description: "Sua localização foi atualizada com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a localização.",
        variant: "destructive"
      });
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };

  const formatDuration = (start: Date, end?: Date) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">Pausada</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Finalizada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestão de Jornada
          </h1>
          <p className="text-gray-600 mt-2">
            Controle sua jornada de trabalho e acompanhe suas atividades diárias
          </p>
        </div>
      </div>

      {/* Jornada Atual */}
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Jornada Atual
          </CardTitle>
          <CardDescription>
            {currentJourney ? 'Você tem uma jornada em andamento' : 'Nenhuma jornada ativa no momento'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentJourney ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(currentJourney.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Início: {new Date(currentJourney.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Duração: {formatDuration(currentJourney.startTime, currentJourney.endTime)}</span>
                  </div>
                  {currentJourney.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Localização: {currentJourney.location.address || 'Coordenadas registradas'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {currentJourney.status === 'active' && (
                  <>
                    <Button 
                      onClick={pauseJourney} 
                      disabled={loading}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      Pausar
                    </Button>
                    <Button 
                      onClick={endJourney} 
                      disabled={loading}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Finalizar
                    </Button>
                  </>
                )}
                
                {currentJourney.status === 'paused' && (
                  <Button 
                    onClick={resumeJourney} 
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Retomar
                  </Button>
                )}

                <Button 
                  onClick={updateLocation} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Atualizar Localização
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                placeholder="Adicione uma observação sobre o início da jornada (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button 
                onClick={startJourney} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar Jornada
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Jornadas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Jornadas</CardTitle>
          <CardDescription>
            Suas últimas jornadas de trabalho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {journeyHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma jornada encontrada no histórico
              </p>
            ) : (
              journeyHistory.slice(0, 10).map((journey) => (
                <div key={journey.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(journey.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(journey.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatDuration(journey.startTime, journey.endTime)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div>Início: {new Date(journey.startTime).toLocaleTimeString()}</div>
                    {journey.endTime && (
                      <div>Fim: {new Date(journey.endTime).toLocaleTimeString()}</div>
                    )}
                    {journey.totalHours && (
                      <div>Total: {journey.totalHours.toFixed(2)}h</div>
                    )}
                  </div>

                  {journey.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                      <span className="font-medium">Observações: </span>
                      {journey.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
