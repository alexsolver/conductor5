/**
 * CreateTimecardUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for timecard creation business logic
 */

import { ITimecardRepository } from '../../domain/ports/ITimecardRepository';
import { Timecard } from '../../domain/entities/Timecard';
import { CreateTimecardDTO } from '../dto/CreateTimecardDTO';

export class CreateTimecardUseCase {
  constructor(
    private readonly timecardRepository: ITimecardRepository
  ) {}

  async execute(createDTO: CreateTimecardDTO): Promise<Timecard> {
    try {
      // Validate DTO
      if (!createDTO.validate()) {
        throw new Error('Dados inválidos para criação do timecard');
      }

      // Check if timecard already exists for this date
      const existingTimecard = await this.timecardRepository.findByUserAndDate(
        createDTO.userId,
        createDTO.tenantId,
        createDTO.date
      );

      if (existingTimecard) {
        throw new Error('Já existe um timecard para esta data');
      }

      // Create new timecard
      const newTimecard = new Timecard(
        crypto.randomUUID(),
        createDTO.tenantId,
        createDTO.userId,
        createDTO.date,
        createDTO.entries || [],
        createDTO.status || 'open',
        0, // total_hours will be calculated
        0, // total_break_time
        0, // overtime_hours
        0, // regular_hours
        null, // approved_by_id
        null, // approved_at
        null, // submitted_at
        createDTO.notes || '',
        new Date(),
        new Date()
      );

      // Save timecard
      const savedTimecard = await this.timecardRepository.save(newTimecard);

      return savedTimecard;

    } catch (error) {
      console.error('Error in CreateTimecardUseCase:', error);
      throw new Error('Falha ao criar timecard');
    }
  }
}