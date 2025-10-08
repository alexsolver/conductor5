import { db } from '../../db';
import { aiConfigurableActions, aiActionFields, aiActionFieldMappings, aiFieldCollectionHistory } from '../../../shared/schema-ai-configurable-actions';
import { eq, and } from 'drizzle-orm';
import axios from 'axios';

interface ExecutionContext {
  tenantId: string;
  userId: string;
  conversationId?: string;
  sessionId?: string;
}

interface CollectedData {
  [key: string]: any;
}

interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  validationErrors?: string[];
}

interface FieldValidationResult {
  isValid: boolean;
  missingFields: string[];
  invalidFields: { field: string; reason: string }[];
}

export class ActionExecutor {
  /**
   * Execute a configured action with collected data
   */
  async executeAction(
    actionId: string,
    collectedData: CollectedData,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    try {
      // 1. Load action configuration
      const action = await db.query.aiConfigurableActions.findFirst({
        where: and(
          eq(aiConfigurableActions.id, actionId),
          eq(aiConfigurableActions.tenantId, context.tenantId)
        ),
      });

      if (!action) {
        return {
          success: false,
          message: 'Ação não encontrada',
          error: 'ACTION_NOT_FOUND'
        };
      }

      // 2. Load field definitions
      const fields = await db.query.aiActionFields.findMany({
        where: eq(aiActionFields.actionId, actionId),
      });

      // 3. Validate collected data
      const validation = this.validateCollectedData(fields, collectedData);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados incompletos ou inválidos',
          validationErrors: [
            ...validation.missingFields.map(f => `Campo obrigatório ausente: ${f}`),
            ...validation.invalidFields.map(f => `${f.field}: ${f.reason}`)
          ]
        };
      }

      // 4. Load field mappings
      const mappings = await db.query.aiActionFieldMappings.findMany({
        where: eq(aiActionFieldMappings.actionId, actionId),
      });

      // 5. Map collected data to API parameters
      const apiParameters = this.mapDataToApiParameters(collectedData, mappings, fields);

      // 6. Execute the action
      let executionResult: any;
      
      if (action.linkedFormId) {
        // Execute through internal form auto-fill
        executionResult = await this.executeViaInternalForm(
          action.linkedFormId,
          apiParameters,
          context
        );
      } else {
        // Execute through direct API call
        executionResult = await this.executeViaDirectApi(
          action.endpointConfig,
          apiParameters,
          context
        );
      }

      // 7. Log execution history
      await this.logExecution(actionId, collectedData, executionResult, context);

      // 8. Generate response message
      const responseMessage = this.generateResponseMessage(
        executionResult.success,
        action.responseTemplates,
        executionResult.data,
        executionResult.error
      );

