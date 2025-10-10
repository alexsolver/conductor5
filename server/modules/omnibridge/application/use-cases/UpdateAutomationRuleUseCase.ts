
import { IAutomationRuleRepository } from '../../domain/repositories/IAutomationRuleRepository';
import { AutomationRule } from '../../domain/entities/AutomationRule';

export interface UpdateAutomationRuleDTO {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  priority?: number;
  conditions?: any;
  triggers?: any[];
  actions?: any[];
  tags?: string[];
}

export class UpdateAutomationRuleUseCase {
  constructor(private automationRuleRepository: IAutomationRuleRepository) {}

  async execute(ruleId: string, tenantId: string, userId: string, data: UpdateAutomationRuleDTO): Promise<AutomationRule> {
    console.log(`🔧 [UpdateAutomationRuleUseCase] Updating automation rule: ${ruleId}`);

    const existingRule = await this.automationRuleRepository.findById(ruleId, tenantId);
    if (!existingRule) {
      throw new Error('Automation rule not found');
    }

    // Convert DTO to update data format
    const updateData: Partial<AutomationRule> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isEnabled !== undefined) updateData.enabled = data.isEnabled;
    if (data.priority !== undefined) updateData.priority = data.priority;
    
    // Handle conditions/triggers conversion
    console.log(`🔍 [UpdateAutomationRuleUseCase] Received data:`, JSON.stringify({
      hasConditions: !!data.conditions,
      hasTriggers: !!data.triggers,
      hasActions: !!data.actions
    }, null, 2));
    
    // ✅ 1QA.MD: Handle both conditions and triggers formats for compatibility
    if (data.conditions !== undefined) {
      updateData.conditions = data.conditions;
      updateData.trigger = data.conditions; // Maintain compatibility
      console.log(`🔧 [UpdateAutomationRuleUseCase] Using conditions format:`, JSON.stringify(data.conditions, null, 2));
    } else if (data.triggers !== undefined) {
      // Convert triggers format to conditions format
      // Frontend sends: triggers: [{ type: 'condition_met', conditions: {...} }]
      console.log(`🔍 [UpdateAutomationRuleUseCase] RAW triggers data:`, JSON.stringify(data.triggers, null, 2));
      const firstTrigger = data.triggers[0];
      console.log(`🔍 [UpdateAutomationRuleUseCase] First trigger:`, JSON.stringify(firstTrigger, null, 2));
      console.log(`🔍 [UpdateAutomationRuleUseCase] Has conditions?:`, !!firstTrigger?.conditions);
      
      if (firstTrigger?.conditions) {
        // Use conditions from inside the trigger
        updateData.conditions = firstTrigger.conditions;
        updateData.trigger = firstTrigger.conditions;
        console.log(`✅ [UpdateAutomationRuleUseCase] Extracted conditions from triggers:`, JSON.stringify(firstTrigger.conditions, null, 2));
      } else {
        // Legacy format with config
        const convertedConditions = {
          rules: data.triggers.map(trigger => ({
            field: trigger.config?.field || 'content',
            operator: trigger.config?.operator || 'contains',
            value: trigger.config?.value || trigger.config?.keywords || '',
            logicalOperator: 'AND'
          })),
          logicalOperator: 'AND'
        };
        updateData.conditions = convertedConditions;
        updateData.trigger = convertedConditions;
        console.log(`⚠️ [UpdateAutomationRuleUseCase] Converted legacy triggers to conditions:`, JSON.stringify(convertedConditions, null, 2));
      }
    }
    
    // ✅ 1QA.MD: Properly handle actions with UI metadata preservation
    if (data.actions !== undefined) {
      console.log(`🔍 [UpdateAutomationRuleUseCase] RAW actions data:`, JSON.stringify(data.actions, null, 2));
      updateData.actions = data.actions.map(action => {
        console.log(`🔍 [UpdateAutomationRuleUseCase] Processing action:`, {
          type: action.type,
          hasParameters: !!action.parameters,
          hasConfig: !!action.config,
          parameters: action.parameters,
          config: action.config
        });
        
        // Preserve action structure from frontend
        // Frontend sends 'parameters', we save as 'config'
        const mappedAction = {
          id: action.id || `action-${Date.now()}`,
          type: action.type,
          name: action.name,
          description: action.description,
          icon: action.icon,
          color: action.color,
          config: action.parameters || action.config || {},  // ✅ Frontend sends 'parameters'
          priority: action.priority || 1
        };
        console.log(`✅ [UpdateAutomationRuleUseCase] Mapped action:`, mappedAction);
        return mappedAction;
      });
    }

    const result = await this.automationRuleRepository.update(ruleId, tenantId, updateData);

    console.log(`✅ [UpdateAutomationRuleUseCase] Updated automation rule: ${ruleId}`);

    return result;
  }
}
