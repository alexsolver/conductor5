import { Request, Response } from 'express';
// Timecard Approval Controller
import { Request, Response } from 'express';
import { TimecardApplicationService } from '../services/TimecardApplicationService';

export class TimecardApprovalController {
  constructor(
    private timecardApplicationService: TimecardApplicationService
  ) {}

  async getApprovals(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const approvals = await this.timecardApplicationService.getTimecardApprovals(tenantId);
      
      res.json({
        success: true,
        data: approvals
      });
    } catch (error) {
      console.error('Error getting timecard approvals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get timecard approvals'
      });
    }
  }

  async approveTimecard(req: Request, res: Response): Promise<void> {
    try {
      const { timecardId } = req.params;
      const { approverId, comments } = req.body;
      
      const result = await this.timecardApplicationService.approveTimecard(
        timecardId,
        approverId,
        comments
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error approving timecard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve timecard'
      });
    }
  }

  async rejectTimecard(req: Request, res: Response): Promise<void> {
    try {
      const { timecardId } = req.params;
      const { approverId, reason } = req.body;
      
      const result = await this.timecardApplicationService.rejectTimecard(
        timecardId,
        approverId,
        reason
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error rejecting timecard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject timecard'
      });
    }
  }

  async getBulkApprovals(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { startDate, endDate, status } = req.query;
      
      const approvals = await this.timecardApplicationService.getBulkTimecardApprovals(
        tenantId,
        startDate as string,
        endDate as string,
        status as string
      );
      
      res.json({
        success: true,
        data: approvals
      });
    } catch (error) {
      console.error('Error getting bulk approvals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get bulk approvals'
      });
    }
  }
}
