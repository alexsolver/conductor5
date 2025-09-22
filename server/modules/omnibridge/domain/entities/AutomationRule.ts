import { IAIAnalysisPort, MessageAnalysis } from '../ports/IAIAnalysisPort';
import { IActionExecutorPort, ActionExecutionContext } from '../ports/IActionExecutorPort';

export interface AutomationTrigger {
  type: 'message_received' | 'email_received' | 'keyword_match' | 'ai_analysis' | 'time_based' | 'channel_specific';
  conditions: AutomationCondition[];
  aiEnabled?: boolean;
  aiPromptId?: string;
}

export interface AutomationCondition {
  id: string;
  type: 'content' | 'sender' | 'subject' | 'channel' | 'priority' | 'ai_intent' | 'ai_sentiment' | 'ai_urgency' | 'keyword' | 'time' | 'custom';
  field?: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than' | 'ai_matches';
  value: string | number;
  caseSensitive?: boolean;
  aiAnalysisRequired?: boolean;
}

export interface AutomationAction {
  id: string;
  type: 'create_ticket' | 'send_auto_reply' | 'forward_message' | 'assign_user' | 'add_tag' | 'change_status' | 'escalate' | 'webhook' | 'ai_response' | 'notify_team';
  target?: string;
  params: Record<string, any>;
  aiEnabled?: boolean;
  templateId?: string;
  priority: number;
}

export class AutomationRule {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly trigger: AutomationTrigger,
    public readonly actions: AutomationAction[],
    public readonly enabled: boolean = true,
    public readonly priority: number = 1,
    public readonly aiEnabled: boolean = false,
    public readonly aiPromptId?: string,
    public readonly executionCount: number = 0,
    public readonly successCount: number = 0,
    public readonly lastExecuted?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  public async evaluate(
    messageData: any, 
    aiAnalysis?: MessageAnalysis, 
    aiService?: IAIAnalysisPort
  ): Promise<boolean> {
    if (!this.enabled) {
      console.log(`🔇 [AutomationRule] Rule "${this.name}" is disabled, skipping evaluation`);
      return false;
    }

    console.log(`🔍 [AutomationRule] Evaluating rule "${this.name}" for message from ${messageData.sender}`);

    // Se a regra requer análise de IA e não foi fornecida, fazer a análise
    let analysis = aiAnalysis;
    if (this.aiEnabled && !analysis && aiService) {
      console.log(`🤖 [AutomationRule] Running AI analysis for rule "${this.name}"`);
      analysis = await aiService.analyzeMessage({
        content: messageData.content || messageData.body,
        sender: messageData.sender || messageData.from,
        subject: messageData.subject,
        channel: messageData.channel || messageData.channelType,
        timestamp: messageData.timestamp
      });
    }

    // Avaliar trigger principal
    const triggerMatches = await this.evaluateTrigger(messageData, analysis);
    
    if (!triggerMatches) {
      console.log(`❌ [AutomationRule] Rule "${this.name}" trigger did not match`);
      return false;
    }

    // Avaliar todas as condições do trigger
    const conditionsMatch = await this.evaluateConditions(messageData, analysis);
    
    if (conditionsMatch) {
      console.log(`✅ [AutomationRule] Rule "${this.name}" matched all conditions`);
    } else {
      console.log(`❌ [AutomationRule] Rule "${this.name}" failed condition evaluation`);
    }

    return conditionsMatch;
  }

