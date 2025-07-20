
/**
 * Process Inbox Messages Use Case
 * Clean Architecture - Application Layer
 */
import { IUnifiedMessageRepository } from '../../domain/repositories/IUnifiedMessageRepository';
import { IProcessingRuleRepository } from '../../domain/repositories/IProcessingRuleRepository';
import { UnifiedMessage } from '../../domain/entities/UnifiedMessage';

export class ProcessInboxMessagesUseCase {
  constructor(
    private messageRepository: IUnifiedMessageRepository,
    private ruleRepository: IProcessingRuleRepository
  ) {}

  async execute(tenantId: string): Promise<ProcessingResult> {
    const unprocessedMessages = await this.messageRepository.findAll(tenantId, {
      // Add filter for unprocessed messages
    });
    
    const activeRules = await this.ruleRepository.findActive(tenantId);
    
    let processedCount = 0;
    let ticketsCreated = 0;
    let autoRepliesSent = 0;
    
    for (const message of unprocessedMessages) {
      if (message.isProcessed) continue;
      
      const applicableRules = activeRules.filter(rule => 
        rule.canExecute(message)
      ).sort((a, b) => a.priority - b.priority);
      
      for (const rule of applicableRules) {
        const result = await this.executeRule(tenantId, rule, message);
        
        if (result.ticketCreated) ticketsCreated++;
        if (result.autoReplySent) autoRepliesSent++;
        
        // Update rule execution count
        await this.ruleRepository.updateExecutionCount(tenantId, rule.id);
        
        // Mark message as processed if ticket was created
        if (result.ticketCreated) {
          await this.messageRepository.markAsProcessed(tenantId, message.id, result.ticketId);
          break; // Stop processing other rules for this message
        }
      }
      
      processedCount++;
    }
    
    return {
      processedCount,
      ticketsCreated,
      autoRepliesSent
    };
  }
  
  private async executeRule(tenantId: string, rule: any, message: UnifiedMessage): Promise<RuleExecutionResult> {
    let ticketCreated = false;
    let autoReplySent = false;
    let ticketId: string | undefined;
    
    for (const action of rule.actions) {
      switch (action.type) {
        case 'create_ticket':
          ticketId = await this.createTicketFromMessage(tenantId, message, action.parameters);
          ticketCreated = !!ticketId;
          break;
          
        case 'auto_reply':
          autoReplySent = await this.sendAutoReply(tenantId, message, action.parameters);
          break;
          
        case 'set_priority':
          // Update message priority
          break;
          
        case 'add_tag':
          // Add tag to message
          break;
      }
    }
    
    return { ticketCreated, autoReplySent, ticketId };
  }
  
  private async createTicketFromMessage(tenantId: string, message: UnifiedMessage, parameters: any): Promise<string | undefined> {
    try {
      const { storage } = await import('../../../../storage-simple');
      
      // Check for existing ticket by thread or subject to prevent duplicates
      const existingTickets = await storage.getTickets(tenantId, 50, 0);
      const duplicateTicket = existingTickets.find(ticket => 
        ticket.subject === message.subject ||
        (message.threadId && ticket.metadata?.threadId === message.threadId)
      );
      
      if (duplicateTicket) {
        // Add message to existing ticket instead of creating new one
        await storage.createTicketMessage(tenantId, {
          ticketId: duplicateTicket.id,
          content: message.content,
          type: 'email',
          isInternal: 'false',
          customerId: null,
          userId: null,
          attachments: JSON.stringify(message.attachments)
        });
        return duplicateTicket.id;
      }
      
      // Create new ticket
      const ticketData = {
        subject: message.subject || 'Email: ' + message.content.substring(0, 50),
        description: message.content,
        priority: message.priority,
        status: 'open',
        customerId: null, // Will be resolved later
        metadata: {
          sourceChannel: message.channelType,
          sourceMessageId: message.id,
          threadId: message.threadId,
          fromEmail: message.fromAddress
        }
      };
      
      const ticket = await storage.createTicket(tenantId, ticketData);
      
      // Add initial message to ticket
      await storage.createTicketMessage(tenantId, {
        ticketId: ticket.id,
        content: message.content,
        type: 'email',
        isInternal: 'false',
        customerId: null,
        userId: null,
        attachments: JSON.stringify(message.attachments)
      });
      
      return ticket.id;
    } catch (error) {
      console.error('Error creating ticket from message:', error);
      return undefined;
    }
  }
  
  private async sendAutoReply(tenantId: string, message: UnifiedMessage, parameters: any): Promise<boolean> {
    try {
      // Implementation for auto-reply
      // This would integrate with the channel's sending mechanism
      return true;
    } catch (error) {
      console.error('Error sending auto-reply:', error);
      return false;
    }
  }
}

interface ProcessingResult {
  processedCount: number;
  ticketsCreated: number;
  autoRepliesSent: number;
}

interface RuleExecutionResult {
  ticketCreated: boolean;
  autoReplySent: boolean;
  ticketId?: string;
}
