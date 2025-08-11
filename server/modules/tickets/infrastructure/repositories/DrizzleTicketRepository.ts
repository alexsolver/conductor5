
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import { db } from '../../../../db';
import { tickets, users, customers } from '../../../../../shared/schema';
import { ITicketRepository } from '../../domain/repositories/ITicketRepository';
import { Ticket } from '../../domain/entities/Ticket';

export class DrizzleTicketRepository implements ITicketRepository {
  async findById(id: string, tenantId: string): Promise<Ticket | null> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const query = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.customer_id as "customerId",
          t.assigned_to_id as "assignedToId",
          t.tenant_id as "tenantId",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          c.name as "customerName",
          u.first_name as "assignedToFirstName",
          u.last_name as "assignedToLastName"
        FROM ${schemaName}.tickets t
        LEFT JOIN ${schemaName}.customers c ON c.id = t.customer_id
        LEFT JOIN ${schemaName}.users u ON u.id = t.assigned_to_id
        WHERE t.id = $1 AND t.tenant_id = $2
      `;

      const result = await db.execute(sql.raw(query, [id, tenantId]));
      const row = result.rows[0];

      if (!row) return null;

      return new Ticket(
        row.id as string,
        row.title as string,
        row.description as string,
        row.status as string,
        row.priority as string,
        row.customerId as string,
        row.assignedToId as string | null,
        row.tenantId as string,
        new Date(row.createdAt as string),
        new Date(row.updatedAt as string)
      );
    } catch (error) {
      console.error('Error finding ticket by id:', error);
      throw error;
    }
  }

  async findAll(tenantId: string, limit?: number, offset?: number): Promise<Ticket[]> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      const limitClause = limit ? `LIMIT ${limit}` : '';
      const offsetClause = offset ? `OFFSET ${offset}` : '';

      const query = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.customer_id as "customerId",
          t.assigned_to_id as "assignedToId",
          t.tenant_id as "tenantId",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt"
        FROM ${schemaName}.tickets t
        WHERE t.tenant_id = $1
        ORDER BY t.created_at DESC
        ${limitClause} ${offsetClause}
      `;

      const result = await db.execute(sql.raw(query, [tenantId]));
      
      return result.rows.map(row => new Ticket(
        row.id as string,
        row.title as string,
        row.description as string,
        row.status as string,
        row.priority as string,
        row.customerId as string,
        row.assignedToId as string | null,
        row.tenantId as string,
        new Date(row.createdAt as string),
        new Date(row.updatedAt as string)
      ));
    } catch (error) {
      console.error('Error finding all tickets:', error);
      throw error;
    }
  }

  async create(ticket: Ticket): Promise<Ticket> {
    try {
      const schemaName = `tenant_${ticket.tenantId.replace(/-/g, '_')}`;

      const query = `
        INSERT INTO ${schemaName}.tickets (
          id, title, description, status, priority,
          customer_id, assigned_to_id, tenant_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const now = new Date();
      const result = await db.execute(sql.raw(query, [
        ticket.id,
        ticket.title,
        ticket.description,
        ticket.status,
        ticket.priority,
        ticket.customerId,
        ticket.assignedToId,
        ticket.tenantId,
        now,
        now
      ]));

      return ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  async update(ticket: Ticket): Promise<Ticket> {
    try {
      const schemaName = `tenant_${ticket.tenantId.replace(/-/g, '_')}`;

      const query = `
        UPDATE ${schemaName}.tickets SET
          title = $2,
          description = $3,
          status = $4,
          priority = $5,
          customer_id = $6,
          assigned_to_id = $7,
          updated_at = $8
        WHERE id = $1 AND tenant_id = $9
        RETURNING *
      `;

      await db.execute(sql.raw(query, [
        ticket.id,
        ticket.title,
        ticket.description,
        ticket.status,
        ticket.priority,
        ticket.customerId,
        ticket.assignedToId,
        new Date(),
        ticket.tenantId
      ]));

      return ticket;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const query = `
        DELETE FROM ${schemaName}.tickets 
        WHERE id = $1 AND tenant_id = $2
      `;

      await db.execute(sql.raw(query, [id, tenantId]));
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  }

  async countByTenant(tenantId: string): Promise<number> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const query = `
        SELECT COUNT(*) as count 
        FROM ${schemaName}.tickets 
        WHERE tenant_id = $1
      `;

      const result = await db.execute(sql.raw(query, [tenantId]));
      return parseInt(result.rows[0]?.count as string) || 0;
    } catch (error) {
      console.error('Error counting tickets:', error);
      return 0;
    }
  }
}
