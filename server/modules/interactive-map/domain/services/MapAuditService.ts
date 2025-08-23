// ===========================================================================================
// MAP AUDIT SERVICE - Audit Logs for Map Visualization and Access Control
// ===========================================================================================

import { db } from '../../../../db';
import { sql } from 'drizzle-orm';

export interface MapAuditEvent {
  id?: string;
  userId: string;
  tenantId: string;
  eventType: MapAuditEventType;
  resourceType: 'agent' | 'route' | 'export' | 'filter' | 'view';
  resourceId?: string;
  details: Record<string, any>;
  clientInfo: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
  timestamp: Date;
}

export type MapAuditEventType = 
  | 'agent_view'
  | 'agent_location_access'
  | 'route_view'
  | 'trajectory_export'
  | 'data_export'
  | 'filter_applied'
  | 'search_performed'
  | 'agent_assignment'
  | 'unauthorized_access_attempt';

export interface AuditQueryFilters {
  userId?: string;
  eventType?: MapAuditEventType[];
  resourceType?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

export class MapAuditService {
  
  // ===========================================================================================
  // Create Audit Log Entry
  // ===========================================================================================
  
  static async logEvent(event: MapAuditEvent): Promise<void> {
    try {
      // Ensure table exists with proper structure
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS map_audit_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          tenant_id UUID NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          resource_type VARCHAR(30) NOT NULL,
          resource_id VARCHAR(255),
          details JSONB DEFAULT '{}',
          client_info JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        INSERT INTO map_audit_logs (
          user_id,
          tenant_id,
          event_type,
          resource_type,
          resource_id,
          details,
          client_info,
          created_at
        ) VALUES (
          ${event.userId}::uuid,
          ${event.tenantId}::uuid,
          ${event.eventType},
          ${event.resourceType},
          ${event.resourceId || null},
          ${JSON.stringify(event.details)}::jsonb,
          ${JSON.stringify(event.clientInfo)}::jsonb,
          ${event.timestamp}
        )
      `);
    } catch (error) {
      console.error('[MAP-AUDIT] Failed to log event:', error);
      // Don't throw error to avoid disrupting main functionality
    }
  }

  // ===========================================================================================
  // Agent Access Logging
  // ===========================================================================================
  
  static async logAgentView(
    userId: string, 
    tenantId: string, 
    agentId: string,
    viewDetails: {
      agentName?: string;
      location?: { lat: number; lng: number };
      viewType: 'popup' | 'list' | 'map_marker';
      duration?: number; // seconds
    },
    clientInfo: any
  ): Promise<void> {
    await this.logEvent({
      userId,
      tenantId,
      eventType: 'agent_view',
      resourceType: 'agent',
      resourceId: agentId,
      details: {
        ...viewDetails,
        privacy_compliance: true,
        access_reason: 'operational_monitoring'
      },
      clientInfo,
      timestamp: new Date()
    });
  }

  static async logLocationAccess(
    userId: string,
    tenantId: string,
    agentIds: string[],
    accessReason: string,
    clientInfo: any
  ): Promise<void> {
    await this.logEvent({
      userId,
      tenantId,
      eventType: 'agent_location_access',
      resourceType: 'agent',
      resourceId: agentIds.join(','),
      details: {
        agent_count: agentIds.length,
        access_reason: accessReason,
        gdpr_compliance: true,
        data_minimization: true
      },
      clientInfo,
      timestamp: new Date()
    });
  }

  // ===========================================================================================
  // Export Activity Logging
  // ===========================================================================================
  
  static async logDataExport(
    userId: string,
    tenantId: string,
    exportType: 'csv' | 'geojson' | 'pdf',
    exportDetails: {
      agentCount: number;
      filters?: any;
      includesPersonalData: boolean;
      fileSize?: number;
    },
    clientInfo: any
  ): Promise<void> {
    await this.logEvent({
      userId,
      tenantId,
      eventType: 'data_export',
      resourceType: 'export',
      details: {
        export_type: exportType,
        ...exportDetails,
        gdpr_notice: 'Data exported for operational purposes only',
        retention_policy: '30_days'
      },
      clientInfo,
      timestamp: new Date()
    });
  }

  static async logTrajectoryExport(
    userId: string,
    tenantId: string,
    agentId: string,
    timeRange: { start: Date; end: Date },
    clientInfo: any
  ): Promise<void> {
    await this.logEvent({
      userId,
      tenantId,
      eventType: 'trajectory_export',
      resourceType: 'route',
      resourceId: agentId,
      details: {
        time_range: timeRange,
        privacy_impact: 'high',
        business_justification: 'Performance analysis and route optimization',
        data_retention: '30_days'
      },
      clientInfo,
      timestamp: new Date()
    });
  }

  // ===========================================================================================
  // Query Audit Logs
  // ===========================================================================================
  
  static async getAuditLogs(
    tenantId: string,
    filters: AuditQueryFilters = {}
  ): Promise<MapAuditEvent[]> {
    try {
      let query = sql`
        SELECT 
          id,
          user_id,
          tenant_id,
          event_type,
          resource_type,
          resource_id,
          details,
          client_info,
          created_at
        FROM map_audit_logs 
        WHERE tenant_id = ${tenantId}
      `;

      // Add filters
      if (filters.userId) {
        query = sql`${query} AND user_id = ${filters.userId}`;
      }

      if (filters.eventType && filters.eventType.length > 0) {
        query = sql`${query} AND event_type = ANY(${filters.eventType})`;
      }

      if (filters.resourceType && filters.resourceType.length > 0) {
        query = sql`${query} AND resource_type = ANY(${filters.resourceType})`;
      }

      if (filters.dateRange) {
        query = sql`${query} AND created_at >= ${filters.dateRange.start} AND created_at <= ${filters.dateRange.end}`;
      }

      query = sql`${query} ORDER BY created_at DESC`;

      if (filters.limit) {
        query = sql`${query} LIMIT ${filters.limit}`;
      }

      if (filters.offset) {
        query = sql`${query} OFFSET ${filters.offset}`;
      }

      const results = await db.execute(query);
      
      return results.map(row => ({
        id: row.id,
        userId: row.user_id,
        tenantId: row.tenant_id,
        eventType: row.event_type as MapAuditEventType,
        resourceType: row.resource_type as any,
        resourceId: row.resource_id,
        details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
        clientInfo: typeof row.client_info === 'string' ? JSON.parse(row.client_info) : row.client_info,
        timestamp: new Date(row.created_at)
      }));

    } catch (error) {
      console.error('[MAP-AUDIT] Failed to query audit logs:', error);
      throw new Error('Failed to retrieve audit logs');
    }
  }

  // ===========================================================================================
  // Privacy Compliance Reports
  // ===========================================================================================
  
  static async generatePrivacyReport(
    tenantId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    totalAccesses: number;
    userAccesses: { userId: string; count: number }[];
    sensitiveDataAccess: number;
    exportActivity: { type: string; count: number }[];
    complianceStatus: 'compliant' | 'review_required';
  }> {
    try {
      const logs = await this.getAuditLogs(tenantId, { dateRange });
      
      const totalAccesses = logs.length;
      const userAccesses = logs.reduce((acc, log) => {
        acc[log.userId] = (acc[log.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sensitiveDataAccess = logs.filter(log => 
        log.eventType === 'agent_location_access' || 
        log.eventType === 'trajectory_export'
      ).length;

      const exportActivity = logs
        .filter(log => log.eventType === 'data_export')
        .reduce((acc, log) => {
          const type = log.details.export_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      return {
        totalAccesses,
        userAccesses: Object.entries(userAccesses).map(([userId, count]) => ({ userId, count })),
        sensitiveDataAccess,
        exportActivity: Object.entries(exportActivity).map(([type, count]) => ({ type, count })),
        complianceStatus: sensitiveDataAccess > 100 ? 'review_required' : 'compliant'
      };

    } catch (error) {
      console.error('[MAP-AUDIT] Failed to generate privacy report:', error);
      throw new Error('Failed to generate privacy report');
    }
  }

  // ===========================================================================================
  // Middleware for Express Routes
  // ===========================================================================================
  
  static createAuditMiddleware(eventType: MapAuditEventType, resourceType: string) {
    return async (req: any, res: any, next: any) => {
      const startTime = Date.now();
      
      // Store original json method to capture response
      const originalJson = res.json;
      res.json = function(data: any) {
        const duration = Date.now() - startTime;
        
        // Log the access after response
        setTimeout(() => {
          MapAuditService.logEvent({
            userId: req.user?.id || 'anonymous',
            tenantId: req.user?.tenantId || 'unknown',
            eventType,
            resourceType: resourceType as any,
            resourceId: req.params.agentId || req.params.id,
            details: {
              endpoint: req.originalUrl,
              method: req.method,
              duration_ms: duration,
              success: res.statusCode < 400,
              user_agent: req.get('User-Agent'),
              filters: req.query
            },
            clientInfo: {
              userAgent: req.get('User-Agent'),
              ipAddress: req.ip || req.connection.remoteAddress,
              sessionId: req.sessionID
            },
            timestamp: new Date()
          }).catch(error => {
            console.error('[MAP-AUDIT] Middleware logging failed:', error);
          });
        }, 0);

        return originalJson.call(this, data);
      };

      next();
    };
  }

  // Add methods for specific audit log types
  static async logDataExport(
    userId: string,
    tenantId: string,
    format: string,
    metadata: any,
    context: any
  ): Promise<void> {
    const event: MapAuditEvent = {
      userId,
      tenantId,
      eventType: 'data_export',
      resourceType: 'export',
      resourceId: 'all',
      details: { format, ...metadata },
      clientInfo: context,
      timestamp: new Date()
    };
    await this.logEvent(event);
  }

  static async logViewData(
    userId: string,
    tenantId: string,
    resourceType: 'agent' | 'route' | 'export' | 'filter' | 'view' | 'weather_data',
    resourceId: string,
    metadata: any,
    context: any
  ): Promise<void> {
    const event: MapAuditEvent = {
      userId,
      tenantId,
      eventType: resourceType === 'weather_data' ? 'agent_location_access' : 'agent_view',
      resourceType: resourceType === 'weather_data' ? 'view' : resourceType,
      resourceId,
      details: metadata,
      clientInfo: context,
      timestamp: new Date()
    };
    await this.logEvent(event);
  }

  static async logDragDropAction(
    userId: string,
    tenantId: string,
    action: string,
    metadata: any,
    context: any
  ): Promise<void> {
    const event: MapAuditEvent = {
      userId,
      tenantId,
      eventType: 'agent_assignment',
      resourceType: 'agent',
      resourceId: metadata.ticketId,
      details: metadata,
      clientInfo: context,
      timestamp: new Date()
    };
    await this.logEvent(event);
  }
}