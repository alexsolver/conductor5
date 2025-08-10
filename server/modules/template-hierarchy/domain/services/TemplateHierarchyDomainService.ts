
<line_number>1</line_number>
import { TemplateHierarchy } from '../entities/TemplateHierarchy';

export class TemplateHierarchyDomainService {
  validateHierarchy(hierarchy: TemplateHierarchy): boolean {
    // Validate hierarchy structure
    if (!hierarchy.templateId) {
      throw new Error('Template ID is required');
    }

    // Prevent circular references
    if (hierarchy.parentId === hierarchy.id) {
      throw new Error('Template cannot be its own parent');
    }

    return true;
  }

  calculateDepth(hierarchy: TemplateHierarchy, allHierarchies: TemplateHierarchy[]): number {
    let depth = 0;
    let currentParentId = hierarchy.parentId;

    while (currentParentId) {
      const parent = allHierarchies.find(h => h.id === currentParentId);
      if (!parent) break;
      
      depth++;
      currentParentId = parent.parentId;

      // Prevent infinite loops
      if (depth > 100) {
        throw new Error('Hierarchy depth exceeds maximum allowed');
      }
    }

    return depth;
  }
}
