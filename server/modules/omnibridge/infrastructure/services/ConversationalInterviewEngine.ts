import { InternalForm, FormField } from '../../../internal-forms/domain/entities/InternalForm';
import { AIAgent } from '../../domain/entities/AiAgent';

export interface InterviewState {
  formId: string;
  fields: FormField[];
  currentFieldIndex: number;
  collectedData: Record<string, any>;
  conversationHistory: { role: 'agent' | 'user'; content: string }[];
}

export interface InterviewResponse {
  message: string;
  isComplete: boolean;
  collectedData?: Record<string, any>;
  currentField?: FormField;
}

export class ConversationalInterviewEngine {
  
  async startInterview(agent: AIAgent, form: InternalForm): Promise<InterviewResponse> {
    const firstField = form.fields[0];
    
    const message = await this.generateGreeting(agent, form, firstField);
    
    return {
      message,
      isComplete: false,
      currentField: firstField
    };
  }

  async processResponse(
    agent: AIAgent,
    form: InternalForm,
    state: InterviewState,
    userResponse: string
  ): Promise<InterviewResponse> {
    
    const currentField = state.fields[state.currentFieldIndex];
    
    state.conversationHistory.push({ role: 'user', content: userResponse });
    
    const extractedValue = await this.extractFieldValue(currentField, userResponse, agent);
    
    const validation = this.validateFieldValue(currentField, extractedValue);
    
    if (!validation.isValid) {
      const retryMessage = await this.generateRetryMessage(agent, currentField, validation.error!);
      return {
        message: retryMessage,
        isComplete: false,
        currentField
      };
    }
    
    state.collectedData[currentField.id] = extractedValue;
    
    state.currentFieldIndex++;
    
    if (state.currentFieldIndex >= state.fields.length) {
      const confirmationMessage = await this.generateConfirmation(agent, state.collectedData);
      return {
        message: confirmationMessage,
        isComplete: true,
        collectedData: state.collectedData
      };
    }
    
    const nextField = state.fields[state.currentFieldIndex];
    const nextQuestion = await this.generateQuestion(agent, nextField, state);
    
    state.conversationHistory.push({ role: 'agent', content: nextQuestion });
    
    return {
      message: nextQuestion,
      isComplete: false,
      currentField: nextField
    };
  }

  private async generateGreeting(agent: AIAgent, form: InternalForm, firstField: FormField): Promise<string> {
    return `Olá! Sou ${agent.name}. ${agent.description || ''}\n\n` +
           `Vou te ajudar a preencher o formulário "${form.name}". ` +
           `Vamos começar!\n\n` +
           `${firstField.label}${firstField.required ? ' (obrigatório)' : ''}`;
  }

  private async generateQuestion(agent: AIAgent, field: FormField, state: InterviewState): Promise<string> {
    let question = field.label;
    
    if (field.placeholder) {
      question += `\n(Exemplo: ${field.placeholder})`;
    }
    
    if (field.options && field.options.length > 0) {
      question += `\n\nOpções disponíveis:\n${field.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`;
    }
    
    if (field.required) {
      question += '\n\n⚠️ Campo obrigatório';
    }
    
    return question;
  }

  private async generateRetryMessage(agent: AIAgent, field: FormField, error: string): Promise<string> {
    return `Desculpe, mas ${error}\n\nPor favor, tente novamente:\n${field.label}`;
  }

  private async generateConfirmation(agent: AIAgent, collectedData: Record<string, any>): Promise<string> {
    const summary = Object.entries(collectedData)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('\n');
    
    return `Perfeito! Aqui está o resumo dos dados coletados:\n\n${summary}\n\n` +
           `✅ Formulário preenchido com sucesso! Os dados foram salvos.`;
  }

  private async extractFieldValue(field: FormField, userResponse: string, agent: AIAgent): Promise<any> {
    switch (field.type) {
      case 'number':
        const num = parseFloat(userResponse.trim());
        return isNaN(num) ? userResponse : num;
      
      case 'email':
        return userResponse.trim().toLowerCase();
      
      case 'checkbox':
        const lowerResponse = userResponse.toLowerCase().trim();
        return ['sim', 'yes', 'true', '1', 'verdadeiro'].includes(lowerResponse);
      
      case 'select':
        if (field.options) {
          const matched = field.options.find(opt => 
            opt.toLowerCase() === userResponse.toLowerCase().trim()
          );
          if (matched) return matched;
          
          const numMatch = userResponse.match(/^(\d+)/);
          if (numMatch) {
            const index = parseInt(numMatch[1]) - 1;
            if (index >= 0 && index < field.options.length) {
              return field.options[index];
            }
          }
        }
        return userResponse.trim();
      
      case 'date':
        return userResponse.trim();
      
      default:
        return userResponse.trim();
    }
  }

  private validateFieldValue(field: FormField, value: any): { isValid: boolean; error?: string } {
    if (field.required && (!value || value === '')) {
      return { isValid: false, error: 'este campo é obrigatório' };
    }

    if (!value && !field.required) {
      return { isValid: true };
    }

    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, error: 'o email informado não é válido' };
      }
    }

    if (field.type === 'number') {
      if (isNaN(value)) {
        return { isValid: false, error: 'este campo aceita apenas números' };
      }
    }

    if (field.validation) {
      if (field.validation.minLength && value.length < field.validation.minLength) {
        return { 
          isValid: false, 
          error: `este campo deve ter pelo menos ${field.validation.minLength} caracteres` 
        };
      }

      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        return { 
          isValid: false, 
          error: `este campo deve ter no máximo ${field.validation.maxLength} caracteres` 
        };
      }

      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return { 
            isValid: false, 
            error: field.validation.customMessage || 'o formato informado não é válido' 
          };
        }
      }
    }

    if (field.type === 'select' && field.options) {
      if (!field.options.includes(value)) {
        return { 
          isValid: false, 
          error: 'por favor, selecione uma das opções disponíveis' 
        };
      }
    }

    return { isValid: true };
  }
}
