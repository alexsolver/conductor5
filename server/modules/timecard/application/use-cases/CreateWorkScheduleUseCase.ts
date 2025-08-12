/**
 * Create Work Schedule Use Case
 * Clean Architecture - Application Layer
 * 
 * @module CreateWorkScheduleUseCase
 * @created 2025-08-12 - Phase 16 Clean Architecture Implementation
 */

import { ITimecardRepository } from '../../domain/repositories/ITimecardRepository';
import { WorkSchedule, TimecardDomainService } from '../../domain/entities/TimecardEntry';

export interface CreateWorkScheduleRequest {
  tenantId: string;
  userId: string;
  scheduleName: string;
  scheduleType: '5x2' | '6x1' | '12x36' | 'shift' | 'flexible' | 'intermittent';
  startDate: Date;
  endDate?: Date;
  workDays: number[];
  startTime: string;
  endTime: string;
  breakDurationMinutes?: number;
}

export interface CreateWorkScheduleResponse {
  success: boolean;
  data?: WorkSchedule;
  errors?: string[];
}

export class CreateWorkScheduleUseCase {
  constructor(private timecardRepository: ITimecardRepository) {}

  async execute(request: CreateWorkScheduleRequest): Promise<CreateWorkScheduleResponse> {
    try {
      // Validate business rules
      const validation = TimecardDomainService.validateWorkSchedule(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Create work schedule
      const schedule = await this.timecardRepository.createWorkSchedule({
        tenantId: request.tenantId,
        userId: request.userId,
        scheduleName: request.scheduleName,
        scheduleType: request.scheduleType,
        startDate: request.startDate,
        endDate: request.endDate,
        workDays: request.workDays,
        startTime: request.startTime,
        endTime: request.endTime,
        breakDurationMinutes: request.breakDurationMinutes || 60,
        isActive: true
      });

      return {
        success: true,
        data: schedule
      };

    } catch (error) {
      console.error('[CreateWorkScheduleUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}