
export interface AutomationAction {
  id: string;
  ruleId: string;
  type: 'auto_reply' | 'forward_message' | 'create_ticket' | 'send_notification' | 'add_tags' | 'assign_agent' | 'escalate' | 'archive' | 'mark_priority' | 'webhook_call';
  parameters: {
    // Auto Reply
    replyTemplate?: string;
    replyDelay?: number;
    
    // Forward Message
    forwardTo?: string[];
    forwardWithNote?: string;
    
    // Create Ticket
    ticketTemplate?: string;
    assignToAgent?: string;
    ticketPriority?: string;
    ticketCategory?: string;
    
    // Notification
    notifyUsers?: string[];
    notificationMessage?: string;
    notificationChannel?: 'email' | 'sms' | 'push' | 'slack';
    
    // Tags
    tagsToAdd?: string[];
    tagsToRemove?: string[];
    
    // Assignment
    agentId?: string;
    teamId?: string;
    
    // Priority
    newPriority?: 'low' | 'medium' | 'high' | 'urgent';
    
    // Webhook
    webhookUrl?: string;
    webhookMethod?: 'GET' | 'POST' | 'PUT';
    webhookHeaders?: Record<string, string>;
    webhookPayload?: Record<string, any>;
  };
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
