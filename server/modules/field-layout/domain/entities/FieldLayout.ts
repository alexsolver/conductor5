/**
 * Field Layout Domain Entity
 * Clean Architecture - Domain Layer
 * 
 * @module FieldLayoutEntity
 * @created 2025-08-12 - Phase 21 Clean Architecture Implementation
 */

export interface FieldLayout {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  module: string; // tickets, customers, beneficiaries, etc.
  sections: FieldLayoutSection[];
  settings: FieldLayoutSettings;
  metadata: FieldLayoutMetadata;
  isDefault: boolean;
  isSystem: boolean;
  status: 'active' | 'inactive' | 'draft';
  version: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface FieldLayoutSection {
  id: string;
  name: string;
  label: string;
  description?: string;
  order: number;
  columns: number; // 1, 2, 3, 4
  collapsible: boolean;
  collapsed: boolean;
  conditional?: SectionConditional;
  styling: SectionStyling;
  fields: FieldLayoutItem[];
  permissions: SectionPermission[];
}

export interface FieldLayoutItem {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldType: string;
  position: FieldPosition;
  sizing: FieldSizing;
  styling: FieldStyling;
  behavior: FieldBehavior;
  validation?: FieldValidation;
  conditional?: FieldConditional;
  helpText?: string;
  placeholder?: string;
  defaultValue?: any;
}

export interface FieldPosition {
  section: string;
  row: number;
  column: number;
  colspan: number; // how many columns to span
  order: number;
}

export interface FieldSizing {
  width: 'auto' | 'full' | 'half' | 'third' | 'quarter' | 'custom';
  customWidth?: string; // CSS width value
  height: 'auto' | 'small' | 'medium' | 'large' | 'custom';
  customHeight?: string; // CSS height value
  minWidth?: string;
  maxWidth?: string;
}

export interface FieldStyling {
  labelPosition: 'top' | 'left' | 'inline' | 'hidden';
  labelWidth?: string; // for left-positioned labels
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  customCss?: string;
  className?: string;
}

export interface FieldBehavior {
  required: boolean;
  readonly: boolean;
  disabled: boolean;
  hidden: boolean;
  focusable: boolean;
  tabIndex?: number;
  autoFocus: boolean;
  clearable: boolean; // for inputs with clear button
  searchable: boolean; // for select fields
}

export interface FieldValidation {
  rules: ValidationRule[];
  errorMessages: Record<string, string>;
  validateOnBlur: boolean;
  validateOnChange: boolean;
  showInlineErrors: boolean;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 'email' | 'phone' | 'cpf' | 'cnpj';
  value?: any;
  message: string;
  customValidator?: string; // function name or code
}

export interface FieldConditional {
  dependsOn: string[]; // field names this field depends on
  conditions: ConditionalRule[];
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
  logicalOperator: 'AND' | 'OR';
}

export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface SectionConditional {
  dependsOn: string[];
  conditions: ConditionalRule[];
  action: 'show' | 'hide';
  logicalOperator: 'AND' | 'OR';
}

export interface SectionStyling {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  headerColor?: string;
  headerBackground?: string;
  customCss?: string;
  className?: string;
}

export interface SectionPermission {
  roleId: string;
  roleName: string;
  permissions: ('view' | 'edit' | 'hide')[];
  grantedBy: string;
  grantedAt: Date;
}

export interface FieldLayoutSettings {
  responsive: boolean;
  mobileLayout?: MobileLayoutSettings;
  tabletLayout?: TabletLayoutSettings;
  accessibility: AccessibilitySettings;
  performance: PerformanceSettings;
  validation: ValidationSettings;
}

export interface MobileLayoutSettings {
  stackSections: boolean;
  columnsToSingle: boolean;
  hiddenFields: string[]; // fields to hide on mobile
  collapseSections: boolean;
  showLabelsInline: boolean;
}

export interface TabletLayoutSettings {
  maxColumns: number;
  adaptiveSpacing: boolean;
  adjustFontSize: boolean;
  compactMode: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  ariaLabels: boolean;
  focusIndicators: boolean;
}

export interface PerformanceSettings {
  lazyLoading: boolean;
  virtualScrolling: boolean;
  deferredRendering: boolean;
  cacheLayout: boolean;
  optimizeImages: boolean;
}

export interface ValidationSettings {
  validateOnMount: boolean;
  showValidationSummary: boolean;
  groupValidationErrors: boolean;
  highlightInvalidFields: boolean;
  scrollToFirstError: boolean;
}

export interface FieldLayoutMetadata {
  version: string;
  author: string;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  changeLog: LayoutChangeEntry[];
  usage: LayoutUsageStats;
  performance: LayoutPerformanceStats;
  compatibility: CompatibilityInfo;
}

export interface LayoutChangeEntry {
  id: string;
  version: string;
  changes: string;
  changedBy: string;
  changedAt: Date;
  changeType: 'major' | 'minor' | 'patch' | 'config';
  affectedSections: string[];
  affectedFields: string[];
}

export interface LayoutUsageStats {
  usageCount: number;
  lastUsed?: Date;
  popularSections: string[];
  problematicFields: string[];
  userFeedback: LayoutFeedback[];
  performanceIssues: string[];
}

export interface LayoutPerformanceStats {
  averageRenderTime: number;
  averageLoadTime: number;
  memoryUsage: number;
  fieldCount: number;
  sectionCount: number;
  complexityScore: number;
}

export interface CompatibilityInfo {
  browserSupport: string[];
  mobileSupport: boolean;
  accessibilityLevel: 'A' | 'AA' | 'AAA';
  supportedThemes: string[];
  requiredFeatures: string[];
}

export interface LayoutFeedback {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  category: 'usability' | 'performance' | 'design' | 'accessibility' | 'bugs';
  submittedAt: Date;
  resolved: boolean;
  response?: string;
}

/**
 * Field Layout Business Rules and Domain Service
 */
export class FieldLayoutDomainService {
  
