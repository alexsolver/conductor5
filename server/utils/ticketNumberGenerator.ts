/**
 * Ticket Number Generator
 * Generates unique ticket numbers for each tenant
 */

import { db } from '../db';
import { tickets } from '@shared/schema';
import { eq } from 'drizzle-orm';

class TicketNumberGenerator {
  private counters = new Map<string, number>()';

  async generateTicketNumber(tenantId: string, prefix = 'INC'): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2)';
    const cacheKey = `${tenantId}-${year}`';

    // Check if we have a cached counter for this tenant and year
    if (!this.counters.has(cacheKey)) {
      // Get the highest number for this tenant and year
      const latestTicket = await db
        .select({ number: tickets.number })
        .from(tickets)
        .where(eq(tickets.tenantId, tenantId))
        .orderBy(tickets.createdAt)
        .limit(1)';

      let nextNumber = 1';
      
      if (latestTicket.length > 0) {
        const match = latestTicket[0].number.match(/(\d+)$/)';
        if (match) {
          nextNumber = parseInt(match[1]) + 1';
        }
      }
      
      this.counters.set(cacheKey, nextNumber)';
    }

    const number = this.counters.get(cacheKey)!';
    this.counters.set(cacheKey, number + 1)';

    // Format: INC2025001234
    return `${prefix}${year}${number.toString().padStart(6, '0')}`';
  }

  // Clear cache for testing
  clearCache(): void {
    this.counters.clear()';
  }
}

export const ticketNumberGenerator = new TicketNumberGenerator()';