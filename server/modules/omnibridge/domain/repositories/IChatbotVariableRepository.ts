import { 
  SelectChatbotVariable, 
  InsertChatbotVariable, 
  UpdateChatbotVariable
} from '../../../../../shared/schema-chatbot';

export interface IChatbotVariableRepository {
  // Basic CRUD operations
  create(variable: InsertChatbotVariable): Promise<SelectChatbotVariable>;
  createMany(variables: InsertChatbotVariable[]): Promise<SelectChatbotVariable[]>;
  findById(id: string): Promise<SelectChatbotVariable | null>;
  findByFlow(flowId: string): Promise<SelectChatbotVariable[]>;
  findByKey(flowId: string, key: string): Promise<SelectChatbotVariable | null>;
  findByScope(flowId: string, scope: string): Promise<SelectChatbotVariable[]>;
  update(id: string, updates: UpdateChatbotVariable): Promise<SelectChatbotVariable | null>;
  delete(id: string): Promise<boolean>;
  deleteByFlow(flowId: string): Promise<boolean>;
  
  // Variable management
  findRequired(flowId: string): Promise<SelectChatbotVariable[]>;
  findByType(flowId: string, valueType: string): Promise<SelectChatbotVariable[]>;
  
  // Validation
  validateVariableKey(flowId: string, key: string, excludeId?: string): Promise<{
    isUnique: boolean;
    existing?: SelectChatbotVariable;
  }>;
  
  // Default values
  getDefaultValues(flowId: string): Promise<Record<string, any>>;
}