import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { chatTransfers } from '@shared/schema-chat';

type AuditAction =
  | 'chat_created'
  | 'chat_assigned'
  | 'chat_transferred'
  | 'chat_closed'
  | 'message_sent'
  | 'agent_status_changed'
  | 'queue_joined'
  | 'queue_left'
  | 'sla_breached'
  | 'escalated';

interface CreateAuditLogInput {
  tenantId: string;
  action: AuditAction;
  chatId?: string;
  queueId?: string;
  agentId?: string;
  userId: string;
  details: Record<string, any>;
}

export class CreateChatAuditLogUseCase {
  constructor(private db: NodePgDatabase<any>) {}

  async execute(input: CreateAuditLogInput): Promise<void> {
    const { tenantId, action, chatId, queueId, agentId, userId, details } = input;

    try {
      // Log to console for immediate visibility
      console.log('[CHAT-AUDIT]', {
        timestamp: new Date().toISOString(),
        tenantId,
        action,
        chatId,
        queueId,
        agentId,
        userId,
        details,
      });

      // For transfer actions, use the chatTransfers table
      if (action === 'chat_transferred' && chatId) {
        await this.db.insert(chatTransfers).values({
          tenantId,
          chatId,
          type: details.transferType || 'agent',
          fromAgentId: details.fromAgentId || null,
          toAgentId: details.toAgentId || null,
          fromQueueId: details.fromQueueId || null,
          toQueueId: details.toQueueId || null,
          reason: details.reason || null,
          notes: details.notes || null,
          initiatedById: userId,
        });
      }

      // For other actions, we could integrate with the global activity_logs table
      // or create a dedicated chat_audit_logs table if needed
      
      // TODO: Integrate with global audit system if available
      // await activityLogsService.create(tenantId, {
      //   action,
      //   entityType: 'chat',
      //   entityId: chatId,
      //   userId,
      //   details,
      // });

    } catch (error) {
      console.error('[CHAT-AUDIT] Error creating audit log:', error);
      // Don't throw - audit logs should not break the main flow
    }
  }

  // Helper method to log common actions
  static async logChatAssignment(
    db: NodePgDatabase<any>,
    tenantId: string,
    chatId: string,
    agentId: string,
    queueId: string,
    userId: string
  ): Promise<void> {
    const useCase = new CreateChatAuditLogUseCase(db);
    await useCase.execute({
      tenantId,
      action: 'chat_assigned',
      chatId,
      queueId,
      agentId,
      userId,
      details: {
        assignedAgentId: agentId,
        queueId,
      },
    });
  }

  static async logMessageSent(
    db: NodePgDatabase<any>,
    tenantId: string,
    chatId: string,
    messageId: string,
    senderId: string,
    content: string
  ): Promise<void> {
    const useCase = new CreateChatAuditLogUseCase(db);
    await useCase.execute({
      tenantId,
      action: 'message_sent',
      chatId,
      userId: senderId,
      details: {
        messageId,
        contentLength: content.length,
        hasAttachment: false,
      },
    });
  }

  static async logStatusChange(
    db: NodePgDatabase<any>,
    tenantId: string,
    agentId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    const useCase = new CreateChatAuditLogUseCase(db);
    await useCase.execute({
      tenantId,
      action: 'agent_status_changed',
      agentId,
      userId: agentId,
      details: {
        oldStatus,
        newStatus,
      },
    });
  }

  static async logSLABreach(
    db: NodePgDatabase<any>,
    tenantId: string,
    chatId: string,
    queueId: string,
    waitTime: number,
    slaThreshold: number
  ): Promise<void> {
    const useCase = new CreateChatAuditLogUseCase(db);
    await useCase.execute({
      tenantId,
      action: 'sla_breached',
      chatId,
      queueId,
      userId: 'system',
      details: {
        waitTime,
        slaThreshold,
        breachAmount: waitTime - slaThreshold,
      },
    });
  }
}
