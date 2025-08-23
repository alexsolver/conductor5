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
import { Polyline, Marker } from 'react-leaflet';
import { Icon } from 'leaflet';

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
  onClose: () => void;
  onExport: (format: 'geojson' | 'csv') => Promise<void>;
  isVisible: boolean;
}

interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  speed: number; // 1x, 2x, 5x, 10x
  loop: boolean;
}

// ===========================================================================================
// Trajectory Replay Component
// ===========================================================================================

export const TrajectoryReplay: React.FC<TrajectoryReplayProps> = ({
  trajectory,
  onClose,
  onExport,
  isVisible
}) => {
  const { toast } = useToast();
  
  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentIndex: 0,
    speed: 1,
    loop: false
  });

  // UI state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TrajectoryPoint | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
      setPlaybackState(prev => {
        if (!prev.isPlaying) return prev;

        let nextIndex = prev.currentIndex + 1;
        
        if (nextIndex >= trajectory.points.length) {
          if (prev.loop) {
            nextIndex = 0;
          } else {
            return { ...prev, isPlaying: false };
          }
        }

        return { ...prev, currentIndex: nextIndex };
      });

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
  }, [trajectory, playbackState.speed, playbackState.isPlaying]);

  const pausePlayback = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    if (playbackTimer.current) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
  }, []);

  const resetPlayback = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false, currentIndex: 0 }));
    setSelectedPoint(null);
    if (playbackTimer.current) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
  }, []);

  const skipToPoint = useCallback((index: number) => {
    setPlaybackState(prev => ({ ...prev, currentIndex: index, isPlaying: false }));
    if (trajectory) {
      setSelectedPoint(trajectory.points[index]);
    }
  }, [trajectory]);

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

  const formatDuration = (startTime: Date, endTime: Date): string => {
    const diff = endTime.getTime() - startTime.getTime();
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
      {/* Trajectory Path and Current Position */}
      {renderTrajectoryPath()}
      {renderCurrentPosition()}

      {/* Control Panel */}
      <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] w-96">
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
          {/* Timeline Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTimestamp(trajectory.startTime)}</span>
              <span>{formatTimestamp(trajectory.endTime)}</span>
            </div>
            
            <Slider
              value={[playbackState.currentIndex]}
              onValueChange={([value]) => skipToPoint(value)}
              max={trajectory.points.length - 1}
              step={1}
              className="w-full"
              data-testid="timeline-slider"
            />
            
            <div className="text-center text-xs text-muted-foreground">
              {playbackState.currentIndex + 1} / {trajectory.points.length} pontos
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
              onClick={() => skipToPoint(Math.max(0, playbackState.currentIndex - 10))}
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
              onClick={() => skipToPoint(Math.min(trajectory.points.length - 1, playbackState.currentIndex + 10))}
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
                onValueChange={(value) => setPlaybackState(prev => ({ ...prev, speed: Number(value) }))}
              >
                <SelectTrigger className="w-20" data-testid="speed-selector">
                  <SelectValue />
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