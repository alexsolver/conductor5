import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';
import { ValidationDomainService } from '../../../shared/domain/services/ValidationDomainService';

export class GetSchedulesUseCase {
  constructor(private scheduleRepository: IScheduleRepository) {}

  async execute(tenantId: string, filters?: any): Promise<any[]> {
    ValidationDomainService.validateRequired(tenantId, 'Tenant ID');

    return await this.scheduleRepository.findByTenant(tenantId);
  }
}
import { IScheduleRepository } from '../../domain/ports/IScheduleRepository';

export class GetSchedulesUseCase {
  constructor(private scheduleRepository: IScheduleRepository) {}

  async execute(): Promise<any[]> {
    return await this.scheduleDomainService.getAllSchedules();
  }
}
