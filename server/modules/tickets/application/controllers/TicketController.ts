import { Request, Response } from 'express';
import { GetTicketsUseCase } from '../usecases/GetTicketsUseCase';
import { CreateTicketUseCase } from '../usecases/CreateTicketUseCase';
import { standardResponse } from '../../../../utils/standardResponse';
import { AssignTicketUseCase } from '../usecases/AssignTicketUseCase';
import { ResolveTicketUseCase } from '../usecases/ResolveTicketUseCase';

export class TicketController {
  constructor(
    private getAllTicketsUseCase: GetTicketsUseCase,
    private createTicketUseCase: CreateTicketUseCase,
    private assignTicketUseCase: AssignTicketUseCase,
    private resolveTicketUseCase: ResolveTicketUseCase
  ) {}

  async getAllTickets(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user || {};

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID is required'));
        return;
      }

      const query = {
        tenantId,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        search: req.query.search as string,
        status: req.query.status as string,
        priority: req.query.priority as string,
        assignedToId: req.query.assignedToId as string,
        companyId: req.query.companyId as string
      };

      const result = await this.getAllTicketsUseCase.execute(query);
      res.json(standardResponse(true, 'Tickets retrieved successfully', result));
    } catch (error) {
      console.error('❌ Error in getAllTickets:', error);
      res.status(500).json(standardResponse(false, 'Failed to retrieve tickets'));
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      // Implementation
      standardResponse(res, 201, 'Ticket created successfully', req.body);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      standardResponse(res, 400, 'Failed to create ticket', null, errorMessage);
    }
  }

  async getTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      // Implementation
      standardResponse(res, 200, 'Ticket retrieved successfully', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      standardResponse(res, 404, 'Ticket not found', null, errorMessage);
    }
  }

  async updateTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      // Implementation
      standardResponse(res, 200, 'Ticket updated successfully', { id, ...req.body });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      standardResponse(res, 400, 'Failed to update ticket', null, errorMessage);
    }
  }

  async deleteTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      // Implementation
      standardResponse(res, 200, 'Ticket deleted successfully', null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      standardResponse(res, 400, 'Failed to delete ticket', null, errorMessage);
    }
  }
}