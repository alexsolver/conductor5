
import { and, eq, gte, lte, isNull } from 'drizzle-orm';
import { db } from '../../../../db';
import { journeys, journeyCheckpoints, journeyMetrics } from '../../../../../shared/schema/journey';
import { IJourneyRepository } from '../../domain/repositories/IJourneyRepository';
import { Journey, JourneyCheckpoint, JourneyMetrics } from '../../domain/entities/Journey';

export class DrizzleJourneyRepository implements IJourneyRepository {
  async create(journeyData: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>): Promise<Journey> {
    const [journey] = await db.insert(journeys).values({
      ...journeyData,
      location: journeyData.location ? JSON.stringify(journeyData.location) : null,
    }).returning();
    
    return {
      ...journey,
      location: journey.location ? JSON.parse(journey.location) : undefined,
    };
  }

  async findById(id: string, tenantId: string): Promise<Journey | null> {
    const [journey] = await db
      .select()
      .from(journeys)
      .where(and(eq(journeys.id, id), eq(journeys.tenantId, tenantId)));
    
    if (!journey) return null;
    
    return {
      ...journey,
      location: journey.location ? JSON.parse(journey.location) : undefined,
    };
  }

  async findByUserId(userId: string, tenantId: string, date?: Date): Promise<Journey[]> {
    let whereCondition = and(
      eq(journeys.userId, userId),
      eq(journeys.tenantId, tenantId)
    );

    if (date) {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      whereCondition = and(
        whereCondition,
        gte(journeys.startTime, startOfDay),
        lte(journeys.startTime, endOfDay)
      );
    }

    const results = await db
      .select()
      .from(journeys)
      .where(whereCondition)
      .orderBy(journeys.startTime);
    
    return results.map(journey => ({
      ...journey,
      location: journey.location ? JSON.parse(journey.location) : undefined,
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
