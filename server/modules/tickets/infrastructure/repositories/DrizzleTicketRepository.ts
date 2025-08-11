import { eq, and, or, ilike, count } from 'drizzle-orm';
import { Ticket } from '../../domain/entities/Ticket';
import { ITicketRepository, TicketFilter } from '../../domain/ports/ITicketRepository';
import { tickets } from '@shared/schema-master';
import { db } from '../../../../db';

export class DrizzleTicketRepository implements ITicketRepository {
  private dbConnection = db;

  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    try {
      const result = await this.dbConnection
        .select()
        .from(tickets)
        .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)))
        .limit(1);

      return result.length > 0 ? this.toDomainEntity(result[0]) : null;
    } catch (error) {
      console.error('❌ Error finding ticket by id:', error);
      throw error;
    }
  }

  async findAll(tenantId: string): Promise<Ticket[]> {
    try {
      const results = await this.dbConnection
        .select()
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId));

      return results.map(result => this.toDomainEntity(result));
    } catch (error) {
      console.error('❌ Error finding all tickets:', error);
      throw error;
    }
  }

  async findByNumber(number: string, tenantId: string): Promise<Ticket | null> {
    try {
      const result = await this.dbConnection
        .select()
        .from(tickets)
        .where(and(eq(tickets.number, number), eq(tickets.tenantId, tenantId)))
        .limit(1);

      return result.length > 0 ? this.toDomainEntity(result[0]) : null;
    } catch (error) {
      console.error('❌ Error finding ticket by number:', error);
      throw error;
    }
  }

  async findMany(filter: any): Promise<Ticket[]> {
    const conditions = [eq(tickets.tenantId, filter.tenantId)];

    if (filter.search) {
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(tickets.subject, searchPattern),
          ilike(tickets.description, searchPattern),
          ilike(tickets.number, searchPattern)
        )!
      );
    }

    if (filter.status) {
      conditions.push(eq(tickets.status, filter.status));
    }

    if (filter.priority) {
      conditions.push(eq(tickets.priority, filter.priority));
    }

    if (filter.assignedToId) {
      conditions.push(eq(tickets.assignedToId, filter.assignedToId));
    }

    if (filter.customerId) {
      conditions.push(eq(tickets.customerId, filter.customerId));
    }

    if (filter.category) {
      conditions.push(eq(tickets.category, filter.category));
    }

    if (filter.urgent) {
      conditions.push(eq(tickets.priority, 'urgent'));
    }

    let query = this.dbConnection
      .select()
      .from(tickets)
      .where(and(...conditions));

    if (filter.limit !== undefined) {
      query = query.limit(filter.limit);
    }

    if (filter.offset !== undefined) {
      query = query.offset(filter.offset);
    }

    try {
      const results = await query;
      return results.map(result => this.toDomainEntity(result));
    } catch (error) {
      console.error('❌ Error finding many tickets:', error);
      throw error;
    }
  }

  async save(ticket: Ticket): Promise<Ticket> {
    const ticketData = this.toPersistenceData(ticket);
    const existingTicket = await this.findById(ticket.getId(), ticket.getTenantId());

    try {
      if (existingTicket) {
        const [updated] = await this.dbConnection
          .update(tickets)
          .set({
            ...ticketData,
            updatedAt: new Date()
          })
          .where(and(
            eq(tickets.id, ticket.getId()),
            eq(tickets.tenantId, ticket.getTenantId())
          ))
          .returning();

        if (!updated) {
          throw new Error('Ticket not found or update failed');
        }
        return this.toDomainEntity(updated);
      } else {
        const [inserted] = await this.dbConnection
          .insert(tickets)
          .values(ticketData)
          .returning();

        if (!inserted) {
          throw new Error('Ticket insertion failed');
        }
        return this.toDomainEntity(inserted);
      }
    } catch (error) {
      console.error('❌ Error saving ticket:', error);
      throw error;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await this.dbConnection
        .delete(tickets)
        .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)));

      return result.rowCount > 0;
    } catch (error) {
      console.error('❌ Error deleting ticket:', error);
      throw error;
    }
  }

  async count(filter: Omit<any, 'limit' | 'offset'>): Promise<number> {
    const conditions = [eq(tickets.tenantId, filter.tenantId)];

    if (filter.search) {
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(tickets.subject, searchPattern),
          ilike(tickets.description, searchPattern),
          ilike(tickets.number, searchPattern)
        )!
      );
    }

    if (filter.status) {
      conditions.push(eq(tickets.status, filter.status));
    }

    if (filter.priority) {
      conditions.push(eq(tickets.priority, filter.priority));
    }

    if (filter.assignedToId) {
      conditions.push(eq(tickets.assignedToId, filter.assignedToId));
    }

    if (filter.customerId) {
      conditions.push(eq(tickets.customerId, filter.customerId));
    }

    if (filter.category) {
      conditions.push(eq(tickets.category, filter.category));
    }

    if (filter.urgent) {
      conditions.push(eq(tickets.priority, 'urgent'));
    }

    try {
      const result = await this.dbConnection
        .select({ count: count() })
        .from(tickets)
        .where(and(...conditions));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('❌ Error counting tickets:', error);
      throw error;
    }
  }

  async findUrgent(tenantId: string): Promise<Ticket[]> {
    try {
      const results = await this.dbConnection
        .select()
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.priority, 'urgent'),
          eq(tickets.status, 'open')
        ));

      return results.map(result => this.toDomainEntity(result));
    } catch (error) {
      console.error('❌ Error finding urgent tickets:', error);
      throw error;
    }
  }

  async findUnassigned(tenantId: string): Promise<Ticket[]> {
    try {
      const results = await this.dbConnection
        .select()
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.assignedToId, null),
          or(
            eq(tickets.status, 'open'),
            eq(tickets.status, 'in_progress')
          )!
        ));

      return results.map(result => this.toDomainEntity(result));
    } catch (error) {
      console.error('❌ Error finding unassigned tickets:', error);
      throw error;
    }
  }

  private toDomainEntity(data: any): Ticket {
    // Clean Architecture: Proper mapping from infrastructure to domain entity
    return new Ticket(
      data.id,
      data.tenant_id || data.tenantId,
      data.customer_id || data.customerId,
      data.caller_id || data.callerId,
      data.caller_type || 'customer',
      data.subject,
      data.description || '',
      data.number || '',
      data.subject || '', // shortDescription
      data.category || '',
      data.subcategory || '',
      data.priority as any || 'medium',
      data.impact || 'medium',
      data.urgency || 'medium',
      data.status as any || 'open',
      data.status || 'open',
      data.assigned_to_id || data.assignedToId,
      data.beneficiary_id || data.beneficiaryId,
      data.beneficiary_type || null,
      data.assignment_group || data.assignmentGroup,
      data.location,
      data.contact_type || data.contactType || 'email',
      data.business_impact || data.businessImpact,
      data.symptoms,
      data.workaround,
      null, // configurationItem
      null, // businessService
      data.resolution_code || data.resolutionCode,
      data.resolution_notes || data.resolutionNotes,
      null, // workNotes
      null, // closeNotes
      true, // notify
      null, // rootCause
      data.created_at || data.createdAt || new Date(),
      null, // resolvedAt
      null, // closedAt
      data.created_at || data.createdAt || new Date(),
      data.updated_at || data.updatedAt || new Date()
    );
  }

  private toPersistenceData(ticket: Ticket): any {
    return {
      id: ticket.getId(),
      tenant_id: ticket.getTenantId(),
      subject: ticket.getSubject(),
      description: ticket.getDescription(),
      priority: ticket.getPriority(),
      status: ticket.getStatus(),
      caller_id: ticket.getCallerId(),
      customer_id: ticket.getCustomerId(),
      beneficiary_id: ticket.getBeneficiaryId(),
      responsible_id: ticket.getResponsibleId(),
      category: ticket.getCategory(),
      subcategory: ticket.getSubcategory(),
      location: ticket.getLocation(),
      tags: ticket.getTags(),
      environment: ticket.getEnvironment(),
      template_name: ticket.getTemplateName(),
      updated_at: new Date()
    };
  }
}