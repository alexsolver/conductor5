// ✅ 1QA.MD COMPLIANCE: Interactive Map Frontend Component
// React component for field agent tracking and management

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Users, AlertTriangle, Clock, Navigation, Signal } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// ✅ Types
interface FieldAgent {
  id: string;
  agentId: string;
  name: string;
  photoUrl?: string;
  team?: string;
  skills: string[];
  status: 'available' | 'in_transit' | 'in_service' | 'paused' | 'sla_risk' | 'offline';
  statusSince?: Date;
  lat?: number;
  lng?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  deviceBattery?: number;
  signalStrength?: number;
  lastPingAt?: Date;
  assignedTicketId?: string;
  customerSiteId?: string;
  slaDeadlineAt?: Date;
  shiftStartAt?: Date;
  shiftEndAt?: Date;
  isOnDuty: boolean;
  currentRouteId?: string;
  etaSeconds?: number;
  distanceMeters?: number;
}

interface AgentStats {
  totalCount: number;
  availableCount: number;
  inTransitCount: number;
  inServiceCount: number;
  offlineCount: number;
}

// ✅ Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-500';
    case 'in_transit': return 'bg-blue-500';
    case 'in_service': return 'bg-yellow-500';
    case 'paused': return 'bg-gray-500';
    case 'sla_risk': return 'bg-red-500';
    case 'offline': return 'bg-gray-400';
    default: return 'bg-gray-500';
  }
};

// ✅ Main Component
export default function InteractiveMap() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // ✅ Fetch agent statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/interactive-map/agents/stats'],
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // ✅ Fetch field agents with filters
  const { data: agentsData, isLoading: agentsLoading, error } = useQuery({
    queryKey: ['/api/interactive-map/agents', { status: filterStatus, team: filterTeam, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterTeam && filterTeam !== 'all') {
        params.append('teams', filterTeam);
      }
      
      const url = `/api/interactive-map/agents?${params.toString()}`;
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    refetchInterval: 15000 // Auto-refresh every 15 seconds
  });

  // ✅ Simulate location update
  const locationUpdateMutation = useMutation({
    mutationFn: async (data: { agentId: string; lat: number; lng: number }) => {
      const response = await apiRequest('POST', '/api/interactive-map/agents/location', {
        agentId: data.agentId,
        lat: data.lat,
        lng: data.lng,
        accuracy: 10
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interactive-map/agents'] });
    }
  });

  const agents: FieldAgent[] = agentsData?.data?.agents || [];
  const agentStats: AgentStats = stats?.data || {
    totalCount: 0,
    availableCount: 0,
    inTransitCount: 0,
    inServiceCount: 0,
    offlineCount: 0
  };

  // ✅ Get unique teams for filter
  const teams = Array.from(new Set(agents.map(agent => agent.team).filter(Boolean)));

  // ✅ Filter agents based on search
  const filteredAgents = agents.filter(agent => {
    if (searchQuery) {
      return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             agent.agentId.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interactive Map</h1>
          <p className="text-muted-foreground">Real-time field agent tracking and management</p>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* ✅ Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{agentStats.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{agentStats.availableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Navigation className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">{agentStats.inTransitCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Service</p>
                <p className="text-2xl font-bold">{agentStats.inServiceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold">{agentStats.offlineCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Agents</Label>
              <Input
                id="search"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status Filter</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="in_service">In Service</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team">Team Filter</Label>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team!}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load agents. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>Field Agents ({filteredAgents.length})</CardTitle>
          <CardDescription>
            Real-time status and location of field agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading agents...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">No agents found</p>
              <p className="text-muted-foreground">Try adjusting your filters or create new field agents.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium truncate">{agent.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-white ${getStatusColor(agent.status)}`}
                          >
                            {agent.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">ID: {agent.agentId}</p>
                        
                        {agent.team && (
                          <p className="text-sm text-muted-foreground">Team: {agent.team}</p>
                        )}
                        
                        {agent.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {agent.skills.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          {agent.lat && agent.lng && (
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <p className="font-mono">{agent.lat.toFixed(6)}, {agent.lng.toFixed(6)}</p>
                            </div>
                          )}
                          
                          {agent.deviceBattery && (
                            <div>
                              <span className="text-muted-foreground">Battery:</span>
                              <p>{agent.deviceBattery}%</p>
                            </div>
                          )}
                          
                          {agent.signalStrength && (
                            <div className="flex items-center space-x-1">
                              <Signal className="h-4 w-4" />
                              <span>{agent.signalStrength}%</span>
                            </div>
                          )}
                          
                          {agent.lastPingAt && (
                            <div>
                              <span className="text-muted-foreground">Last Ping:</span>
                              <p>{new Date(agent.lastPingAt).toLocaleTimeString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {agent.lat && agent.lng && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Simulate location update with small random change
                            const newLat = agent.lat! + (Math.random() - 0.5) * 0.001;
                            const newLng = agent.lng! + (Math.random() - 0.5) * 0.001;
                            locationUpdateMutation.mutate({
                              agentId: agent.agentId,
                              lat: newLat,
                              lng: newLng
                            });
                          }}
                          disabled={locationUpdateMutation.isPending}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Update Location
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
