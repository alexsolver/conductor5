export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'greaterThan' | 'lessThan';
  value: string | number;
  logicalOperator?: 'AND' | 'OR';
  type?: string; // Adicionado para compatibilidade com a nova lógica de avaliação
  condition?: string; // Adicionado para compatibilidade com a nova lógica de avaliação
  channel?: string; // Adicionado para compatibilidade com a nova lógica de avaliação
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

  public evaluate(data: any): boolean {
    if (!this.enabled) {
      return false;
    }

    console.log(`🔍 [AutomationRule] Evaluating rule "${this.name}" with data:`, JSON.stringify(data, null, 2));

    // Avaliar todas as condições (AND logic - todas devem ser verdadeiras)
    return this.conditions.every(condition => {
      const result = this.evaluateCondition(condition, data);
      console.log(`🔍 [AutomationRule] Condition "${condition.type}" result: ${result}`);
      return result;
    });
  }

  private evaluateCondition(condition: AutomationCondition, data: any): boolean {
    const conditionType = condition.type;
    const conditionValue = condition.value?.toLowerCase() || '';
    const conditionOperator = condition.condition || 'equals';

    switch (conditionType) {
      case 'message_received':
        return data.type === 'message' || data.body || data.content;

      case 'email_received':
        return data.type === 'email' || data.subject || data.from_email;

      case 'keyword_match':
        const content = (data.content || data.body || data.subject || '').toLowerCase();
        return this.matchText(content, conditionValue, conditionOperator);

      case 'email_subject':
        const subject = (data.subject || '').toLowerCase();
        return this.matchText(subject, conditionValue, conditionOperator);

      case 'sender_email':
        const senderEmail = (data.sender || data.from_email || data.senderEmail || '').toLowerCase();
        return this.matchText(senderEmail, conditionValue, conditionOperator);

      case 'message_contains':
        const messageBody = (data.body || data.content || data.bodyText || '').toLowerCase();
        return this.matchText(messageBody, conditionValue, conditionOperator);

      case 'time_based':
        return this.evaluateTimeCondition(condition, data);

      case 'priority_high':
        return (data.priority || '').toLowerCase() === 'high' ||
               (data.priority || '').toLowerCase() === 'urgent';

      case 'channel_match':
        return data.channel === condition.channel || data.source === condition.channel;

      default:
        console.warn(`⚠️ [AutomationRule] Unknown condition type: ${conditionType}`);
        return false;
    }
  }

  private matchText(text: string, value: string, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return text === value;
      case 'contains':
        return text.includes(value);
      case 'starts_with':
        return text.startsWith(value);
      case 'ends_with':
        return text.endsWith(value);
      case 'regex':
        try {
          const regex = new RegExp(value, 'i');
          return regex.test(text);
        } catch (error) {
          console.error(`❌ [AutomationRule] Invalid regex: ${value}`, error);
          return false;
        }
      default:
        return text.includes(value);
    }
  }

  private evaluateTimeCondition(condition: AutomationCondition, data: any): boolean {
    const now = new Date();
    const hour = now.getHours();

    // Exemplo: horário comercial (9h às 18h)
    if (condition.value === 'business_hours') {
      return hour >= 9 && hour < 18;
    }

    // Exemplo: fora do horário comercial
    if (condition.value === 'after_hours') {
      return hour < 9 || hour >= 18;
    }

    return true;
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