
import { Request, Response } from 'express';
import { DrizzleChatbotRepository } from '../../infrastructure/repositories/DrizzleChatbotRepository';
import { CreateChatbotUseCase } from '../use-cases/CreateChatbotUseCase';
import { GetChatbotsUseCase } from '../use-cases/GetChatbotsUseCase';
import { UpdateChatbotUseCase } from '../use-cases/UpdateChatbotUseCase';
import { DeleteChatbotUseCase } from '../use-cases/DeleteChatbotUseCase';

export class ChatbotController {
  private chatbotRepository = new DrizzleChatbotRepository();

  async createChatbot(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID required'
        });
      }

      console.log('🔧 [ChatbotController] Creating chatbot for tenant:', tenantId);

      const createUseCase = new CreateChatbotUseCase(this.chatbotRepository);
      const chatbot = await createUseCase.execute({
        ...req.body,
        tenantId
      });

      res.json({
        success: true,
        data: chatbot,
        message: 'Chatbot created successfully'
      });
    } catch (error: any) {
      console.error('❌ [ChatbotController] Error creating chatbot:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to create chatbot'
      });
    }
  }

  async getChatbots(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID required'
        });
      }

      console.log('🔍 [ChatbotController] Getting chatbots for tenant:', tenantId);

      const getChatbotsUseCase = new GetChatbotsUseCase(this.chatbotRepository);
      const chatbots = await getChatbotsUseCase.execute(tenantId);

      res.json({
        success: true,
        data: chatbots,
        message: 'Chatbots retrieved successfully'
      });
    } catch (error: any) {
      console.error('❌ [ChatbotController] Error getting chatbots:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to get chatbots'
      });
    }
  }

  async updateChatbot(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const chatbotId = req.params.id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID required'
        });
      }

      console.log('🔧 [ChatbotController] Updating chatbot:', chatbotId);

      const updateUseCase = new UpdateChatbotUseCase(this.chatbotRepository);
      const chatbot = await updateUseCase.execute({
        id: chatbotId,
        tenantId,
        ...req.body
      });

      if (!chatbot) {
        return res.status(404).json({
          success: false,
          error: 'Chatbot not found'
        });
      }

      res.json({
        success: true,
        data: chatbot,
        message: 'Chatbot updated successfully'
      });
    } catch (error: any) {
      console.error('❌ [ChatbotController] Error updating chatbot:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to update chatbot'
      });
    }
  }

  async deleteChatbot(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const chatbotId = req.params.id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID required'
        });
      }

      console.log('🗑️ [ChatbotController] Deleting chatbot:', chatbotId);

      const deleteUseCase = new DeleteChatbotUseCase(this.chatbotRepository);
      const success = await deleteUseCase.execute(chatbotId, tenantId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Chatbot not found'
        });
      }

      res.json({
        success: true,
        message: 'Chatbot deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ [ChatbotController] Error deleting chatbot:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to delete chatbot'
      });
    }
  }

  async toggleChatbot(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const chatbotId = req.params.id;
      const { isActive } = req.body;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID required'
        });
      }

      console.log('🔄 [ChatbotController] Toggling chatbot:', chatbotId, 'to', isActive);

      const updateUseCase = new UpdateChatbotUseCase(this.chatbotRepository);
      const chatbot = await updateUseCase.execute({
        id: chatbotId,
        tenantId,
        isActive
      });

      if (!chatbot) {
        return res.status(404).json({
          success: false,
          error: 'Chatbot not found'
        });
      }

      res.json({
        success: true,
        data: chatbot,
        message: `Chatbot ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error: any) {
      console.error('❌ [ChatbotController] Error toggling chatbot:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to toggle chatbot'
      });
    }
  }
}
