
export interface TicketNotificationPayload {
  ticketId: string;
  tenantId: string;
  event: 'created' | 'updated' | 'assigned' | 'resolved' | 'closed';
  data: any;
}

export class TicketNotificationClient {
  async sendNotification(payload: TicketNotificationPayload): Promise<void> {
    try {
      console.log('📧 [TICKET-NOTIFICATION] Sending notification:', {
        event: payload.event,
        ticketId: payload.ticketId,
        tenantId: payload.tenantId
      });

      // Implementação futura: integrar com serviço de notificações
      // Por enquanto, apenas log
      
    } catch (error) {
      console.error('❌ [TICKET-NOTIFICATION] Failed to send notification:', error);
      // Não relançar o erro para não quebrar o fluxo principal
    }
  }

  async notifyTicketCreated(ticketId: string, tenantId: string, ticketData: any): Promise<void> {
    await this.sendNotification({
      ticketId,
      tenantId,
      event: 'created',
      data: ticketData
    });
  }

  async notifyTicketAssigned(ticketId: string, tenantId: string, assignedToId: string): Promise<void> {
    await this.sendNotification({
      ticketId,
      tenantId,
      event: 'assigned',
      data: { assignedToId }
    });
  }

  async notifyTicketResolved(ticketId: string, tenantId: string): Promise<void> {
    await this.sendNotification({
      ticketId,
      tenantId,
      event: 'resolved',
      data: {}
    });
  }
}
