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
      console.log('🎫 [TICKETS-ROUTES] Request context:', {
        path: req.path,
        method: req.method,
        hasUser: !!req.user,
        tenantId: req.user?.tenantId,
        userId: req.user?.userId
      });

      const { tenantId } = req.user!;
      const tickets = await this.getTicketsUseCase.execute({ 
        tenantId,
        filters: req.query as any
      });

      res.json({
        success: true,
        message: 'Tickets retrieved successfully',
        data: tickets,
        count: tickets.length
      });
    } catch (error) {
      console.error('❌ Error finding all tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving tickets',
        data: [],
        count: 0,
        error: error.message
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user || {};

      if (!tenantId) {
        res.status(400).json(standardResponse(false, 'Tenant ID is required'));
        return;
      }

      // Clean Architecture: Delegate to Use Case, controller only handles HTTP protocol
      const ticketData = { ...req.body, tenantId };
      const result = await this.createTicketUseCase.execute(ticketData);

      res.status(201).json(standardResponse(true, 'Ticket created successfully', result));
    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      res.status(400).json(standardResponse(false, 'Failed to create ticket'));
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