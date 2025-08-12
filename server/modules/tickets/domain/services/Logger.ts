import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { tickets } from './schema'; // Assuming schema is in a separate file
import { eq, and, asc, desc, ILike } from 'drizzle-orm';

export interface Logger {
  info(message: string, context?: any): void;
  error(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  debug(message: string, context?: any): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, context?: any): void {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
  }

  error(message: string, context?: any): void {
    console.error(`[ERROR] ${message}`, context ? JSON.stringify(context) : '');
  }

  warn(message: string, context?: any): void {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
  }

  debug(message: string, context?: any): void {
    console.debug(`[DEBUG] ${message}`, context ? JSON.stringify(context) : '');
  }
}

export interface TicketRepository {
  create(ticket: any): Promise<any>;
  findAll(filters?: any): Promise<any[]>;
  findById(id: string): Promise<any | undefined>;
  update(id: string, ticket: any): Promise<any>;
  delete(id: string): Promise<void>;
  findWithFilters(filters: any): Promise<any[]>;
}

export class DrizzleTicketRepository implements TicketRepository {
  private db: any;
  private logger: Logger;

  constructor(client: Client, logger: Logger) {
    this.db = drizzle(client);
    this.logger = logger;
  }

  async create(ticket: any): Promise<any> {
    this.logger.info('Creating ticket', ticket);
    const result = await this.db.insert(tickets).values(ticket).returning();
    this.logger.info('Ticket created successfully', result[0]);
    return result[0];
  }

  async findAll(filters: any = {}): Promise<any[]> {
    this.logger.info('Finding all tickets with filters', filters);
    const query = this.db.select().from(tickets);

    // Apply filters
    if (filters.status) {
      query.where(eq(tickets.status, filters.status));
    }
    if (filters.search) {
      query.where(
        and(
          eq(tickets.status, filters.status || 'OPEN'), // Default to OPEN if not specified
          ILike(tickets.title, `%${filters.search}%`)
        )
      );
    }

    // Apply sorting
    if (filters.sortBy && filters.sortOrder) {
      if (filters.sortOrder === 'asc') {
        query.orderBy(asc(tickets[filters.sortBy]));
      } else {
        query.orderBy(desc(tickets[filters.sortBy]));
      }
    } else {
      query.orderBy(asc(tickets.createdAt)); // Default sort
    }

    const result = await query;
    this.logger.info('Found tickets', result);
    return result;
  }

  async findById(id: string): Promise<any | undefined> {
    this.logger.info(`Finding ticket by ID: ${id}`);
    const result = await this.db.select().from(tickets).where(eq(tickets.id, id));
    this.logger.info(`Ticket found: ${result[0]}`);
    return result[0];
  }

  async update(id: string, ticket: any): Promise<any> {
    this.logger.info(`Updating ticket with ID: ${id}`, ticket);
    if (Object.keys(ticket).length === 0) {
      this.logger.warn('No fields provided for update, returning existing ticket.');
      return this.findById(id);
    }
    const result = await this.db.update(tickets).set(ticket).where(eq(tickets.id, id)).returning();
    this.logger.info('Ticket updated successfully', result[0]);
    return result[0];
  }

  async delete(id: string): Promise<void> {
    this.logger.info(`Deleting ticket with ID: ${id}`);
    await this.db.delete(tickets).where(eq(tickets.id, id));
    this.logger.info(`Ticket with ID: ${id} deleted successfully`);
  }

  async findWithFilters(filters: any): Promise<any[]> {
    this.logger.info('Find tickets with filters called', filters);
    const query = this.db.select().from(tickets);

    const conditions = [];

    if (filters.status) {
      conditions.push(eq(tickets.status, filters.status));
    }
    if (filters.priority) {
      conditions.push(eq(tickets.priority, filters.priority));
    }
    if (filters.search) {
      conditions.push(ILike(tickets.title, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      // If there are conditions, apply them. If no conditions, select all.
      query.where(and(...conditions));
    }

    if (filters.sortBy && filters.sortOrder) {
      if (filters.sortOrder === 'asc') {
        query.orderBy(asc(tickets[filters.sortBy]));
      } else {
        query.orderBy(desc(tickets[filters.sortBy]));
      }
    } else {
      query.orderBy(asc(tickets.createdAt));
    }

    const result = await query;
    this.logger.info('Tickets found with filters', result);
    return result;
  }
}