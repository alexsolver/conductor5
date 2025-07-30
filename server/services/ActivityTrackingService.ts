
import { Request } from 'express';
import { db } from "./db";
import { sql } from 'drizzle-orm';

interface ActivityData {
  userId: string;
  tenantId: string;
  activityType: string;
  resourceType?: string;
  resourceId?: string;
  action: 'start' | 'end' | 'update';
  metadata?: Record<string, any>;
  sessionId?: string;
  pageUrl?: string;
  userAgent?: string;
  ipAddress?: string;
}

export class ActivityTrackingService {
  private static activeActivities = new Map<string, any>();

  static async startActivity(data: ActivityData, req?: Request): Promise<string> {
    const activityId = crypto.randomUUID();
    const now = new Date();
    
    // Extract additional data from request if available
    const enrichedData = {
      ...data,
      sessionId: data.sessionId || this.extractSessionId(req),
      pageUrl: data.pageUrl || req?.get('referer'),
      userAgent: data.userAgent || req?.get('user-agent'),
      ipAddress: data.ipAddress || this.extractIpAddress(req),
    };

    try {
      await db.execute(sql`
        INSERT INTO ${sql.identifier(this.getTenantSchema(data.tenantId))}.user_activity_tracking 
        (id, tenant_id, user_id, session_id, activity_type, resource_type, resource_id, 
         action, metadata, start_time, page_url, user_agent, ip_address)
        VALUES (${activityId}, ${data.tenantId}, ${data.userId}, ${enrichedData.sessionId},
                ${data.activityType}, ${data.resourceType}, ${data.resourceId}, 
                ${data.action}, ${JSON.stringify(data.metadata || {})}, ${now},
                ${enrichedData.pageUrl}, ${enrichedData.userAgent}, ${enrichedData.ipAddress})
      `);

      // Store in memory for tracking duration
      this.activeActivities.set(activityId, {
        ...enrichedData,
        startTime: now,
        activityId
      });

      return activityId;
    } catch (error) {
      console.error('Error starting activity tracking:', error);
      throw error;
    }
  }

  static async endActivity(activityId: string, metadata?: Record<string, any>): Promise<void> {
    const activity = this.activeActivities.get(activityId);
    if (!activity) return;

    const now = new Date();
    const durationSeconds = Math.floor((now.getTime() - activity.startTime.getTime()) / 1000);

    try {
      await db.execute(sql`
        UPDATE ${sql.identifier(this.getTenantSchema(activity.tenantId))}.user_activity_tracking 
        SET end_time = ${now}, 
            duration_seconds = ${durationSeconds},
            action = 'end',
            metadata = ${JSON.stringify({ ...activity.metadata, ...metadata })},
            updated_at = ${now}
        WHERE id = ${activityId}
      `);

      this.activeActivities.delete(activityId);
    } catch (error) {
      console.error('Error ending activity tracking:', error);
      throw error;
    }
  }

  static async updateActivity(activityId: string, metadata: Record<string, any>): Promise<void> {
    const activity = this.activeActivities.get(activityId);
    if (!activity) return;

    try {
      await db.execute(sql`
        UPDATE ${sql.identifier(this.getTenantSchema(activity.tenantId))}.user_activity_tracking 
        SET metadata = ${JSON.stringify({ ...activity.metadata, ...metadata })},
            action = 'update',
            updated_at = ${new Date()}
        WHERE id = ${activityId}
      `);

      // Update in memory
      activity.metadata = { ...activity.metadata, ...metadata };
    } catch (error) {
      console.error('Error updating activity tracking:', error);
      throw error;
    }
  }

  static async getProductivityReport(
    tenantId: string, 
    userId?: string, 
    startDate?: Date, 
    endDate?: Date
  ) {
    const whereConditions = [`tenant_id = '${tenantId}'`];
    
    if (userId) {
      whereConditions.push(`user_id = '${userId}'`);
    }
    
    if (startDate) {
      whereConditions.push(`created_at >= '${startDate.toISOString()}'`);
    }
    
    if (endDate) {
      whereConditions.push(`created_at <= '${endDate.toISOString()}'`);
    }

    try {
      const result = await db.execute(sql`
        SELECT 
          user_id,
          activity_type,
          resource_type,
          COUNT(*) as total_activities,
          SUM(duration_seconds) as total_duration_seconds,
          AVG(duration_seconds) as avg_duration_seconds,
          DATE(created_at) as activity_date
        FROM ${sql.identifier(this.getTenantSchema(tenantId))}.user_activity_tracking 
        WHERE ${sql.raw(whereConditions.join(' AND '))}
          AND duration_seconds IS NOT NULL
        GROUP BY user_id, activity_type, resource_type, DATE(created_at)
        ORDER BY activity_date DESC, total_duration_seconds DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error getting productivity report:', error);
      throw error;
    }
  }

  private static getTenantSchema(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  private static extractSessionId(req?: Request): string {
    return req?.sessionID || req?.headers['x-session-id'] as string || crypto.randomUUID();
  }

  private static extractIpAddress(req?: Request): string {
    return req?.ip || 
           req?.headers['x-forwarded-for'] as string || 
           req?.headers['x-real-ip'] as string || 
           req?.connection?.remoteAddress || 
           'unknown';
  }
}
