import { 
  SelectChatbotForm, 
  InsertChatbotForm,
  SelectChatbotFormField, 
  InsertChatbotFormField
} from '../../../../../shared/schema-chatbot';

export interface IChatbotFormRepository {
  // Form CRUD operations
  createForm(form: InsertChatbotForm): Promise<SelectChatbotForm>;
  findFormById(id: string): Promise<SelectChatbotForm | null>;
  findFormByNode(nodeId: string): Promise<SelectChatbotForm | null>;
  updateForm(id: string, updates: Partial<SelectChatbotForm>): Promise<SelectChatbotForm | null>;
  deleteForm(id: string): Promise<boolean>;
  
  // Form field CRUD operations
  createField(field: InsertChatbotFormField): Promise<SelectChatbotFormField>;
  createFields(fields: InsertChatbotFormField[]): Promise<SelectChatbotFormField[]>;
  findFieldById(id: string): Promise<SelectChatbotFormField | null>;
  findFieldsByForm(formId: string): Promise<SelectChatbotFormField[]>;
  updateField(id: string, updates: Partial<SelectChatbotFormField>): Promise<SelectChatbotFormField | null>;
  deleteField(id: string): Promise<boolean>;
  deleteFieldsByForm(formId: string): Promise<boolean>;
  
  // Form with fields
  findFormWithFields(formId: string): Promise<{
    form: SelectChatbotForm;
    fields: SelectChatbotFormField[];
  } | null>;
  
  findFormWithFieldsByNode(nodeId: string): Promise<{
    form: SelectChatbotForm;
    fields: SelectChatbotFormField[];
  } | null>;
  
  // Field ordering
  reorderFields(formId: string, fieldOrders: { id: string; order: number }[]): Promise<boolean>;
  
  // Validation
  validateFormStructure(formId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
  
  // Field types
  findFieldsByType(formId: string, fieldType: string): Promise<SelectChatbotFormField[]>;
  
  // Required fields
  findRequiredFields(formId: string): Promise<SelectChatbotFormField[]>;
}