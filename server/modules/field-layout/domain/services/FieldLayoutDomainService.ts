
import { FieldLayout } from '../entities/FieldLayout';

export class FieldLayoutDomainService {
  public validateLayout(layout: any): boolean {
    if (!layout || typeof layout !== 'object') {
      return false;
    }
    
    // Basic layout validation
    return true;
  }

  public canDeactivate(fieldLayout: FieldLayout): boolean {
    // Business logic to determine if layout can be deactivated
    return fieldLayout.isActive;
  }

  public generateLayoutName(tenantId: string, baseName: string): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseName}_${tenantId}_${timestamp}`;
  }
}
