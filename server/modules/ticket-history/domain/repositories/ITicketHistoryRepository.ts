/**
 * ITicketHistoryRepository Interface - Clean Architecture Implementation
 * Follows 1qa.md specifications exactly
 * 
 * @module ITicketHistoryRepository
 * @created 2025-08-14 - Clean Architecture compliance
 */

import { TicketHistory, CreateTicketHistoryData } from '../entities/TicketHistory';

export interface ITicketHistoryRepository {
  create(data: CreateTicketHistoryData): Promise<TicketHistory>;
  findByTicketId(ticketId: string, tenantId: string): Promise<TicketHistory[]>;
  findById(id: string, tenantId: string): Promise<TicketHistory | null>;
}