      return {
        success: executionResult.success,
        message: responseMessage,
        data: executionResult.data,
        error: executionResult.error
      };

    } catch (error: any) {
      console.error('[ACTION-EXECUTOR] Error executing action:', error);
      return {
        success: false,
        message: 'Erro ao executar ação',
        error: error.message
      };
    }
  }

  /**
   * Validate that all required fields are present and valid
   */
  private validateCollectedData(
    fields: any[],
    collectedData: CollectedData
  ): FieldValidationResult {
    const missingFields: string[] = [];
    const invalidFields: { field: string; reason: string }[] = [];

    for (const field of fields) {
      const value = collectedData[field.fieldKey];

      // Check if required field is missing
      if (field.isRequired && (value === undefined || value === null || value === '')) {
        missingFields.push(field.fieldLabel);
        continue;
      }

      // Skip validation if field is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      const typeValidation = this.validateFieldType(field.fieldType, value);
      if (!typeValidation.isValid) {
        invalidFields.push({
          field: field.fieldLabel,
          reason: typeValidation.reason || 'Tipo inválido'
        });
      }
    }

    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields
    };
  }

  /**
   * Validate field type
   */
  private validateFieldType(fieldType: string, value: any): { isValid: boolean; reason?: string } {
    switch (fieldType) {
      case 'string':
      case 'text':
        if (typeof value !== 'string') {
          return { isValid: false, reason: 'Deve ser um texto' };
        }
        break;

      case 'number':
      case 'integer':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, reason: 'Deve ser um número' };
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !value.includes('@')) {
          return { isValid: false, reason: 'Deve ser um email válido' };
        }
        break;

      case 'phone':
        if (typeof value !== 'string' || value.replace(/\D/g, '').length < 10) {
          return { isValid: false, reason: 'Deve ser um telefone válido' };
        }
        break;

      case 'date':
      case 'datetime':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return { isValid: false, reason: 'Deve ser uma data válida' };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, reason: 'Deve ser verdadeiro ou falso' };
        }
        break;

      case 'select':
      case 'multiselect':
        // No strict validation for select fields
        break;

      default:
        // Unknown type, assume valid
        break;
    }

    return { isValid: true };
  }

  /**
   * Map collected data to API parameters using field mappings
   */
  private mapDataToApiParameters(
    collectedData: CollectedData,
    mappings: any[],
    fields: any[]
  ): any {
    const apiParameters: any = {};

    // If no mappings defined, use field keys directly
    if (mappings.length === 0) {
      return collectedData;
    }

    // Apply mappings
    for (const mapping of mappings) {
      const field = fields.find(f => f.id === mapping.fieldId);
      if (!field) continue;

      const value = collectedData[field.fieldKey];
      if (value === undefined) continue;

      // Apply transformation if specified
      let transformedValue = value;
      if (mapping.transformRule) {
        transformedValue = this.applyTransformation(value, mapping.transformRule);
      }

      // Set the mapped value
      this.setNestedValue(apiParameters, mapping.apiParameterPath, transformedValue);
    }

    return apiParameters;
  }

  /**
   * Apply transformation rule to a value
   */
  private applyTransformation(value: any, rule: string): any {
    try {
      // Simple transformation rules
      switch (rule) {
        case 'uppercase':
          return String(value).toUpperCase();
        case 'lowercase':
          return String(value).toLowerCase();
        case 'trim':
          return String(value).trim();
        case 'number':
          return Number(value);
        case 'boolean':
          return Boolean(value);
        case 'date_iso':
          return new Date(value).toISOString();
        default:
          return value;
      }
    } catch (error) {
      console.error('[ACTION-EXECUTOR] Transformation error:', error);
      return value;
    }
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Execute action via internal form auto-fill
   */
  private async executeViaInternalForm(
    formId: string,
    data: any,
    context: ExecutionContext
  ): Promise<any> {
    try {
      // Submit form through internal API
      const response = await axios.post(
        `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/internal-forms/${formId}/submit`,
        {
          formData: data,
          submittedBy: context.userId,
          conversationId: context.conversationId
        },
        {
          headers: {
            'X-Tenant-ID': context.tenantId,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Execute action via direct API call
   */
  private async executeViaDirectApi(
    endpointConfig: any,
    data: any,
    context: ExecutionContext
  ): Promise<any> {
    try {
      const config: any = {
        method: endpointConfig.method || 'POST',
        url: endpointConfig.url,
        headers: {
          'X-Tenant-ID': context.tenantId,
          'Content-Type': 'application/json',
          ...(endpointConfig.headers || {})
        }
      };

      // Add data based on method
      if (['POST', 'PUT', 'PATCH'].includes(config.method)) {
        config.data = data;
      } else if (config.method === 'GET') {
        config.params = data;
      }

      const response = await axios(config);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Log action execution history
   */
  private async logExecution(
    actionId: string,
    collectedData: CollectedData,
    result: any,
    context: ExecutionContext
  ): Promise<void> {
    try {
      await db.insert(aiFieldCollectionHistory).values({
        actionId,
        tenantId: context.tenantId,
        userId: context.userId,
        conversationId: context.conversationId,
        sessionId: context.sessionId,
        collectedData,
        executionResult: result,
        status: result.success ? 'success' : 'failed',
        collectionStrategy: 'hybrid', // Could be determined dynamically
        completedAt: new Date()
      });
    } catch (error) {
      console.error('[ACTION-EXECUTOR] Error logging execution:', error);
      // Don't fail the action if logging fails
    }
  }

  /**
   * Generate response message using template
   */
  private generateResponseMessage(
    success: boolean,
    templates: any,
    data?: any,
    error?: string
  ): string {
    let template = success ? templates.success : templates.error;

    // Replace variables in template
    if (data) {
      template = this.replaceTemplateVariables(template, data);
    }

    if (error) {
      template = template.replace('{error}', error);
    }

    return template;
  }

  /**
   * Replace template variables with actual data
   */
  private replaceTemplateVariables(template: string, data: any): string {
    let result = template;

    // Replace {variable} patterns
    const matches = template.match(/\{([^}]+)\}/g);
    if (matches) {
      for (const match of matches) {
        const key = match.slice(1, -1); // Remove { }
        const value = this.getNestedValue(data, key);
        if (value !== undefined) {
          result = result.replace(match, String(value));
        }
      }
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Get missing fields for an action
   */
  async getMissingFields(
    actionId: string,
    collectedData: CollectedData,
    tenantId: string
  ): Promise<any[]> {
    const fields = await db.query.aiActionFields.findMany({
      where: and(
        eq(aiActionFields.actionId, actionId),
        eq(aiActionFields.tenantId, tenantId)
      ),
    });

    const missingFields = fields.filter((field: any) => {
      if (!field.isRequired) return false;
      
      const value = collectedData[field.fieldKey];
      return value === undefined || value === null || value === '';
    });

    return missingFields;
  }
}

// Export singleton instance
export const actionExecutor = new ActionExecutor();
