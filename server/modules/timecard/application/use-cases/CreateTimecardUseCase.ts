
import { Timecard } from '../../domain/entities/Timecard';
import { ITimecardRepository } from '../../domain/ports/ITimecardRepository';

export class CreateTimecardUseCase {
  constructor(
    private readonly timecardRepository: ITimecardRepository
  ) {}

  async execute(data: {
    tenantId: string;
    userId: string;
    date: Date;
    checkIn?: Date;
    checkOut?: Date;
    breakStart?: Date;
    breakEnd?: Date;
    notes?: string;
  }): Promise<Timecard> {
    const timecard = Timecard.create(
      crypto.randomUUID(),
      data.tenantId,
      data.userId,
      data.date,
      data.checkIn,
      data.checkOut,
      data.breakStart,
      data.breakEnd,
      data.notes
    );

    if (!timecard.isValid()) {
      throw new Error('Invalid timecard data');
    }

    return await this.timecardRepository.create(timecard);
  }
}
