/**
 * TicketHistoryApplicationService - Clean Architecture Implementation
 * Follows 1qa.md specifications exactly
 * 
 * @module TicketHistoryApplicationService
 * @created 2025-08-14 - Clean Architecture compliance
 */

import { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository';
import { TicketHistoryDomainService } from '../../domain/services/TicketHistoryDomainService';
import { TicketHistory } from '../../domain/entities/TicketHistory';

export class TicketHistoryApplicationService {
  constructor(
    private ticketHistoryRepository: ITicketHistoryRepository,
    private ticketHistoryDomainService: TicketHistoryDomainService
  ) {
    console.log('✅ [TicketHistoryApplicationService] Initialized with dependencies');
  }

  /**
   * Record all field changes during a ticket update
   */
  async recordTicketUpdate(
    ticketId: string,
    oldTicketData: Record<string, any>,
    newTicketData: Record<string, any>,
    performedBy: string,
    performedByName: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): Promise<TicketHistory[]> {
    
    console.log('📝 [TicketHistoryApplicationService] Recording ticket update:', { 
      ticketId, 
      performedBy,
      fieldsToCompare: Object.keys(newTicketData).length
    });

    try {
      const changedFields: Array<{field: string, oldValue: any, newValue: any, changeType: string}> = [];
      const historyEntries: TicketHistory[] = [];

      // Compare each field to detect changes
      for (const [fieldName, newValue] of Object.entries(newTicketData)) {
        const oldValue = oldTicketData[fieldName];
        
        // Skip internal fields and unchanged values
        if (this.shouldSkipField(fieldName)) continue;
        
        // Detect if value actually changed
        if (this.hasValueChanged(oldValue, newValue)) {
          
          console.log(`🔍 [TicketHistoryApplicationService] Field changed: ${fieldName}`, {
            oldValue: oldValue,
            newValue: newValue
          });

          changedFields.push({
            field: fieldName,
            oldValue,
            newValue,
            changeType: oldValue === null || oldValue === undefined ? 'added' : 'modified'
          });

          // Create individual field change history
          const fieldHistoryData = this.ticketHistoryDomainService.createFieldChangeHistory(
            ticketId,
            fieldName,
            oldValue,
            newValue,
            performedBy,
            performedByName,
            tenantId,
            metadata
          );

          const fieldHistory = await this.ticketHistoryRepository.create(fieldHistoryData);
          historyEntries.push(fieldHistory);
        }
      }

      // Create overall update history if there were changes
      if (changedFields.length > 0) {
        const updateHistoryData = this.ticketHistoryDomainService.createTicketUpdateHistory(
          ticketId,
          changedFields,
          performedBy,
          performedByName,
          tenantId,
          metadata
        );

        const updateHistory = await this.ticketHistoryRepository.create(updateHistoryData);
        historyEntries.push(updateHistory);

        console.log('✅ [TicketHistoryApplicationService] Recorded changes:', {
          totalChanges: changedFields.length,
          historyEntriesCreated: historyEntries.length
        });
      } else {
        console.log('ℹ️ [TicketHistoryApplicationService] No changes detected');
      }

      return historyEntries;

    } catch (error: any) {
      console.error('❌ [TicketHistoryApplicationService] Error recording update:', error);
      throw new Error(`Failed to record ticket update: ${error.message}`);
    }
  }

  /**
   * Record internal action history
   */
  async recordInternalAction(
    ticketId: string,
    actionType: string,
    actionData: Record<string, any>,
    performedBy: string,
    performedByName: string,
    tenantId: string
  ): Promise<TicketHistory> {
    
    console.log('📝 [TicketHistoryApplicationService] Recording internal action:', { 
      ticketId, 
      actionType,
      performedBy
    });

    try {
      const historyData = this.ticketHistoryDomainService.createInternalActionHistory(
        ticketId,
        actionType,
        performedBy,
        performedByName,
        tenantId,
        actionData
      );

      const history = await this.ticketHistoryRepository.create(historyData);

      console.log('✅ [TicketHistoryApplicationService] Internal action recorded:', history.id);
      
      return history;

    } catch (error: any) {
      console.error('❌ [TicketHistoryApplicationService] Error recording internal action:', error);
      throw new Error(`Failed to record internal action: ${error.message}`);
    }
  }

  /**
   * Create a single history entry for notes, relationships, etc.
   * Following 1qa.md Clean Architecture pattern
   */
  async createHistoryEntry(params: {
    ticketId: string;
    actionType: string;
    fieldName: string;
    oldValue: string;
    newValue: string;
    performedBy: string;
    tenantId: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<TicketHistory> {
    
    console.log('📝 [TicketHistoryApplicationService] Creating single history entry:', { 
      ticketId: params.ticketId,
      actionType: params.actionType,
      performedBy: params.performedBy
    });

    try {
      // Create history data using domain service
      const historyData = this.ticketHistoryDomainService.createInternalActionHistory(
        params.ticketId,
        params.actionType,
        params.description || `${params.actionType} performed`,
        params.performedBy,
`User ${params.performedBy}`, // Use proper performer name
        params.tenantId,
        {
          ...params.metadata,
          fieldName: params.fieldName,
          oldValue: params.oldValue,
          newValue: params.newValue
        }
      );

      const history = await this.ticketHistoryRepository.create(historyData);

      console.log('✅ [TicketHistoryApplicationService] History entry created:', history.id);
      
      return history;

    } catch (error: any) {
      console.error('❌ [TicketHistoryApplicationService] Error creating history entry:', error);
      throw new Error(`Failed to create history entry: ${error.message}`);
    }
  }

  /**
   * Get ticket history
   */
  async getTicketHistory(ticketId: string, tenantId: string): Promise<TicketHistory[]> {
    console.log('🔍 [TicketHistoryApplicationService] Getting ticket history:', ticketId);

    try {
      const history = await this.ticketHistoryRepository.findByTicketId(ticketId, tenantId);
      
      console.log('✅ [TicketHistoryApplicationService] Retrieved history entries:', history.length);
      
      return history;

    } catch (error: any) {
      console.error('❌ [TicketHistoryApplicationService] Error getting history:', error);
      throw new Error(`Failed to get ticket history: ${error.message}`);
    }
  }

  private shouldSkipField(fieldName: string): boolean {
    const skipFields = ['updatedAt', 'updatedById', 'createdAt', 'createdBy', 'tenantId'];
    return skipFields.includes(fieldName);
  }

  private hasValueChanged(oldValue: any, newValue: any): boolean {
    // Handle null/undefined comparisons
    if (oldValue === null || oldValue === undefined) {
      return newValue !== null && newValue !== undefined && newValue !== '';
    }
    
    if (newValue === null || newValue === undefined) {
      return oldValue !== null && oldValue !== undefined && oldValue !== '';
    }

    // Handle array comparisons
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      return JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort());
    }

    // Handle object comparisons
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }

    // Handle string/number comparisons
    return String(oldValue) !== String(newValue);
  }
}