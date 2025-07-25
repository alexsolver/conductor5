
/**
 * Notification Automation Service
 * Integrates with existing modules to trigger automatic notifications
 */

import { CreateNotificationUseCase } from '../../application/use-cases/CreateNotificationUseCase';
import { Ticket } from '../../../tickets/domain/entities/Ticket';

export class NotificationAutomationService {
  constructor(
    private createNotificationUseCase: CreateNotificationUseCase
  ) {}

  // Ticket-related notifications
  async onTicketCreated(ticket: Ticket): Promise<void> {
    // Notify assigned user if ticket is assigned
    if (ticket.getAssignedToId()) {
      await this.createNotificationUseCase.execute({
        tenantId: ticket.getTenantId(),
        userId: ticket.getAssignedToId()!,
        type: 'ticket_assignment',
        severity: 'info',
        title: `Novo ticket atribuído: ${ticket.getNumber()}`,
        message: `Você foi designado para o ticket: ${ticket.getSubject()}`,
        channels: ['in_app', 'email'],
        relatedEntityType: 'ticket',
        relatedEntityId: ticket.getId()
      });
    }

    // Notify on critical tickets
    if (ticket.getPriority() === 'urgent') {
      await this.createNotificationUseCase.execute({
        tenantId: ticket.getTenantId(),
        userId: ticket.getCallerId(),
        type: 'ticket_assignment',
        severity: 'critical',
        title: `Ticket crítico criado: ${ticket.getNumber()}`,
        message: `Um ticket com prioridade crítica foi criado: ${ticket.getSubject()}`,
        channels: ['in_app', 'email', 'sms'],
        relatedEntityType: 'ticket',
        relatedEntityId: ticket.getId()
      });
    }
  }

  async onTicketOverdue(ticket: Ticket): Promise<void> {
    if (ticket.getAssignedToId()) {
      await this.createNotificationUseCase.execute({
        tenantId: ticket.getTenantId(),
        userId: ticket.getAssignedToId()!,
        type: 'ticket_overdue',
        severity: 'warning',
        title: `Ticket em atraso: ${ticket.getNumber()}`,
        message: `O ticket ${ticket.getSubject()} está em atraso e precisa de atenção.`,
        channels: ['in_app', 'email'],
        relatedEntityType: 'ticket',
        relatedEntityId: ticket.getId()
      });
    }
  }

  async onSLABreach(ticket: Ticket): Promise<void> {
    await this.createNotificationUseCase.execute({
      tenantId: ticket.getTenantId(),
      userId: ticket.getAssignedToId() || ticket.getCallerId(),
      type: 'sla_breach',
      severity: 'critical',
      title: `SLA violado: ${ticket.getNumber()}`,
      message: `O SLA do ticket ${ticket.getSubject()} foi violado.`,
      channels: ['in_app', 'email', 'sms'],
      relatedEntityType: 'ticket',
      relatedEntityId: ticket.getId()
    });
  }

  // Compliance notifications
  async onComplianceExpiry(complianceId: string, tenantId: string, userId: string, itemName: string, expiryDate: Date): Promise<void> {
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    let severity: 'info' | 'warning' | 'error' | 'critical' = 'info';
    if (daysUntilExpiry <= 7) severity = 'critical';
    else if (daysUntilExpiry <= 30) severity = 'warning';

    await this.createNotificationUseCase.execute({
      tenantId,
      userId,
      type: 'compliance_expiry',
      severity,
      title: `Compliance expirando: ${itemName}`,
      message: `O item ${itemName} expira em ${daysUntilExpiry} dias. Renovação necessária.`,
      channels: ['in_app', 'email'],
      relatedEntityType: 'compliance',
      relatedEntityId: complianceId
    });
  }

  // Stock notifications
  async onLowStock(itemId: string, tenantId: string, userId: string, itemName: string, currentStock: number, minStock: number): Promise<void> {
    await this.createNotificationUseCase.execute({
      tenantId,
      userId,
      type: 'stock_low',
      severity: 'warning',
      title: `Estoque baixo: ${itemName}`,
      message: `O item ${itemName} está com estoque baixo (${currentStock} unidades). Mínimo: ${minStock}.`,
      channels: ['in_app', 'email'],
      relatedEntityType: 'stock_item',
      relatedEntityId: itemId
    });
  }

  // Timecard notifications
  async onTimecardPendingApproval(timecardId: string, tenantId: string, managerId: string, employeeName: string): Promise<void> {
    await this.createNotificationUseCase.execute({
      tenantId,
      userId: managerId,
      type: 'timecard_approval',
      severity: 'info',
      title: `Timecard pendente de aprovação`,
      message: `O timecard de ${employeeName} está aguardando sua aprovação.`,
      channels: ['in_app', 'email'],
      relatedEntityType: 'timecard',
      relatedEntityId: timecardId
    });
  }

  // System notifications
  async onSystemAlert(tenantId: string, userId: string, alertType: string, message: string): Promise<void> {
    await this.createNotificationUseCase.execute({
      tenantId,
      userId,
      type: 'system_alert',
      severity: 'error',
      title: `Alerta do sistema: ${alertType}`,
      message,
      channels: ['in_app', 'email'],
      relatedEntityType: 'system',
      relatedEntityId: alertType
    });
  }

  // Batch processing for automated notifications
  async processAutomatedNotifications(tenantId: string): Promise<void> {
    // This would be called by a scheduled job to process:
    // - Overdue tickets
    // - Expiring compliance items
    // - Low stock alerts
    // - Pending approvals
    console.log(`Processing automated notifications for tenant: ${tenantId}`);
  }
}
