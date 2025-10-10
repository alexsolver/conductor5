/**
 * CHAT CONTROLLER
 * REST API Controller for Chat Module
 * 
 * Provides 33 endpoints for:
 * - Queue Management (11 endpoints)
 * - Chat Management (8 endpoints)
 * - Message Management (5 endpoints)
 * - Agent Status (3 endpoints)
 * - Assignment (2 endpoints)
 * - Monitoring (3 endpoints)
 * - WebSocket Stats (1 endpoint)
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { jwtAuth } from '@server/middleware/jwtAuth';

import { CreateQueueUseCase } from '../use-cases/CreateQueueUseCase';
import { UpdateQueueUseCase } from '../use-cases/UpdateQueueUseCase';
import { AddToQueueUseCase } from '../use-cases/AddToQueueUseCase';
import { AssignAgentToChatUseCase } from '../use-cases/AssignAgentToChatUseCase';
import { UpdateAgentStatusUseCase } from '../use-cases/UpdateAgentStatusUseCase';
import { TransferChatUseCase } from '../use-cases/TransferChatUseCase';
import { SendMessageUseCase } from '../use-cases/SendMessageUseCase';
import { CloseChatUseCase } from '../use-cases/CloseChatUseCase';
import { AddParticipantUseCase } from '../use-cases/AddParticipantUseCase';
import { RemoveParticipantUseCase } from '../use-cases/RemoveParticipantUseCase';
import { AddReactionUseCase } from '../use-cases/AddReactionUseCase';

import { DrizzleQueueRepository } from '../../infrastructure/repositories/DrizzleQueueRepository';
import { DrizzleChatRepository } from '../../infrastructure/repositories/DrizzleChatRepository';
import { DrizzleMessageRepository } from '../../infrastructure/repositories/DrizzleMessageRepository';
import { DrizzleAgentStatusRepository } from '../../infrastructure/repositories/DrizzleAgentStatusRepository';

import { SLAMonitoringService } from '../../domain/services/SLAMonitoringService';
import { chatWebSocketService } from '../../infrastructure/services/WebSocketChatService';

export class ChatController {
  router: Router;
  
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    // ===========================================================================================
    // QUEUE ENDPOINTS (11)
    // ===========================================================================================
    
    this.router.post('/queues', jwtAuth, this.createQueue);
    this.router.get('/queues', jwtAuth, this.listQueues);
    this.router.get('/queues/stats', jwtAuth, this.getAllQueuesStats);
    this.router.get('/queues/:id', jwtAuth, this.getQueue);
    this.router.put('/queues/:id', jwtAuth, this.updateQueue);
    this.router.delete('/queues/:id', jwtAuth, this.deleteQueue);
    this.router.post('/queues/:id/members', jwtAuth, this.addQueueMember);
    this.router.delete('/queues/:id/members/:memberId', jwtAuth, this.removeQueueMember);
    this.router.get('/queues/:id/members', jwtAuth, this.listQueueMembers);
    this.router.post('/queues/:id/entries', jwtAuth, this.addQueueEntry);
    this.router.get('/queues/:id/entries', jwtAuth, this.listQueueEntries);
    this.router.get('/queues/:id/stats', jwtAuth, this.getQueueStats);

    // ===========================================================================================
    // CHAT ENDPOINTS (8)
    // ===========================================================================================
    
    this.router.post('/chats', jwtAuth, this.createChat);
    this.router.get('/chats', jwtAuth, this.listChats);
    this.router.get('/chats/:id', jwtAuth, this.getChat);
    this.router.put('/chats/:id/close', jwtAuth, this.closeChat);
    this.router.post('/chats/:id/transfer', jwtAuth, this.transferChat);
    this.router.post('/chats/:id/participants', jwtAuth, this.addParticipant);
    this.router.delete('/chats/:id/participants/:participantId', jwtAuth, this.removeParticipant);
    this.router.get('/chats/:id/participants', jwtAuth, this.listParticipants);

    // ===========================================================================================
    // MESSAGE ENDPOINTS (5)
    // ===========================================================================================
    
    this.router.post('/chats/:chatId/messages', jwtAuth, this.sendMessage);
    this.router.get('/chats/:chatId/messages', jwtAuth, this.listMessages);
    this.router.put('/messages/:id/read', jwtAuth, this.markMessageRead);
    this.router.post('/messages/:id/reactions', jwtAuth, this.addReaction);
    this.router.delete('/messages/:id/reactions/:reactionId', jwtAuth, this.removeReaction);

    // ===========================================================================================
    // AGENT STATUS ENDPOINTS (3)
    // ===========================================================================================
    
    this.router.put('/agent/status', jwtAuth, this.updateAgentStatus);
    this.router.get('/agent/status', jwtAuth, this.getAgentStatus);
    this.router.get('/agents/status', jwtAuth, this.listAgentsStatus);

    // ===========================================================================================
    // AGENT INTERFACE ENDPOINTS (6) - For Chat Agent & Agent Control Pages
    // ===========================================================================================
    
    this.router.get('/agents/pending', jwtAuth, this.getAgentPendingChats);
    this.router.get('/agents/chats', jwtAuth, this.getAgentActiveChats);
    this.router.get('/agents/my-status', jwtAuth, this.getMyAgentStatus);
    this.router.get('/agents/my-metrics', jwtAuth, this.getMyAgentMetrics);
    this.router.post('/agents/accept', jwtAuth, this.acceptChat);
    this.router.post('/agents/decline', jwtAuth, this.declineChat);

    // ===========================================================================================
    // ASSIGNMENT ENDPOINTS (2)
    // ===========================================================================================
    
    this.router.post('/assign/:entryId', jwtAuth, this.assignAgent);
    this.router.post('/assign/auto/:queueId', jwtAuth, this.autoAssignAgent);

    // ===========================================================================================
    // MONITORING ENDPOINTS (3)
    // ===========================================================================================
    
    this.router.get('/monitor/dashboard', jwtAuth, this.getMonitorDashboard);
    this.router.get('/monitor/alerts', jwtAuth, this.getMonitorAlerts);
    this.router.get('/monitor/queue/:queueId', jwtAuth, this.monitorQueue);

    // ===========================================================================================
    // WEBSOCKET STATS (1)
    // ===========================================================================================
    
    this.router.get('/ws/stats', jwtAuth, this.getWebSocketStats);
  }

  // ===========================================================================================
  // QUEUE ENDPOINTS IMPLEMENTATION
  // ===========================================================================================

  private createQueue = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const repository = new DrizzleQueueRepository();
      const useCase = new CreateQueueUseCase(repository);
      
      const result = await useCase.execute({
        tenantId,
        createdById: userId,
        ...req.body
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private listQueues = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      
      const repository = new DrizzleQueueRepository();
      const queues = await repository.findQueuesByTenant(tenantId);
      
      res.json(queues);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private getQueue = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const repository = new DrizzleQueueRepository();
      const queue = await repository.findQueueById(id, tenantId);
      
      if (!queue) {
        return res.status(404).json({ error: 'Queue not found' });
      }
      
      res.json(queue);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private updateQueue = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;
      
      const repository = new DrizzleQueueRepository();
      const useCase = new UpdateQueueUseCase(repository);
      
      const result = await useCase.execute({
        id,
        tenantId,
        updatedById: userId,
        ...req.body
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private deleteQueue = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const repository = new DrizzleQueueRepository();
      await repository.deleteQueue(id, tenantId);
      
      res.json({ success: true, message: 'Queue deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private addQueueMember = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const { userId, priority, skills } = req.body;
      
      const repository = new DrizzleQueueRepository();
      
      const member = {
        id: uuidv4(),
        tenantId,
        queueId: id,
        userId,
        priority: priority || 1,
        skills: skills || [],
        isActive: true,
        joinedAt: new Date(),
      };
      
      const result = await repository.addMember(member);
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private removeQueueMember = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { memberId } = req.params;
      
      const repository = new DrizzleQueueRepository();
      await repository.removeMember(memberId, tenantId);
      
      res.json({ success: true, message: 'Member removed successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private listQueueMembers = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const repository = new DrizzleQueueRepository();
      const members = await repository.findQueueMembers(id, tenantId);
      
      res.json(members);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private addQueueEntry = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const repository = new DrizzleQueueRepository();
      const useCase = new AddToQueueUseCase(repository);
      
      const result = await useCase.execute({
        tenantId,
        queueId: id,
        ...req.body
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private listQueueEntries = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const repository = new DrizzleQueueRepository();
      const entries = await repository.findEntriesByQueue(id, tenantId);
      
      res.json(entries);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private getAllQueuesStats = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      
      const queueRepository = new DrizzleQueueRepository();
      const slaService = new SLAMonitoringService(queueRepository);
      
      // Get all queues for this tenant
      const queues = await queueRepository.findQueuesByTenant(tenantId);
      console.log('📊 [QUEUE-STATS] Found queues:', queues.length, queues.map(q => ({ id: q?.id, name: q?.name })));
      
      // Get stats for each queue
      const allStats = await Promise.all(
        queues.map(queue => {
          console.log('📊 [QUEUE-STATS] Processing queue:', { id: queue?.id, name: queue?.name });
          return slaService.monitorQueue(tenantId, queue.id);
        })
      );
      
      console.log('📊 [QUEUE-STATS] Stats generated successfully:', allStats.length);
      res.json(allStats);
    } catch (error: any) {
      console.error('❌ [QUEUE-STATS-ERROR] Message:', error?.message || 'No message');
      console.error('❌ [QUEUE-STATS-ERROR] Name:', error?.name || 'No name');  
      console.error('❌ [QUEUE-STATS-ERROR] Stack trace:', error?.stack || 'No stack');
      console.error('❌ [QUEUE-STATS-ERROR] Full error object:', JSON.stringify(error, null, 2));
      res.status(400).json({ error: error.message || 'Unknown error' });
    }
  };

  private getQueueStats = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const queueRepository = new DrizzleQueueRepository();
      const slaService = new SLAMonitoringService(queueRepository);
      
      const stats = await slaService.monitorQueue(tenantId, id);
      
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // ===========================================================================================
  // CHAT ENDPOINTS IMPLEMENTATION
  // ===========================================================================================

  private createChat = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const chatRepository = new DrizzleChatRepository();
      
      const chat = {
        id: uuidv4(),
        tenantId,
        type: req.body.type || 'support',
        status: 'active',
        title: req.body.title,
        assignedAgentId: req.body.assignedAgentId || userId,
        customerId: req.body.customerId,
        queueId: req.body.queueId,
        conversationId: req.body.conversationId,
        metadata: req.body.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await chatRepository.createChat(chat);
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private listChats = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { agentId, customerId, status } = req.query;
      
      const chatRepository = new DrizzleChatRepository();
      
      let chats;
      
      if (agentId) {
        chats = await chatRepository.findChatsByAgent(
          agentId as string,
          tenantId,
          status as string
        );
      } else if (customerId) {
        chats = await chatRepository.findChatsByCustomer(
          customerId as string,
          tenantId
        );
      } else {
        chats = await chatRepository.findChatsByAgent(
          req.user!.id,
          tenantId,
          status as string
        );
      }
      
      res.json(chats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private getChat = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const chatRepository = new DrizzleChatRepository();
      const chat = await chatRepository.findChatById(id, tenantId);
      
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      res.json(chat);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private closeChat = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;
      
      const chatRepository = new DrizzleChatRepository();
      const queueRepository = new DrizzleQueueRepository();
      const agentStatusRepository = new DrizzleAgentStatusRepository();
      
      const useCase = new CloseChatUseCase(
        chatRepository,
        agentStatusRepository,
        queueRepository
      );
      
      const result = await useCase.execute({
        tenantId,
        chatId: id,
        closedById: userId,
      });
      
      chatWebSocketService.broadcastToChat(id, {
        type: 'chat_closed',
        data: {
          chatId: id,
          tenantId,
          status: 'closed',
          timestamp: new Date().toISOString()
        }
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private transferChat = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;
      
      const chatRepository = new DrizzleChatRepository();
      const queueRepository = new DrizzleQueueRepository();
      const agentStatusRepository = new DrizzleAgentStatusRepository();
      
      const useCase = new TransferChatUseCase(
        chatRepository,
        queueRepository,
        agentStatusRepository
      );
      
      const result = await useCase.execute({
        tenantId,
        chatId: id,
        initiatedById: userId,
        ...req.body
      });
      
      if (result.success && result.chat) {
        chatWebSocketService.broadcastToChat(id, {
          type: 'chat_transferred',
          data: {
            chatId: id,
            fromAgentId: req.body.fromAgentId,
            toAgentId: req.body.toAgentId,
            toQueueId: req.body.toQueueId,
            reason: req.body.reason,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private addParticipant = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const chatRepository = new DrizzleChatRepository();
      const useCase = new AddParticipantUseCase(chatRepository);
      
      const result = await useCase.execute({
        tenantId,
        chatId: id,
        ...req.body
      });
      
      chatWebSocketService.broadcastToChat(id, {
        type: 'participant_joined',
        data: {
          chatId: id,
          userId: req.body.userId,
          userName: req.body.userName || 'User',
          role: req.body.role || 'participant',
          timestamp: new Date().toISOString()
        }
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private removeParticipant = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id, participantId } = req.params;
      
      const chatRepository = new DrizzleChatRepository();
      const useCase = new RemoveParticipantUseCase(chatRepository);
      
      await useCase.execute({
        tenantId,
        chatId: id,
        participantId,
      });
      
      chatWebSocketService.broadcastToChat(id, {
        type: 'participant_left',
        data: {
          chatId: id,
          userId: participantId,
          userName: 'User',
          role: 'participant',
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({ success: true, message: 'Participant removed successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private listParticipants = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      
      const chatRepository = new DrizzleChatRepository();
      const participants = await chatRepository.findParticipants(id, tenantId);
      
      res.json(participants);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // ===========================================================================================
  // MESSAGE ENDPOINTS IMPLEMENTATION
  // ===========================================================================================

  private sendMessage = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { chatId } = req.params;
      
      const messageRepository = new DrizzleMessageRepository();
      const chatRepository = new DrizzleChatRepository();
      
      const useCase = new SendMessageUseCase(messageRepository, chatRepository);
      
      const result = await useCase.execute({
        tenantId,
        chatId,
        senderId: userId,
        senderName: req.body.senderName || req.user!.name || 'User',
        ...req.body
      });
      
      chatWebSocketService.broadcastToChat(chatId, {
        type: 'message_sent',
        data: {
          messageId: result.id,
          chatId,
          senderId: userId,
          senderName: req.body.senderName || req.user!.name || 'User',
          content: result.content,
          type: result.type,
          timestamp: result.createdAt.toISOString()
        }
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private listMessages = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { chatId } = req.params;
      const { page = '1', limit = '50' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      const messageRepository = new DrizzleMessageRepository();
      const messages = await messageRepository.findMessagesByChat(
        chatId,
        tenantId,
        limitNum,
        offset
      );
      
      res.json({
        messages,
        page: pageNum,
        limit: limitNum,
        total: messages.length
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private markMessageRead = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;
      
      const messageRepository = new DrizzleMessageRepository();
      
      const message = await messageRepository.findMessageById(id, tenantId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      const readBy = message.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
      }
      
      const result = await messageRepository.updateMessage(id, {
        tenantId,
        isRead: true,
        readBy,
        readAt: new Date(),
      });
      
      chatWebSocketService.broadcastToChat(message.chatId, {
        type: 'message_read',
        data: {
          messageId: id,
          chatId: message.chatId,
          readByUserId: userId,
          readByName: req.user!.name || 'User',
          timestamp: new Date().toISOString()
        }
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private addReaction = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;
      
      const messageRepository = new DrizzleMessageRepository();
      const useCase = new AddReactionUseCase(messageRepository);
      
      const result = await useCase.execute({
        tenantId,
        messageId: id,
        userId,
        emoji: req.body.emoji,
      });
      
      const message = await messageRepository.findMessageById(id, tenantId);
      
      if (message) {
        chatWebSocketService.broadcastToChat(message.chatId, {
          type: 'reaction_added',
          data: {
            messageId: id,
            chatId: message.chatId,
            userId,
            userName: req.user!.name || 'User',
            emoji: req.body.emoji,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private removeReaction = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id, reactionId } = req.params;
      
      const messageRepository = new DrizzleMessageRepository();
      
      const message = await messageRepository.findMessageById(id, tenantId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      await messageRepository.removeReaction(reactionId, tenantId);
      
      chatWebSocketService.broadcastToChat(message.chatId, {
        type: 'reaction_removed',
        data: {
          messageId: id,
          chatId: message.chatId,
          userId: req.user!.id,
          emoji: '',
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({ success: true, message: 'Reaction removed successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // ===========================================================================================
  // AGENT STATUS ENDPOINTS IMPLEMENTATION
  // ===========================================================================================

  private updateAgentStatus = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const agentStatusRepository = new DrizzleAgentStatusRepository();
      const useCase = new UpdateAgentStatusUseCase(agentStatusRepository);
      
      const result = await useCase.execute({
        tenantId,
        userId,
        ...req.body
      });
      
      chatWebSocketService.broadcastToAgents(tenantId, {
        type: 'agent_status_changed',
        data: {
          userId,
          userName: req.user!.name || 'Agent',
          status: result.status,
          currentChatsCount: result.currentChatsCount,
          maxConcurrentChats: result.maxConcurrentChats,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private getAgentStatus = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const agentStatusRepository = new DrizzleAgentStatusRepository();
      const status = await agentStatusRepository.findByUserId(userId, tenantId);
      
      if (!status) {
        return res.status(404).json({ error: 'Agent status not found' });
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private listAgentsStatus = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      
      const agentStatusRepository = new DrizzleAgentStatusRepository();
      const statuses = await agentStatusRepository.findAll(tenantId);
      
      res.json(statuses);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // ===========================================================================================
  // ASSIGNMENT ENDPOINTS IMPLEMENTATION
  // ===========================================================================================

  private assignAgent = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { entryId } = req.params;
      
      const queueRepository = new DrizzleQueueRepository();
      const chatRepository = new DrizzleChatRepository();
      const agentStatusRepository = new DrizzleAgentStatusRepository();
      
      const useCase = new AssignAgentToChatUseCase(
        queueRepository,
        chatRepository,
        agentStatusRepository
      );
      
      const result = await useCase.execute({
        tenantId,
        queueEntryId: entryId,
      });
      
      if (result.success && result.chat) {
        chatWebSocketService.broadcastToChat(result.chat.id, {
          type: 'queue_entry_assigned',
          data: {
            entryId,
            chatId: result.chat.id,
            agentId: result.chat.assignedAgentId,
            agentName: 'Agent',
            assignmentReason: 'Manual assignment',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private autoAssignAgent = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { queueId } = req.params;
      
      const queueRepository = new DrizzleQueueRepository();
      const chatRepository = new DrizzleChatRepository();
      const agentStatusRepository = new DrizzleAgentStatusRepository();
      
      const entries = await queueRepository.findEntriesByQueue(queueId, tenantId);
      const waitingEntry = entries.find(e => e.status === 'waiting');
      
      if (!waitingEntry) {
        return res.status(404).json({ error: 'No waiting entries in queue' });
      }
      
      const useCase = new AssignAgentToChatUseCase(
        queueRepository,
        chatRepository,
        agentStatusRepository
      );
      
      const result = await useCase.execute({
        tenantId,
        queueEntryId: waitingEntry.id,
      });
      
      if (result.success && result.chat) {
        chatWebSocketService.broadcastToQueue(queueId, {
          type: 'queue_entry_assigned',
          data: {
            entryId: waitingEntry.id,
            queueId,
            chatId: result.chat.id,
            agentId: result.chat.assignedAgentId,
            agentName: 'Agent',
            assignmentReason: 'Auto-assignment',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // ===========================================================================================
  // MONITORING ENDPOINTS IMPLEMENTATION
  // ===========================================================================================

  private getMonitorDashboard = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      
      const queueRepository = new DrizzleQueueRepository();
      const slaService = new SLAMonitoringService(queueRepository);
      
      const dashboard = await slaService.getDashboardSummary(tenantId);
      
      res.json(dashboard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private getMonitorAlerts = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      
      const queueRepository = new DrizzleQueueRepository();
      const slaService = new SLAMonitoringService(queueRepository);
      
      const { alerts } = await slaService.monitorAllQueues(tenantId);
      
      res.json(alerts);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private monitorQueue = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { queueId } = req.params;
      
      const queueRepository = new DrizzleQueueRepository();
      const slaService = new SLAMonitoringService(queueRepository);
      
      const monitoring = await slaService.monitorQueue(tenantId, queueId);
      
      res.json(monitoring);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // ===========================================================================================
  // WEBSOCKET STATS IMPLEMENTATION
  // ===========================================================================================

  private getWebSocketStats = async (req: Request, res: Response) => {
    try {
      const stats = chatWebSocketService.getStats();
      
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // ===========================================================================================
  // AGENT INTERFACE IMPLEMENTATIONS
  // ===========================================================================================

  private getAgentPendingChats = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const queueRepository = new DrizzleQueueRepository();
      
      // Get all queue entries assigned to this agent or waiting
      const entries = await queueRepository.findPendingEntriesForAgent(tenantId, userId);
      
      res.json(entries);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private getAgentActiveChats = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const chatRepository = new DrizzleChatRepository();
      
      // Get all active chats for this agent
      const chats = await chatRepository.findChatsByAgent(tenantId, userId);
      
      res.json(chats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private getMyAgentStatus = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const agentStatusRepository = new DrizzleAgentStatusRepository();
      
      const status = await agentStatusRepository.findAgentStatus(userId, tenantId);
      
      res.json(status || { userId, tenantId, status: 'offline', activeChats: 0 });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private getMyAgentMetrics = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      
      const chatRepository = new DrizzleChatRepository();
      
      // Get agent metrics
      const metrics = await chatRepository.getAgentMetrics(tenantId, userId);
      
      res.json(metrics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private acceptChat = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { chatId } = req.body;
      
      if (!chatId) {
        return res.status(400).json({ error: 'Chat ID is required' });
      }
      
      const queueRepository = new DrizzleQueueRepository();
      const useCase = new AssignAgentToChatUseCase(queueRepository);
      
      // Assign the agent to this chat
      await useCase.execute({
        tenantId,
        agentId: userId,
        entryId: chatId
      });
      
      res.json({ success: true, message: 'Chat accepted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private declineChat = async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { chatId } = req.body;
      
      if (!chatId) {
        return res.status(400).json({ error: 'Chat ID is required' });
      }
      
      // Simply return success - the chat stays in queue for other agents
      res.json({ success: true, message: 'Chat declined successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

export const chatController = new ChatController();
export const chatRoutes = chatController.router;
