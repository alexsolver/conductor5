import { SelectChatbotNode } from '../../../../../shared/schema-chatbot';

export interface NodeProcessingResult {
  responses: Array<{
    type: 'text' | 'media' | 'form' | 'action';
    content: any;
  }>;
  context: Record<string, any>;
  shouldStop?: boolean;
  fallbackToHuman?: boolean;
  error?: string;
}

export class ChatbotNodeProcessor {
  
  async processNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    
    try {
      // Process based on node category and type
      switch (node.category) {
        case 'trigger':
          return await this.processTriggerNode(node, context, userInput);
        
        case 'condition':
          return await this.processConditionNode(node, context, userInput);
        
        case 'action':
          return await this.processActionNode(node, context, userInput);
        
        case 'response':
          return await this.processResponseNode(node, context, userInput);
        
        case 'integration':
          return await this.processIntegrationNode(node, context, userInput);
        
        case 'ai':
          return await this.processAiNode(node, context, userInput);
        
        case 'flow_control':
          return await this.processFlowControlNode(node, context, userInput);
        
        case 'validation':
          return await this.processValidationNode(node, context, userInput);
        
        case 'advanced':
          return await this.processAdvancedNode(node, context, userInput);
        
        default:
          return {
            responses: [],
            context,
            error: `Unknown node category: ${node.category}`
          };
      }
      
    } catch (error) {
      console.error(`Error processing node ${node.id}:`, error);
      return {
        responses: [],
        context,
        error: error instanceof Error ? error.message : 'Node processing failed'
      };
    }
  }

  private async processTriggerNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    switch (node.type) {
      case 'message_received':
        // Always triggers for message received
        return {
          responses: [],
          context: {
            ...context,
            triggeredBy: 'message_received',
            triggeredAt: new Date().toISOString()
          }
        };
      
      case 'keyword_trigger':
        const keywords = config.keywords || [];
        const matched = keywords.some((keyword: string) => 
          userInput.toLowerCase().includes(keyword.toLowerCase())
        );
        
        return {
          responses: [],
          context: {
            ...context,
            keywordMatched: matched,
            matchedKeywords: keywords.filter((kw: string) => 
              userInput.toLowerCase().includes(kw.toLowerCase())
            )
          }
        };
      
      case 'pattern_trigger':
        const pattern = config.pattern || '';
        let patternMatched = false;
        let matches: string[] = [];
        
        if (pattern) {
          try {
            const regex = new RegExp(pattern, 'i');
            const match = regex.exec(userInput);
            patternMatched = !!match;
            matches = match ? Array.from(match) : [];
          } catch (error) {
            console.warn('Invalid regex pattern:', pattern);
          }
        }
        
        return {
          responses: [],
          context: {
            ...context,
            patternMatched,
            patternMatches: matches
          }
        };
      
      case 'intent_trigger':
        // For now, simple intent matching based on keywords
        const intentKeywords = config.intentKeywords || [];
        const intentMatched = intentKeywords.some((keyword: string) => 
          userInput.toLowerCase().includes(keyword.toLowerCase())
        );
        
        return {
          responses: [],
          context: {
            ...context,
            intentMatched,
            detectedIntent: intentMatched ? config.intentName : null
          }
        };
      
      default:
        return { responses: [], context };
    }
  }

  private async processConditionNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    switch (node.type) {
      case 'text_condition':
        const textCondition = config.condition || '';
        let textResult = true;
        
        if (textCondition.includes('contains')) {
          const value = config.value || '';
          textResult = userInput.toLowerCase().includes(value.toLowerCase());
        } else if (textCondition.includes('equals')) {
          const value = config.value || '';
          textResult = userInput.toLowerCase() === value.toLowerCase();
        }
        
        return {
          responses: [],
          context: {
            ...context,
            conditionResult: textResult,
            lastCondition: 'text_condition'
          }
        };
      
      case 'variable_condition':
        const variableName = config.variableName || '';
        const operator = config.operator || 'equals';
        const expectedValue = config.value;
        const actualValue = context[variableName];
        
        let variableResult = false;
        
        switch (operator) {
          case 'equals':
            variableResult = actualValue === expectedValue;
            break;
          case 'not_equals':
            variableResult = actualValue !== expectedValue;
            break;
          case 'contains':
            variableResult = String(actualValue).includes(String(expectedValue));
            break;
          case 'greater_than':
            variableResult = Number(actualValue) > Number(expectedValue);
            break;
          case 'less_than':
            variableResult = Number(actualValue) < Number(expectedValue);
            break;
        }
        
        return {
          responses: [],
          context: {
            ...context,
            conditionResult: variableResult,
            lastCondition: 'variable_condition'
          }
        };
      
      case 'user_input_condition':
        const inputCondition = config.condition || 'not_empty';
        let inputResult = false;
        
        switch (inputCondition) {
          case 'not_empty':
            inputResult = userInput.trim().length > 0;
            break;
          case 'is_number':
            inputResult = !isNaN(Number(userInput));
            break;
          case 'is_email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            inputResult = emailRegex.test(userInput);
            break;
          case 'min_length':
            inputResult = userInput.length >= (config.minLength || 1);
            break;
          case 'max_length':
            inputResult = userInput.length <= (config.maxLength || 1000);
            break;
        }
        
        return {
          responses: [],
          context: {
            ...context,
            conditionResult: inputResult,
            lastCondition: 'user_input_condition'
          }
        };
      
      default:
        return { responses: [], context };
    }
  }

  private async processActionNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    switch (node.type) {
      case 'set_variable':
        const variableName = config.variableName || '';
        const variableValue = config.value || userInput;
        
        return {
          responses: [],
          context: {
            ...context,
            [variableName]: variableValue
          }
        };
      
      case 'http_request':
        // Placeholder for HTTP request functionality
        const url = config.url || '';
        const method = config.method || 'GET';
        
        // For now, just log the intended request
        console.log(`HTTP ${method} request to ${url} would be made here`);
        
        return {
          responses: [],
          context: {
            ...context,
            lastHttpRequest: { url, method, timestamp: new Date().toISOString() }
          }
        };
      
      case 'save_user_data':
        const dataKey = config.dataKey || 'user_input';
        
        return {
          responses: [],
          context: {
            ...context,
            userData: {
              ...(context.userData || {}),
              [dataKey]: userInput
            }
          }
        };
      
      default:
        return { responses: [], context };
    }
  }

  private async processResponseNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    switch (node.type) {
      case 'text_response':
        let message = config.message || 'Hello!';
        
        // Replace variables in message
        message = this.replaceVariables(message, context);
        
        return {
          responses: [{
            type: 'text',
            content: message
          }],
          context
        };
      
      case 'quick_reply':
        const text = config.message || '';
        const options = config.options || [];
        
        return {
          responses: [{
            type: 'form',
            content: {
              type: 'quick_reply',
              text: this.replaceVariables(text, context),
              options: options.map((opt: any) => ({
                text: opt.text || '',
                value: opt.value || opt.text
              }))
            }
          }],
          context
        };
      
      case 'media_response':
        const mediaUrl = config.mediaUrl || '';
        const mediaType = config.mediaType || 'image';
        const caption = config.caption || '';
        
        return {
          responses: [{
            type: 'media',
            content: {
              type: mediaType,
              url: mediaUrl,
              caption: this.replaceVariables(caption, context)
            }
          }],
          context
        };
      
      case 'form_response':
        const formTitle = config.title || 'Please fill out this form';
        const formFields = config.fields || [];
        
        return {
          responses: [{
            type: 'form',
            content: {
              type: 'form',
              title: formTitle,
              fields: formFields.map((field: any) => ({
                name: field.name || '',
                label: field.label || '',
                type: field.type || 'text',
                required: field.required || false,
                options: field.options || []
              }))
            }
          }],
          context
        };
      
      default:
        return { responses: [], context };
    }
  }

  private async processIntegrationNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    // Placeholder for integration processing
    // In a real implementation, this would handle various integrations
    
    return {
      responses: [],
      context: {
        ...context,
        integrationProcessed: true,
        integrationType: node.type
      }
    };
  }

  private async processAiNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    switch (node.type) {
      case 'gpt_chat':
        // Placeholder for GPT integration
        const prompt = config.prompt || 'You are a helpful assistant.';
        const systemMessage = this.replaceVariables(prompt, context);
        
        // For now, return a simple response
        return {
          responses: [{
            type: 'text',
            content: `AI would respond here based on: "${userInput}"`
          }],
          context: {
            ...context,
            aiProcessed: true,
            aiPrompt: systemMessage
          }
        };
      
      case 'sentiment_analysis':
        // Simple sentiment analysis placeholder
        const sentiment = userInput.toLowerCase().includes('good') || 
                         userInput.toLowerCase().includes('great') || 
                         userInput.toLowerCase().includes('excellent') ? 'positive' :
                         userInput.toLowerCase().includes('bad') || 
                         userInput.toLowerCase().includes('terrible') || 
                         userInput.toLowerCase().includes('awful') ? 'negative' : 'neutral';
        
        return {
          responses: [],
          context: {
            ...context,
            sentiment,
            sentimentAnalyzed: true
          }
        };
      
      default:
        return { responses: [], context };
    }
  }

  private async processFlowControlNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    switch (node.type) {
      case 'delay':
        const delaySeconds = config.seconds || 1;
        // For now, just log the delay - in a real implementation you'd handle this properly
        console.log(`Would delay execution by ${delaySeconds} seconds`);
        
        return {
          responses: [],
          context: {
            ...context,
            delayApplied: delaySeconds
          }
        };
      
      case 'jump_to_flow':
        const targetFlowId = config.flowId || '';
        
        return {
          responses: [],
          context: {
            ...context,
            jumpToFlow: targetFlowId
          },
          shouldStop: true // Stop current flow execution
        };
      
      case 'end_conversation':
        return {
          responses: [{
            type: 'text',
            content: config.message || 'Goodbye!'
          }],
          context,
          shouldStop: true
        };
      
      default:
        return { responses: [], context };
    }
  }

  private async processValidationNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    switch (node.type) {
      case 'email_validation':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = emailRegex.test(userInput);
        
        return {
          responses: isValidEmail ? [] : [{
            type: 'text',
            content: config.errorMessage || 'Please enter a valid email address.'
          }],
          context: {
            ...context,
            emailValidation: isValidEmail,
            validatedEmail: isValidEmail ? userInput : null
          }
        };
      
      case 'phone_validation':
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        const isValidPhone = phoneRegex.test(userInput) && userInput.replace(/\D/g, '').length >= 10;
        
        return {
          responses: isValidPhone ? [] : [{
            type: 'text',
            content: config.errorMessage || 'Please enter a valid phone number.'
          }],
          context: {
            ...context,
            phoneValidation: isValidPhone,
            validatedPhone: isValidPhone ? userInput : null
          }
        };
      
      case 'required_field':
        const isNotEmpty = userInput.trim().length > 0;
        
        return {
          responses: isNotEmpty ? [] : [{
            type: 'text',
            content: config.errorMessage || 'This field is required.'
          }],
          context: {
            ...context,
            requiredFieldValidation: isNotEmpty
          }
        };
      
      default:
        return { responses: [], context };
    }
  }

  private async processAdvancedNode(
    node: SelectChatbotNode,
    context: Record<string, any>,
    userInput: string
  ): Promise<NodeProcessingResult> {
    const config = node.config as any || {};
    
    switch (node.type) {
      case 'custom_code':
        // Placeholder for custom code execution
        // In a real implementation, this would safely execute custom code
        return {
          responses: [],
          context: {
            ...context,
            customCodeExecuted: true
          }
        };
      
      case 'analytics_tracking':
        const eventName = config.eventName || 'chatbot_event';
        const properties = config.properties || {};
        
        // Log analytics event
        console.log(`Analytics event: ${eventName}`, properties);
        
        return {
          responses: [],
          context: {
            ...context,
            analyticsTracked: { eventName, properties }
          }
        };
      
      case 'fallback_to_human':
        return {
          responses: [{
            type: 'text',
            content: config.message || 'Let me connect you with a human agent.'
          }],
          context,
          fallbackToHuman: true,
          shouldStop: true
        };
      
      default:
        return { responses: [], context };
    }
  }

  private replaceVariables(text: string, context: Record<string, any>): string {
    let result = text;
    
    // Replace ${variableName} patterns
    result = result.replace(/\$\{(\w+)\}/g, (match, variableName) => {
      return context[variableName] || match;
    });
    
    // Replace {{variableName}} patterns
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      return context[variableName] || match;
    });
    
    return result;
  }
}