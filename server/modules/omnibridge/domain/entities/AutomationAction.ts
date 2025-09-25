
export interface AutomationAction {
  id: string;
  ruleId: string;
  type: 'auto_reply' | 'forward_message' | 'create_ticket' | 'send_notification' | 'add_tags' | 'assign_agent' | 'escalate' | 'archive' | 'mark_priority' | 'webhook_call' | 
        'create_urgent_ticket' | 'create_ticket_from_template' | 'assign_by_skill' | 'assign_round_robin' | 'escalate_ticket' | 'link_related_tickets' | 
        'send_sms' | 'send_survey' | 'ai_categorize' | 'ai_translate' | 'update_crm' | 'generate_report' | 'assign_team' | 'remove_tags' | 'change_status' |
        'create_followup_task' | 'schedule_reminder' | 'add_note' | 'log_activity' | 'notify_customer' | 'send_email' | 'notify_manager' | 'api_request' |
        'close_ticket' | 'reopen_ticket' | 'set_ticket_sla' | 'assign_ticket_by_category' | 'update_priority' | 'update_metrics';
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
