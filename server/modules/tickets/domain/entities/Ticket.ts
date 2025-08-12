/**
 * DOMAIN LAYER - TICKET ENTITY
 * Seguindo Clean Architecture - 1qa.md compliance
 */

export interface Ticket {
  id: string;
  tenantId: string;
  number: string;
  subject: string;
  description: string;
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  
  // Relacionamentos
  customerId?: string;
  beneficiaryId?: string;
  assignedToId?: string;
  companyId?: string;
  
  // Classificação hierárquica
  category?: string;
  subcategory?: string;
  action?: string;
  
  // Metadata
  tags?: string[];
  customFields?: Record<string, any>;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  isActive: boolean;
}

export interface TicketMetadata {
  estimatedResolution?: Date;
  actualResolution?: Date;
  slaViolated: boolean;
  escalationLevel: number;
  lastActivity?: Date;
}

export class TicketDomainService {
  /**
   * Validates ticket business rules
   */
  validate(ticket: Partial<Ticket>): boolean {
    // Regra de negócio: Subject obrigatório
    if (!ticket.subject || ticket.subject.trim().length === 0) {
      throw new Error('Ticket subject is required');
    }
    
    // Regra de negócio: Subject deve ter pelo menos 5 caracteres
    if (ticket.subject.trim().length < 5) {
      throw new Error('Ticket subject must have at least 5 characters');
    }
    
    // Regra de negócio: Status válido
    const validStatuses = ['new', 'open', 'in_progress', 'resolved', 'closed'];
    if (ticket.status && !validStatuses.includes(ticket.status)) {
      throw new Error('Invalid ticket status');
    }
    
    // Regra de negócio: Priority válida
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (ticket.priority && !validPriorities.includes(ticket.priority)) {
      throw new Error('Invalid ticket priority');
    }
    
    return true;
  }
  
  /**
   * Calculates ticket escalation level based on priority and age
   */
  calculateEscalationLevel(ticket: Ticket): number {
    const hoursOld = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
    
    switch (ticket.priority) {
      case 'critical':
        return hoursOld > 1 ? 3 : hoursOld > 0.5 ? 2 : 1;
      case 'high':
        return hoursOld > 4 ? 3 : hoursOld > 2 ? 2 : 1;
      case 'medium':
        return hoursOld > 24 ? 3 : hoursOld > 12 ? 2 : 1;
      case 'low':
        return hoursOld > 72 ? 3 : hoursOld > 48 ? 2 : 1;
      default:
        return 1;
    }
  }
  
  /**
   * Determines if SLA is violated based on priority and creation time
   */
  isSLAViolated(ticket: Ticket): boolean {
    const hoursOld = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
    
    const slaLimits = {
      critical: 1, // 1 hour
      high: 4,     // 4 hours
      medium: 24,  // 24 hours
      low: 72      // 72 hours
    };
    
    return hoursOld > (slaLimits[ticket.priority] || 24);
  }
  
  /**
   * Generates automatic ticket number
   */
  generateTicketNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `T${timestamp}-${random}`;
  }
}