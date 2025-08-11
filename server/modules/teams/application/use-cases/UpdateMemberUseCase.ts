
import { DrizzleTeamRepository } from '../../infrastructure/repositories/DrizzleTeamRepository';

export interface UpdateMemberRequest {
  tenantId: string;
  userId: string;
  memberId: string;
  updateData: any;
  updatedBy: string;
}

export interface UpdateMemberResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class UpdateMemberUseCase {
  private teamRepository: DrizzleTeamRepository;

  constructor() {
    this.teamRepository = new DrizzleTeamRepository();
  }

  async execute(request: UpdateMemberRequest): Promise<UpdateMemberResponse> {
    try {
      console.log('[UPDATE-MEMBER] Processing request:', request);

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(request.memberId)) {
        return {
          success: false,
          message: 'Invalid member ID format'
        };
      }

      const updatedMember = await this.teamRepository.updateMember(
        request.tenantId,
        request.memberId,
        request.updateData
      );

      return {
        success: true,
        message: 'Member updated successfully',
        data: updatedMember
      };
    } catch (error) {
      console.error('Error in UpdateMemberUseCase:', error);
      return {
        success: false,
        message: 'Failed to update member'
      };
    }
  }
}
