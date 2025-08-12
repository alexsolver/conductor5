/**
 * APPLICATION LAYER - TICKET DTOs
 * Seguindo Clean Architecture - 1qa.md compliance
 */

export interface CreateTicketDTO {
  subject: string;
  description: string;
  status?: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  impact?: 'low' | 'medium' | 'high' | 'critical';
  
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
  
  // Criado por (será preenchido pelo sistema)
  createdById: string;
}

export interface UpdateTicketDTO {
  subject?: string;
  description?: string;
  status?: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  impact?: 'low' | 'medium' | 'high' | 'critical';
  
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
  
  // Atualizado por (será preenchido pelo sistema)
  updatedById: string;
}

export interface TicketFiltersDTO {
  status?: string[];
  priority?: string[];
  urgency?: string[];
  impact?: string[];
  assignedToId?: string;
  customerId?: string;
  companyId?: string;
  category?: string;
  subcategory?: string;
  action?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TicketResponseDTO {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  urgency?: string;
  impact?: string;
  
  // Relacionamentos
  customerId?: string;
  customerName?: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  assignedToId?: string;
  assignedToName?: string;
  companyId?: string;
  companyName?: string;
  
  // Classificação hierárquica
  category?: string;
  categoryLabel?: string;
  subcategory?: string;
  subcategoryLabel?: string;
  action?: string;
  actionLabel?: string;
  
  // Metadata
  tags?: string[];
  customFields?: Record<string, any>;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
  
  // Computed fields
  escalationLevel?: number;
  slaViolated?: boolean;
  hoursOpen?: number;
}

export interface BulkUpdateTicketsDTO {
  ticketIds: string[];
  updates: UpdateTicketDTO;
}

export interface TicketStatsDTO {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  overdueCount: number;
  todayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  avgResolutionHours: number;
  slaCompliance: number; // percentage
}