
export class TicketDomainService {
  validateTicketStatus(status: string): boolean {
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    return validStatuses.includes(status);
  }

  validatePriority(priority: string): boolean {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority);
  }

  generateTicketNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TK-${timestamp}-${random}`;
  }
}
