import { Request, Response } from 'express';
import { GetTicketsUseCase } from '../use-cases/GetTicketsUseCase';
import { CreateTicketUseCase } from '../use-cases/CreateTicketUseCase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class TicketController {
  constructor(
    private getTicketsUseCase: GetTicketsUseCase,
    private createTicketUseCase: CreateTicketUseCase
  ) {}

  async getAllTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await this.getTicketsUseCase.execute({
        tenantId,
        userId,
        filters
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        data: [],
        total: 0
      });
    }
  }

  async createTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { title, description, priority, customerId, categoryId } = req.body;

      const result = await this.createTicketUseCase.execute({
        title,
        description,
        priority,
        customerId,
        categoryId,
        tenantId,
        userId
      });

      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error'
      });
    }
  }
}