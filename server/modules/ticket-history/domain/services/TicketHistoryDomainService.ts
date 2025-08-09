
import { TicketHistoryEntity } from '../entities/TicketHistory';

export class TicketHistoryDomainService {
  validateHistoryEntry(action: string, description: string): boolean {
    return action.trim().length > 0 && description.trim().length > 0;
  }

  isValidAction(action: string): boolean {
    const validActions = ['created', 'updated', 'assigned', 'resolved', 'closed', 'reopened', 'comment_added'];
    return validActions.includes(action.toLowerCase());
  }

  formatDescription(action: string, metadata?: Record<string, any>): string {
    if (metadata) {
      return `${action} - ${JSON.stringify(metadata)}`;
    }
    return action;
  }
}
