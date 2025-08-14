/**
 * TicketHistoryDomainService - Clean Architecture Implementation
 * Follows 1qa.md specifications exactly
 * 
 * @module TicketHistoryDomainService
 * @created 2025-08-14 - Clean Architecture compliance
 */

import { CreateTicketHistoryData } from '../entities/TicketHistory';
import { v4 as uuidv4 } from 'uuid';

export class TicketHistoryDomainService {
  
  /**
   * Create history entry for field change
   */
  createFieldChangeHistory(
    ticketId: string,
    fieldName: string,
    oldValue: any,
    newValue: any,
    performedBy: string,
    performedByName: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): CreateTicketHistoryData {
    
    const oldValueStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : '';
    const newValueStr = newValue !== null && newValue !== undefined ? String(newValue) : '';
    
    return {
      ticketId,
      actionType: `field_${fieldName}_changed`,
      fieldName,
      oldValue: oldValueStr,
      newValue: newValueStr,
      performedBy,
      performedByName,
      description: `Campo ${fieldName} alterado de "${oldValueStr}" para "${newValueStr}"`,
      tenantId,
      metadata: {
        ...metadata,
        field_name: fieldName,
        old_value: oldValueStr,
        new_value: newValueStr,
        change_impact: this.calculateChangeImpact(fieldName)
      }
    };
  }

  /**
   * Create history entry for ticket update
   */
  createTicketUpdateHistory(
    ticketId: string,
    changedFields: Array<{field: string, oldValue: any, newValue: any, changeType: string}>,
    performedBy: string,
    performedByName: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): CreateTicketHistoryData {
    
    return {
      ticketId,
      actionType: 'ticket_updated',
      performedBy,
      performedByName,
      description: `Ticket atualizado: ${changedFields.length} campo(s) alterado(s)`,
      tenantId,
      metadata: {
        ...metadata,
        total_changes: changedFields.length,
        update_source: 'web_interface',
        changed_fields: changedFields.map(f => f.field),
        changes_summary: changedFields,
        update_timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create history entry for internal action
   */
  createInternalActionHistory(
    ticketId: string,
    actionType: string,
    performedBy: string,
    performedByName: string,
    tenantId: string,
    actionData: Record<string, any>
  ): CreateTicketHistoryData {
    
    return {
      ticketId,
      actionType: 'internal_action_created',
      performedBy,
      performedByName,
      description: `Ação interna criada: ${actionType} action performed`,
      tenantId,
      metadata: {
        action_type: actionType,
        action_id: actionData.action_id,
        action_number: actionData.action_number,
        status: actionData.status || 'pending',
        estimated_hours: actionData.estimated_hours || 0,
        created_time: new Date().toISOString()
      }
    };
  }

  private calculateChangeImpact(fieldName: string): string {
    const highImpactFields = ['status', 'priority', 'assigned_to_id', 'urgency'];
    const mediumImpactFields = ['category', 'subcategory', 'description', 'subject'];
    
    if (highImpactFields.includes(fieldName)) return 'high';
    if (mediumImpactFields.includes(fieldName)) return 'medium';
    return 'low';
  }
}