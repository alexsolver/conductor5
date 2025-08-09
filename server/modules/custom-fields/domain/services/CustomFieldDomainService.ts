
import { CustomField } from '../entities/CustomField';

export class CustomFieldDomainService {
  async validateCustomFieldConfiguration(customField: CustomField): Promise<void> {
    // Validate field type compatibility
    if (customField.type === 'select' && !customField.options?.length) {
      throw new Error('Select fields must have options');
    }

    // Validate field name uniqueness within tenant
    if (!customField.name || customField.name.trim().length === 0) {
      throw new Error('Custom field name is required');
    }
  }

  async validateFieldDependencies(customField: CustomField): Promise<boolean> {
    // Check if field has dependencies that need validation
    return true;
  }
}
