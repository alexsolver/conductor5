
import { Journey, JourneyCheckpoint, JourneyMetrics } from '../entities/Journey';

export interface IJourneyRepository {
  create(journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>): Promise<Journey>;
  findById(id: string, tenantId: string): Promise<Journey | null>;
  findByUserId(userId: string, tenantId: string, date?: Date): Promise<Journey[]>;
  findActiveByUserId(userId: string, tenantId: string): Promise<Journey | null>;
  update(id: string, tenantId: string, data: Partial<Journey>): Promise<Journey>;
  delete(id: string, tenantId: string): Promise<void>;
  
  // Journey Checkpoints
  createCheckpoint(checkpoint: Omit<JourneyCheckpoint, 'id' | 'createdAt'>): Promise<JourneyCheckpoint>;
  findCheckpointsByJourneyId(journeyId: string, tenantId: string): Promise<JourneyCheckpoint[]>;
  
  // Journey Metrics
  createMetrics(metrics: Omit<JourneyMetrics, 'id' | 'createdAt'>): Promise<JourneyMetrics>;
  findMetricsByDateRange(tenantId: string, startDate: Date, endDate: Date, userId?: string): Promise<JourneyMetrics[]>;
  findMetricsByUserId(userId: string, tenantId: string, startDate: Date, endDate: Date): Promise<JourneyMetrics[]>;
}
