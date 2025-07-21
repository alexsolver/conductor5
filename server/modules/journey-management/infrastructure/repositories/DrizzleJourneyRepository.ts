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
        id, tenant_id, user_id, start_time, end_time, status, 
        notes, total_hours, location
      ) VALUES (
        gen_random_uuid(), ${journeyData.tenantId}, ${journeyData.userId}, ${journeyData.startTime}, 
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
    const schemaName = this.getSchemaName(tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const result = await db.execute(sql`
      SELECT * FROM ${schemaId}.journeys 
      WHERE user_id = ${userId} AND tenant_id = ${tenantId} AND status = 'active'
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

  async update(id: string, tenantId: string, updateData: Partial<Journey>): Promise<Journey> {
    const schemaName = this.getSchemaName(tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const setClause: string[] = [];
    const values: any[] = [];
    
    if (updateData.endTime !== undefined) {
      setClause.push('end_time = $' + (values.length + 1));
      values.push(updateData.endTime);
    }
    if (updateData.status !== undefined) {
      setClause.push('status = $' + (values.length + 1));
      values.push(updateData.status);
    }
    if (updateData.notes !== undefined) {
      setClause.push('notes = $' + (values.length + 1));
      values.push(updateData.notes);
    }
    if (updateData.totalHours !== undefined) {
      setClause.push('total_hours = $' + (values.length + 1));
      values.push(updateData.totalHours);
    }
    if (updateData.location !== undefined) {
      setClause.push('location = $' + (values.length + 1));
      values.push(updateData.location ? JSON.stringify(updateData.location) : null);
    }
    
    setClause.push('updated_at = NOW()');
    
    values.push(id, tenantId);
    
    const result = await db.execute(sql`
      UPDATE ${schemaId}.journeys 
      SET ${sql.raw(setClause.join(', '))}
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
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

  async delete(id: string, tenantId: string): Promise<void> {
    const schemaName = this.getSchemaName(tenantId);
    const schemaId = sql.identifier(schemaName);
    
    await db.execute(sql`
      DELETE FROM ${schemaId}.journeys 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `);
  }

  async createCheckpoint(checkpointData: Omit<JourneyCheckpoint, 'id' | 'createdAt'>): Promise<JourneyCheckpoint> {
    const schemaName = this.getSchemaName(checkpointData.tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const result = await db.execute(sql`
      INSERT INTO ${schemaId}.journey_checkpoints (
        id, journey_id, tenant_id, type, timestamp, location, notes
      ) VALUES (
        gen_random_uuid(), ${checkpointData.journeyId}, ${checkpointData.tenantId}, ${checkpointData.type},
        ${checkpointData.timestamp}, 
        ${checkpointData.location ? JSON.stringify(checkpointData.location) : null},
        ${checkpointData.notes || null}
      ) RETURNING *
    `);
    
    const checkpoint = result.rows[0];
    return {
      id: checkpoint.id,
      journeyId: checkpoint.journey_id,
      tenantId: checkpoint.tenant_id,
      type: checkpoint.type,
      timestamp: checkpoint.timestamp,
      location: checkpoint.location ? JSON.parse(checkpoint.location) : undefined,
      notes: checkpoint.notes || undefined,
      createdAt: checkpoint.created_at,
    };
  }

  async findCheckpointsByJourneyId(journeyId: string, tenantId: string): Promise<JourneyCheckpoint[]> {
    const schemaName = this.getSchemaName(tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const result = await db.execute(sql`
      SELECT * FROM ${schemaId}.journey_checkpoints 
      WHERE journey_id = ${journeyId} AND tenant_id = ${tenantId}
      ORDER BY timestamp
    `);
    
    return result.rows.map(checkpoint => ({
      id: checkpoint.id,
      journeyId: checkpoint.journey_id,
      tenantId: checkpoint.tenant_id,
      type: checkpoint.type,
      timestamp: checkpoint.timestamp,
      location: checkpoint.location ? JSON.parse(checkpoint.location) : undefined,
      notes: checkpoint.notes || undefined,
      createdAt: checkpoint.created_at,
    }));
  }

  async createMetrics(metricsData: Omit<JourneyMetrics, 'id' | 'createdAt'>): Promise<JourneyMetrics> {
    const schemaName = this.getSchemaName(metricsData.tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const result = await db.execute(sql`
      INSERT INTO ${schemaId}.journey_metrics (
        id, journey_id, tenant_id, date, total_working_hours, break_hours, 
        overtime_hours, productivity, tickets_completed, customer_visits
      ) VALUES (
        gen_random_uuid(), ${metricsData.journeyId}, ${metricsData.tenantId}, ${metricsData.date},
        ${metricsData.totalWorkingHours}, ${metricsData.breakHours}, ${metricsData.overtimeHours},
        ${metricsData.productivity}, ${metricsData.ticketsCompleted || 0}, 
        ${metricsData.customerVisits || 0}
      ) RETURNING *
    `);
    
    const metrics = result.rows[0];
    return {
      id: metrics.id,
      journeyId: metrics.journey_id,
      tenantId: metrics.tenant_id,
      date: metrics.date,
      totalWorkingHours: parseFloat(metrics.total_working_hours),
      breakHours: parseFloat(metrics.break_hours || '0'),
      overtimeHours: parseFloat(metrics.overtime_hours || '0'),
      productivity: parseFloat(metrics.productivity || '0'),
      ticketsCompleted: metrics.tickets_completed || 0,
      customerVisits: metrics.customer_visits || 0,
      createdAt: metrics.created_at,
    };
  }

  async findMetricsByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<JourneyMetrics[]> {
    const schemaName = this.getSchemaName(tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const result = await db.execute(sql`
      SELECT * FROM ${schemaId}.journey_metrics 
      WHERE tenant_id = ${tenantId} 
      AND date >= ${startDate} AND date <= ${endDate}
      ORDER BY date
    `);
    
    return result.rows.map(metrics => ({
      id: metrics.id,
      journeyId: metrics.journey_id,
      tenantId: metrics.tenant_id,
      date: metrics.date,
      totalWorkingHours: parseFloat(metrics.total_working_hours),
      breakHours: parseFloat(metrics.break_hours || '0'),
      overtimeHours: parseFloat(metrics.overtime_hours || '0'),
      productivity: parseFloat(metrics.productivity || '0'),
      ticketsCompleted: metrics.tickets_completed || 0,
      customerVisits: metrics.customer_visits || 0,
      createdAt: metrics.created_at,
    }));
  }

  async findMetricsByJourneyId(journeyId: string, tenantId: string): Promise<JourneyMetrics[]> {
    const schemaName = this.getSchemaName(tenantId);
    const schemaId = sql.identifier(schemaName);
    
    const result = await db.execute(sql`
      SELECT * FROM ${schemaId}.journey_metrics 
      WHERE journey_id = ${journeyId} AND tenant_id = ${tenantId}
      ORDER BY date
    `);
    
    return result.rows.map(metrics => ({
      id: metrics.id,
      journeyId: metrics.journey_id,
      tenantId: metrics.tenant_id,
      date: metrics.date,
      totalWorkingHours: parseFloat(metrics.total_working_hours),
      breakHours: parseFloat(metrics.break_hours || '0'),
      overtimeHours: parseFloat(metrics.overtime_hours || '0'),
      productivity: parseFloat(metrics.productivity || '0'),
      ticketsCompleted: metrics.tickets_completed || 0,
      customerVisits: metrics.customer_visits || 0,
      createdAt: metrics.created_at,
    }));
  }
}