  private async evaluateTrigger(messageData: any, aiAnalysis?: MessageAnalysis): Promise<boolean> {
    const { type } = this.trigger;

    console.log(`🔍 [AutomationRule] Evaluating trigger type: ${type} for rule "${this.name}"`);

    switch (type) {
      case 'message_received':
        const hasContent = Boolean(messageData.content || messageData.body);
        console.log(`📨 [AutomationRule] Message received trigger: ${hasContent}`);
        return hasContent;

      case 'email_received':
        const isEmail = messageData.channelType === 'email' || messageData.channel === 'email' || Boolean(messageData.subject);
        console.log(`📧 [AutomationRule] Email received trigger: ${isEmail}`);
        return isEmail;

      case 'keyword_match':
        const content = (messageData.content || messageData.body || '').toLowerCase();
        console.log(`🔤 [AutomationRule] Checking keyword_match in content: "${content}"`);
        
        if (!this.trigger.conditions || this.trigger.conditions.length === 0) {
          console.log(`⚠️ [AutomationRule] No keyword conditions found for keyword_match trigger`);
          return false;
        }
        
        const keywordMatch = this.trigger.conditions.some(condition => {
          if (condition.type === 'keyword' && condition.value) {
            const keyword = condition.value.toString().toLowerCase();
            const matches = content.includes(keyword);
            console.log(`🔍 [AutomationRule] Keyword "${keyword}" in "${content}": ${matches}`);
            return matches;
          }
          return false;
        });
        
        console.log(`🎯 [AutomationRule] Keyword match result: ${keywordMatch}`);
        return keywordMatch;

      case 'ai_analysis':
        const hasAI = Boolean(aiAnalysis);
        console.log(`🤖 [AutomationRule] AI analysis trigger: ${hasAI}`);
        return hasAI;

      case 'channel_specific':
        const channelMatch = this.trigger.conditions.some(condition =>
          condition.type === 'channel' && 
          (messageData.channel === condition.value || messageData.channelType === condition.value)
        );
        console.log(`📺 [AutomationRule] Channel specific trigger: ${channelMatch}`);
        return channelMatch;

      case 'time_based':
        const timeMatch = this.evaluateTimeConditions();
        console.log(`⏰ [AutomationRule] Time based trigger: ${timeMatch}`);
        return timeMatch;

      default:
        console.warn(`⚠️ [AutomationRule] Unknown trigger type: ${type}`);
        return false;
    }
  }

  private async evaluateConditions(messageData: any, aiAnalysis?: MessageAnalysis): Promise<boolean> {
    const conditions = this.trigger.conditions;
    
    if (!conditions || conditions.length === 0) {
      console.log(`✅ [AutomationRule] No conditions to evaluate, rule "${this.name}" applies by default`);
      return true; // Se não há condições, a regra sempre se aplica
    }

    console.log(`🔍 [AutomationRule] Evaluating ${conditions.length} conditions for rule "${this.name}"`);

    // Todas as condições devem ser verdadeiras (AND logic)
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, messageData, aiAnalysis);
      
      console.log(`🔍 [AutomationRule] Condition ${condition.type}:${condition.operator}:"${condition.value}" = ${result}`);
      
