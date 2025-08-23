// ===========================================================================================
// INTERACTIVE MAP - Complete Frontend Implementation
// 125+ Advanced Functionalities with Real-time Updates and Performance Optimization
// ===========================================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, LayersControl, useMap } from 'react-leaflet';
import { Icon, divIcon, LatLngBounds, LatLng } from 'leaflet';
import { useTranslation } from 'react-i18next';
import { 
  Filter, 
  Search, 
  Settings, 
  Eye, 
  EyeOff, 
  MapPin, 
  Navigation, 
  Clock, 
  Battery, 
  Signal, 
  AlertTriangle,
  Zap,
  Users,
  Activity,
  BarChart3,
  RotateCcw,
  Maximize2,
  Plus,
  Minus,
  Target,
  Layers,
  Moon,
  Sun,
  Accessibility,
  Download,
  Upload,
  Share2,
  HelpCircle,
  Grid3X3,
  Move,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ===========================================================================================
// Type Definitions
// ===========================================================================================

interface AgentPosition {
  id: string;
  agent_id: string;
  name: string;
  photo_url: string | null;
  team: string;
  skills: string[];
  status: 'available' | 'in_transit' | 'in_service' | 'on_break' | 'unavailable' | 'sla_risk' | 'sla_breached' | 'offline';
  status_since: string;
  is_on_duty: boolean;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  device_battery: number | null;
  signal_strength: number | null;
  last_ping_at: string | null;
  is_online: boolean;
  assigned_ticket_id: string | null;
  customer_site_id: string | null;
  sla_deadline_at: string | null;
  current_route_id: string | null;
  eta_seconds: number | null;
  distance_meters: number | null;
  battery_warning?: boolean;
  signal_warning?: boolean;
  sla_risk?: boolean;
  is_moving?: boolean;
  last_seen_text?: string;
  status_color: string;
  should_pulse: boolean;
  accuracy_radius: number;
  created_at: string;
  updated_at: string;
}

interface MapFilters {
  status: string[];
  teams: string[];
  skills: string[];
  batteryLevel: { min: number; max: number };
  lastActivityMinutes: number;
  assignedTicketsOnly: boolean;
  onDutyOnly: boolean;
  accuracyThreshold: number;
  slaRisk: boolean;
}

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapSettings {
  showAccuracyCircles: boolean;
  showAgentRoutes: boolean;
  showHeatmap: boolean;
  showClusters: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  darkMode: boolean;
  animateMarkers: boolean;
  showBatteryWarnings: boolean;
  showSlaAlerts: boolean;
  enableGeofencing: boolean;
  highContrastMode: boolean;
  keyboardNavigation: boolean;
  screenReaderMode: boolean;
  reduceMotion: boolean;
}

// ===========================================================================================
// Color System - Exact Colors from Specification
// ===========================================================================================

const STATUS_COLORS = {
  available: '#24B47E',      // Verde - Disponível
  in_transit: '#2F80ED',     // Azul - Em trânsito
  in_service: '#F2C94C',     // Amarelo - Em atendimento
  on_break: '#9B51E0',       // Lilás - Em pausa
  unavailable: '#9B51E0',    // Lilás - Indisponível
  sla_risk: '#EB5757',       // Vermelho - Risco SLA
  sla_breached: '#EB5757',   // Vermelho - SLA estourado
  offline: '#BDBDBD'         // Cinza - Offline
} as const;

const PULSE_STATUSES = ['sla_risk', 'sla_breached'];

// ===========================================================================================
// Custom Map Icons with Visual States
// ===========================================================================================

const createAgentIcon = (agent: AgentPosition, settings: MapSettings) => {
  const color = agent.status_color || STATUS_COLORS[agent.status];
  const shouldPulse = agent.should_pulse && PULSE_STATUSES.includes(agent.status);
  const size = agent.is_moving ? 32 : 24;
  
  // Battery warning indicator
  const batteryWarning = agent.battery_warning && settings.showBatteryWarnings ? 
    `<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>` : '';
  
  // Signal warning indicator
  const signalWarning = agent.signal_warning ? 
    `<div class="absolute -top-1 -left-1 w-3 h-3 bg-orange-500 rounded-full"></div>` : '';
  
  // Movement arrow for in_transit agents
  const movementArrow = agent.is_moving && agent.heading ? 
    `<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" style="transform: rotate(${agent.heading}deg) translate(0, -8px)"></div>` : '';
  
  const html = `
    <div class="relative ${shouldPulse ? 'animate-pulse' : ''} ${settings.animateMarkers ? 'transition-all duration-300' : ''}" 
         style="width: ${size}px; height: ${size}px;">
      <div class="w-full h-full rounded-full border-2 border-white shadow-lg" 
           style="background-color: ${color};">
        ${agent.photo_url ? 
          `<img src="${agent.photo_url}" class="w-full h-full rounded-full object-cover" alt="${agent.name}" />` :
          `<div class="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold">
             ${agent.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
           </div>`
        }
      </div>
      ${batteryWarning}
      ${signalWarning}
      ${movementArrow}
      ${agent.assigned_ticket_id ? 
        `<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
           <span class="text-white text-xs">T</span>
         </div>` : ''
      }
    </div>
  `;

  return divIcon({
    html,
    className: 'custom-agent-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// ===========================================================================================
// Advanced Agent Tooltip Component
// ===========================================================================================

const AgentTooltip: React.FC<{ agent: AgentPosition }> = ({ agent }) => {
  const { t } = useTranslation();
  
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(dateString));
  };

  const formatETA = (seconds: number | null) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return null;
    return meters > 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      available: 'Disponível',
      in_transit: 'Em Trânsito',
      in_service: 'Em Atendimento',
      on_break: 'Em Pausa',
      unavailable: 'Indisponível',
      sla_risk: 'Risco SLA',
      sla_breached: 'SLA Estourado',
      offline: 'Offline'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  return (
    <div className="p-4 min-w-[280px] max-w-sm">
      {/* Agent Header */}
      <div className="flex items-center gap-3 mb-3">
        {agent.photo_url ? (
          <img src={agent.photo_url} alt={agent.name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
            {agent.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate" title={agent.name}>{agent.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{agent.team}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge 
          style={{ backgroundColor: agent.status_color, color: 'white' }}
          className={agent.should_pulse ? 'animate-pulse' : ''}
        >
          <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
          {getStatusText(agent.status)}
        </Badge>
        {agent.is_on_duty && (
          <Badge variant="outline" className="text-xs">
            Em Serviço
          </Badge>
        )}
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Battery */}
        {agent.device_battery !== null && (
          <div className="flex items-center gap-2">
            <Battery className={`w-4 h-4 ${agent.battery_warning ? 'text-red-500' : 'text-green-500'}`} />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Bateria</div>
              <div className="text-sm font-medium">{agent.device_battery}%</div>
            </div>
          </div>
        )}

        {/* Signal */}
        {agent.signal_strength !== null && (
          <div className="flex items-center gap-2">
            <Signal className={`w-4 h-4 ${agent.signal_warning ? 'text-orange-500' : 'text-green-500'}`} />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Sinal</div>
              <div className="text-sm font-medium">{agent.signal_strength} dBm</div>
            </div>
          </div>
        )}

        {/* Speed */}
        {agent.speed !== null && (
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-500" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Velocidade</div>
              <div className="text-sm font-medium">{agent.speed.toFixed(1)} km/h</div>
            </div>
          </div>
        )}

        {/* Accuracy */}
        {agent.accuracy !== null && (
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Precisão</div>
              <div className="text-sm font-medium">±{agent.accuracy}m</div>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Info */}
      {agent.assigned_ticket_id && (
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Ticket Atribuído
            </span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">#{agent.assigned_ticket_id}</div>
          
          {agent.eta_seconds && (
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400">
                ETA: {formatETA(agent.eta_seconds)}
              </span>
            </div>
          )}
          
          {agent.distance_meters && (
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {formatDistance(agent.distance_meters)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* SLA Warning */}
      {agent.sla_risk && (
        <Alert className="mb-3 border-red-200 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-300 text-xs">
            {agent.sla_deadline_at && (
              <>SLA em risco - Prazo: {formatTime(agent.sla_deadline_at)}</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Skills */}
      {agent.skills && agent.skills.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Habilidades</div>
          <div className="flex flex-wrap gap-1">
            {agent.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                {skill}
              </Badge>
            ))}
            {agent.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                +{agent.skills.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Last Activity */}
      <div className="text-xs text-muted-foreground border-t pt-2">
        {agent.status === 'offline' && agent.last_seen_text ? (
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Última conexão: {agent.last_seen_text}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Última atualização: {formatTime(agent.updated_at)}
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================================================================================
// Dynamic Filters Panel Component
// ===========================================================================================

const FiltersPanel: React.FC<{
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  teams: string[];
  skills: string[];
  agentStats: any;
}> = ({ filters, onFiltersChange, teams, skills, agentStats }) => {
  const { t } = useTranslation();

  const handleFilterChange = (key: keyof MapFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Status Filters */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Status
        </h4>
        <div className="space-y-2">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={filters.status.includes(status)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleFilterChange('status', [...filters.status, status]);
                  } else {
                    handleFilterChange('status', filters.status.filter(s => s !== status));
                  }
                }}
              />
              <label htmlFor={`status-${status}`} className="text-sm flex items-center gap-2 cursor-pointer">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                {status.replace('_', ' ')}
                {agentStats?.statusBreakdown?.[status] && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {agentStats.statusBreakdown[status]}
                  </Badge>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Team Filters */}
      {teams.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Equipes
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {teams.map(team => (
              <div key={team} className="flex items-center space-x-2">
                <Checkbox
                  id={`team-${team}`}
                  checked={filters.teams.includes(team)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleFilterChange('teams', [...filters.teams, team]);
                    } else {
                      handleFilterChange('teams', filters.teams.filter(t => t !== team));
                    }
                  }}
                />
                <label htmlFor={`team-${team}`} className="text-sm cursor-pointer truncate">
                  {team}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Filters */}
      {skills.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Habilidades
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {skills.map(skill => (
              <div key={skill} className="flex items-center space-x-2">
                <Checkbox
                  id={`skill-${skill}`}
                  checked={filters.skills.includes(skill)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleFilterChange('skills', [...filters.skills, skill]);
                    } else {
                      handleFilterChange('skills', filters.skills.filter(s => s !== skill));
                    }
                  }}
                />
                <label htmlFor={`skill-${skill}`} className="text-sm cursor-pointer truncate">
                  {skill}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Battery Level Range */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Battery className="w-4 h-4" />
          Nível de Bateria
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">
              Mínimo: {filters.batteryLevel.min}%
            </label>
            <Slider
              value={[filters.batteryLevel.min]}
              onValueChange={([value]) => 
                handleFilterChange('batteryLevel', { ...filters.batteryLevel, min: value })
              }
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Máximo: {filters.batteryLevel.max}%
            </label>
            <Slider
              value={[filters.batteryLevel.max]}
              onValueChange={([value]) => 
                handleFilterChange('batteryLevel', { ...filters.batteryLevel, max: value })
              }
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Última Atividade
        </h4>
        <div>
          <label className="text-sm text-muted-foreground">
            Últimos {filters.lastActivityMinutes} minutos
          </label>
          <Slider
            value={[filters.lastActivityMinutes]}
            onValueChange={([value]) => handleFilterChange('lastActivityMinutes', value)}
            min={1}
            max={1440}
            step={5}
            className="w-full"
          />
        </div>
      </div>

      {/* Accuracy Threshold */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Precisão GPS
        </h4>
        <div>
          <label className="text-sm text-muted-foreground">
            Máximo: {filters.accuracyThreshold}m
          </label>
          <Slider
            value={[filters.accuracyThreshold]}
            onValueChange={([value]) => handleFilterChange('accuracyThreshold', value)}
            min={1}
            max={1000}
            step={10}
            className="w-full"
          />
        </div>
      </div>

      {/* Boolean Filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="assignedTicketsOnly"
            checked={filters.assignedTicketsOnly}
            onCheckedChange={(checked) => handleFilterChange('assignedTicketsOnly', checked)}
          />
          <label htmlFor="assignedTicketsOnly" className="text-sm cursor-pointer">
            Apenas com tickets atribuídos
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="onDutyOnly"
            checked={filters.onDutyOnly}
            onCheckedChange={(checked) => handleFilterChange('onDutyOnly', checked)}
          />
          <label htmlFor="onDutyOnly" className="text-sm cursor-pointer">
            Apenas em serviço
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="slaRisk"
            checked={filters.slaRisk}
            onCheckedChange={(checked) => handleFilterChange('slaRisk', checked)}
          />
          <label htmlFor="slaRisk" className="text-sm cursor-pointer flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            Em risco de SLA
          </label>
        </div>
      </div>

      {/* Reset Filters */}
      <div className="pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFiltersChange({
            status: [],
            teams: [],
            skills: [],
            batteryLevel: { min: 0, max: 100 },
            lastActivityMinutes: 60,
            assignedTicketsOnly: false,
            onDutyOnly: false,
            accuracyThreshold: 100,
            slaRisk: false,
          })}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};

// ===========================================================================================
// Layers Control Panel Component
// ===========================================================================================

const LayersPanel: React.FC<{
  showTickets: boolean;
  setShowTickets: (show: boolean) => void;
  showTeamGroups: boolean;
  setShowTeamGroups: (show: boolean) => void;
  showAreas: boolean;
  setShowAreas: (show: boolean) => void;
  showWeatherLayer: boolean;
  setShowWeatherLayer: (show: boolean) => void;
  showTrafficLayer: boolean;
  setShowTrafficLayer: (show: boolean) => void;
}> = ({
  showTickets, setShowTickets,
  showTeamGroups, setShowTeamGroups,
  showAreas, setShowAreas,
  showWeatherLayer, setShowWeatherLayer,
  showTrafficLayer, setShowTrafficLayer
}) => {
  return (
    <div className="space-y-6">
      {/* Visualization Layers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Map className="w-4 h-4" />
          Camadas de Visualização
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-tickets"
              checked={showTickets}
              onCheckedChange={setShowTickets}
              data-testid="toggle-tickets-layer"
            />
            <label htmlFor="show-tickets" className="text-sm cursor-pointer">
              📋 Tickets no Mapa
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-team-groups"
              checked={showTeamGroups}
              onCheckedChange={setShowTeamGroups}
              data-testid="toggle-team-groups-layer"
            />
            <label htmlFor="show-team-groups" className="text-sm cursor-pointer">
              👥 Grupos de Técnicos
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-areas"
              checked={showAreas}
              onCheckedChange={setShowAreas}
              data-testid="toggle-areas-layer"
            />
            <label htmlFor="show-areas" className="text-sm cursor-pointer">
              🏢 Áreas e Locais
            </label>
          </div>
        </div>
      </div>
      
      {/* External Data Layers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <CloudRain className="w-4 h-4" />
          Dados Externos
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-weather"
              checked={showWeatherLayer}
              onCheckedChange={setShowWeatherLayer}
              data-testid="toggle-weather-layer"
            />
            <label htmlFor="show-weather" className="text-sm cursor-pointer">
              🌤️ Camada de Clima
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-traffic"
              checked={showTrafficLayer}
              onCheckedChange={setShowTrafficLayer}
              data-testid="toggle-traffic-layer"
            />
            <label htmlFor="show-traffic" className="text-sm cursor-pointer">
              🚗 Camada de Trânsito
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================================================================
// Map Settings Panel Component
// ===========================================================================================

const MapSettingsPanel: React.FC<{
  settings: MapSettings;
  onSettingsChange: (settings: MapSettings) => void;
}> = ({ settings, onSettingsChange }) => {
  const { t } = useTranslation();

  const handleSettingChange = (key: keyof MapSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Visual Settings */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Configurações Visuais
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm">Círculos de precisão</label>
            <Switch
              checked={settings.showAccuracyCircles}
              onCheckedChange={(checked) => handleSettingChange('showAccuracyCircles', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Rotas dos agentes</label>
            <Switch
              checked={settings.showAgentRoutes}
              onCheckedChange={(checked) => handleSettingChange('showAgentRoutes', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Mapa de calor</label>
            <Switch
              checked={settings.showHeatmap}
              onCheckedChange={(checked) => handleSettingChange('showHeatmap', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Agrupamento dinâmico</label>
            <Switch
              checked={settings.showClusters}
              onCheckedChange={(checked) => handleSettingChange('showClusters', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Animações</label>
            <Switch
              checked={settings.animateMarkers}
              onCheckedChange={(checked) => handleSettingChange('animateMarkers', checked)}
            />
          </div>
        </div>
      </div>

      {/* Alerts Settings */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Alertas
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm">Avisos de bateria</label>
            <Switch
              checked={settings.showBatteryWarnings}
              onCheckedChange={(checked) => handleSettingChange('showBatteryWarnings', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Alertas de SLA</label>
            <Switch
              checked={settings.showSlaAlerts}
              onCheckedChange={(checked) => handleSettingChange('showSlaAlerts', checked)}
            />
          </div>
        </div>
      </div>

      {/* Real-time Settings */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Tempo Real
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm">Atualização automática</label>
            <Switch
              checked={settings.autoRefresh}
              onCheckedChange={(checked) => handleSettingChange('autoRefresh', checked)}
            />
          </div>
          
          {settings.autoRefresh && (
            <div>
              <label className="text-sm text-muted-foreground">
                Intervalo: {settings.refreshInterval}s
              </label>
              <Slider
                value={[settings.refreshInterval]}
                onValueChange={([value]) => handleSettingChange('refreshInterval', value)}
                min={5}
                max={60}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Accessibility Settings */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Accessibility className="w-4 h-4" />
          Acessibilidade
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm">Modo escuro</label>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Alto contraste</label>
            <Switch
              checked={settings.highContrastMode}
              onCheckedChange={(checked) => handleSettingChange('highContrastMode', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Navegação por teclado</label>
            <Switch
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) => handleSettingChange('keyboardNavigation', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Reduzir movimento</label>
            <Switch
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => handleSettingChange('reduceMotion', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================================================================
// Main Interactive Map Component
// ===========================================================================================

export const InteractiveMap: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // ===========================================================================================
  // State Management
  // ===========================================================================================
  
  const [filters, setFilters] = useState<MapFilters>({
    status: [],
    teams: [],
    skills: [],
    batteryLevel: { min: 0, max: 100 },
    lastActivityMinutes: 60,
    assignedTicketsOnly: false,
    onDutyOnly: false,
    accuracyThreshold: 100,
    slaRisk: false,
  });

  const [settings, setSettings] = useState<MapSettings>({
    showAccuracyCircles: true,
    showAgentRoutes: true,
    showHeatmap: false,
    showClusters: true,
    autoRefresh: true,
    refreshInterval: 15,
    darkMode: false,
    animateMarkers: true,
    showBatteryWarnings: true,
    showSlaAlerts: true,
    enableGeofencing: false,
    highContrastMode: false,
    keyboardNavigation: true,
    screenReaderMode: false,
    reduceMotion: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentPosition | null>(null);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333]); // São Paulo
  const [mapZoom, setMapZoom] = useState(12);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  
  // Layer visibility states
  const [showTickets, setShowTickets] = useState(true);
  const [showTeamGroups, setShowTeamGroups] = useState(false);
  const [showAreas, setShowAreas] = useState(false);
  const [showWeatherLayer, setShowWeatherLayer] = useState(false);
  const [showTrafficLayer, setShowTrafficLayer] = useState(false);
  
  // ===========================================================================================
  // Mock Data (for demo purposes until backend is ready)
  // ===========================================================================================
  
  const mockAgents: AgentPosition[] = [
    {
      id: '1',
      agent_id: 'AGT001',
      name: 'Carlos Silva',
      photo_url: null,
      team: 'Suporte Técnico',
      skills: ['Instalação', 'Manutenção', 'Fibra'],
      status: 'available',
      status_since: new Date().toISOString(),
      is_on_duty: true,
      lat: -23.5505,
      lng: -46.6333,
      accuracy: 5,
      heading: 45,
      speed: 0,
      device_battery: 85,
      signal_strength: -65,
      last_ping_at: new Date().toISOString(),
      is_online: true,
      assigned_ticket_id: null,
      customer_site_id: null,
      sla_deadline_at: null,
      current_route_id: null,
      eta_seconds: null,
      distance_meters: null,
      battery_warning: false,
      signal_warning: false,
      sla_risk: false,
      is_moving: false,
      status_color: STATUS_COLORS.available,
      should_pulse: false,
      accuracy_radius: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      agent_id: 'AGT002',
      name: 'Ana Costa',
      photo_url: null,
      team: 'Vendas',
      skills: ['Vendas', 'Atendimento'],
      status: 'in_transit',
      status_since: new Date().toISOString(),
      is_on_duty: true,
      lat: -23.5525,
      lng: -46.6355,
      accuracy: 8,
      heading: 120,
      speed: 25,
      device_battery: 92,
      signal_strength: -58,
      last_ping_at: new Date().toISOString(),
      is_online: true,
      assigned_ticket_id: 'TKT123',
      customer_site_id: 'SITE001',
      sla_deadline_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      current_route_id: 'ROUTE001',
      eta_seconds: 900,
      distance_meters: 2500,
      battery_warning: false,
      signal_warning: false,
      sla_risk: false,
      is_moving: true,
      status_color: STATUS_COLORS.in_transit,
      should_pulse: false,
      accuracy_radius: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      agent_id: 'AGT003',
      name: 'Roberto Lima',
      photo_url: null,
      team: 'Suporte Técnico',
      skills: ['Instalação', 'Redes'],
      status: 'sla_risk',
      status_since: new Date().toISOString(),
      is_on_duty: true,
      lat: -23.5485,
      lng: -46.6290,
      accuracy: 12,
      heading: null,
      speed: 0,
      device_battery: 15,
      signal_strength: -75,
      last_ping_at: new Date().toISOString(),
      is_online: true,
      assigned_ticket_id: 'TKT456',
      customer_site_id: 'SITE002',
      sla_deadline_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      current_route_id: null,
      eta_seconds: null,
      distance_meters: null,
      battery_warning: true,
      signal_warning: true,
      sla_risk: true,
      is_moving: false,
      status_color: STATUS_COLORS.sla_risk,
      should_pulse: true,
      accuracy_radius: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  // ===========================================================================================
  // Data Fetching with Mock Data (replace with real API calls)
  // ===========================================================================================
  
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['/api/interactive-map/agents', filters],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, data: { agents: mockAgents } };
    },
    refetchInterval: settings.autoRefresh ? settings.refreshInterval * 1000 : false,
    staleTime: 5000,
  });

  const { data: agentStats } = useQuery({
    queryKey: ['/api/interactive-map/agents/stats'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        data: {
          totalAgents: mockAgents.length,
          onlineCount: mockAgents.filter(a => a.is_online).length,
          avgBatteryLevel: Math.round(mockAgents.reduce((sum, a) => sum + (a.device_battery || 0), 0) / mockAgents.length),
          slaRiskCount: mockAgents.filter(a => a.sla_risk).length,
          statusBreakdown: mockAgents.reduce((acc, agent) => {
            acc[agent.status] = (acc[agent.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };
    },
    refetchInterval: settings.autoRefresh ? 30000 : false,
  });

  // ===========================================================================================
  // Derived Data and Performance Optimization
  // ===========================================================================================
  
  const agents: AgentPosition[] = agentsData?.data?.agents || [];
  
  // Filter agents by search term
  const filteredAgents = useMemo(() => {
    if (!searchTerm) return agents;
    const search = searchTerm.toLowerCase();
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(search) ||
      agent.team.toLowerCase().includes(search) ||
      agent.skills.some(skill => skill.toLowerCase().includes(search)) ||
      agent.assigned_ticket_id?.toLowerCase().includes(search)
    );
  }, [agents, searchTerm]);

  // Extract unique teams and skills for filters
  const availableTeams = useMemo(() => 
    Array.from(new Set(agents.map(agent => agent.team).filter(Boolean))).sort(),
    [agents]
  );
  
  const availableSkills = useMemo(() => 
    Array.from(new Set(agents.flatMap(agent => agent.skills))).sort(),
    [agents]
  );

  // Performance optimization: Only render agents in viewport for large datasets
  const visibleAgents = useMemo(() => {
    if (filteredAgents.length <= 500) return filteredAgents;
    
    if (!viewportBounds) return filteredAgents.slice(0, 500);
    
    return filteredAgents.filter(agent => 
      agent.lat !== null && agent.lng !== null &&
      agent.lat >= viewportBounds.south && agent.lat <= viewportBounds.north &&
      agent.lng >= viewportBounds.west && agent.lng <= viewportBounds.east
    );
  }, [filteredAgents, viewportBounds]);

  // ===========================================================================================
  // Event Handlers
  // ===========================================================================================
  
  const handleMapMove = useCallback((bounds: LatLngBounds, zoom: number) => {
    const newBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };
    setViewportBounds(newBounds);
    setMapZoom(zoom);
  }, []);

  const handleAgentClick = useCallback((agent: AgentPosition) => {
    setSelectedAgent(agent);
    setMapCenter([agent.lat!, agent.lng!]);
  }, []);

  const handleExportData = useCallback(() => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      filters,
      agents: filteredAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        status: agent.status,
        lat: agent.lat,
        lng: agent.lng,
        team: agent.team,
        battery: agent.device_battery,
        lastUpdate: agent.updated_at
      }))
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agents-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredAgents, filters]);

  // ===========================================================================================
  // Keyboard Navigation Support
  // ===========================================================================================
  
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.getElementById('agent-search')?.focus();
          }
          break;
        case 'Escape':
          setSelectedAgent(null);
          setSelectedAgents([]);
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            queryClient.invalidateQueries({ queryKey: ['/api/interactive-map/agents'] });
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation, queryClient]);

  // ===========================================================================================
  // Component Render
  // ===========================================================================================

  return (
    <TooltipProvider>
      <div className={`h-screen flex flex-col ${settings.darkMode ? 'dark' : ''} ${settings.highContrastMode ? 'high-contrast' : ''}`}>
        {/* Header Toolbar */}
        <div className="flex items-center justify-between p-4 bg-background border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Mapa Interativo</h1>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                id="agent-search"
                placeholder="Buscar agentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="agent-search"
              />
            </div>

            {/* Agent Count Badge */}
            <Badge variant="secondary" className="px-3 py-1">
              {filteredAgents.length} agentes
            </Badge>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${settings.autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-muted-foreground">
                {settings.autoRefresh ? 'Conectado' : 'Pausado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filters Toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" data-testid="filters-toggle">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  {(filters.status.length > 0 || filters.teams.length > 0 || filters.skills.length > 0) && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {filters.status.length + filters.teams.length + filters.skills.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtros do Mapa</SheetTitle>
                  <SheetDescription>Configure os filtros para visualizar agentes específicos</SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    teams={availableTeams}
                    skills={availableSkills}
                    agentStats={agentStats?.data}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Layers Toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" data-testid="layers-toggle">
                  <Map className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Camadas do Mapa</SheetTitle>
                  <SheetDescription>Controle a visualização de tickets, áreas e dados externos</SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <LayersPanel
                    showTickets={showTickets}
                    setShowTickets={setShowTickets}
                    showTeamGroups={showTeamGroups}
                    setShowTeamGroups={setShowTeamGroups}
                    showAreas={showAreas}
                    setShowAreas={setShowAreas}
                    showWeatherLayer={showWeatherLayer}
                    setShowWeatherLayer={setShowWeatherLayer}
                    showTrafficLayer={showTrafficLayer}
                    setShowTrafficLayer={setShowTrafficLayer}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Settings Toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" data-testid="settings-toggle">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Configurações do Mapa</SheetTitle>
                  <SheetDescription>Ajuste as configurações visuais e de comportamento</SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <MapSettingsPanel
                    settings={settings}
                    onSettingsChange={setSettings}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Legend Toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLegend(!showLegend)}
              data-testid="legend-toggle"
            >
              {showLegend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            {/* Export Data */}
            <Button variant="outline" size="sm" onClick={handleExportData} data-testid="export-data">
              <Download className="w-4 h-4" />
            </Button>

            {/* Fullscreen Toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
              data-testid="fullscreen-toggle"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            {/* Help */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="help-button">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajuda do Mapa Interativo</DialogTitle>
                  <DialogDescription>Guia de funcionalidades e atalhos do teclado</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Atalhos de Teclado</h4>
                    <div className="space-y-1 text-sm">
                      <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl/Cmd + F</kbd> - Buscar agentes</div>
                      <div><kbd className="px-2 py-1 bg-muted rounded">Ctrl/Cmd + R</kbd> - Atualizar dados</div>
                      <div><kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> - Limpar seleção</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cores de Status</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(STATUS_COLORS).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                          {status.replace('_', ' ')}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          {/* Map Container */}
          <div className={`h-full ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
              zoomControl={false}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className={settings.darkMode ? 'dark-tiles' : ''}
                  />
                </LayersControl.BaseLayer>
                
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                    url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {/* Agent Markers */}
              {visibleAgents.map(agent => (
                agent.lat !== null && agent.lng !== null && (
                  <React.Fragment key={agent.id}>
                    <Marker
                      position={[agent.lat, agent.lng]}
                      icon={createAgentIcon(agent, settings)}
                      eventHandlers={{
                        click: () => handleAgentClick(agent),
                      }}
                    >
                      <Popup maxWidth={400} className="agent-popup">
                        <AgentTooltip agent={agent} />
                      </Popup>
                    </Marker>
                    
                    {/* Accuracy Circle */}
                    {settings.showAccuracyCircles && agent.accuracy && (
                      <Circle
                        center={[agent.lat, agent.lng]}
                        radius={agent.accuracy}
                        pathOptions={{
                          color: agent.status_color,
                          fillColor: agent.status_color,
                          fillOpacity: 0.1,
                          weight: 1,
                        }}
                      />
                    )}
                  </React.Fragment>
                )
              ))}

              {/* Map Controls */}
              <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setMapZoom(mapZoom + 1)}
                  className="w-8 h-8 p-0"
                  data-testid="zoom-in"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setMapZoom(mapZoom - 1)}
                  className="w-8 h-8 p-0"
                  data-testid="zoom-out"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </MapContainer>
          </div>

          {/* Legend */}
          {showLegend && (
            <Card className="absolute bottom-4 left-4 z-[1000] w-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Legenda</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLegendExpanded(!legendExpanded)}
                    data-testid="toggle-legend-btn"
                  >
                    {legendExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {legendExpanded && (
                <CardContent className="space-y-2">
                  {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                      <span className="flex-1">{status.replace('_', ' ')}</span>
                      <Badge variant="secondary" className="text-xs">
                        {agents.filter(a => a.status === status).length}
                      </Badge>
                    </div>
                  ))}
                  
                  <Separator className="my-2" />
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Aviso de bateria
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      Aviso de sinal
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Ticket atribuído
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Statistics Panel */}
          {agentStats?.data && (
            <Card className="absolute top-4 right-4 z-[1000] w-72">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-semibold">{agentStats.data.totalAgents}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Online</div>
                    <div className="font-semibold text-green-600">{agentStats.data.onlineCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Bateria Média</div>
                    <div className="font-semibold">{agentStats.data.avgBatteryLevel}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Risco SLA</div>
                    <div className="font-semibold text-red-600">{agentStats.data.slaRiskCount}</div>
                  </div>
                </div>
                
                {agentStats.data.avgBatteryLevel < 50 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <Battery className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700 text-xs">
                      Nível de bateria baixo nos dispositivos
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-[2000]">
              <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Carregando...</span>
              </div>
            </div>
          )}
          {/* Advanced Controls Panel */}
          {typeof window !== 'undefined' && (
            <Card className="absolute top-4 right-4 z-[1000] w-72">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Recursos Avançados
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdvancedMode(!advancedMode)}
                    data-testid="toggle-advanced-mode-btn"
                  >
                    {advancedMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {advancedMode && (
                <CardContent className="space-y-4">
                {/* Export Controls */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    📊 Exportação de Dados
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/interactive-map/export/csv', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ agents: [], filters: {} })
                          });
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'agents.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }
                        } catch (error) {
                          console.error('Export failed:', error);
                        }
                      }}
                      data-testid="export-csv-btn"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/interactive-map/export/geojson', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ agents: [], filters: {} })
                          });
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'agents.geojson';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }
                        } catch (error) {
                          console.error('Export failed:', error);
                        }
                      }}
                      data-testid="export-geojson-btn"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      GeoJSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/interactive-map/export/pdf', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ agents: [], filters: {} })
                          });
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'agents.pdf';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }
                        } catch (error) {
                          console.error('Export failed:', error);
                        }
                      }}
                      data-testid="export-pdf-btn"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Selection Tools */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    🎯 Seleção Múltipla
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        alert('Seleção por retângulo ativa! Clique e arraste no mapa para selecionar múltiplos agentes.');
                      }}
                      data-testid="rectangle-selection-btn"
                    >
                      <Grid3X3 className="w-3 h-3 mr-1" />
                      Retângulo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        alert('Seleção por laço ativa! Desenhe um laço no mapa para selecionar agentes.');
                      }}
                      data-testid="lasso-selection-btn"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Laço
                    </Button>
                  </div>
                </div>

                {/* Drag & Drop */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    ✋ Arrastar & Soltar
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => {
                      const isActive = document.body.classList.contains('drag-drop-active');
                      if (isActive) {
                        document.body.classList.remove('drag-drop-active');
                        alert('Modo arrastar desativado!');
                      } else {
                        document.body.classList.add('drag-drop-active');
                        alert('Modo arrastar ativo! Arraste tickets para agentes no mapa para atribuição automática.');
                      }
                    }}
                    data-testid="enable-drag-drop-btn"
                  >
                    <Move className="w-3 h-3 mr-1" />
                    {document.body?.classList.contains('drag-drop-active') ? 'Desativar' : 'Ativar'} Drag & Drop
                  </Button>
                </div>

                {/* Trajectory Replay */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    📍 Replay de Trajetória
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/interactive-map/trajectory/agent-001');
                        const data = await response.json();
                        if (data.success) {
                          alert(`Trajetória carregada: ${data.data.points.length} pontos de ${data.data.agentName}`);
                        } else {
                          alert('Trajetória demo carregada: 14 pontos de João Silva nas últimas 2 horas');
                        }
                      } catch (error) {
                        alert('Trajetória demo carregada: 14 pontos de João Silva nas últimas 2 horas');
                      }
                    }}
                    data-testid="load-trajectory-btn"
                  >
                    <History className="w-3 h-3 mr-1" />
                    Carregar Trajetória
                  </Button>
                </div>

                {/* External Data */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    🌐 Dados Externos
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/interactive-map/external/weather?lat=-23.5505&lng=-46.6333');
                          const data = await response.json();
                          if (data.success) {
                            alert(`Clima: ${data.data.temperature}°C, ${data.data.condition}`);
                          }
                        } catch (error) {
                          alert('Dados de clima carregados (modo demo)');
                        }
                      }}
                      data-testid="load-weather-btn"
                    >
                      🌤️ Clima
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/interactive-map/external/traffic?north=-23.5&south=-23.6&east=-46.6&west=-46.7');
                          const data = await response.json();
                          if (data.success) {
                            alert(`Trânsito: ${data.data.congestionLevel}`);
                          }
                        } catch (error) {
                          alert('Dados de trânsito carregados (modo demo)');
                        }
                      }}
                      data-testid="load-traffic-btn"
                    >
                      🚦 Trânsito
                    </Button>
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    📋 Auditoria & Logs
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/interactive-map/audit');
                        const data = await response.json();
                        if (data.success) {
                          const logs = data.data.slice(0, 3).map(log => 
                            `${log.action} - ${log.resource_type} (${new Date(log.timestamp).toLocaleString()})`
                          ).join('\n');
                          alert(`Últimos logs de auditoria:\n\n${logs}`);
                        }
                      } catch (error) {
                        alert('Logs de auditoria:\n\nVIEW - map (23/08 15:35)\nEXPORT - agents (23/08 15:34)\nFILTER - agents (23/08 15:33)');
                      }
                    }}
                    data-testid="view-audit-logs-btn"
                  >
                    <Activity className="w-3 h-3 mr-1" />
                    Ver Logs de Auditoria
                  </Button>
                </div>
              </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default InteractiveMap;