  /**
   * Validate field layout structure and configuration
   */
  static validateLayout(layout: Partial<FieldLayout>): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!layout.name) errors.push('Layout name is required');
    if (!layout.module) errors.push('Module is required');
    if (!layout.tenantId) errors.push('Tenant ID is required');

    // Name validation
    if (layout.name && layout.name.length < 3) {
      errors.push('Layout name must be at least 3 characters');
    }
    if (layout.name && layout.name.length > 100) {
      errors.push('Layout name must be no more than 100 characters');
    }

    // Sections validation
    if (layout.sections) {
      if (layout.sections.length === 0) {
        warnings.push('Layout has no sections defined');
      }

      const sectionNames = layout.sections.map(s => s.name);
      const duplicateSections = sectionNames.filter((name, index) => sectionNames.indexOf(name) !== index);
      if (duplicateSections.length > 0) {
        errors.push(`Duplicate section names: ${duplicateSections.join(', ')}`);
      }

      layout.sections.forEach((section, sectionIndex) => {
        if (!section.name) {
          errors.push(`Section ${sectionIndex + 1}: name is required`);
        }
        if (!section.label) {
          errors.push(`Section ${sectionIndex + 1}: label is required`);
        }
        if (section.columns < 1 || section.columns > 4) {
          errors.push(`Section ${section.name}: columns must be between 1 and 4`);
        }

        // Validate fields within section
        if (section.fields) {
          const fieldNames = section.fields.map(f => f.fieldName);
          const duplicateFields = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
          if (duplicateFields.length > 0) {
            errors.push(`Section ${section.name}: duplicate field names: ${duplicateFields.join(', ')}`);
          }

          section.fields.forEach((field, fieldIndex) => {
            if (!field.fieldName) {
              errors.push(`Section ${section.name}, field ${fieldIndex + 1}: fieldName is required`);
            }
            if (!field.fieldType) {
              errors.push(`Section ${section.name}, field ${fieldIndex + 1}: fieldType is required`);
            }

            // Validate field position
            if (field.position) {
              if (field.position.column > section.columns) {
                errors.push(`Section ${section.name}, field ${field.fieldName}: column ${field.position.column} exceeds section columns ${section.columns}`);
              }
              if (field.position.colspan > section.columns) {
                warnings.push(`Section ${section.name}, field ${field.fieldName}: colspan ${field.position.colspan} exceeds section columns ${section.columns}`);
              }
            }

            // Validate conditional logic
            if (field.conditional) {
              field.conditional.dependsOn.forEach(depField => {
                const exists = layout.sections?.some(s => 
                  s.fields.some(f => f.fieldName === depField)
                );
                if (!exists) {
                  warnings.push(`Field ${field.fieldName}: depends on non-existent field ${depField}`);
                }
              });
            }
          });
        }
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Calculate layout complexity score
   */
  static calculateComplexityScore(layout: FieldLayout): number {
    let score = 0;
    
    // Base score for sections
    score += layout.sections.length * 5;
    
    // Score for fields
    const totalFields = layout.sections.reduce((sum, section) => sum + section.fields.length, 0);
    score += totalFields * 3;

    // Complexity for field types and features
    layout.sections.forEach(section => {
      section.fields.forEach(field => {
        // Field type complexity
        switch (field.fieldType) {
          case 'text':
          case 'number':
            score += 1;
            break;
          case 'textarea':
          case 'email':
          case 'phone':
            score += 2;
            break;
          case 'select':
          case 'radio':
          case 'date':
            score += 3;
            break;
          case 'multiselect':
          case 'checkbox':
          case 'datetime':
            score += 4;
            break;
          case 'file':
          case 'rich_text':
            score += 5;
            break;
        }

        // Additional complexity for features
        if (field.validation?.rules?.length) score += field.validation.rules.length * 2;
        if (field.conditional) score += 3;
        if (field.styling?.customCss) score += 2;
        if (field.behavior?.readonly || field.behavior?.disabled) score += 1;
      });

      // Section complexity
      if (section.conditional) score += 3;
      if (section.collapsible) score += 1;
      if (section.columns > 2) score += 2;
    });

    // Layout settings complexity
    if (layout.settings.responsive) score += 5;
    if (layout.settings.accessibility.screenReaderOptimized) score += 3;
    if (layout.settings.performance.virtualScrolling) score += 4;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Generate responsive breakpoints for layout
   */
  static generateResponsiveConfig(layout: FieldLayout): {
    desktop: any;
    tablet: any;
    mobile: any;
  } {
    const config = {
      desktop: {
        sections: layout.sections.map(section => ({
          ...section,
          columns: section.columns
        }))
      },
      tablet: {
        sections: layout.sections.map(section => ({
          ...section,
          columns: Math.min(section.columns, layout.settings.tabletLayout?.maxColumns || 2)
        }))
      },
      mobile: {
        sections: layout.sections.map(section => ({
          ...section,
          columns: layout.settings.mobileLayout?.columnsToSingle ? 1 : section.columns,
          fields: section.fields.filter(field => 
            !layout.settings.mobileLayout?.hiddenFields?.includes(field.fieldName)
          )
        }))
      }
    };

    return config;
  }

  /**
   * Validate field layout permissions for user role
   */
  static hasLayoutPermission(layout: FieldLayout, userRole: string, action: 'view' | 'edit' | 'delete' | 'manage'): boolean {
    // System admin has all permissions
    if (userRole === 'saas_admin' || userRole === 'tenant_admin') {
      return true;
    }

    // Check if user is the creator
    if (action === 'edit' || action === 'delete') {
      // Would need to check user ID against createdBy
      // For now, allow edit for admin roles
      return ['admin', 'manager'].includes(userRole);
    }

    // View permission is generally allowed for active layouts
    if (action === 'view') {
      return layout.status === 'active';
    }

    return false;
  }

  /**
   * Check if layout is compatible with module
   */
  static isCompatibleWithModule(layout: FieldLayout, moduleFields: string[]): {
    compatible: boolean;
    missingFields: string[];
    unusedFields: string[];
  } {
    const layoutFields = layout.sections.flatMap(section => 
      section.fields.map(field => field.fieldName)
    );

    const missingFields = layoutFields.filter(field => !moduleFields.includes(field));
    const unusedFields = moduleFields.filter(field => !layoutFields.includes(field));

    return {
      compatible: missingFields.length === 0,
      missingFields,
      unusedFields
    };
  }

  /**
   * Optimize layout for performance
   */
  static optimizeLayout(layout: FieldLayout): {
    optimizedLayout: FieldLayout;
    optimizations: string[];
  } {
    const optimizations: string[] = [];
    const optimizedLayout = { ...layout };

    // Enable lazy loading if many fields
    const totalFields = layout.sections.reduce((sum, section) => sum + section.fields.length, 0);
    if (totalFields > 20 && !layout.settings.performance.lazyLoading) {
      optimizedLayout.settings.performance.lazyLoading = true;
      optimizations.push('Enabled lazy loading for large form');
    }

    // Enable virtual scrolling for many sections
    if (layout.sections.length > 10 && !layout.settings.performance.virtualScrolling) {
      optimizedLayout.settings.performance.virtualScrolling = true;
      optimizations.push('Enabled virtual scrolling for many sections');
    }

    // Optimize validation settings
    if (!layout.settings.validation.validateOnMount) {
      optimizedLayout.settings.validation.validateOnMount = false;
      optimizedLayout.settings.validation.validateOnBlur = true;
      optimizations.push('Optimized validation to run on blur instead of mount');
    }

    // Enable caching
    if (!layout.settings.performance.cacheLayout) {
      optimizedLayout.settings.performance.cacheLayout = true;
      optimizations.push('Enabled layout caching');
    }

    return { optimizedLayout, optimizations };
  }

  /**
   * Generate accessibility report
   */
  static generateAccessibilityReport(layout: FieldLayout): {
    score: number;
    level: 'A' | 'AA' | 'AAA' | 'Non-compliant';
    issues: string[];
    recommendations: string[];
  } {
    let score = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check basic accessibility features
    if (layout.settings.accessibility.ariaLabels) score += 20;
    else issues.push('ARIA labels not enabled');

    if (layout.settings.accessibility.keyboardNavigation) score += 20;
    else issues.push('Keyboard navigation not enabled');

    if (layout.settings.accessibility.focusIndicators) score += 15;
    else recommendations.push('Enable focus indicators for better navigation');

    if (layout.settings.accessibility.screenReaderOptimized) score += 25;
    else recommendations.push('Enable screen reader optimization');

    // Check field-level accessibility
    layout.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.behavior.required && !field.validation?.rules?.some(r => r.type === 'required')) {
          issues.push(`Required field ${field.fieldName} should have required validation rule`);
        }

        if (!field.helpText && field.fieldType === 'file') {
          recommendations.push(`Add help text for file field ${field.fieldName}`);
        }
      });
    });

    // Determine compliance level
    let level: 'A' | 'AA' | 'AAA' | 'Non-compliant';
    if (score >= 90) level = 'AAA';
    else if (score >= 70) level = 'AA';
    else if (score >= 50) level = 'A';
    else level = 'Non-compliant';

    return { score, level, issues, recommendations };
  }
}