
import { Request, Response } from 'express';
import { CreateTicketHistoryUseCase } from '../use-cases/CreateTicketHistoryUseCase';
import { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository';

export class TicketHistoryController {
  constructor(
    private createTicketHistoryUseCase: CreateTicketHistoryUseCase,
    private ticketHistoryRepository: ITicketHistoryRepository
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const ticketHistory = await this.createTicketHistoryUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        data: ticketHistory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create ticket history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getByTicketId(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const history = await this.ticketHistoryRepository.findByTicketId(ticketId);
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get ticket history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
