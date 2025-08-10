import { ScheduleEntity } from '../../domain/entities/ScheduleEntity';
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';
import { ValidationDomainService } from '../../../shared/domain/services/ValidationDomainService';

export class CreateScheduleUseCase {
  constructor(private scheduleRepository: IScheduleRepository) {}

  async execute(scheduleData: any, tenantId: string): Promise<any> {
    // Validações de domínio
    ValidationDomainService.validateRequired(scheduleData.title, 'Schedule title');
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');

    // Delegar para repository
    return await this.scheduleRepository.create({
      ...scheduleData,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

export class CreateScheduleUseCase {
  constructor(private scheduleRepository: IScheduleRepository) {}

  async execute(scheduleData: any): Promise<any> {
    if (!scheduleData.startTime || !scheduleData.endTime) {
      throw new Error('Start time and end time are required');
    }

    return await this.scheduleRepository.create(scheduleData);
  }
}