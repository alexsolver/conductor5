import { eq, and } from 'drizzle-orm';
import { Ticket } from '../../domain/entities/Ticket';
import { ITicketRepository, TicketFilter } from '../../domain/ports/ITicketRepository';
import { tickets } from '@shared/schema'; // Corrected import path
import { db } from '../../../../db'; // Assuming db is still used internally

export class DrizzleTicketRepository implements ITicketRepository {

  // Assuming db is still available or managed elsewhere for internal use if not injected
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
      // Re-throw or handle as appropriate for the application's error handling strategy
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


  async findMany(filter: any): Promise<Ticket[]> { // Simplified filter type for broader compatibility
    const conditions = [eq(tickets.tenantId, filter.tenantId)];

    if (filter.search) {
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(tickets.subject, searchPattern),
          ilike(tickets.description, searchPattern),
          ilike(tickets.number, searchPattern),
          ilike(tickets.shortDescription, searchPattern)
        )!
      );
    }

    if (filter.status) {
      conditions.push(eq(tickets.status, filter.status));
    }

    if (filter.state) {
      conditions.push(eq(tickets.state, filter.state));
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

    // Check if ticket exists by ID and tenantId
    const existingTicket = await this.findById(ticket.getId(), ticket.getTenantId());

    try {
      if (existingTicket) {
        // Update existing ticket
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
        // Insert new ticket
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

  async count(filter: Omit<any, 'limit' | 'offset'>): Promise<number> { // Simplified filter type
    const conditions = [eq(tickets.tenantId, filter.tenantId)];

    if (filter.search) {
      const searchPattern = `%${filter.search.replace(/[%_]/g, '\\$&')}%`;
      conditions.push(
        or(
          ilike(tickets.subject, searchPattern),
          ilike(tickets.description, searchPattern),
          ilike(tickets.number, searchPattern),
          ilike(tickets.shortDescription, searchPattern)
        )!
      );
    }

    if (filter.status) {
      conditions.push(eq(tickets.status, filter.status));
    }

    if (filter.state) {
      conditions.push(eq(tickets.state, filter.state));
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
          or(
            eq(tickets.state, 'open'),
            eq(tickets.state, 'in_progress')
          )!
        ));

      return results.map(result => this.toDomainEntity(result));
    } catch (error) {
      console.error('❌ Error finding urgent tickets:', error);
      throw error;
    }
  }

  async findOverdue(tenantId: string): Promise<Ticket[]> {
    // Placeholder: This would require more complex SQL logic
    // to determine "overdue" status based on priority, deadlines, etc.
    // For now, returning an empty array as per the original implementation.
    return [];
  }

  async findUnassigned(tenantId: string): Promise<Ticket[]> {
    try {
      const results = await this.dbConnection
        .select()
        .from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.assignedToId, null), // Ensure correct handling of null for Drizzle
          or(
            eq(tickets.state, 'open'),
            eq(tickets.state, 'in_progress')
          )!
        ));

      return results.map(result => this.toDomainEntity(result));
    } catch (error) {
      console.error('❌ Error finding unassigned tickets:', error);
      throw error;
    }
  }

  async getNextTicketNumber(tenantId: string, prefix = 'INC'): Promise<string> {
    // Assuming ticketNumberGenerator is still available and used
    // If ticketNumberGenerator was meant to be replaced or removed, adjust accordingly.
    // For now, keeping the original functionality.
    return await ticketNumberGenerator.generateTicketNumber(tenantId, prefix);
  }


  private toDomainEntity(data: any): Ticket {
    // Infrastructure mapping - domain entity reconstruction from persistence layer
    return new Ticket(
      data.id,
      data.tenantId,
      data.customerId,
      data.callerId,
      data.callerType,
      data.subject,
      data.description,
      data.number,
      data.shortDescription,
      data.category,
      data.subcategory,
      data.priority,
      data.impact,
      data.urgency,
      data.state,
      data.status,
      data.assignedToId,
      data.beneficiaryId,
      data.beneficiaryType,
      data.assignmentGroup,
      data.location,
      data.contactType,
      data.businessImpact,
      data.symptoms,
      data.workaround,
      data.configurationItem,
      data.businessService,
      data.resolutionCode,
      data.resolutionNotes,
      data.workNotes,
      data.closeNotes,
      data.notify,
      data.rootCause,
      data.openedAt,
      data.resolvedAt,
      data.closedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  private toPersistenceData(ticket: Ticket): any {
    return {
      id: ticket.getId(),
      tenantId: ticket.getTenantId(),
      customerId: ticket.getCustomerId(),
      callerId: ticket.getCallerId(),
      callerType: ticket.getCallerType(),
      subject: ticket.getSubject(),
      description: ticket.getDescription(),
      number: ticket.getNumber(),
      shortDescription: ticket.getShortDescription(),
      category: ticket.getCategory(),
      subcategory: ticket.getSubcategory(),
      priority: ticket.getPriority().getValue(), // Convert TicketPriority to string
      impact: ticket.getImpact(),
      urgency: ticket.getUrgency(),
      state: ticket.getState().getValue(), // Convert TicketStatus to string
      status: ticket.getStatus(),
      assignedToId: ticket.getAssignedToId(),
      beneficiaryId: ticket.getBeneficiaryId(),
      beneficiaryType: ticket.getBeneficiaryType(),
      openedAt: ticket.getOpenedAt(),
      resolvedAt: ticket.getResolvedAt(),
      closedAt: ticket.getClosedAt(),
      createdAt: ticket.getCreatedAt(),
      updatedAt: ticket.getUpdatedAt()
    };
  }
}