
export interface CreateTicketHistoryDTO {
  ticketId: string;
  action: string;
  description: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface TicketHistoryResponseDTO {
  id: string;
  ticketId: string;
  action: string;
  description: string;
  userId: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
