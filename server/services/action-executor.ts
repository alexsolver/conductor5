// ========================================
// ACTION EXECUTOR SERVICE
// ========================================
// Executes actions decided by the AI agent with validation and error handling

import { unifiedStorage } from '../storage-master';
import type { AiAction, AiAgent } from '@shared/schema';

// ========================================
// TYPES
// ========================================

export interface ActionExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  shouldRetry?: boolean;
  shouldEscalate?: boolean;
}

export interface PrerequisiteCheckResult {
  satisfied: boolean;
  missingPrerequisites?: string[];
  details?: any;
}

// ========================================
// ACTION EXECUTOR CLASS
// ========================================

export class ActionExecutor {
  
  /**
   * Execute an action with full validation and error handling
   */
  async executeAction(
    tenantId: string,
    agent: AiAgent,
    action: AiAction,
    params: Record<string, any>,
    conversationId: string
  ): Promise<ActionExecutionResult> {
    
    // Create execution record
    const execution = await unifiedStorage.createAiActionExecution({
      conversationId,
      actionType: action.actionType,
      inputParams: params,
      status: 'pending'
    });

    try {
      // Update to running
      await unifiedStorage.updateAiActionExecution(execution.id, {
        status: 'running'
      });

      // Check prerequisites
      const prereqCheck = await this.checkPrerequisites(tenantId, action, params);
      if (!prereqCheck.satisfied) {
        await unifiedStorage.updateAiActionExecution(execution.id, {
          status: 'failed',
          errorMessage: `Prerequisites not met: ${prereqCheck.missingPrerequisites?.join(', ')}`,
          completedAt: new Date()
        });

        return {
          success: false,
          error: `Prerequisites not met: ${prereqCheck.missingPrerequisites?.join(', ')}`,
          shouldEscalate: true
        };
      }

      // Execute the specific action
      const result = await this.executeSpecificAction(
        tenantId,
        action.actionType,
        params
      );

      // Update execution as completed
      await unifiedStorage.updateAiActionExecution(execution.id, {
        status: 'completed',
        result,
        completedAt: new Date()
      });

      return {
        success: true,
        result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update execution as failed
      await unifiedStorage.updateAiActionExecution(execution.id, {
        status: 'failed',
        errorMessage,
        completedAt: new Date()
      });

      // Determine retry/escalate based on error type and retry count
      const shouldRetry = execution.retryCount < 2 && this.isRetryableError(errorMessage);
      const shouldEscalate = !shouldRetry;

      return {
        success: false,
        error: errorMessage,
        shouldRetry,
        shouldEscalate
      };
    }
  }

  /**
   * Check if action prerequisites are satisfied
   */
  private async checkPrerequisites(
    tenantId: string,
    action: AiAction,
    params: Record<string, any>
  ): Promise<PrerequisiteCheckResult> {
    
    if (!action.prerequisites || Object.keys(action.prerequisites).length === 0) {
      return { satisfied: true };
    }

    const prerequisites = action.prerequisites as Record<string, any>;
    const missingPrerequisites: string[] = [];

    // Check each prerequisite
    for (const [prereqName, prereqConfig] of Object.entries(prerequisites)) {
      const isSatisfied = await this.checkSinglePrerequisite(
        tenantId,
        prereqName,
        prereqConfig,
        params
      );

      if (!isSatisfied) {
        missingPrerequisites.push(prereqName);
      }
    }

    return {
      satisfied: missingPrerequisites.length === 0,
      missingPrerequisites: missingPrerequisites.length > 0 ? missingPrerequisites : undefined
    };
  }

  /**
   * Check a single prerequisite
   */
  private async checkSinglePrerequisite(
    tenantId: string,
    prereqName: string,
    prereqConfig: any,
    params: Record<string, any>
  ): Promise<boolean> {
    
    switch (prereqName) {
      case 'customerExists':
        if (!params.customerId) return false;
        const customer = await unifiedStorage.getCustomer(tenantId, params.customerId);
        return !!customer;

      case 'ticketExists':
        if (!params.ticketId) return false;
        const ticket = await unifiedStorage.getTicket(tenantId, params.ticketId);
        return !!ticket;

      case 'validEmail':
        if (!params.email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(params.email);

      default:
        // Unknown prerequisite, assume satisfied
        return true;
    }
  }

  /**
   * Execute specific action based on action type
   */
  private async executeSpecificAction(
    tenantId: string,
    actionType: string,
    params: Record<string, any>
  ): Promise<any> {
    
    switch (actionType) {
      // ========================================
      // CUSTOMER ACTIONS
      // ========================================
      case 'create_customer':
        return await this.createCustomer(tenantId, params);

      case 'update_customer':
        return await this.updateCustomer(tenantId, params);

      case 'search_customer':
        return await this.searchCustomer(tenantId, params);

      // ========================================
      // TICKET ACTIONS
      // ========================================
      case 'create_ticket':
        return await this.createTicket(tenantId, params);

      case 'update_ticket':
        return await this.updateTicket(tenantId, params);

      case 'add_ticket_comment':
        return await this.addTicketComment(tenantId, params);

      case 'assign_ticket':
        return await this.assignTicket(tenantId, params);

      case 'change_ticket_status':
        return await this.changeTicketStatus(tenantId, params);

      case 'search_tickets':
        return await this.searchTickets(tenantId, params);

      // ========================================
      // KNOWLEDGE BASE ACTIONS
      // ========================================
      case 'search_knowledge_base':
        return await this.searchKnowledgeBase(tenantId, params);

      case 'get_article':
        return await this.getArticle(tenantId, params);

      // ========================================
      // NOTIFICATION ACTIONS
      // ========================================
      case 'send_notification':
        return await this.sendNotification(tenantId, params);

      case 'notify_group':
        return await this.notifyGroup(tenantId, params);

      // ========================================
      // EMAIL ACTIONS
      // ========================================
      case 'send_email':
        return await this.sendEmail(tenantId, params);

      // ========================================
      // INFORMATION ACTIONS
      // ========================================
      case 'get_business_hours':
        return await this.getBusinessHours(tenantId, params);

      case 'get_location_info':
        return await this.getLocationInfo(tenantId, params);

      default:
        throw new Error(`Action type not implemented: ${actionType}`);
    }
  }

  // ========================================
  // CUSTOMER ACTION IMPLEMENTATIONS
  // ========================================

  private async createCustomer(tenantId: string, params: any) {
    return await unifiedStorage.createCustomer({
      tenantId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      document: params.document,
      address: params.address,
      notes: params.notes || null
    });
  }

  private async updateCustomer(tenantId: string, params: any) {
    return await unifiedStorage.updateCustomer(tenantId, params.customerId, {
      name: params.name,
      email: params.email,
      phone: params.phone,
      address: params.address
    });
  }

  private async searchCustomer(tenantId: string, params: any) {
    const customers = await unifiedStorage.getCustomers(tenantId);
    
    // Simple search by name, email, or phone
    const query = params.query?.toLowerCase() || '';
    return customers.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  }

  // ========================================
  // TICKET ACTION IMPLEMENTATIONS
  // ========================================

  private async createTicket(tenantId: string, params: any) {
    return await unifiedStorage.createTicket({
      tenantId,
      customerId: params.customerId,
      title: params.title,
      description: params.description,
      priority: params.priority || 'medium',
      status: params.status || 'open',
      categoryId: params.categoryId,
      subcategoryId: params.subcategoryId,
      assignedTo: params.assignedTo,
      dueDate: params.dueDate ? new Date(params.dueDate) : null
    });
  }

  private async updateTicket(tenantId: string, params: any) {
    return await unifiedStorage.updateTicket(tenantId, params.ticketId, {
      title: params.title,
      description: params.description,
      priority: params.priority,
      status: params.status,
      assignedTo: params.assignedTo
    });
  }

  private async addTicketComment(tenantId: string, params: any) {
    return await unifiedStorage.createTicketMessage({
      tenantId,
      ticketId: params.ticketId,
      content: params.comment,
      isInternal: params.isInternal || false,
      senderId: params.senderId
    });
  }

  private async assignTicket(tenantId: string, params: any) {
    return await unifiedStorage.updateTicket(tenantId, params.ticketId, {
      assignedTo: params.userId
    });
  }

  private async changeTicketStatus(tenantId: string, params: any) {
    return await unifiedStorage.updateTicket(tenantId, params.ticketId, {
      status: params.status
    });
  }

  private async searchTickets(tenantId: string, params: any) {
    const tickets = await unifiedStorage.getTickets(tenantId);
    
    let filtered = tickets;

    // Filter by customer
    if (params.customerId) {
      filtered = filtered.filter(t => t.customerId === params.customerId);
    }

    // Filter by status
    if (params.status) {
      filtered = filtered.filter(t => t.status === params.status);
    }

    // Filter by priority
    if (params.priority) {
      filtered = filtered.filter(t => t.priority === params.priority);
    }

    // Text search in title/description
    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  // ========================================
  // KNOWLEDGE BASE ACTION IMPLEMENTATIONS
  // ========================================

  private async searchKnowledgeBase(tenantId: string, params: any) {
    // TODO: Implement knowledge base search
    // This would integrate with the knowledge base module
    return {
      message: 'Knowledge base search not yet implemented',
      query: params.query
    };
  }

  private async getArticle(tenantId: string, params: any) {
    // TODO: Implement article retrieval
    return {
      message: 'Article retrieval not yet implemented',
      articleId: params.articleId
    };
  }

  // ========================================
  // NOTIFICATION ACTION IMPLEMENTATIONS
  // ========================================

  private async sendNotification(tenantId: string, params: any) {
    // TODO: Integrate with notification system
    return {
      message: 'Notification sent',
      userId: params.userId,
      content: params.message
    };
  }

  private async notifyGroup(tenantId: string, params: any) {
    // TODO: Integrate with group notification system
    return {
      message: 'Group notification sent',
      groupId: params.groupId,
      content: params.message
    };
  }

  // ========================================
  // EMAIL ACTION IMPLEMENTATIONS
  // ========================================

  private async sendEmail(tenantId: string, params: any) {
    // TODO: Integrate with email service (SendGrid)
    return {
      message: 'Email sent',
      to: params.to,
      subject: params.subject,
      body: params.body
    };
  }

  // ========================================
  // INFORMATION ACTION IMPLEMENTATIONS
  // ========================================

  private async getBusinessHours(tenantId: string, params: any) {
    // TODO: Get business hours from configuration
    return {
      weekdays: '9:00 AM - 6:00 PM',
      saturday: '9:00 AM - 1:00 PM',
      sunday: 'Closed'
    };
  }

  private async getLocationInfo(tenantId: string, params: any) {
    // TODO: Get location information
    return {
      address: 'Location information not yet configured',
      phone: params.locationId
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(errorMessage: string): boolean {
    const retryableErrors = [
      'timeout',
      'connection',
      'network',
      'temporarily unavailable',
      'rate limit'
    ];

    return retryableErrors.some(err => 
      errorMessage.toLowerCase().includes(err)
    );
  }
}

// Export singleton instance
export const actionExecutor = new ActionExecutor();
