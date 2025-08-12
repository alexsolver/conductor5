/**
 * APPLICATION LAYER - TICKET CONTROLLER
 * Seguindo Clean Architecture - 1qa.md compliance
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../../../middleware/jwtAuth';
import { CreateTicketUseCase } from '../use-cases/CreateTicketUseCase';
import { UpdateTicketUseCase } from '../use-cases/UpdateTicketUseCase';
import { FindTicketUseCase } from '../use-cases/FindTicketUseCase';
import { DeleteTicketUseCase } from '../use-cases/DeleteTicketUseCase';
import { CreateTicketDTO, UpdateTicketDTO, TicketFiltersDTO } from '../dto/CreateTicketDTO';

// Assuming these types are defined elsewhere, as they are used in the 'list' method
type TicketFilters = {
  status?: string[];
  priority?: string[];
  assignedToId?: string;
  customerId?: string;
  companyId?: string;
  search?: string;
};

type PaginationOptions = {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export class TicketController {
  constructor(
    private createTicketUseCase: CreateTicketUseCase,
    private updateTicketUseCase: UpdateTicketUseCase,
    private findTicketUseCase: FindTicketUseCase,
    private deleteTicketUseCase: DeleteTicketUseCase
  ) {}

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dto: CreateTicketDTO = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      // Ensure createdById is set from authenticated user
      dto.createdById = userId;

      const ticket = await this.createTicketUseCase.execute(dto, tenantId);

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create ticket',
        error: error.message
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateTicketDTO = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      // Ensure updatedById is set from authenticated user
      dto.updatedById = userId;

      const ticket = await this.updateTicketUseCase.execute(id, dto, tenantId);

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update ticket',
        error: error.message
      });
    }
  }

  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      const ticket = await this.findTicketUseCase.findById(id, tenantId);

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find ticket',
        error: error.message
      });
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      // Extract filters from query parameters
      const filters: any = {};
      const { 
        status, priority, urgency, impact, assignedToId, customerId, companyId,
        category, subcategory, action, dateFrom, dateTo, search, tags,
        page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc'
      } = req.query;

      // Build filters object
      if (status) filters.status = Array.isArray(status) ? status : [status];
      if (priority) filters.priority = Array.isArray(priority) ? priority : [priority];
      if (urgency) filters.urgency = Array.isArray(urgency) ? urgency : [urgency];
      if (impact) filters.impact = Array.isArray(impact) ? impact : [impact];
      if (assignedToId) filters.assignedToId = assignedToId;
      if (customerId) filters.customerId = customerId;
      if (companyId) filters.companyId = companyId;
      if (category) filters.category = category;
      if (subcategory) filters.subcategory = subcategory;
      if (action) filters.action = action;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (search) filters.search = search;
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];

      const pagination = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.findTicketUseCase.findWithFilters(filters, pagination, tenantId);

      res.json({
        success: true,
        message: 'Tickets retrieved successfully',
        data: {
          tickets: result.tickets,
          pagination: {
            page: result.page,
            totalPages: result.totalPages,
            total: result.total,
            limit: pagination.limit
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve tickets',
        error: error.message
      });
    }
  }

  async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { q: searchTerm, page = 1, limit = 50 } = req.query;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }

      const pagination = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      const result = await this.findTicketUseCase.searchTickets(
        searchTerm as string,
        tenantId,
        pagination
      );

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: result.tickets,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: pagination.limit
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Search failed',
        error: error.message
      });
    }
  }

  async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      const stats = await this.findTicketUseCase.getStatistics(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get statistics',
        error: error.message
      });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      await this.deleteTicketUseCase.execute(id, tenantId, userId);

      res.json({
        success: true,
        message: 'Ticket deleted successfully'
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete ticket',
        error: error.message
      });
    }
  }

  async findByAssignedUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      const tickets = await this.findTicketUseCase.findByAssignedUser(userId, tenantId);

      res.json({
        success: true,
        data: tickets
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find assigned tickets',
        error: error.message
      });
    }
  }

  async findByCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      const tickets = await this.findTicketUseCase.findByCustomer(customerId, tenantId);

      res.json({
        success: true,
        data: tickets
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find customer tickets',
        error: error.message
      });
    }
  }
}