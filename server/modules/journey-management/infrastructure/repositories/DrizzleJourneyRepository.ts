
import { sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { IJourneyRepository } from '../../domain/repositories/IJourneyRepository';
import { Journey, JourneyCheckpoint, JourneyMetrics } from '../../domain/entities/Journey';

export class DrizzleJourneyRepository implements IJourneyRepository {
  private getSchemaName(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
  }

  async create(journeyData: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>): Promise<Journey> {
    const schemaName = this.getSchemaName(journeyData.tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const result = await db.execute(sql`
      INSERT INTO ${schemaId}.journeys (
        tenant_id, user_id, start_time, end_time, status, 
        notes, total_hours, location
      ) VALUES (
        ${journeyData.tenantId}, ${journeyData.userId}, ${journeyData.startTime}, 
        ${journeyData.endTime || null}, ${journeyData.status}, 
        ${journeyData.notes || null}, ${journeyData.totalHours || null}, 
        ${journeyData.location ? JSON.stringify(journeyData.location) : null}
      ) RETURNING *
    `);
    
    const journey = result.rows[0];
    return {
      id: journey.id,
      tenantId: journey.tenant_id,
      userId: journey.user_id,
      startTime: journey.start_time,
      endTime: journey.end_time || undefined,
      status: journey.status,
      notes: journey.notes || undefined,
      totalHours: journey.total_hours ? parseFloat(journey.total_hours) : undefined,
      location: journey.location ? JSON.parse(journey.location) : undefined,
      createdAt: journey.created_at,
      updatedAt: journey.updated_at,
    };
  }

  async findById(id: string, tenantId: string): Promise<Journey | null> {
    const schemaName = this.getSchemaName(tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const result = await db.execute(sql`
      SELECT * FROM ${schemaId}.journeys 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `);
    
    if (result.rows.length === 0) return null;
    
    const journey = result.rows[0];
    return {
      id: journey.id,
      tenantId: journey.tenant_id,
      userId: journey.user_id,
      startTime: journey.start_time,
      endTime: journey.end_time || undefined,
      status: journey.status,
      notes: journey.notes || undefined,
      totalHours: journey.total_hours ? parseFloat(journey.total_hours) : undefined,
      location: journey.location ? JSON.parse(journey.location) : undefined,
      createdAt: journey.created_at,
      updatedAt: journey.updated_at,
    };
  }

  async findByUserId(userId: string, tenantId: string, date?: Date): Promise<Journey[]> {
    const schemaName = this.getSchemaName(tenantId);
    const schemaId = sql.identifier(schemaName);
    
    let query = sql`
      SELECT * FROM ${schemaId}.journeys 
      WHERE user_id = ${userId} AND tenant_id = ${tenantId}
    `;

    if (date) {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      query = sql`
        SELECT * FROM ${schemaId}.journeys 
        WHERE user_id = ${userId} AND tenant_id = ${tenantId}
        AND start_time >= ${startOfDay} AND start_time < ${endOfDay}
      `;
    }

    query = sql`${query} ORDER BY start_time`;

    const result = await db.execute(query);
    
    return result.rows.map(journey => ({
      id: journey.id,
      tenantId: journey.tenant_id,
      userId: journey.user_id,
      startTime: journey.start_time,
      endTime: journey.end_time || undefined,
      status: journey.status,
      notes: journey.notes || undefined,
      totalHours: journey.total_hours ? parseFloat(journey.total_hours) : undefined,
      location: journey.location ? JSON.parse(journey.location) : undefined,
      createdAt: journey.created_at,
      updatedAt: journey.updated_at,
    }));
  }

  async findActiveByUserId(userId: string, tenantId: string): Promise<Journey | null> {
    const [journey] = await db
      .select()
      .from(journeys)
      .where(and(
        eq(journeys.userId, userId),
        eq(journeys.tenantId, tenantId),
        eq(journeys.status, 'active')
      ));
    
    if (!journey) return null;

    return {
      ...journey,
      endTime: journey.endTime || undefined,
      notes: journey.notes || undefined,
      totalHours: journey.totalHours ? parseFloat(journey.totalHours) : undefined,
      overtimeHours: journey.overtimeHours ? parseFloat(journey.overtimeHours) : undefined,
      location: journey.location ? JSON.parse(journey.location) : undefined,
    };
  }
    
    return {
      ...journey,
      location: journey.location ? JSON.parse(journey.location) : undefined,
    };
  }

  async update(id: string, tenantId: string, data: Partial<Journey>): Promise<Journey> {
    const updateData = {
      ...data,
      location: data.location ? JSON.stringify(data.location) : undefined,
      updatedAt: new Date(),
    };

    const [journey] = await db
      .update(journeys)
      .set(updateData)
      .where(and(eq(journeys.id, id), eq(journeys.tenantId, tenantId)))
      .returning();
    
    return {
      ...journey,
      location: journey.location ? JSON.parse(journey.location) : undefined,
    };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await db
      .delete(journeys)
      .where(and(eq(journeys.id, id), eq(journeys.tenantId, tenantId)));
  }

  async createCheckpoint(checkpointData: Omit<JourneyCheckpoint, 'id' | 'createdAt'>): Promise<JourneyCheckpoint> {
    const [checkpoint] = await db.insert(journeyCheckpoints).values({
      ...checkpointData,
      location: checkpointData.location ? JSON.stringify(checkpointData.location) : null,
      metadata: checkpointData.metadata ? JSON.stringify(checkpointData.metadata) : null,
    }).returning();
    
    return {
      ...checkpoint,
      location: checkpoint.location ? JSON.parse(checkpoint.location) : undefined,
      metadata: checkpoint.metadata ? JSON.parse(checkpoint.metadata) : undefined,
    };
  }

  async findCheckpointsByJourneyId(journeyId: string, tenantId: string): Promise<JourneyCheckpoint[]> {
    const results = await db
      .select()
      .from(journeyCheckpoints)
      .where(and(
        eq(journeyCheckpoints.journeyId, journeyId),
        eq(journeyCheckpoints.tenantId, tenantId)
      ))
      .orderBy(journeyCheckpoints.timestamp);
    
    return results.map(checkpoint => ({
      ...checkpoint,
      location: checkpoint.location ? JSON.parse(checkpoint.location) : undefined,
      metadata: checkpoint.metadata ? JSON.parse(checkpoint.metadata) : undefined,
    }));
  }

  async createMetrics(metricsData: Omit<JourneyMetrics, 'id' | 'createdAt'>): Promise<JourneyMetrics> {
    const [metrics] = await db.insert(journeyMetrics).values(metricsData).returning();
    return metrics;
  }

  async findMetricsByDateRange(tenantId: string, startDate: Date, endDate: Date, userId?: string): Promise<JourneyMetrics[]> {
    let whereCondition = and(
      eq(journeyMetrics.tenantId, tenantId),
      gte(journeyMetrics.date, startDate),
      lte(journeyMetrics.date, endDate)
    );

    if (userId) {
      // Precisamos fazer join com journeys para filtrar por userId
      const results = await db
        .select({
          id: journeyMetrics.id,
          journeyId: journeyMetrics.journeyId,
          tenantId: journeyMetrics.tenantId,
          date: journeyMetrics.date,
          totalWorkingHours: journeyMetrics.totalWorkingHours,
          breakHours: journeyMetrics.breakHours,
          overtimeHours: journeyMetrics.overtimeHours,
          productivity: journeyMetrics.productivity,
          distanceTraveled: journeyMetrics.distanceTraveled,
          ticketsCompleted: journeyMetrics.ticketsCompleted,
          customerVisits: journeyMetrics.customerVisits,
          createdAt: journeyMetrics.createdAt,
        })
        .from(journeyMetrics)
        .innerJoin(journeys, eq(journeyMetrics.journeyId, journeys.id))
        .where(and(
          whereCondition,
          eq(journeys.userId, userId)
        ));
      
      return results;
    }

    return await db
      .select()
      .from(journeyMetrics)
      .where(whereCondition)
      .orderBy(journeyMetrics.date);
  }

  async findMetricsByUserId(userId: string, tenantId: string, startDate: Date, endDate: Date): Promise<JourneyMetrics[]> {
    return this.findMetricsByDateRange(tenantId, startDate, endDate, userId);
  }
}
