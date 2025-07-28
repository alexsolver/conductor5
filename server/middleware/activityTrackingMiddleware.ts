
import { Request, Response, NextFunction } from 'express';
import { ActivityTrackingService } from '../services/ActivityTrackingService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
}

export const activityTrackingMiddleware = (activityType: string, resourceType?: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    let activityId: string | undefined;
    const startTime = Date.now();

    try {
      // Extract resource ID from URL params
      const resourceId = req.params.id || req.params.ticketId || req.params.customerId;

      // Start tracking
      activityId = await ActivityTrackingService.startActivity({
        userId: req.user.id,
        tenantId: req.user.tenantId,
        activityType,
        resourceType,
        resourceId,
        action: 'start',
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.method === 'GET' ? undefined : req.body
        }
      }, req);

      // Override res.json to capture response and end tracking
      const originalJson = res.json;
      res.json = function(data: any) {
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000);

        // End tracking with response data
        if (activityId) {
          ActivityTrackingService.endActivity(activityId, {
            statusCode: res.statusCode,
            responseSize: JSON.stringify(data).length,
            success: res.statusCode < 400
          }).catch(console.error);
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Activity tracking middleware error:', error);
      next();
    }
  };
};

// Specific middleware for different activities
export const trackTicketView = activityTrackingMiddleware('view_ticket', 'ticket');
export const trackTicketEdit = activityTrackingMiddleware('edit_ticket', 'ticket');
export const trackTicketCreate = activityTrackingMiddleware('create_ticket', 'ticket');
export const trackCustomerView = activityTrackingMiddleware('view_customer', 'customer');
export const trackMessageSend = activityTrackingMiddleware('send_message', 'communication');
