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
  urgency?: string[];
  impact?: string[];
  category?: string;
  subcategory?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
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
    private deleteTicketUseCase: DeleteTicketUseCase,
    private findTicketUseCase: FindTicketUseCase
  ) {
    console.log('✅ [TicketController] Controller initialized with all use cases');
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const filters: TicketFilters = {
        status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status as string[] : [req.query.status as string]) : undefined,
        priority: req.query.priority ? (Array.isArray(req.query.priority) ? req.query.priority as string[] : [req.query.priority as string]) : undefined,
        assignedToId: req.query.assignedToId as string,
        customerId: req.query.customerId as string,
        companyId: req.query.companyId as string,
        category: req.query.category as string,
        subcategory: req.query.subcategory as string,
        action: req.query.action as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search as string,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags as string[] : [req.query.tags as string]) : undefined,
        urgency: req.query.urgency ? (Array.isArray(req.query.urgency) ? req.query.urgency as string[] : [req.query.urgency as string]) : undefined,
        impact: req.query.impact ? (Array.isArray(req.query.impact) ? req.query.impact as string[] : [req.query.impact as string]) : undefined,
      };

      const pagination: PaginationOptions = {
        page: parseInt(req.query.page as string, 10) || 1,
        limit: Math.min(parseInt(req.query.limit as string, 10) || 50, 1000),
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await this.findTicketUseCase.execute(filters, pagination, tenantId);

      // Consistent response structure for frontend
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

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dto: CreateTicketDTO = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      console.log('🎫 [TICKET-CONTROLLER] Creating ticket with DTO:', JSON.stringify(dto, null, 2));
      console.log('🎫 [TICKET-CONTROLLER] TenantId:', tenantId, 'UserId:', userId);

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      // Ensure createdById is set from authenticated user
      if (userId) {
        dto.createdById = userId;
      } else {
        throw new Error('User ID is required');
      }

      console.log('🎫 [TICKET-CONTROLLER] Final DTO before use case:', JSON.stringify(dto, null, 2));
      const ticket = await this.createTicketUseCase.execute(dto, tenantId);
      console.log('🎫 [TICKET-CONTROLLER] Ticket created:', JSON.stringify(ticket, null, 2));

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
      });
    } catch (error: any) {
      console.error('❌ [TICKET-CONTROLLER] Error creating ticket:', error);
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
      const updateData = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      console.log('🎯 [TicketController] update called with:', { 
        id, 
        tenantId, 
        userId,
        updateDataKeys: Object.keys(updateData || {})
      });

      // Validações de entrada seguindo 1qa.md
      if (!tenantId) {
        console.log('❌ [TicketController] No tenant ID provided');
        res.status(401).json({
          success: false,
          message: 'Tenant ID required',
          error: 'MISSING_TENANT_ID'
        });
        return;
      }

      if (!userId) {
        console.log('❌ [TicketController] No user ID provided');
        res.status(401).json({
          success: false,
          message: 'User ID required',
          error: 'MISSING_USER_ID'
        });
        return;
      }

      if (!id || typeof id !== 'string' || id.trim() === '') {
        console.log('❌ [TicketController] Invalid ticket ID');
        res.status(400).json({
          success: false,
          message: 'Valid ticket ID is required',
          error: 'INVALID_TICKET_ID'
        });
        return;
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        console.log('❌ [TicketController] No update data provided');
        res.status(400).json({
          success: false,
          message: 'Update data is required',
          error: 'NO_UPDATE_DATA'
        });
        return;
      }

      // Preparar DTO seguindo Clean Architecture
      const dto: UpdateTicketDTO = {
        ...updateData,
        updatedById: userId
      };

      console.log('🚀 [TicketController] Calling updateTicketUseCase.execute');
      const ticket = await this.updateTicketUseCase.execute(id, dto, tenantId, userId);

      console.log('✅ [TicketController] Update successful, returning data');
      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket
      });
    } catch (error: any) {
      console.error('❌ [TicketController] Update failed:', error);

      // Tratamento de erro seguindo 1qa.md
      let statusCode = 500;
      let errorCode = 'INTERNAL_SERVER_ERROR';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorCode = 'TICKET_NOT_FOUND';
      } else if (error.message.includes('Validation error')) {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      } else if (error.message.includes('constraint')) {
        statusCode = 400;
        errorCode = 'DATABASE_CONSTRAINT_ERROR';
      } else if (error.message.includes('Update failed')) {
        statusCode = 500;
        errorCode = 'UPDATE_OPERATION_FAILED';
      }

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update ticket',
        error: errorCode,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      console.log('🎯 [TicketController] findById called with:', { id, tenantId });

      if (!tenantId) {
        console.log('❌ [TicketController] No tenant ID provided');
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      console.log('🔍 [TicketController] Calling findTicketUseCase.findById');
      const ticket = await this.findTicketUseCase.findById(id, tenantId);

      if (!ticket) {
        console.log('❌ [TicketController] Ticket not found');
        res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
        return;
      }

      console.log('✅ [TicketController] Ticket found, returning data');
      res.json({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      console.error('❌ [TicketController] Error in findById:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to find ticket',
        error: error.message
      });
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🎯 [TicketController] findAll method called');
    console.log('🔍 [TicketController] findTicketUseCase exists:', !!this.findTicketUseCase);

    try {
      const tenantId = req.user?.tenantId;
      console.log('🔍 [TicketController] TenantId:', tenantId);

      if (!tenantId) {
        console.log('❌ [TicketController] No tenant ID provided');
        res.status(401).json({
          success: false,
          message: 'Tenant ID required'
        });
        return;
      }

      // Extract filters from query parameters
      const filters: TicketFilters = {
        status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status as string[] : [req.query.status as string]) : undefined,
        priority: req.query.priority ? (Array.isArray(req.query.priority) ? req.query.priority as string[] : [req.query.priority as string]) : undefined,
        assignedToId: req.query.assignedToId as string,
        customerId: req.query.customerId as string,
        companyId: req.query.companyId as string,
        category: req.query.category as string,
        subcategory: req.query.subcategory as string,
        action: req.query.action as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search as string,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags as string[] : [req.query.tags as string]) : undefined,
        urgency: req.query.urgency ? (Array.isArray(req.query.urgency) ? req.query.urgency as string[] : [req.query.urgency as string]) : undefined,
        impact: req.query.impact ? (Array.isArray(req.query.impact) ? req.query.impact as string[] : [req.query.impact as string]) : undefined,
      };

      const pagination: PaginationOptions = {
        page: parseInt(req.query.page as string, 10) || 1,
        limit: Math.min(parseInt(req.query.limit as string, 10) || 50, 1000),
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      console.log('🔍 [TicketController] Calling findWithFilters with:', { filters, pagination, tenantId });
      const result = await this.findTicketUseCase.findWithFilters(filters, pagination, tenantId);
      console.log('✅ [TicketController] findWithFilters result:', { ticketsCount: result.tickets?.length, total: result.total });

      // Consistent response structure for frontend
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

      if (!userId) {
        throw new Error('User ID is required');
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