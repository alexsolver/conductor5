
/**
 * Ticket Number Generator
 * Generates unique ticket numbers based on company-specific configurations
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

class TicketNumberGenerator {
  private counters = new Map<string, number>();

  async generateTicketNumber(tenantId: string, companyId: string): Promise<string> {
    try {
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Buscar configuração específica da empresa
      const configResult = await db.execute(sql`
        SELECT prefix, year_format, sequential_digits, separator, reset_yearly
        FROM "${sql.raw(schemaName)}"."ticket_numbering_config" 
        WHERE tenant_id = ${tenantId} AND company_id = ${companyId}
        LIMIT 1
      `);

      // Configuração padrão se não encontrar específica da empresa
      const config = configResult.rows[0] || {
        prefix: 'INC',
        year_format: '4',
        sequential_digits: 6,
        separator: '-',
        reset_yearly: true
      };

      const currentYear = new Date().getFullYear();
      const yearString = config.year_format === '2' 
        ? currentYear.toString().slice(-2)
        : currentYear.toString();

      const cacheKey = `${tenantId}-${companyId}-${config.reset_yearly ? yearString : 'all'}`;

      // Verificar se temos contador em cache
      if (!this.counters.has(cacheKey)) {
        // Buscar o maior número existente para esta empresa
        const prefix = config.prefix;
        const yearPattern = config.reset_yearly ? yearString : '%';
        
        const latestResult = await db.execute(sql`
          SELECT number FROM "${sql.raw(schemaName)}"."tickets" 
          WHERE tenant_id = ${tenantId} 
          AND company_id = ${companyId}
          AND number LIKE ${`${prefix}${config.separator}${yearPattern}%`}
          ORDER BY created_at DESC
          LIMIT 1
        `);

        let nextNumber = 1;
        
        if (latestResult.rows.length > 0) {
          const lastNumber = latestResult.rows[0].number;
          // Extrair o número sequencial do final
          const match = lastNumber.match(/(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
        
        this.counters.set(cacheKey, nextNumber);
      }

      const sequentialNumber = this.counters.get(cacheKey)!;
      this.counters.set(cacheKey, sequentialNumber + 1);

      // Formatar número final baseado na configuração
      const paddedNumber = sequentialNumber.toString().padStart(config.sequential_digits, '0');
      
      return `${config.prefix}${config.separator}${yearString}${config.separator}${paddedNumber}`;
      
    } catch (error) {
      console.error('Error generating ticket number:', error);
      // Fallback para formato padrão
      const year = new Date().getFullYear().toString().slice(-2);
      const fallbackKey = `${tenantId}-fallback-${year}`;
      
      if (!this.counters.has(fallbackKey)) {
        this.counters.set(fallbackKey, 1);
      }
      
      const number = this.counters.get(fallbackKey)!;
      this.counters.set(fallbackKey, number + 1);
      
      return `INC${year}${number.toString().padStart(6, '0')}`;
    }
  }

  // Limpar cache para testes
  clearCache(): void {
    this.counters.clear();
  }

  // Limpar cache específico de uma empresa
  clearCompanyCache(tenantId: string, companyId: string): void {
    const keysToDelete = Array.from(this.counters.keys())
      .filter(key => key.startsWith(`${tenantId}-${companyId}-`));
    
    keysToDelete.forEach(key => this.counters.delete(key));
  }
}

export const ticketNumberGenerator = new TicketNumberGenerator();
