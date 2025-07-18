// Unified Storage Implementation for Solicitantes & Favorecidos
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, or, desc, count, ilike, sql } from "drizzle-orm";
import {
  tenants,
  users,
  sessions,
  solicitantes,
  favorecidos,
  tickets,
  ticketMessages,
  locations,
  activityLogs,
  type InsertSolicitante,
  type SelectSolicitante,
  type InsertFavorecido,
  type SelectFavorecido,
  type InsertTicket,
  type SelectTicket,
  type InsertTicketMessage,
  type InsertLocation,
  type InsertActivityLog,
} from "../shared/schema-unified";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql_conn = neon(connectionString);
const db = drizzle(sql_conn);

export class UnifiedStorage {
  
  // === SOLICITANTES METHODS ===
  
  async getSolicitantes(tenantId: string, limit: number = 50, offset: number = 0, search?: string): Promise<SelectSolicitante[]> {
    try {
      let query = db
        .select()
        .from(solicitantes)
        .where(eq(solicitantes.tenantId, tenantId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(solicitantes.createdAt));

      if (search) {
        query = query.where(
          and(
            eq(solicitantes.tenantId, tenantId),
            or(
              ilike(solicitantes.firstName, `%${search}%`),
              ilike(solicitantes.lastName, `%${search}%`),
              ilike(solicitantes.email, `%${search}%`),
              ilike(solicitantes.documento, `%${search}%`)
            )
          )
        );
      }

      const result = await query;
      return result || [];
    } catch (error) {
      console.error('Error fetching solicitantes:', error);
      return [];
    }
  }

  async getSolicitanteById(tenantId: string, id: string): Promise<SelectSolicitante | null> {
    try {
      const [result] = await db
        .select()
        .from(solicitantes)
        .where(and(eq(solicitantes.tenantId, tenantId), eq(solicitantes.id, id)));
      
      return result || null;
    } catch (error) {
      console.error('Error fetching solicitante by id:', error);
      return null;
    }
  }

  async createSolicitante(tenantId: string, data: InsertSolicitante): Promise<SelectSolicitante> {
    try {
      const [newSolicitante] = await db
        .insert(solicitantes)
        .values({
          ...data,
          tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newSolicitante;
    } catch (error) {
      console.error('Error creating solicitante:', error);
      throw error;
    }
  }

  async updateSolicitante(tenantId: string, id: string, data: Partial<InsertSolicitante>): Promise<SelectSolicitante | null> {
    try {
      const [updated] = await db
        .update(solicitantes)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(and(eq(solicitantes.tenantId, tenantId), eq(solicitantes.id, id)))
        .returning();

      return updated || null;
    } catch (error) {
      console.error('Error updating solicitante:', error);
      throw error;
    }
  }

  async deleteSolicitante(tenantId: string, id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(solicitantes)
        .where(and(eq(solicitantes.tenantId, tenantId), eq(solicitantes.id, id)));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting solicitante:', error);
      return false;
    }
  }

  async getSolicitantesCount(tenantId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(solicitantes)
        .where(eq(solicitantes.tenantId, tenantId));
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting solicitantes:', error);
      return 0;
    }
  }

  // === FAVORECIDOS METHODS ===
  
  async getFavorecidos(tenantId: string, limit: number = 50, offset: number = 0, search?: string): Promise<SelectFavorecido[]> {
    try {
      let query = db
        .select()
        .from(favorecidos)
        .where(eq(favorecidos.tenantId, tenantId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(favorecidos.createdAt));

      if (search) {
        query = query.where(
          and(
            eq(favorecidos.tenantId, tenantId),
            or(
              ilike(favorecidos.nome, `%${search}%`),
              ilike(favorecidos.email, `%${search}%`),
              ilike(favorecidos.documento, `%${search}%`)
            )
          )
        );
      }

      const result = await query;
      return result || [];
    } catch (error) {
      console.error('Error fetching favorecidos:', error);
      return [];
    }
  }

  async getFavorecidoById(tenantId: string, id: string): Promise<SelectFavorecido | null> {
    try {
      const [result] = await db
        .select()
        .from(favorecidos)
        .where(and(eq(favorecidos.tenantId, tenantId), eq(favorecidos.id, id)));
      
      return result || null;
    } catch (error) {
      console.error('Error fetching favorecido by id:', error);
      return null;
    }
  }

  async createFavorecido(tenantId: string, data: InsertFavorecido): Promise<SelectFavorecido> {
    try {
      const [newFavorecido] = await db
        .insert(favorecidos)
        .values({
          ...data,
          tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newFavorecido;
    } catch (error) {
      console.error('Error creating favorecido:', error);
      throw error;
    }
  }

  async updateFavorecido(tenantId: string, id: string, data: Partial<InsertFavorecido>): Promise<SelectFavorecido | null> {
    try {
      const [updated] = await db
        .update(favorecidos)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(and(eq(favorecidos.tenantId, tenantId), eq(favorecidos.id, id)))
        .returning();

      return updated || null;
    } catch (error) {
      console.error('Error updating favorecido:', error);
      throw error;
    }
  }

  async deleteFavorecido(tenantId: string, id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(favorecidos)
        .where(and(eq(favorecidos.tenantId, tenantId), eq(favorecidos.id, id)));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting favorecido:', error);
      return false;
    }
  }

  async getFavorecidosCount(tenantId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(favorecidos)
        .where(eq(favorecidos.tenantId, tenantId));
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting favorecidos:', error);
      return 0;
    }
  }

  // === TICKETS METHODS ===
  
  async getTickets(tenantId: string, limit: number = 50, offset: number = 0): Promise<SelectTicket[]> {
    try {
      const result = await db
        .select()
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(tickets.createdAt));

      return result || [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  }

  async getTicketById(tenantId: string, id: string): Promise<SelectTicket | null> {
    try {
      const [result] = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.id, id)));
      
      return result || null;
    } catch (error) {
      console.error('Error fetching ticket by id:', error);
      return null;
    }
  }

