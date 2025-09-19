import { AutomationAction } from '../entities/AutomationRule';
import { MessageAnalysis } from './IAIAnalysisPort';

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ActionExecutionContext {
  tenantId: string;
  messageData: any;
  aiAnalysis?: MessageAnalysis;
  ruleId: string;
  ruleName: string;
}

export interface IActionExecutorPort {
  execute(action: AutomationAction, context: ActionExecutionContext): Promise<ActionExecutionResult>;
  executeActions(actions: AutomationAction[], context: ActionExecutionContext): Promise<ActionExecutionResult[]>;
  canExecute(actionType: string): boolean;
}