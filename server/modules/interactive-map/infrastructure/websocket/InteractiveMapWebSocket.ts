// ===========================================================================================
// INTERACTIVE MAP WEBSOCKET - Real-time Updates for Field Agents
// Supports >1000 agents with delta updates and intelligent broadcasting
// ===========================================================================================

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { EnhancedFieldAgent, EnhancedFieldAgentResponse } from '../../domain/entities/EnhancedFieldAgent';
import { AgentStatusType } from '@shared/schema-mobile-integration';

// ===========================================================================================
// WebSocket Event Types
// ===========================================================================================

export interface MapWebSocketEvents {
  // Agent Updates
  'agent_position_update': AgentPositionUpdate;
  'agent_status_change': AgentStatusChange;
  'agent_route_update': AgentRouteUpdate;
  'agents_bulk_update': AgentsBulkUpdate;
  
  // System Events
  'sla_alert': SlaAlert;
  'battery_warning': BatteryWarning;
  'connectivity_issue': ConnectivityIssue;
  'traffic_update': TrafficUpdate;
  'weather_alert': WeatherAlert;
  
  // User Actions
  'agent_assignment': AgentAssignment;
  'route_recalculation': RouteRecalculation;
  
  // Filter/View Updates
  'filter_applied': FilterApplied;
  'view_bounds_changed': ViewBoundsChanged;
}

export interface AgentPositionUpdate {
  agent_id: string;
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  previous_position?: { lat: number; lng: number };
}

export interface AgentStatusChange {
  agent_id: string;
  from_status: AgentStatusType;
  to_status: AgentStatusType;
  change_reason: string;
  timestamp: string;
  location?: { lat: number; lng: number };
}

export interface AgentRouteUpdate {
  agent_id: string;
  route_id: string;
  eta_seconds: number;
  distance_meters: number;
  traffic_impact?: string;
  timestamp: string;
}

export interface AgentsBulkUpdate {
  agents: EnhancedFieldAgentResponse[];
  total_count: number;
  update_type: 'full' | 'delta' | 'filtered';
  timestamp: string;
}

export interface SlaAlert {
  agent_id: string;
  ticket_id: string;
  alert_type: 'warning' | 'breach';
  sla_deadline: string;
  current_eta_seconds: number;
  location: { lat: number; lng: number };
  timestamp: string;
}

export interface BatteryWarning {
  agent_id: string;
  battery_level: number;
  location: { lat: number; lng: number };
  timestamp: string;
}

export interface ConnectivityIssue {
  agent_id: string;
  issue_type: 'offline' | 'poor_signal' | 'gps_disabled';
  last_seen: string;
  timestamp: string;
}

export interface TrafficUpdate {
  affected_routes: string[];
  impact_level: 'light' | 'moderate' | 'heavy' | 'severe';
  description: string;
  timestamp: string;
}

export interface WeatherAlert {
  alert_type: 'rain' | 'storm' | 'fog' | 'snow';
  severity: 'low' | 'medium' | 'high';
  affected_area: { bounds: [number, number, number, number] };
  description: string;
  timestamp: string;
}

export interface AgentAssignment {
  agent_id: string;
  ticket_id: string;
  assigned_by: string;
  estimated_eta: number;
  timestamp: string;
}

export interface RouteRecalculation {
  agent_id: string;
  route_id: string;
  old_eta_seconds: number;
  new_eta_seconds: number;
  reason: string;
  timestamp: string;
}

export interface FilterApplied {
  user_id: string;
  filter_type: string;
  filter_values: any;
  result_count: number;
  timestamp: string;
}

export interface ViewBoundsChanged {
  user_id: string;
  bounds: [number, number, number, number]; // [south, west, north, east]
  zoom_level: number;
  visible_agents: string[];
  timestamp: string;
}

// ===========================================================================================
// WebSocket Client Connection
// ===========================================================================================

export interface MapWebSocketClient {
  id: string;
  ws: WebSocket;
  tenant_id: string;
  user_id: string;
  subscriptions: Set<string>;
  view_bounds?: [number, number, number, number];
  active_filters: Record<string, any>;
  last_activity: Date;
  connection_quality: 'good' | 'poor' | 'unstable';
}

// ===========================================================================================
// Interactive Map WebSocket Server
// ===========================================================================================

