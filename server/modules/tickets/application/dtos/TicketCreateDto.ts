/**
 * Ticket Create DTO
 * Application Layer - Data Transfer Object
 * Used for transferring data between layers, not part of domain logic
 */

export interface TicketCreateDto {
  tenantId: string;
  customerId: string;
  callerId: string;
  callerType: 'user' | 'customer';
  subject: string;
  description: string;
  shortDescription?: string;
  category?: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  impact?: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high';
  state?: string;
  status?: string;
  assignedToId?: string;
  beneficiaryId?: string;
  beneficiaryType?: 'user' | 'customer';
  assignmentGroup?: string;
  location?: string;
  contactType?: string;
  businessImpact?: string;
  symptoms?: string;
  workaround?: string;
  configurationItem?: string;
  businessService?: string;
  resolutionCode?: string;
  resolutionNotes?: string;
  workNotes?: string;
  closeNotes?: string;
  notify?: boolean;
  rootCause?: string;
}

export interface TicketUpdateDto {
  subject?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  subcategory?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  impact?: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high';
  state?: string;
  status?: string;
  assignedToId?: string;
  assignmentGroup?: string;
  location?: string;
  businessImpact?: string;
  symptoms?: string;
  workaround?: string;
  resolutionCode?: string;
  resolutionNotes?: string;
  workNotes?: string;
  closeNotes?: string;
  rootCause?: string;
}