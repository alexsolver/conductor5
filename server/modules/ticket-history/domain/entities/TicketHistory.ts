/**
 * TicketHistory Domain Entity - Clean Architecture Implementation
 * Follows 1qa.md specifications exactly
 * 
 * @module TicketHistory
 * @created 2025-08-14 - Clean Architecture compliance
 */

export interface TicketHistory {
  id: string;
  ticketId: string;
  actionType: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  performedByName: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  tenantId: string;
  isActive: boolean;
}

export interface CreateTicketHistoryData {
  ticketId: string;
  actionType: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  performedByName: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  description: string;
  metadata?: Record<string, any>;
  tenantId: string;
}