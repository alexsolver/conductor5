/**
 * Create Timecard Entry Use Case
 * Clean Architecture - Application Layer
 * 
 * @module CreateTimecardEntryUseCase
 * @created 2025-08-12 - Phase 16 Clean Architecture Implementation
 */

import { ITimecardRepository } from '../../domain/repositories/ITimecardRepository';
import { TimecardEntry, TimecardDomainService } from '../../domain/entities/TimecardEntry';

export interface CreateTimecardEntryRequest {
  tenantId: string;
  userId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  breakDurationMinutes?: number;
  notes?: string;
  location?: string;
  ipAddress?: string;
  device?: string;
}

export interface CreateTimecardEntryResponse {
  success: boolean;
  data?: TimecardEntry;
  errors?: string[];
}

export class CreateTimecardEntryUseCase {
  constructor(private timecardRepository: ITimecardRepository) {}

  async execute(request: CreateTimecardEntryRequest): Promise<CreateTimecardEntryResponse> {
    try {
      // Validate business rules
      const validation = TimecardDomainService.validateTimecardEntry(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Calculate worked minutes and overtime
      let totalWorkedMinutes = 0;
      let overtimeMinutes = 0;
      const breakDurationMinutes = request.breakDurationMinutes || 0;

      if (request.checkIn && request.checkOut) {
        totalWorkedMinutes = TimecardDomainService.calculateWorkedMinutes(
          request.checkIn,
          request.checkOut,
          breakDurationMinutes
        );
        overtimeMinutes = TimecardDomainService.calculateOvertimeMinutes(totalWorkedMinutes);
      }

      // Create timecard entry
      const entry = await this.timecardRepository.createTimecardEntry({
        tenantId: request.tenantId,
        userId: request.userId,
        date: request.date,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        breakStart: request.breakStart,
        breakEnd: request.breakEnd,
        totalWorkedMinutes,
        breakDurationMinutes,
        overtimeMinutes,
        status: 'draft',
        notes: request.notes,
        location: request.location,
        ipAddress: request.ipAddress,
        device: request.device,
        isActive: true
      });

      return {
        success: true,
        data: entry
      };

    } catch (error) {
      console.error('[CreateTimecardEntryUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}