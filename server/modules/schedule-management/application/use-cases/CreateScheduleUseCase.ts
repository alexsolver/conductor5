import { ScheduleEntity } from '../../domain/entities/ScheduleEntity';
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';
import { ValidationDomainService } from '../../../shared/domain/services/ValidationDomainService';
import { ScheduleDomainService } from '../../domain/services/ScheduleDomainService';

export class CreateScheduleUseCase {
  constructor(private scheduleDomainService: ScheduleDomainService) {}

  async execute(scheduleData: any, tenantId: string): Promise<any> {
    // Validações de domínio
    ValidationDomainService.validateRequired(scheduleData.title, 'Schedule title');
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');

    // Delegando para domain service
    return await this.scheduleDomainService.createSchedule({
      ...scheduleData,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}