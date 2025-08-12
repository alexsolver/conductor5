/**
 * Create Field Layout Use Case
 * Clean Architecture - Application Layer
 * 
 * @module CreateFieldLayoutUseCase
 * @created 2025-08-12 - Phase 21 Clean Architecture Implementation
 */

import { IFieldLayoutRepository } from '../../domain/repositories/IFieldLayoutRepository';
import { FieldLayout, FieldLayoutDomainService, FieldLayoutSection, FieldLayoutItem } from '../../domain/entities/FieldLayout';

export interface CreateFieldLayoutRequest {
  tenantId: string;
  name: string;
  description?: string;
  module: string;
  sections: FieldLayoutSection[];
  settings?: any;
  isDefault?: boolean;
  tags?: string[];
  createdBy: string;
  userRole: string;
}

export interface CreateFieldLayoutResponse {
  success: boolean;
  data?: FieldLayout;
  errors?: string[];
  warnings?: string[];
}

export class CreateFieldLayoutUseCase {
  constructor(private fieldLayoutRepository: IFieldLayoutRepository) {}

  async execute(request: CreateFieldLayoutRequest): Promise<CreateFieldLayoutResponse> {
    try {
      // 1. Validate basic layout data
      const validation = FieldLayoutDomainService.validateLayout({
        name: request.name,
        module: request.module,
        tenantId: request.tenantId,
        sections: request.sections
      });

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // 2. Check for name uniqueness within tenant and module
      const existingLayout = await this.fieldLayoutRepository.findByName(
        request.name,
        request.tenantId
      );

      if (existingLayout && existingLayout.module === request.module) {
        return {
          success: false,
          errors: ['A layout with this name already exists for this module']
        };
      }

      // 3. Set default settings if not provided
      const defaultSettings = {
        responsive: true,
        mobileLayout: {
          stackSections: true,
          columnsToSingle: true,
          hiddenFields: [],
          collapseSections: true,
          showLabelsInline: false
        },
        tabletLayout: {
          maxColumns: 2,
          adaptiveSpacing: true,
          adjustFontSize: false,
          compactMode: false
        },
        accessibility: {
          highContrast: false,
          largeText: false,
          keyboardNavigation: true,
          screenReaderOptimized: true,
          ariaLabels: true,
          focusIndicators: true
        },
        performance: {
          lazyLoading: false,
          virtualScrolling: false,
          deferredRendering: false,
          cacheLayout: true,
          optimizeImages: true
        },
        validation: {
          validateOnMount: false,
          showValidationSummary: true,
          groupValidationErrors: true,
          highlightInvalidFields: true,
          scrollToFirstError: true
        }
      };

      // 4. Process and validate sections
      const processedSections = request.sections.map((section, index) => ({
        ...section,
        id: section.id || `section_${Date.now()}_${index}`,
        order: section.order || index + 1,
        columns: Math.max(1, Math.min(4, section.columns || 1)),
        collapsible: section.collapsible || false,
        collapsed: section.collapsed || false,
        styling: section.styling || {},
        permissions: section.permissions || [],
        fields: section.fields.map((field, fieldIndex) => ({
          ...field,
          id: field.id || `field_${Date.now()}_${fieldIndex}`,
          position: {
            section: section.name,
            row: field.position?.row || Math.floor(fieldIndex / section.columns) + 1,
            column: field.position?.column || (fieldIndex % section.columns) + 1,
            colspan: Math.min(field.position?.colspan || 1, section.columns),
            order: field.position?.order || fieldIndex + 1
          },
          sizing: field.sizing || {
            width: 'auto',
            height: 'auto'
          },
          styling: field.styling || {
            labelPosition: 'top'
          },
          behavior: {
            required: field.behavior?.required || false,
            readonly: field.behavior?.readonly || false,
            disabled: field.behavior?.disabled || false,
            hidden: field.behavior?.hidden || false,
            focusable: field.behavior?.focusable !== false,
            autoFocus: field.behavior?.autoFocus || false,
            clearable: field.behavior?.clearable || false,
            searchable: field.behavior?.searchable || false,
            ...field.behavior
          }
        }))
      }));

      // 5. Calculate complexity score
      const tempLayout = {
        sections: processedSections,
        settings: request.settings || defaultSettings
      } as FieldLayout;
      
      const complexityScore = FieldLayoutDomainService.calculateComplexityScore(tempLayout);

      // 6. Create layout
      const layoutToCreate: Omit<FieldLayout, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: request.tenantId,
        name: request.name,
        description: request.description,
        module: request.module,
        sections: processedSections,
        settings: request.settings || defaultSettings,
        metadata: {
          version: '1.0.0',
          author: request.createdBy,
          lastModifiedBy: request.createdBy,
          lastModifiedAt: new Date(),
          changeLog: [
            {
              id: `change_${Date.now()}`,
              version: '1.0.0',
              changes: 'Layout created',
              changedBy: request.createdBy,
              changedAt: new Date(),
              changeType: 'major',
              affectedSections: processedSections.map(s => s.name),
              affectedFields: processedSections.flatMap(s => s.fields.map(f => f.fieldName))
            }
          ],
          usage: {
            usageCount: 0,
            popularSections: [],
            problematicFields: [],
            userFeedback: [],
            performanceIssues: []
          },
          performance: {
            averageRenderTime: 0,
            averageLoadTime: 0,
            memoryUsage: 0,
            fieldCount: processedSections.reduce((sum, s) => sum + s.fields.length, 0),
            sectionCount: processedSections.length,
            complexityScore
          },
          compatibility: {
            browserSupport: ['Chrome', 'Firefox', 'Safari', 'Edge'],
            mobileSupport: true,
            accessibilityLevel: 'AA',
            supportedThemes: ['default', 'dark', 'light'],
            requiredFeatures: []
          }
        },
        isDefault: request.isDefault || false,
        isSystem: false,
        status: 'active',
        version: '1.0.0',
        tags: request.tags || [],
        createdBy: request.createdBy,
        isActive: true
      };

      const createdLayout = await this.fieldLayoutRepository.create(layoutToCreate);

      // 7. Create initial version
      await this.fieldLayoutRepository.createVersion(
        createdLayout.id,
        request.tenantId,
        {
          version: '1.0.0',
          changes: 'Layout created',
          changeType: 'major',
          changedBy: request.createdBy,
          affectedSections: processedSections.map(s => s.name),
          affectedFields: processedSections.flatMap(s => s.fields.map(f => f.fieldName))
        }
      );

      // 8. Generate accessibility report
      const accessibilityReport = FieldLayoutDomainService.generateAccessibilityReport(createdLayout);
      
      return {
        success: true,
        data: createdLayout,
        warnings: [
          ...validation.warnings,
          ...(accessibilityReport.issues.length > 0 ? [`Accessibility issues found: ${accessibilityReport.issues.join(', ')}`] : []),
          ...(complexityScore > 70 ? ['Layout complexity is high, consider simplifying'] : [])
        ]
      };

    } catch (error) {
      console.error('[CreateFieldLayoutUseCase] Error:', error);
      return {
        success: false,
        errors: ['Internal server error']
      };
    }
  }
}