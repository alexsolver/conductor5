import OpenAI from 'openai';
import { db } from '../../db';
import { aiConfigurableActions, aiActionFields } from '../../../shared/schema-ai-configurable-actions';
import { eq, and } from 'drizzle-orm';

interface ExtractionContext {
  conversationHistory?: Array<{ role: string; content: string }>;
  previouslyExtractedData?: Record<string, any>;
  userMessage: string;
}

interface FieldExtractionResult {
  fieldKey: string;
  value: any;
  confidence: number;
  extractionMethod: 'direct' | 'inferred' | 'contextual';
  reasoning?: string;
}

interface EntityExtractionResult {
  success: boolean;
  extractedFields: FieldExtractionResult[];
  missingFields: string[];
  overallConfidence: number;
  needsInteractivePrompt: boolean;
  suggestedFollowUp?: string;
}

export class EntityExtractor {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey || process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Extract entities from conversation for a specific action
   */
  async extractForAction(
    actionId: string,
    context: ExtractionContext,
    tenantId: string
  ): Promise<EntityExtractionResult> {
    try {
      // 1. Load action and fields configuration
      const action = await db.query.aiConfigurableActions.findFirst({
        where: and(
          eq(aiConfigurableActions.id, actionId),
          eq(aiConfigurableActions.tenantId, tenantId)
        ),
      });

      if (!action) {
        throw new Error('Action not found');
      }

      const fields = await db.query.aiActionFields.findMany({
        where: eq(aiActionFields.actionId, actionId),
      });

      // 2. Use OpenAI Function Calling to extract entities
      const extractedFields = await this.extractUsingOpenAI(
        action,
        fields,
        context
      );

      // 3. Calculate confidence scores
      const overallConfidence = this.calculateOverallConfidence(extractedFields);

      // 4. Identify missing required fields
      const missingFields = this.identifyMissingFields(fields, extractedFields);

      // 5. Determine if interactive prompting is needed
      const needsInteractivePrompt = 
        missingFields.length > 0 ||
        overallConfidence < 0.7 ||
        extractedFields.some(f => f.confidence < 0.6);

      // 6. Generate follow-up suggestion
      const suggestedFollowUp = needsInteractivePrompt
        ? this.generateFollowUpPrompt(missingFields, fields)
        : undefined;

      return {
        success: true,
        extractedFields,
        missingFields,
        overallConfidence,
        needsInteractivePrompt,
        suggestedFollowUp
      };

    } catch (error: any) {
      console.error('[ENTITY-EXTRACTOR] Error:', error);
      return {
        success: false,
        extractedFields: [],
        missingFields: [],
        overallConfidence: 0,
        needsInteractivePrompt: true,
        suggestedFollowUp: 'Desculpe, não consegui entender. Pode fornecer mais detalhes?'
      };
    }
  }

  /**
   * Extract entities using OpenAI Function Calling
   */
  private async extractUsingOpenAI(
    action: any,
    fields: any[],
    context: ExtractionContext
  ): Promise<FieldExtractionResult[]> {
    if (!this.openai) {
      // Fallback to pattern matching if OpenAI is not available
      return this.extractUsingPatterns(fields, context);
    }

    try {
      // Build function schema for OpenAI
      const functionSchema = this.buildFunctionSchema(action, fields);

      // Build conversation messages
      const messages = this.buildMessages(action, context);

      // Call OpenAI with function calling
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        functions: [functionSchema],
        function_call: { name: functionSchema.name },
        temperature: 0.1 // Low temperature for more deterministic extraction
      });

      const functionCall = response.choices[0]?.message?.function_call;
      
      if (!functionCall || !functionCall.arguments) {
        return this.extractUsingPatterns(fields, context);
      }

      // Parse extracted data
      const extractedData = JSON.parse(functionCall.arguments);

      // Convert to FieldExtractionResult array with confidence scores
      const results: FieldExtractionResult[] = [];

      for (const field of fields) {
        const value = extractedData[field.fieldKey];
        
        if (value !== undefined && value !== null && value !== '') {
          results.push({
            fieldKey: field.fieldKey,
            value,
            confidence: this.calculateFieldConfidence(value, field, context),
            extractionMethod: 'direct',
            reasoning: `Extracted from user message using OpenAI`
          });
        }
      }

