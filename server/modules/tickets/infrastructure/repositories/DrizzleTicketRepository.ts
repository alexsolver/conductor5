/**
 * Drizzle Ticket Repository Implementation
 * Clean Architecture - Infrastructure Layer
 * Implements ITicketRepository using Drizzle ORM
 */

import { eq, and, ilike, count, or, sql } from 'drizzle-orm''[,;]
import { Ticket } from '../../domain/entities/Ticket''[,;]
import { ITicketRepository, TicketFilter } from '../../domain/ports/ITicketRepository''[,;]
import { tickets } from '@shared/schema''[,;]
import { db } from '../../../../db''[,;]
import { ticketNumberGenerator } from '../../../../utils/ticketNumberGenerator''[,;]

export class DrizzleTicketRepository implements ITicketRepository {
  
  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    const result = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  async findByNumber(number: string, tenantId: string): Promise<Ticket | null> {
    const result = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.number, number), eq(tickets.tenantId, tenantId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  async findMany(filter: TicketFilter): Promise<Ticket[]> {
    const conditions = [eq(tickets.tenantId, filter.tenantId)];

    // Apply filters with parameterized search
    if (filter.search) {
      // Use parameterized search to prevent SQL injection
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

    let query = db
      .select()
      .from(tickets)
      .where(and(...conditions));

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    const results = await query;
    return results.map(result => this.toDomainEntity(result));
  }

  async save(ticket: Ticket): Promise<Ticket> {
    const ticketData = this.toPersistenceData(ticket);

    // Check if ticket exists
    const existingTicket = await this.findById(ticket.getId(), ticket.getTenantId());

    if (existingTicket) {
      // Update existing ticket
      const [updated] = await db
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

      return this.toDomainEntity(updated);
    } else {
      // Insert new ticket
      const [inserted] = await db
        .insert(tickets)
        .values(ticketData)
        .returning();

      return this.toDomainEntity(inserted);
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(tickets)
      .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)));

    return result.rowCount > 0;
  }

  async count(filter: Omit<TicketFilter, 'limit' | 'offset'>): Promise<number> {
    const conditions = [eq(tickets.tenantId, filter.tenantId)];

    if (filter.search) {
      // Use parameterized search to prevent SQL injection
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

    const result = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  async findUrgent(tenantId: string): Promise<Ticket[]> {
    const results = await db
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
  }

  async findOverdue(tenantId: string): Promise<Ticket[]> {
    // This would need more complex SQL logic based on priority and creation time
    // For now, return empty array as placeholder
    return [];
  }

  async findUnassigned(tenantId: string): Promise<Ticket[]> {
    const results = await db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.assignedToId, null),
        or(
          eq(tickets.state, 'open'),
          eq(tickets.state, 'in_progress')
        )!
      ));

    return results.map(result => this.toDomainEntity(result));
  }

  async getNextTicketNumber(tenantId: string, prefix = 'INC'): Promise<string> {
    return await ticketNumberGenerator.generateTicketNumber(tenantId, prefix);
  }

  private toDomainEntity(data: any): Ticket {
    return Ticket.fromPersistence({
      id: data.id,
      tenantId: data.tenantId,
      customerId: data.customerId,
      callerId: data.callerId,
      callerType: data.callerType,
      subject: data.subject,
      description: data.description,
      number: data.number,
      shortDescription: data.shortDescription,
      category: data.category,
      subcategory: data.subcategory,
      priority: data.priority,
      impact: data.impact,
      urgency: data.urgency,
      state: data.state,
      status: data.status,
      assignedToId: data.assignedToId,
      beneficiaryId: data.beneficiaryId,
      beneficiaryType: data.beneficiaryType,
      assignmentGroup: data.assignmentGroup,
      location: data.location,
      contactType: data.contactType,
      businessImpact: data.businessImpact,
      symptoms: data.symptoms,
      workaround: data.workaround,
      configurationItem: data.configurationItem,
      businessService: data.businessService,
      resolutionCode: data.resolutionCode,
      resolutionNotes: data.resolutionNotes,
      workNotes: data.workNotes,
      closeNotes: data.closeNotes,
      notify: data.notify,
      rootCause: data.rootCause,
      openedAt: data.openedAt,
      resolvedAt: data.resolvedAt,
      closedAt: data.closedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
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
      priority: ticket.getPriority(),
      impact: ticket.getImpact(),
      urgency: ticket.getUrgency(),
      state: ticket.getState(),
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