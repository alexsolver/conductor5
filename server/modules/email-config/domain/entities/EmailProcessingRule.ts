
export interface EmailProcessingRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  
  // Matching criteria
  fromEmailPattern?: string;
  subjectPattern?: string;
  bodyPattern?: string;
  attachmentRequired: boolean;
  
  // Actions
  actionType: string;
  defaultCategory?: string;
  defaultPriority: string;
  defaultUrgency: string;
  defaultStatus: string;
  defaultAssigneeId?: string;
  defaultAssignmentGroup?: string;
  
  // Auto-response
  autoResponseEnabled: boolean;
  autoResponseTemplateId?: string;
  autoResponseDelay: number;
  
  // Advanced settings
  extractTicketNumber: boolean;
  createDuplicateTickets: boolean;
  notifyAssignee: boolean;
  
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailResponseTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  templateType: string;
  subjectTemplate: string;
  bodyTemplateHtml?: string;
  bodyTemplateText?: string;
  priority: number;
  languageCode: string;
  variableMapping: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