      return results;

    } catch (error) {
      console.error('[ENTITY-EXTRACTOR] OpenAI error:', error);
      return this.extractUsingPatterns(fields, context);
    }
  }

  /**
   * Build OpenAI function schema from action fields
   */
  private buildFunctionSchema(action: any, fields: any[]): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const field of fields) {
      properties[field.fieldKey] = {
        type: this.mapFieldTypeToJsonType(field.fieldType),
        description: field.fieldDescription || field.fieldLabel
      };

      if (field.isRequired) {
        required.push(field.fieldKey);
      }
    }

    return {
      name: `extract_${action.actionKey}_data`,
      description: action.description || `Extract data for ${action.name}`,
      parameters: {
        type: 'object',
        properties,
        required
      }
    };
  }

  /**
   * Map Drizzle field type to JSON Schema type
   */
  private mapFieldTypeToJsonType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'text': 'string',
      'number': 'number',
      'integer': 'integer',
      'boolean': 'boolean',
      'date': 'string',
      'datetime': 'string',
      'email': 'string',
      'phone': 'string',
      'select': 'string',
      'multiselect': 'array'
    };

    return typeMap[fieldType] || 'string';
  }

  /**
   * Build conversation messages for OpenAI
   */
  private buildMessages(action: any, context: ExtractionContext): any[] {
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a data extraction assistant. Extract structured data from the user's message for the action: ${action.name}. 
Be precise and extract only what is explicitly mentioned. If information is ambiguous or missing, leave it empty.
Pay attention to dates, times, and numeric values. Convert relative dates (today, tomorrow) to specific dates.`
      }
    ];

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      messages.push(...context.conversationHistory.slice(-5)); // Last 5 messages
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: context.userMessage
    });

    return messages;
  }

  /**
   * Fallback pattern-based extraction
   */
  private extractUsingPatterns(
    fields: any[],
    context: ExtractionContext
  ): FieldExtractionResult[] {
    const results: FieldExtractionResult[] = [];
    const message = context.userMessage.toLowerCase();

    for (const field of fields) {
      let value: any = null;
      let confidence = 0;

      switch (field.fieldType) {
        case 'email':
          const emailMatch = context.userMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) {
            value = emailMatch[1];
            confidence = 0.95;
          }
          break;

        case 'phone':
          const phoneMatch = context.userMessage.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/);
          if (phoneMatch) {
            value = phoneMatch[0].replace(/[^\d+]/g, '');
            confidence = 0.9;
          }
          break;

        case 'number':
        case 'integer':
          const numberMatch = context.userMessage.match(/\b(\d+(?:\.\d+)?)\b/);
          if (numberMatch) {
            value = field.fieldType === 'integer' ? parseInt(numberMatch[1]) : parseFloat(numberMatch[1]);
            confidence = 0.7;
          }
          break;

        case 'date':
        case 'datetime':
          // Simple date pattern matching
          if (message.includes('hoje')) {
            value = new Date().toISOString();
            confidence = 0.9;
          } else if (message.includes('amanhã') || message.includes('amanha')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            value = tomorrow.toISOString();
            confidence = 0.9;
          }
          break;
      }

      if (value !== null) {
        results.push({
          fieldKey: field.fieldKey,
          value,
          confidence,
          extractionMethod: 'direct',
          reasoning: 'Extracted using pattern matching'
        });
      }
    }

    return results;
  }

  /**
   * Calculate confidence score for a field
   */
  private calculateFieldConfidence(
    value: any,
    field: any,
    context: ExtractionContext
  ): number {
    let confidence = 0.8; // Base confidence for OpenAI extraction

    // Reduce confidence if value seems generic
    if (typeof value === 'string') {
      if (value.length < 2) confidence -= 0.3;
      if (value === 'yes' || value === 'no') confidence -= 0.1;
    }

    // Increase confidence if field was previously mentioned
    if (context.previouslyExtractedData && context.previouslyExtractedData[field.fieldKey]) {
      confidence += 0.1;
    }

    // Cap between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate overall confidence from all extracted fields
   */
  private calculateOverallConfidence(results: FieldExtractionResult[]): number {
    if (results.length === 0) return 0;

    const sum = results.reduce((acc, r) => acc + r.confidence, 0);
    return sum / results.length;
  }

  /**
   * Identify missing required fields
   */
  private identifyMissingFields(
    fields: any[],
    extractedFields: FieldExtractionResult[]
  ): string[] {
    const extractedKeys = new Set(extractedFields.map(f => f.fieldKey));
    
    return fields
      .filter(f => f.isRequired && !extractedKeys.has(f.fieldKey))
      .map(f => f.fieldKey);
  }

  /**
   * Generate follow-up prompt for missing fields
   */
  private generateFollowUpPrompt(
    missingFields: string[],
    allFields: any[]
  ): string {
    if (missingFields.length === 0) {
      return 'Dados coletados com sucesso!';
    }

    const missingFieldObjects = allFields.filter(f => 
      missingFields.includes(f.fieldKey)
    );

    if (missingFieldObjects.length === 1) {
      const field = missingFieldObjects[0];
      return `Para continuar, preciso saber: ${field.fieldLabel.toLowerCase()}`;
    }

    const fieldLabels = missingFieldObjects
      .slice(0, 3)
      .map(f => f.fieldLabel.toLowerCase())
      .join(', ');

    return `Ainda preciso de algumas informações: ${fieldLabels}`;
  }
}

// Export singleton instance
export const entityExtractor = new EntityExtractor();