export class InteractiveMapWebSocket {
  private wss: WebSocketServer;
  private clients = new Map<string, MapWebSocketClient>();
  private tenantClients = new Map<string, Set<string>>(); // tenant_id -> client_ids
  private agentSubscriptions = new Map<string, Set<string>>(); // agent_id -> client_ids
  
  // Performance tracking
  private messageQueue: Array<{ type: string; data: any; targets: string[] }> = [];
  private lastBroadcast = new Date();
  private connectionCount = 0;
  
  // Rate limiting
  private readonly MAX_MESSAGES_PER_SECOND = 100;
  private readonly BULK_UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly CLIENT_TIMEOUT = 300000; // 5 minutes

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/interactive-map',
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 1,
          chunkSize: 1024,
        },
        threshold: 1024,
        concurrencyLimit: 10,
      }
    });

    this.setupWebSocketServer();
    this.startBackgroundJobs();
  }

  // ===========================================================================================
  // WebSocket Server Setup
  // ===========================================================================================

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      this.handleNewConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      console.error('[INTERACTIVE-MAP-WS] WebSocket server error:', error);
    });

    console.log('🗺️ [INTERACTIVE-MAP-WS] WebSocket server initialized on /ws/interactive-map');
  }

  private handleNewConnection(ws: WebSocket, request: any): void {
    const clientId = this.generateClientId();
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const tenantId = url.searchParams.get('tenant_id');
    const userId = url.searchParams.get('user_id');

    if (!tenantId || !userId) {
      ws.close(1008, 'Missing tenant_id or user_id');
      return;
    }

    const client: MapWebSocketClient = {
      id: clientId,
      ws,
      tenant_id: tenantId,
      user_id: userId,
      subscriptions: new Set(),
      active_filters: {},
      last_activity: new Date(),
      connection_quality: 'good'
    };

    this.clients.set(clientId, client);
    this.addClientToTenant(tenantId, clientId);
    this.connectionCount++;

    console.log(`🗺️ [INTERACTIVE-MAP-WS] New connection: ${clientId} (tenant: ${tenantId}, user: ${userId})`);

    // Setup client event handlers
    ws.on('message', (data) => this.handleClientMessage(clientId, data));
    ws.on('close', () => this.handleClientDisconnect(clientId));
    ws.on('error', (error) => this.handleClientError(clientId, error));
    ws.on('pong', () => this.handleClientPong(clientId));

    // Send initial connection confirmation
    this.sendToClient(clientId, 'connection_established', {
      client_id: clientId,
      server_time: new Date().toISOString(),
      supported_events: Object.keys({} as MapWebSocketEvents)
    });
  }

  private handleClientMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.last_activity = new Date();

    try {
      const message = JSON.parse(data.toString());
      this.processClientMessage(clientId, message);
    } catch (error) {
      console.error(`[INTERACTIVE-MAP-WS] Invalid message from ${clientId}:`, error);
      this.sendToClient(clientId, 'error', { message: 'Invalid JSON format' });
    }
  }

  private processClientMessage(clientId: string, message: any): void {
    const { type, data } = message;

    switch (type) {
      case 'subscribe_agents':
        this.handleAgentSubscription(clientId, data.agent_ids || []);
        break;
      
      case 'update_filters':
        this.handleFilterUpdate(clientId, data.filters || {});
        break;
      
      case 'update_view_bounds':
        this.handleViewBoundsUpdate(clientId, data.bounds, data.zoom_level);
        break;
      
      case 'request_agent_details':
        this.handleAgentDetailsRequest(clientId, data.agent_id);
        break;
      
      case 'ping':
        this.sendToClient(clientId, 'pong', { timestamp: new Date().toISOString() });
        break;
      
      default:
        console.warn(`[INTERACTIVE-MAP-WS] Unknown message type: ${type} from ${clientId}`);
    }
  }

  private handleClientDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.removeClientFromTenant(client.tenant_id, clientId);
      this.removeClientFromAgentSubscriptions(clientId);
      this.clients.delete(clientId);
      this.connectionCount--;
      
      console.log(`🗺️ [INTERACTIVE-MAP-WS] Client disconnected: ${clientId}`);
    }
  }

  private handleClientError(clientId: string, error: Error): void {
    console.error(`[INTERACTIVE-MAP-WS] Client error ${clientId}:`, error);
    const client = this.clients.get(clientId);
    if (client) {
      client.connection_quality = 'poor';
    }
  }

  private handleClientPong(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.last_activity = new Date();
      client.connection_quality = 'good';
    }
  }

  // ===========================================================================================
  // Subscription Management
  // ===========================================================================================

  private handleAgentSubscription(clientId: string, agentIds: string[]): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from previous subscriptions
    this.removeClientFromAgentSubscriptions(clientId);

    // Add to new subscriptions
    client.subscriptions.clear();
    agentIds.forEach(agentId => {
      client.subscriptions.add(agentId);
      
      if (!this.agentSubscriptions.has(agentId)) {
        this.agentSubscriptions.set(agentId, new Set());
      }
      this.agentSubscriptions.get(agentId)!.add(clientId);
    });

    this.sendToClient(clientId, 'subscription_updated', {
      subscribed_agents: agentIds,
      count: agentIds.length
    });
  }

  private handleFilterUpdate(clientId: string, filters: Record<string, any>): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.active_filters = filters;

    // Emit filter event for analytics
    this.broadcastToTenant(client.tenant_id, 'filter_applied', {
      user_id: client.user_id,
      filter_type: Object.keys(filters).join(','),
      filter_values: filters,
      result_count: 0, // Will be updated by application layer
      timestamp: new Date().toISOString()
    }, [clientId]); // Exclude sender
  }

  private handleViewBoundsUpdate(clientId: string, bounds: [number, number, number, number], zoomLevel: number): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.view_bounds = bounds;

    // Emit view bounds change for optimization
    this.broadcastToTenant(client.tenant_id, 'view_bounds_changed', {
      user_id: client.user_id,
      bounds,
      zoom_level: zoomLevel,
      visible_agents: [], // Will be calculated by application layer
      timestamp: new Date().toISOString()
    }, [clientId]); // Exclude sender
  }

  private handleAgentDetailsRequest(clientId: string, agentId: string): void {
    // This would typically fetch detailed agent data and send it back
    // For now, we'll emit an event that the application layer can handle
    this.sendToClient(clientId, 'agent_details_requested', {
      agent_id: agentId,
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================================================================
  // Broadcasting Methods
  // ===========================================================================================

  /**
   * Broadcast agent position update to subscribed clients
   */
  public broadcastAgentPositionUpdate(agentPositionUpdate: AgentPositionUpdate): void {
    const subscribedClients = this.agentSubscriptions.get(agentPositionUpdate.agent_id);
    if (!subscribedClients || subscribedClients.size === 0) return;

    const targetClients = Array.from(subscribedClients);
    this.broadcastToClients(targetClients, 'agent_position_update', agentPositionUpdate);
  }

  /**
   * Broadcast agent status change to all tenant clients
   */
  public broadcastAgentStatusChange(tenantId: string, statusChange: AgentStatusChange): void {
    this.broadcastToTenant(tenantId, 'agent_status_change', statusChange);
  }

  /**
   * Broadcast bulk agent updates with delta optimization
   */
  public broadcastAgentsBulkUpdate(tenantId: string, bulkUpdate: AgentsBulkUpdate): void {
    this.broadcastToTenant(tenantId, 'agents_bulk_update', bulkUpdate);
  }

  /**
   * Broadcast SLA alert with priority
   */
  public broadcastSlaAlert(tenantId: string, slaAlert: SlaAlert): void {
    this.broadcastToTenant(tenantId, 'sla_alert', slaAlert);
  }

  /**
   * Broadcast to all clients in a tenant
   */
  private broadcastToTenant(tenantId: string, eventType: keyof MapWebSocketEvents, data: any, excludeClients: string[] = []): void {
    const tenantClientIds = this.tenantClients.get(tenantId);
    if (!tenantClientIds) return;

    const targetClients = Array.from(tenantClientIds).filter(id => !excludeClients.includes(id));
    this.broadcastToClients(targetClients, eventType, data);
  }

  /**
   * Broadcast to specific clients
   */
  private broadcastToClients(clientIds: string[], eventType: keyof MapWebSocketEvents, data: any): void {
    const message = JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });

    let successCount = 0;
    let failCount = 0;

    clientIds.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message);
          successCount++;
        } catch (error) {
          console.error(`[INTERACTIVE-MAP-WS] Failed to send to ${clientId}:`, error);
          failCount++;
        }
      } else {
        failCount++;
      }
    });

    if (failCount > 0) {
      console.warn(`[INTERACTIVE-MAP-WS] Broadcast ${eventType}: ${successCount} success, ${failCount} failed`);
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, eventType: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify({
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error(`[INTERACTIVE-MAP-WS] Failed to send to ${clientId}:`, error);
    }
  }

  // ===========================================================================================
  // Background Jobs & Maintenance
  // ===========================================================================================

  private startBackgroundJobs(): void {
    // Health check ping every 30 seconds
    setInterval(() => this.performHealthCheck(), 30000);
    
    // Clean up inactive clients every 60 seconds
    setInterval(() => this.cleanupInactiveClients(), 60000);
    
    // Process message queue every 100ms for rate limiting
    setInterval(() => this.processMessageQueue(), 100);
  }

  private performHealthCheck(): void {
    const ping = JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() });
    
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.ping();
        } catch (error) {
          console.error(`[INTERACTIVE-MAP-WS] Health check failed for ${clientId}:`, error);
          this.handleClientDisconnect(clientId);
        }
      } else {
        this.handleClientDisconnect(clientId);
      }
    });
  }

  private cleanupInactiveClients(): void {
    const now = new Date();
    const inactiveThreshold = new Date(now.getTime() - this.CLIENT_TIMEOUT);
    
    this.clients.forEach((client, clientId) => {
      if (client.last_activity < inactiveThreshold) {
        console.log(`[INTERACTIVE-MAP-WS] Cleaning up inactive client: ${clientId}`);
        this.handleClientDisconnect(clientId);
      }
    });
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    const messagesToProcess = this.messageQueue.splice(0, this.MAX_MESSAGES_PER_SECOND);
    
    messagesToProcess.forEach(({ type, data, targets }) => {
      this.broadcastToClients(targets, type as keyof MapWebSocketEvents, data);
    });
  }

  // ===========================================================================================
  // Utility Methods
  // ===========================================================================================

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addClientToTenant(tenantId: string, clientId: string): void {
    if (!this.tenantClients.has(tenantId)) {
      this.tenantClients.set(tenantId, new Set());
    }
    this.tenantClients.get(tenantId)!.add(clientId);
  }

  private removeClientFromTenant(tenantId: string, clientId: string): void {
    const tenantSet = this.tenantClients.get(tenantId);
    if (tenantSet) {
      tenantSet.delete(clientId);
      if (tenantSet.size === 0) {
        this.tenantClients.delete(tenantId);
      }
    }
  }

  private removeClientFromAgentSubscriptions(clientId: string): void {
    this.agentSubscriptions.forEach((clientSet, agentId) => {
      clientSet.delete(clientId);
      if (clientSet.size === 0) {
        this.agentSubscriptions.delete(agentId);
      }
    });
  }

  // ===========================================================================================
  // Statistics & Monitoring
  // ===========================================================================================

  public getConnectionStats(): {
    total_connections: number;
    connections_by_tenant: Record<string, number>;
    agent_subscriptions: number;
    uptime_seconds: number;
  } {
    const connectionsByTenant: Record<string, number> = {};
    
    this.tenantClients.forEach((clientSet, tenantId) => {
      connectionsByTenant[tenantId] = clientSet.size;
    });

    return {
      total_connections: this.connectionCount,
      connections_by_tenant: connectionsByTenant,
      agent_subscriptions: this.agentSubscriptions.size,
      uptime_seconds: Math.floor((Date.now() - this.lastBroadcast.getTime()) / 1000)
    };
  }
}

// ===========================================================================================
// Export Singleton Instance
// ===========================================================================================

let webSocketInstance: InteractiveMapWebSocket | null = null;

export function initializeInteractiveMapWebSocket(server: Server): InteractiveMapWebSocket {
  if (!webSocketInstance) {
    webSocketInstance = new InteractiveMapWebSocket(server);
  }
  return webSocketInstance;
}

export function getInteractiveMapWebSocket(): InteractiveMapWebSocket | null {
  return webSocketInstance;
}