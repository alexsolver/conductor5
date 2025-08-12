/**
 * Get Timecard Entries Use Case
 * Clean Architecture - Application Layer
 * 
 * @module GetTimecardEntriesUseCase
 * @created 2025-08-12 - Phase 16 Clean Architecture Implementation
 */

import { ITimecardRepository } from '../../domain/repositories/ITimecardRepository';
import { TimecardEntry } from '../../domain/entities/TimecardEntry';

export interface GetTimecardEntriesRequest {
  tenantId: string;
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface GetTimecardEntriesResponse {
  success: boolean;
  data?: TimecardEntry[];
  errors?: string[];
}

export class GetTimecardEntriesUseCase {
  constructor(private timecardRepository: ITimecardRepository) {}

  async execute(request: GetTimecardEntriesRequest): Promise<GetTimecardEntriesResponse> {
    try {
      // Validate request
      if (!request.tenantId) {
        return {
          success: false,
          errors: ['Tenant ID é obrigatório']
        };
      }

      if (!request.userId) {
        return {
          success: false,
          errors: ['User ID é obrigatório']
        };
      }

      // Get timecard entries
      const entries = await this.timecardRepository.getTimecardEntriesByUser(
        request.userId,
        request.tenantId,
        request.startDate,
        request.endDate
      );

      return {
        success: true,
        data: entries
      };

    } catch (error) {
      console.error('[GetTimecardEntriesUseCase] Error:', error);
      return {
        success: false,
        errors: ['Erro interno do servidor']
      };
    }
  }
}