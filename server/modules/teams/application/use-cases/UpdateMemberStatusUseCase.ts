
import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface UpdateMemberStatusRequest {
  tenantId: string;
  userId: string;
  memberId: string;
  status: string;
  updatedBy: string;
}

export interface UpdateMemberStatusResponse {
  success: boolean;
  message: string;
}

export class UpdateMemberStatusUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: UpdateMemberStatusRequest): Promise<UpdateMemberStatusResponse> {
    try {
      console.log('[UPDATE-MEMBER-STATUS] Processing request:', request);

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(request.memberId)) {
        return {
          success: false,
          message: 'Invalid member ID format'
        };
      }

      if (!['active', 'inactive', 'pending'].includes(request.status)) {
        return {
          success: false,
          message: 'Invalid status'
        };
      }

      const success = await this.teamRepository.updateMemberStatus(
        request.tenantId, 
        request.memberId, 
        request.status
      );

      if (success) {
        return {
          success: true,
          message: 'Status updated successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to update status'
        };
      }
    } catch (error) {
      console.error('Error in UpdateMemberStatusUseCase:', error);
      return {
        success: false,
        message: 'Failed to update status'
      };
    }
  }
}
