// Domain Entity - Pure business logic
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  number?: string;
  subject: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  urgency?: string;
  impact?: string;
  category?: string;
  subcategory?: string;
  action?: string;
  callerId?: string;
  assignedToId?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
  companyId?: string;
  beneficiaryId?: string;
  isActive: boolean;
  // Campos relacionais
  companyName?: string;
  companyEmail?: string;
  callerName?: string;
  callerEmail?: string;
  beneficiaryName?: string;
  beneficiaryEmail?: string;
  assignedToName?: string;
}</old_str>

// Business rules utilities
export const TicketBusinessRules = {
  isOpen: (status: TicketStatus): boolean => status === 'open',
  isResolved: (status: TicketStatus): boolean => status === 'resolved' || status === 'closed',
  isAssigned: (assignedToId?: string): boolean => !!assignedToId,
  isUrgent: (priority: TicketPriority): boolean => priority === 'urgent' || priority === 'high',
  
  canBeAssignedTo: (status: TicketStatus): boolean => status !== 'closed',
  canBeResolvedBy: (assignedToId?: string, userId?: string): boolean => 
    assignedToId === userId || !assignedToId,
  
  validateSubject: (subject: string): void => {
    if (!subject || subject.trim().length === 0) {
      throw new Error('Ticket subject is required');
    }
    if (subject.length > 500) {
      throw new Error('Ticket subject cannot exceed 500 characters');
    }
  }
};</old_str>