// Ticket Number Generator - ServiceNow style
export class TicketNumberGenerator {
  private static instance: TicketNumberGenerator;
  private lastNumbers = new Map<string, number>();

  static getInstance(): TicketNumberGenerator {
    if (!this.instance) {
      this.instance = new TicketNumberGenerator();
    }
    return this.instance;
  }

  /**
   * Generate a unique ticket number for a tenant
   * Format: INC0010001, INC0010002, etc.
   */
  async generateTicketNumber(tenantId: string, prefix: string = "INC"): Promise<string> {
    const key = `${tenantId}-${prefix}`;
    
    // Get the last number for this tenant and prefix
    let lastNumber = this.lastNumbers.get(key) || 0;
    
    // Increment and store
    const newNumber = lastNumber + 1;
    this.lastNumbers.set(key, newNumber);
    
    // Format with padding
    const paddedNumber = newNumber.toString().padStart(7, '0');
    
    return `${prefix}${paddedNumber}`;
  }

  /**
   * Initialize from database - called on startup
   */
  async initializeFromDatabase(tenantId: string, lastTicketNumber?: string) {
    if (lastTicketNumber) {
      // Extract number from format like INC0010001
      const match = lastTicketNumber.match(/([A-Z]+)(\d+)/);
      if (match) {
        const prefix = match[1];
        const number = parseInt(match[2], 10);
        const key = `${tenantId}-${prefix}`;
        this.lastNumbers.set(key, number);
      }
    }
  }

  /**
   * Get next number without incrementing (for preview)
   */
  previewNextNumber(tenantId: string, prefix: string = "INC"): string {
    const key = `${tenantId}-${prefix}`;
    const lastNumber = this.lastNumbers.get(key) || 0;
    const nextNumber = (lastNumber + 1).toString().padStart(7, '0');
    return `${prefix}${nextNumber}`;
  }
}

export const ticketNumberGenerator = TicketNumberGenerator.getInstance();