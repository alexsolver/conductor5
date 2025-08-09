
export interface TicketHistoryCreatedEvent {
  id: string;
  ticketId: string;
  action: string;
  description: string;
  userId: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}