      if (!result) {
        console.log(`❌ [AutomationRule] Rule "${this.name}" failed condition: ${condition.type} ${condition.operator} "${condition.value}"`);
        return false;
      }
    }

    console.log(`✅ [AutomationRule] All conditions passed for rule "${this.name}"`);
    return true;
  }

  private async evaluateCondition(
    condition: AutomationCondition, 
    messageData: any, 
    aiAnalysis?: MessageAnalysis
  ): Promise<boolean> {
    let actualValue: string | number | undefined;

    // Extrair valor baseado no tipo da condição
    switch (condition.type) {
      case 'content':
        actualValue = messageData.content || messageData.body || '';
        break;
      case 'sender':
        actualValue = messageData.sender || messageData.from || '';
        break;
      case 'subject':
        actualValue = messageData.subject || '';
        break;
      case 'channel':
        actualValue = messageData.channel || messageData.channelType || '';
        break;
      case 'priority':
        actualValue = messageData.priority || 'medium';
        break;
      case 'ai_intent':
        actualValue = aiAnalysis?.intent || '';
        break;
      case 'ai_sentiment':
        actualValue = aiAnalysis?.sentiment || '';
        break;
      case 'ai_urgency':
        actualValue = aiAnalysis?.urgency || '';
        break;
      case 'keyword':
        actualValue = (messageData.content || messageData.body || '').toLowerCase();
        break;
      default:
        console.log(`🔍 [AutomationRule] Using field "${condition.field}" for condition type "${condition.type}"`);
        if (condition.field === 'content') {
          actualValue = (messageData.content || messageData.body || '').toLowerCase();
        } else {
          actualValue = messageData[condition.field] || '';
        }
    }

    console.log(`🔍 [AutomationRule] Comparing "${actualValue}" ${condition.operator} "${condition.value}"`);
    
    const result = this.compareValues(actualValue, condition.value, condition.operator, condition.caseSensitive);
    console.log(`🎯 [AutomationRule] Condition result: ${result}`);
    
    return result;
  }

  private compareValues(
    actual: string | number | undefined, 
    expected: string | number, 
    operator: string,
    caseSensitive: boolean = false
  ): boolean {
    const actualStr = String(actual || '');
    const expectedStr = String(expected);
    
    const actualCompare = caseSensitive ? actualStr : actualStr.toLowerCase();
    const expectedCompare = caseSensitive ? expectedStr : expectedStr.toLowerCase();

    switch (operator) {
      case 'equals':
        return actualCompare === expectedCompare;
      case 'contains':
        return actualCompare.includes(expectedCompare);
      case 'starts_with':
        return actualCompare.startsWith(expectedCompare);
      case 'ends_with':
        return actualCompare.endsWith(expectedCompare);
      case 'regex':
        try {
          const regex = new RegExp(expectedStr, caseSensitive ? '' : 'i');
          return regex.test(actualStr);
        } catch (error) {
          console.error(`❌ [AutomationRule] Invalid regex: ${expectedStr}`, error);
          return false;
        }
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'ai_matches':
        // Para condições de IA, usar contains como fallback
        return actualCompare.includes(expectedCompare);
      default:
        console.warn(`⚠️ [AutomationRule] Unknown operator: ${operator}`);
        return false;
    }
  }

  private evaluateTimeConditions(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Implementar lógica de tempo baseada nas condições
    const timeConditions = this.trigger.conditions.filter(c => c.type === 'time');
    
    if (timeConditions.length === 0) {
      return true;
    }

    return timeConditions.every(condition => {
      switch (condition.value) {
        case 'business_hours':
          return hour >= 9 && hour < 18 && dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'after_hours':
          return hour < 9 || hour >= 18 || dayOfWeek === 0 || dayOfWeek === 6;
        case 'weekend':
          return dayOfWeek === 0 || dayOfWeek === 6;
        case 'weekday':
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        default:
          return true;
      }
    });
  }

  public async execute(
    messageData: any, 
    aiAnalysis?: MessageAnalysis, 
    actionExecutor?: IActionExecutorPort
  ): Promise<void> {
    console.log(`🚀 [AutomationRule] Executing rule "${this.name}" with ${this.actions.length} actions`);

    // Ordenar ações por prioridade
    const sortedActions = [...this.actions].sort((a, b) => (a.priority || 0) - (b.priority || 0));

    if (actionExecutor) {
      const context: ActionExecutionContext = {
        tenantId: this.tenantId,
        messageData,
        aiAnalysis,
        ruleId: this.id,
        ruleName: this.name
      };

      const results = await actionExecutor.executeActions(sortedActions, context);
      
      // Log resultados
      results.forEach((result, index) => {
        const action = sortedActions[index];
        if (result.success) {
          console.log(`✅ [AutomationRule] Action ${action.type} executed successfully: ${result.message}`);
        } else {
          console.error(`❌ [AutomationRule] Action ${action.type} failed: ${result.error || result.message}`);
        }
      });
    } else {
      console.warn(`⚠️ [AutomationRule] No action executor provided, actions will not be executed`);
    }

    console.log(`✅ [AutomationRule] Rule "${this.name}" execution completed`);
  }

}