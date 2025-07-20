// =====================================================
// OMNIBRIDGE DOMAIN ENTITIES
// Core business entities for unified communication management
// =====================================================

export interface CommunicationChannel {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  channelType: ChannelType;
  provider?: string;
  config: Record<string, any>;
  credentials: Record<string, any>;
  isActive: boolean;
  isMonitoring: boolean;
  messageLimit: number;
  dailyQuota: number;
  currentUsage: number;
  lastHealthCheck?: Date;
  healthStatus: HealthStatus;
  errorCount: number;
  lastError?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InboxMessage {
  id: string;
  tenantId: string;
  messageId?: string;
  threadId?: string;
  channelId: string;
  channelType: ChannelType;
  fromContact: string;
  fromName?: string;
  toContact?: string;
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  hasAttachments: boolean;
  attachmentCount: number;
  attachmentDetails: any[];
  mediaType?: string;
  direction: MessageDirection;
  priority: MessagePriority;
  category?: string;
  tags?: string;
  isRead: boolean;
  isProcessed: boolean;
  isArchived: boolean;
  processingRuleId?: string;
  ticketId?: string;
  needsResponse: boolean;
  responseDeadline?: Date;
  respondedAt?: Date;
  originalHeaders: Record<string, any>;
  providerData: Record<string, any>;
  messageDate?: Date;
  receivedAt: Date;
  processedAt?: Date;
}

export interface ProcessingRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  applicableChannels: ChannelType[];
  specificChannelIds: string[];
  conditions: Record<string, any>;
  senderPattern?: string;
  subjectPattern?: string;
  contentPattern?: string;
  keywordTriggers?: string;
  timeRestrictions: Record<string, any>;
  urgencyDetection: boolean;
  actionType: ActionType;
  actionConfig: Record<string, any>;
  defaultCategory?: string;
  defaultPriority?: string;
  defaultUrgency?: string;
  defaultStatus?: string;
  defaultAssigneeId?: string;
  defaultAssignmentGroup?: string;
  autoResponseEnabled: boolean;
  autoResponseTemplateId?: string;
  autoResponseDelay: number;
  escalationEnabled: boolean;
  escalationTimeMinutes: number;
  escalationTargetGroup?: string;
  extractTicketNumber: boolean;
  preventDuplicateTickets: boolean;
  notifyAssignee: boolean;
  sendAcknowledgment: boolean;
  executionCount: number;
  lastExecuted?: Date;
  averageExecutionTime: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponseTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  templateType: TemplateType;
  category?: string;
  supportedChannels: ChannelType[];
  channelVariants: Record<string, any>;
  emailSubject?: string;
  emailBodyHtml?: string;
  emailBodyText?: string;
  smsContent?: string;
  whatsappContent?: string;
  chatbotContent?: string;
  variableMapping: Record<string, any>;
  personalizationLevel: string;
  triggerConditions: Record<string, any>;
  languageCode: string;
  priority: number;
  requiresApproval: boolean;
  isActive: boolean;
  signatureId?: string;
  includeSignature: boolean;
  usageCount: number;
  lastUsed?: Date;
  successRate: number;
  isVariant: boolean;
  parentTemplateId?: string;
  variantWeight: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSignature {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  supportGroup: string;
  emailSignatureHtml?: string;
  emailSignatureText?: string;
  smsSignature?: string;
  whatsappSignature?: string;
  chatbotSignature?: string;
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  companyName?: string;
  companyWebsite?: string;
  companyAddress?: string;
  logoUrl?: string;
  brandColors: Record<string, any>;
  socialLinks: Record<string, any>;
  isDefault: boolean;
  isActive: boolean;
  autoInclude: boolean;
  channelSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessingLog {
  id: string;
  tenantId: string;
  messageId?: string;
  inboxId?: string;
  channelId?: string;
  channelType?: ChannelType;
  messageFrom?: string;
  messageSubject?: string;
  messageDirection?: MessageDirection;
  processingRuleId?: string;
  actionTaken?: string;
  processingStatus: ProcessingStatus;
  ticketId?: string;
  responseTemplateId?: string;
  escalationTriggered: boolean;
  processingTimeMs?: number;
  queueWaitTimeMs: number;
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  metadata: Record<string, any>;
  processedAt: Date;
}

export interface ChannelAnalytics {
  id: string;
  tenantId: string;
  date: Date;
  hour?: number;
  channelId?: string;
  channelType?: ChannelType;
  inboundMessages: number;
  outboundMessages: number;
  totalMessages: number;
  processedMessages: number;
  failedMessages: number;
  ignoredMessages: number;
  autoResponses: number;
  manualResponses: number;
  averageResponseTimeMinutes: number;
  ticketsCreated: number;
  escalationsTriggered: number;
  customerSatisfactionScore?: number;
  systemResponseTimeMs: number;
  errorRate: number;
  uptime: number;
  createdAt: Date;
}

// =====================================================
// ENUMS AND TYPE DEFINITIONS
// =====================================================

export type ChannelType = 
  | 'email'
  | 'whatsapp' 
  | 'telegram'
  | 'sms'
  | 'chatbot'
  | 'webchat'
  | 'voice'
  | 'social_media';

export type MessageDirection = 'inbound' | 'outbound';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export type ActionType = 
  | 'create_ticket'
  | 'update_ticket'
  | 'auto_respond'
  | 'forward'
  | 'escalate'
  | 'categorize'
  | 'ignore'
  | 'archive';

export type TemplateType = 
  | 'auto_response'
  | 'acknowledgment'
  | 'status_update'
  | 'resolution'
  | 'escalation'
  | 'welcome'
  | 'goodbye'
  | 'hold_notification';

export type ProcessingStatus = 
  | 'processed'
  | 'failed'
  | 'ignored'
  | 'pending'
  | 'retrying';

export type HealthStatus = 
  | 'healthy'
  | 'degraded'
  | 'error'
  | 'unknown';

// =====================================================
// VALUE OBJECTS AND CONSTANTS
// =====================================================

export const CHANNEL_PROVIDERS = {
  email: ['gmail', 'outlook', 'exchange', 'imap', 'smtp'],
  whatsapp: ['whatsapp_business', 'twilio', 'meta_api'],
  telegram: ['telegram_bot_api'],
  sms: ['twilio', 'aws_sns', 'nexmo', 'messagebird'],
  chatbot: ['dialogflow', 'rasa', 'botframework', 'custom'],
  webchat: ['intercom', 'zendesk', 'freshchat', 'custom'],
  voice: ['twilio_voice', 'amazon_connect', 'asterisk'],
  social_media: ['facebook', 'twitter', 'instagram', 'linkedin']
} as const;

export const PRIORITY_LEVELS = {
  low: { value: 1, label: 'Baixa', color: 'green' },
  normal: { value: 2, label: 'Normal', color: 'blue' },
  high: { value: 3, label: 'Alta', color: 'orange' },
  urgent: { value: 4, label: 'Urgente', color: 'red' }
} as const;

export const DEFAULT_RATE_LIMITS = {
  email: { messageLimit: 1000, dailyQuota: 50000 },
  whatsapp: { messageLimit: 100, dailyQuota: 1000 },
  telegram: { messageLimit: 500, dailyQuota: 10000 },
  sms: { messageLimit: 50, dailyQuota: 500 },
  chatbot: { messageLimit: 1000, dailyQuota: 100000 },
  webchat: { messageLimit: 500, dailyQuota: 50000 },
  voice: { messageLimit: 100, dailyQuota: 1000 },
  social_media: { messageLimit: 200, dailyQuota: 5000 }
} as const;