  async createTicket(tenantId: string, data: InsertTicket): Promise<SelectTicket> {
    try {
      // Generate ticket number
      const [countResult] = await db
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId));
      
      const ticketNumber = `TK-${String(countResult.count + 1).padStart(6, '0')}`;

      const [newTicket] = await db
        .insert(tickets)
        .values({
          ...data,
          tenantId,
          number: ticketNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newTicket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  async updateTicket(tenantId: string, id: string, data: Partial<InsertTicket>): Promise<SelectTicket | null> {
    try {
      const [updated] = await db
        .update(tickets)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.id, id)))
        .returning();

      return updated || null;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  async getTicketsCount(tenantId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId));
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting tickets:', error);
      return 0;
    }
  }

  async getOpenTicketsCount(tenantId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(tickets)
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.status, 'open')));
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting open tickets:', error);
      return 0;
    }
  }

  // === LOCATIONS METHODS ===
  
  async getLocations(tenantId: string): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(locations)
        .where(eq(locations.tenantId, tenantId))
        .orderBy(desc(locations.createdAt));

      return result || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }

  async createLocation(tenantId: string, data: InsertLocation): Promise<any> {
    try {
      const [newLocation] = await db
        .insert(locations)
        .values({
          ...data,
          tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newLocation;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  // === DASHBOARD METHODS ===

  async getDashboardStats(tenantId: string): Promise<any> {
    try {
      const [ticketCount] = await db
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId));

      const [solicitanteCount] = await db
        .select({ count: count() })
        .from(solicitantes)
        .where(eq(solicitantes.tenantId, tenantId));

      const [openTickets] = await db
        .select({ count: count() })
        .from(tickets)
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.status, 'open')));

      const [resolvedTickets] = await db
        .select({ count: count() })
        .from(tickets)
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.status, 'resolved')));

      return {
        totalTickets: ticketCount?.count || 0,
        totalCustomers: solicitanteCount?.count || 0,
        openTickets: openTickets?.count || 0,
        resolvedTickets: resolvedTickets?.count || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalTickets: 0,
        totalCustomers: 0,
        openTickets: 0,
        resolvedTickets: 0,
      };
    }
  }

  async getRecentActivity(tenantId: string, limit: number = 20): Promise<any[]> {
    try {
      const recentTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId))
        .orderBy(desc(tickets.createdAt))
        .limit(5);

      const recentSolicitantes = await db
        .select()
        .from(solicitantes)
        .where(eq(solicitantes.tenantId, tenantId))
        .orderBy(desc(solicitantes.createdAt))
        .limit(5);

      // Combine activities
      const activities = [
        ...recentTickets.map(ticket => ({
          type: 'ticket',
          id: ticket.id,
          title: ticket.subject,
          createdAt: ticket.createdAt,
          data: ticket
        })),
        ...recentSolicitantes.map(solicitante => ({
          type: 'solicitante',
          id: solicitante.id,
          title: `${solicitante.firstName || ''} ${solicitante.lastName || ''}`.trim() || solicitante.email,
          createdAt: solicitante.createdAt,
          data: solicitante
        }))
      ];

      // Sort by creation date and return
      return activities
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  // === USER MANAGEMENT ===

  async getUserByEmail(email: string): Promise<any> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      return user || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // === TENANT MANAGEMENT ===

  async getTenantById(id: string): Promise<any> {
    try {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, id));
      
      return tenant || null;
    } catch (error) {
      console.error('Error fetching tenant by id:', error);
      return null;
    }
  }

  async createTenant(tenantData: any): Promise<any> {
    try {
      const [newTenant] = await db
        .insert(tenants)
        .values({
          ...tenantData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newTenant;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }
}

// Export single instance
export const unifiedStorage = new UnifiedStorage();