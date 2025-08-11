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
      return []; // Return empty array to maintain system stability
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
      return []; // Return empty array to maintain system stability
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

      return result?.rowCount > 0;
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

  async findOverdue(tenantId: string): Promise<Ticket[]> {
    try {
      const today = new Date();
      const results = await this.dbConnection
        .select()
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          or(
            eq(tickets.status, 'open'),
            eq(tickets.status, 'in_progress')
          )!
        ));

      return results.map(result => this.toDomainEntity(result));
    } catch (error) {
      console.error('❌ Error finding overdue tickets:', error);
      return [];
    }
  }

  async getNextTicketNumber(tenantId: string, prefix: string = 'TK'): Promise<string> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const result = await this.dbConnection
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId));

      const nextNumber = (result[0]?.count || 0) + 1;
      return `${prefix}-${dateStr}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('❌ Error generating ticket number:', error);
      return `${prefix}-${Date.now()}`;
    }
  }

  private toDomainEntity(data: any): Ticket {
    return new Ticket(
      data.id,
      data.tenantId,
      data.customerId || null,
      data.callerId || 'system',
      'customer',
      data.subject || data.title || 'Untitled',
      data.description || '',
      data.number || 'TK-' + Date.now(),
      data.shortDescription || data.description || '',
      data.category || 'General',
      data.subcategory || 'General',
      data.priority || 'medium',
      data.impact || 'low',
      data.urgency || 'low',
      data.state || 'open',
      data.status || 'open',
      data.assignedToId || null,
      data.beneficiaryId || null,
      null,
      null,
      data.location || null,
      'phone',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      false,
      null,
      data.openedAt || data.createdAt || new Date(),
      data.resolvedAt || null,
      data.closedAt || null,
      data.createdAt || new Date(),
      data.updatedAt || new Date()
    );
  }

  private toPersistenceData(ticket: Ticket): any {
    return {
      id: ticket.getId(),
      tenantId: ticket.getTenantId(),
      subject: ticket.getSubject(),
      description: ticket.getDescription(),
      priority: ticket.getPriority(),
      status: ticket.getStatus(),
      callerId: ticket.getCallerId(),
      customerId: ticket.getCustomerId(),
      beneficiaryId: ticket.getBeneficiaryId(),
      assignedToId: ticket.getAssignedToId(),
      category: ticket.getCategory(),
      subcategory: ticket.getSubcategory(),
      updatedAt: new Date()
    };
  }
}