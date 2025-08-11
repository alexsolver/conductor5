/**
 * CommunicationsController - Clean Architecture Application Layer
 * Resolves violations: Missing Controllers for communication management endpoints
 */

import { Request, Response } from 'express';
import { Communication } from '../../domain/entities/Communication';

interface CommunicationsRepositoryInterface {
  save(communication: Communication): Promise<void>;
  findById(id: string, tenantId: string): Promise<Communication | null>;
  findByThread(threadId: string, tenantId: string): Promise<Communication[]>;
}

interface SendCommunicationUseCase {
  execute(request: any): Promise<{ success: boolean; message: string; data?: any }>;
}

export class CommunicationsController {
  constructor(
    private readonly communicationsRepository: CommunicationsRepositoryInterface,
    private readonly sendCommunicationUseCase: SendCommunicationUseCase
  ) {}

  async sendCommunication(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.sendCommunicationUseCase.execute({
        tenantId,
        ...req.body
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async getCommunication(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const communication = await this.communicationsRepository.findById(
        req.params.id, 
        tenantId
      );

      if (!communication) {
        res.status(404).json({ success: false, message: 'Communication not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: communication.getId(),
          channel: communication.getChannel(),
          subject: communication.getSubject(),
          content: communication.getContent(),
          direction: communication.getDirection(),
          status: communication.getStatus(),
          priority: communication.getPriority(),
          participants: communication.getParticipants(),
          attachments: communication.getAttachments(),
          createdAt: communication.getCreatedAt()
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
}