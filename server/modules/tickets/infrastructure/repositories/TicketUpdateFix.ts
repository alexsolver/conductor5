// MÉTODO UPDATE CORRIGIDO - Elimina problemas de contagem de parâmetros SQL
// Esta implementação usa uma abordagem mais simples e confiável

import { sql } from 'drizzle-orm';
import { db } from '../../../../db/connection.js';
import { Ticket } from '../../domain/entities/Ticket.js';

export async function updateTicketFixed(id: string, data: Partial<Ticket>, tenantId: string): Promise<Ticket> {
  try {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    
    console.log('🔍 [TicketUpdateFix] update called:', {
      id, 
      tenantId,
      dataKeys: Object.keys(data)
    });

    // Field mapping to handle both camelCase and snake_case
    const fieldMapping: Record<string, string> = {
      'subject': 'subject',
      'description': 'description',
      'priority': 'priority',
      'status': 'status',
      'category': 'category',
      'subcategory': 'subcategory',
      'action': 'action',
      'impact': 'impact',
      'urgency': 'urgency',
      'caller_id': 'caller_id',
      'caller_type': 'caller_type',
      'callerType': 'caller_type',
      'beneficiary_id': 'beneficiary_id',
      'beneficiary_type': 'beneficiary_type',
      'beneficiaryType': 'beneficiary_type',
      'assigned_to_id': 'assigned_to_id',
      'assignment_group': 'assignment_group',
      'assignmentGroup': 'assignment_group',
      'company_id': 'company_id',
      'location': 'location',
      'contact_type': 'contact_type',
      'contactType': 'contact_type',
      'business_impact': 'business_impact',
      'businessImpact': 'business_impact',
      'symptoms': 'symptoms',
      'workaround': 'workaround', 
      'environment': 'environment',
      'link_ticket_number': 'link_ticket_number',
      'linkTicketNumber': 'link_ticket_number',
      'link_type': 'link_type',
      'linkType': 'link_type',
      'link_comment': 'link_comment',
      'linkComment': 'link_comment',
      'updatedById': 'updated_by'
    };

    // Build SET clause arrays
    const setClauses: string[] = [];
    const values: any[] = [];

    // Process each field in the update data
    for (const [key, value] of Object.entries(data)) {
      if (key === 'tenantId' || key === 'updatedAt' || key === 'createdAt' || key === 'isActive' || key === 'id') continue;

      const dbColumn = fieldMapping[key] || key;

      if (value !== undefined && value !== null) {
        setClauses.push(`${dbColumn} = ?`);
        if (Array.isArray(value) || typeof value === 'object') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

    if (setClauses.length === 0) {
      console.log('⚠️ [TicketUpdateFix] No fields to update');
      // Return existing ticket without modifications
      const result = await db.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.tickets
        WHERE id = ${id} AND tenant_id = ${tenantId} AND is_active = true
      `);
      if (result.rows.length === 0) {
        throw new Error('Ticket not found');
      }
      return result.rows[0] as any;
    }

    // Add WHERE parameters
    values.push(id, tenantId);

    // Build complete query using positional placeholders
    const baseQuery = `
      UPDATE ${schemaName}.tickets 
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = ? AND tenant_id = ? AND is_active = true
      RETURNING *
    `;

    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const finalQuery = baseQuery.replace(/\?/g, () => `$${paramIndex++}`);

    console.log('📝 [TicketUpdateFix] Executing update with:', {
      setFieldsCount: setClauses.length,
      totalValues: values.length,
      finalQuery: finalQuery
    });

    const result = await db.execute(sql.raw(finalQuery, values));

    if (result.rows.length === 0) {
      throw new Error('Ticket not found or update failed');
    }

    const updatedTicket = result.rows[0] as any;
    console.log('✅ [TicketUpdateFix] Update successful:', updatedTicket.id);

    // Transform back to frontend format
    return {
      ...updatedTicket,
      callerId: updatedTicket.caller_id,
      callerType: updatedTicket.caller_type,
      beneficiaryId: updatedTicket.beneficiary_id,
      beneficiaryType: updatedTicket.beneficiary_type,
      assignedToId: updatedTicket.assigned_to_id,
      assignmentGroupId: updatedTicket.assignment_group,
      companyId: updatedTicket.company_id,
      contactType: updatedTicket.contact_type,
      businessImpact: updatedTicket.business_impact,
      linkTicketNumber: updatedTicket.link_ticket_number,
      linkType: updatedTicket.link_type,
      linkComment: updatedTicket.link_comment,
      tenantId: updatedTicket.tenant_id,
      createdAt: updatedTicket.created_at,
      updatedAt: updatedTicket.updated_at,
      createdBy: updatedTicket.opened_by_id,
      updatedBy: updatedTicket.updated_by,
      isActive: updatedTicket.is_active,
      followers: [],
      tags: []
    };

  } catch (error: any) {
    console.error('❌ [TicketUpdateFix] Error in update:', error);
    throw new Error(`Failed to update ticket: ${error.message}`);
  }
}