
export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'greaterThan' | 'lessThan';
  value: string | number;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutomationAction {
  type: 'send_message' | 'assign_user' | 'add_tag' | 'change_status' | 'escalate' | 'create_ticket';
  target: string;
  params: Record<string, any>;
}

export class AutomationRule {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly conditions: AutomationCondition[],
    public readonly actions: AutomationAction[],
    public readonly enabled: boolean = true,
    public readonly priority: number = 1,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  public evaluate(data: Record<string, any>): boolean {
    if (!this.enabled || this.conditions.length === 0) {
      return false;
    }

    let result = true;
    let currentLogical: 'AND' | 'OR' = 'AND';

    for (const condition of this.conditions) {
      const fieldValue = data[condition.field];
      const conditionResult = this.evaluateCondition(condition, fieldValue);

      if (currentLogical === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogical = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private evaluateCondition(condition: AutomationCondition, fieldValue: any): boolean {
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
      case 'regex':
        try {
          const regex = new RegExp(String(value), 'i');
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      default:
        return false;
    }
  }

  public execute(data: Record<string, any>): Promise<void[]> {
    const promises = this.actions.map(action => this.executeAction(action, data));
    return Promise.all(promises);
  }

  private async executeAction(action: AutomationAction, data: Record<string, any>): Promise<void> {
    console.log(`🤖 [AUTOMATION] Executing action: ${action.type} for rule: ${this.name}`);
    
    switch (action.type) {
      case 'send_message':
        await this.sendMessage(action, data);
        break;
      case 'assign_user':
        await this.assignUser(action, data);
        break;
      case 'add_tag':
        await this.addTag(action, data);
        break;
      case 'change_status':
        await this.changeStatus(action, data);
        break;
      case 'escalate':
        await this.escalateTicket(action, data);
        break;
      case 'create_ticket':
        await this.createTicket(action, data);
        break;
      default:
        console.warn(`🤖 [AUTOMATION] Unknown action type: ${action.type}`);
    }
  }

  private async sendMessage(action: AutomationAction, data: Record<string, any>): Promise<void> {
    // Implementar envio de mensagem
    console.log(`📤 [AUTOMATION] Sending message to ${action.target}:`, action.params);
  }

  private async assignUser(action: AutomationAction, data: Record<string, any>): Promise<void> {
    // Implementar atribuição de usuário
    console.log(`👤 [AUTOMATION] Assigning to user ${action.target}:`, action.params);
  }

  private async addTag(action: AutomationAction, data: Record<string, any>): Promise<void> {
    // Implementar adição de tag
    console.log(`🏷️ [AUTOMATION] Adding tag ${action.target}:`, action.params);
  }

  private async changeStatus(action: AutomationAction, data: Record<string, any>): Promise<void> {
    // Implementar mudança de status
    console.log(`🔄 [AUTOMATION] Changing status to ${action.target}:`, action.params);
  }

  private async escalateTicket(action: AutomationAction, data: Record<string, any>): Promise<void> {
    // Implementar escalação
    console.log(`⬆️ [AUTOMATION] Escalating to ${action.target}:`, action.params);
  }

  private async createTicket(action: AutomationAction, data: Record<string, any>): Promise<void> {
    // Implementar criação de ticket
    console.log(`🎫 [AUTOMATION] Creating ticket:`, action.params);
  }
}
