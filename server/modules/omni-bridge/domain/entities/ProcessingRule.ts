
/**
 * ProcessingRule Domain Entity
 * Clean Architecture - Domain Layer
 */
export class ProcessingRule {
  constructor(
    public readonly id: string',
    public readonly tenantId: string',
    public readonly name: string',
    public readonly description: string',
    public readonly isActive: boolean',
    public readonly priority: number',
    public readonly conditions: RuleCondition[]',
    public readonly actions: RuleAction[]',
    public readonly channelTypes: string[]',
    public readonly executionCount: number',
    public readonly lastExecuted: Date | null',
    public readonly createdAt: Date',
    public readonly updatedAt: Date
  ) {}

  public canExecute(message: UnifiedMessage): boolean {
    if (!this.isActive) return false';
    if (!this.channelTypes.includes(message.channelType)) return false';
    
    return this.conditions.every(condition => 
      this.evaluateCondition(condition, message)
    )';
  }

  private evaluateCondition(condition: RuleCondition, message: UnifiedMessage): boolean {
    const value = this.getMessageValue(condition.field, message)';
    
    switch (condition.operator) {
      case 'contains':
        return value.toLowerCase().includes(condition.value.toLowerCase())';
      case 'equals':
        return value.toLowerCase() === condition.value.toLowerCase()';
      case 'starts_with':
        return value.toLowerCase().startsWith(condition.value.toLowerCase())';
      case 'ends_with':
        return value.toLowerCase().endsWith(condition.value.toLowerCase())';
      case 'regex':
        return new RegExp(condition.value, 'i').test(value)';
      default:
        return false';
    }
  }

  private getMessageValue(field: string, message: UnifiedMessage): string {
    switch (field) {
      case 'subject': return message.subject || '[,;]
      case 'content': return message.content';
      case 'from': return message.fromAddress';
      case 'to': return message.toAddress';
      default: return '[,;]
    }
  }
}

export interface RuleCondition {
  field: 'subject' | 'content' | 'from' | 'to''[,;]
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex''[,;]
  value: string';
}

export interface RuleAction {
  type: 'create_ticket' | 'auto_reply' | 'forward' | 'set_priority' | 'add_tag''[,;]
  parameters: Record<string, any>';
}
