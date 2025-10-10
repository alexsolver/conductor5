/**
 * Ticket Number Generator
 * Generates unique ticket numbers for each tenant based on configuration
 */

import { sql } from 'drizzle-orm';
import { poolManager } from '../database/ConnectionPoolManager';

interface NumberingConfig {
  id: string;
  prefix: string;
  first_separator: string;
  year_format: '2' | '4';
  sequential_digits: number;
  separator: string;
  reset_yearly: boolean;
  company_id: string;
}

class TicketNumberGenerator {
  private counters = new Map<string, number>();

  async generateTicketNumber(tenantId: string, companyId: string): Promise<string> {
    try {
      // Get numbering configuration from database
      const config = await this.getNumberingConfig(tenantId, companyId);
      
      if (!config) {
        // Fallback to default format if no config found
        return `T-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      }

      const currentYear = new Date().getFullYear();
      const yearStr = config.year_format === '2' ? 
        currentYear.toString().slice(-2) : 
        currentYear.toString();

      const cacheKey = config.reset_yearly ? 
        `${tenantId}-${companyId}-${currentYear}` : 
        `${tenantId}-${companyId}`;

      // Get next sequential number
      let nextNumber = 1;
      
      if (!this.counters.has(cacheKey)) {
        nextNumber = await this.getNextSequentialNumber(tenantId, config, currentYear);
        this.counters.set(cacheKey, nextNumber);
      } else {
        nextNumber = this.counters.get(cacheKey)! + 1;
        this.counters.set(cacheKey, nextNumber);
      }

      // Build ticket number according to configuration
      const sequentialPart = nextNumber.toString().padStart(config.sequential_digits, '0');
      
      let ticketNumber = config.prefix;
      
      if (config.first_separator) {
        ticketNumber += config.first_separator;
      }
      
      ticketNumber += yearStr;
      
      if (config.separator) {
        ticketNumber += config.separator;
      }
      
      ticketNumber += sequentialPart;

      return ticketNumber;
    } catch (error) {
      console.error('Error generating ticket number:', error);
      // Fallback to simple format
      return `T-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }

  private async getNumberingConfig(tenantId: string, companyId: string): Promise<NumberingConfig | null> {
    try {
      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      const result = await tenantDb.execute(sql`
        SELECT * FROM ${sql.identifier(schemaName)}.ticket_numbering_config 
        WHERE tenant_id = ${tenantId} 
        AND company_id = ${companyId}
        LIMIT 1
      `);

      const row = result.rows?.[0];
      if (!row) return null;

      return {
        id: String(row.id),
        prefix: String(row.prefix),
        first_separator: String(row.first_separator || ''),
        year_format: String(row.year_format) === '2' ? '2' : '4',
        sequential_digits: Number(row.sequential_digits) || 6,
        separator: String(row.separator || ''),
        reset_yearly: Boolean(row.reset_yearly !== false),
        company_id: String(row.company_id)
      };
    } catch (error) {
      console.error('Error fetching numbering config:', error);
      return null;
    }
  }

  private async getNextSequentialNumber(tenantId: string, config: NumberingConfig, currentYear: number): Promise<number> {
    try {
      const tenantDb = await poolManager.getTenantConnection(tenantId);
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      // 🔒 ATOMIC SOLUTION: Use ticket_sequences table with SELECT FOR UPDATE
      const sequenceKey = config.reset_yearly ? 
        `${config.prefix}-${currentYear}` : 
        config.prefix;

      // Try to get and increment sequence atomically
      const result = await tenantDb.execute(sql`
        INSERT INTO ${sql.identifier(schemaName)}.ticket_sequences 
          (tenant_id, company_id, sequence_key, current_value, year)
        VALUES 
          (${tenantId}, ${config.company_id}, ${sequenceKey}, 1, ${currentYear})
        ON CONFLICT (tenant_id, company_id, sequence_key, year) 
        DO UPDATE SET 
          current_value = ${sql.identifier(schemaName)}.ticket_sequences.current_value + 1
        RETURNING current_value
      `);

      if (result.rows && result.rows.length > 0) {
        return Number(result.rows[0].current_value);
      }

      // Fallback: if table doesn't exist, use old method (will be slow but safe)
      console.warn('[TICKET-NUMBER] ticket_sequences table not found, using fallback method');
      
      let whereClause = sql`tenant_id = ${tenantId}`;
      if (config.reset_yearly) {
        whereClause = sql`${whereClause} AND EXTRACT(YEAR FROM created_at) = ${currentYear}`;
      }

      const fallbackResult = await tenantDb.execute(sql`
        SELECT number FROM ${sql.identifier(schemaName)}.tickets
        WHERE ${whereClause}
        AND number LIKE ${config.prefix + '%'}
        ORDER BY created_at DESC
        LIMIT 1
      `);

      if (fallbackResult.rows && fallbackResult.rows.length > 0) {
        const lastNumber = String(fallbackResult.rows[0].number);
        const sequentialMatch = lastNumber.match(/(\d+)$/);
        if (sequentialMatch) {
          return parseInt(sequentialMatch[1]) + 1;
        }
      }

      return 1;
    } catch (error) {
      console.error('Error getting next sequential number:', error);
      return 1;
    }
  }

  // Clear cache for testing
  clearCache(): void {
    this.counters.clear();
  }
}

export const ticketNumberGenerator = new TicketNumberGenerator();