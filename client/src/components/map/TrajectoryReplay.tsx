// ===========================================================================================
// TRAJECTORY REPLAY - Time Slider for Agent Path Playback with Speed Control
// ===========================================================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward,
  Rewind,
  MapPin,
  Clock,
  Route,
  Calendar,
  X,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Map elements now rendered in InteractiveMap within MapContainer

// ===========================================================================================
// Types
// ===========================================================================================

export interface TrajectoryPoint {
  id: string;
  agentId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
  accuracy?: number;
  deviceBattery?: number;
}

export interface AgentTrajectory {
  agentId: string;
  agentName: string;
  startTime: Date;
  endTime: Date;
  points: TrajectoryPoint[];
  totalDistance: number;
  maxSpeed: number;
  avgSpeed: number;
}

interface TrajectoryReplayProps {
  trajectory: AgentTrajectory | null;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onExport: (format: 'geojson' | 'csv') => Promise<void>;
  onPeriodChange?: (startTime: string, endTime: string) => Promise<void>;
  isVisible: boolean;
}

interface PlaybackState {
  isPlaying: boolean;
  speed: number; // 1x, 2x, 5x, 10x
  loop: boolean;
}

// ===========================================================================================
// Trajectory Replay Component
// ===========================================================================================

export const TrajectoryReplay: React.FC<TrajectoryReplayProps> = ({
  trajectory,
  currentIndex,
  onIndexChange,
  onClose,
  onExport,
  onPeriodChange,
  isVisible
}) => {
  const { toast } = useToast();
  
  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    speed: 1,
    loop: false
  });

  // UI state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TrajectoryPoint | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Period state - Default to last 8 hours
  const getDefaultDates = () => {
    const now = new Date();
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    return {
      startDate: eightHoursAgo.toISOString().slice(0, 16),
      endDate: now.toISOString().slice(0, 16)
    };
  };
  
  const [periodDates, setPeriodDates] = useState(getDefaultDates());

  // Refs
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const animationFrame = useRef<number | null>(null);

  // ===========================================================================================
  // Playback Control
  // ===========================================================================================

  const startPlayback = useCallback(() => {
    if (!trajectory || trajectory.points.length === 0) return;

    setPlaybackState(prev => ({ ...prev, isPlaying: true }));

    const animate = () => {
      let nextIndex = currentIndex + 1;
      
      if (nextIndex >= trajectory.points.length) {
        if (playbackState.loop) {
          nextIndex = 0;
          onIndexChange(nextIndex);
        } else {
          setPlaybackState(prev => ({ ...prev, isPlaying: false }));
          return;
        }
      } else {
        onIndexChange(nextIndex);
      }

      // Schedule next frame based on speed
      const baseDelay = 500; // Base delay in ms
      const delay = baseDelay / playbackState.speed;
      
      playbackTimer.current = setTimeout(() => {
        if (playbackState.isPlaying) {
          animate();
        }
      }, delay);
    };

    animate();
  }, [trajectory, playbackState.speed, playbackState.isPlaying, currentIndex, onIndexChange]);

  const pausePlayback = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    if (playbackTimer.current) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
  }, []);

  const resetPlayback = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    onIndexChange(0);
    setSelectedPoint(null);
    if (playbackTimer.current) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
  }, [onIndexChange]);

  const skipToPoint = useCallback((index: number) => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    onIndexChange(index);
    if (trajectory) {
      setSelectedPoint(trajectory.points[index]);
    }
  }, [trajectory, onIndexChange]);

  // ===========================================================================================
  // Export Functions
  // ===========================================================================================

  const handleExport = async (format: 'geojson' | 'csv') => {
    if (!trajectory) return;

    setIsExporting(true);
    try {
      await onExport(format);
      toast({
        title: "Trajetória Exportada",
        description: `Trajetória exportada em formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Falha ao exportar trajetória",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ===========================================================================================
  // Effects
  // ===========================================================================================

  useEffect(() => {
    return () => {
      if (playbackTimer.current) {
        clearTimeout(playbackTimer.current);
      }
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    if (trajectory && trajectory.points.length > 0) {
      setSelectedPoint(trajectory.points[playbackState.currentIndex]);
    }
  }, [trajectory, playbackState.currentIndex]);

  // ===========================================================================================
  // Helper Functions
  // ===========================================================================================

  const formatDuration = (startTime: Date | string, endTime: Date | string): string => {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleString('pt-BR');
  };

  const getSpeedColor = (speed: number): string => {
    if (speed < 10) return '#22c55e'; // green
    if (speed < 30) return '#eab308'; // yellow
    if (speed < 60) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  // ===========================================================================================
  // Render Map Elements
  // ===========================================================================================

  const renderTrajectoryPath = () => {
    if (!trajectory || !isVisible) return null;

    const currentPath = trajectory.points.slice(0, playbackState.currentIndex + 1);
    const positions = currentPath.map(point => [point.lat, point.lng] as [number, number]);

    return (
      <Polyline
        positions={positions}
        color="#3b82f6"
        weight={3}
        opacity={0.8}
      />
    );
  };

  const renderCurrentPosition = () => {
    if (!trajectory || !isVisible || !selectedPoint) return null;

    const currentIcon = new Icon({
      iconUrl: '/api/placeholder/32/32',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: 'animate-bounce'
    });

    return (
      <Marker
        position={[selectedPoint.lat, selectedPoint.lng]}
        icon={currentIcon}
      />
    );
  };

  // ===========================================================================================
  // Render UI
  // ===========================================================================================

  if (!trajectory || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Map elements now rendered in InteractiveMap within MapContainer */}

      {/* Control Panel */}
      <Card className="bg-white shadow-xl border z-[1000] w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Route className="w-4 h-4" />
              Replay: {trajectory.agentName}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="close-replay-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Period Selection Section */}
          <div className="border-b pb-3 mb-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              📅 Período da Trajetória
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Início</label>
                <input
                  type="datetime-local"
                  value={periodDates.startDate}
                  onChange={(e) => setPeriodDates(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full text-xs px-2 py-1 border rounded"
                  data-testid="start-date-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fim</label>
                <input
                  type="datetime-local"
                  value={periodDates.endDate}
                  onChange={(e) => setPeriodDates(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full text-xs px-2 py-1 border rounded"
                  data-testid="end-date-input"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs"
                onClick={() => {
                  const now = new Date();
                  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
                  setPeriodDates({
                    startDate: eightHoursAgo.toISOString().slice(0, 16),
                    endDate: now.toISOString().slice(0, 16)
                  });
                }}
              >
                Últimas 8h
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs"
                onClick={() => {
                  const now = new Date();
                  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                  setPeriodDates({
                    startDate: dayAgo.toISOString().slice(0, 16),
                    endDate: now.toISOString().slice(0, 16)
                  });
                }}
              >
                Último dia
              </Button>
              {onPeriodChange && (
                <Button
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onPeriodChange(periodDates.startDate, periodDates.endDate)}
                >
                  Atualizar
                </Button>
              )}
            </div>
          </div>
          
          {/* Timeline Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTimestamp(trajectory.startTime)}</span>
              <span>{formatTimestamp(trajectory.endTime)}</span>
            </div>
            
            <Slider
              value={[currentIndex]}
              onValueChange={([value]) => skipToPoint(value)}
              max={trajectory.points.length - 1}
              step={1}
              className="w-full"
              data-testid="timeline-slider"
            />
            
            <div className="text-center text-xs text-muted-foreground">
              {currentIndex + 1} / {trajectory.points.length} pontos
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetPlayback}
              data-testid="reset-playback-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => skipToPoint(Math.max(0, currentIndex - 10))}
              data-testid="rewind-btn"
            >
              <Rewind className="w-4 h-4" />
            </Button>
            
            <Button
              variant={playbackState.isPlaying ? "default" : "outline"}
              onClick={playbackState.isPlaying ? pausePlayback : startPlayback}
              data-testid="play-pause-btn"
            >
              {playbackState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => skipToPoint(Math.min(trajectory.points.length - 1, currentIndex + 10))}
              data-testid="forward-btn"
            >
              <FastForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Speed and Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">Velocidade:</span>
              <Select
                value={playbackState.speed.toString()}
                onValueChange={(value) => {
                  console.log('🎛️ [SPEED] Mudando velocidade para:', value + 'x');
                  setPlaybackState(prev => ({ ...prev, speed: Number(value) }));
                }}
              >
                <SelectTrigger className="w-20" data-testid="speed-selector">
                  <SelectValue placeholder={`${playbackState.speed}x`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="10">10x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              data-testid="toggle-details-btn"
            >
              Detalhes
            </Button>
          </div>

          {/* Current Point Info */}
          {selectedPoint && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Horário:</span>
                  <div className="font-medium">{formatTimestamp(selectedPoint.timestamp)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Velocidade:</span>
                  <div className="font-medium" style={{ color: getSpeedColor(selectedPoint.speed || 0) }}>
                    {selectedPoint.speed || 0} km/h
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Localização:</span>
                  <div className="font-medium">{selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Bateria:</span>
                  <div className="font-medium">{selectedPoint.deviceBattery || 'N/A'}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Extended Details */}
          {showDetails && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="text-sm font-medium">Estatísticas da Trajetória:</div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">Duração Total</div>
                    <div className="font-medium">{formatDuration(trajectory.startTime, trajectory.endTime)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Distância</div>
                    <div className="font-medium">{trajectory.totalDistance.toFixed(2)} km</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Vel. Máxima</div>
                    <div className="font-medium">{trajectory.maxSpeed.toFixed(1)} km/h</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Vel. Média</div>
                    <div className="font-medium">{trajectory.avgSpeed.toFixed(1)} km/h</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleExport('geojson')}
                    disabled={isExporting}
                    data-testid="export-geojson-btn"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    GeoJSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    data-testid="export-csv-btn"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};