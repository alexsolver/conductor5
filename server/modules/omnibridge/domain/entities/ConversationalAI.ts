
export interface ConversationStep {
  id: string;
  type: 'menu' | 'text_input' | 'confirmation' | 'action_execution';
  prompt: string;
  options?: Array<{
    id: string;
    label: string;
    value: any;
    nextStepId?: string;
  }>;
  inputType?: 'text' | 'email' | 'number' | 'date' | 'select';
  validation?: {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  nextStepId?: string;
  actionConfig?: {
    type: string;
    parameters: Record<string, any>;
  };
}

export interface ConversationFlow {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  triggerKeywords: string[];
  steps: ConversationStep[];
  dataSchema: Record<string, any>;
  finalActions: Array<{
    type: string;
    parameters: Record<string, any>;
    condition?: string;
  }>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSession {
  id: string;
  flowId: string;
  tenantId: string;
  userId?: string;
  channel: string;
  sender: string;
  currentStepId: string;
  collectedData: Record<string, any>;
  status: 'active' | 'completed' | 'cancelled' | 'error';
  startedAt: Date;
  lastInteractionAt: Date;
  completedAt?: Date;
}

export class ConversationalAI {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public description: string,
    public flows: ConversationFlow[],
    public enabled: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  public findFlowByKeywords(message: string): ConversationFlow | null {
    const lowerMessage = message.toLowerCase();
    
    for (const flow of this.flows) {
      if (!flow.enabled) continue;
      
      const hasKeyword = flow.triggerKeywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        return flow;
      }
    }
    
    return null;
  }

  public generateMenuResponse(step: ConversationStep): string {
    let response = step.prompt + '\n\n';
    
    if (step.type === 'menu' && step.options) {
      step.options.forEach((option, index) => {
        response += `${index + 1}. ${option.label}\n`;
      });
      response += '\nDigite o número da opção desejada.';
    } else if (step.type === 'text_input') {
      response += '\nPor favor, digite sua resposta:';
    } else if (step.type === 'confirmation') {
      response += '\n1. Sim\n2. Não\n\nDigite 1 para confirmar ou 2 para cancelar.';
    }
    
    return response;
  }

  public validateInput(step: ConversationStep, input: string): { valid: boolean; error?: string } {
    if (!step.validation) return { valid: true };

    if (step.validation.required && (!input || input.trim() === '')) {
      return { valid: false, error: 'Este campo é obrigatório.' };
    }

    if (step.validation.minLength && input.length < step.validation.minLength) {
      return { valid: false, error: `Mínimo de ${step.validation.minLength} caracteres.` };
    }

    if (step.validation.maxLength && input.length > step.validation.maxLength) {
      return { valid: false, error: `Máximo de ${step.validation.maxLength} caracteres.` };
    }

    if (step.validation.pattern) {
      const regex = new RegExp(step.validation.pattern);
      if (!regex.test(input)) {
        return { valid: false, error: 'Formato inválido.' };
      }
    }

    return { valid: true };
  }
}
