/**
 * CreateFieldLayoutUseCase - Clean Architecture Application Layer
 * Resolves violations: Missing Use Cases for field layout creation business logic
 */

import { FieldLayout } from '../../domain/entities/FieldLayout';

interface FieldLayoutRepositoryInterface {
  save(layout: FieldLayout): Promise<void>;
  findByName(name: string, tenantId: string): Promise<FieldLayout | null>;
  findByCategory(category: string, tenantId: string): Promise<FieldLayout[]>;
}

interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  options?: string[];
  defaultValue?: any;
  helpText?: string;
}

interface FieldPosition {
  fieldId: string;
  column: number;
  row: number;
  width: number;
  height: number;
}

export interface CreateFieldLayoutRequest {
  tenantId: string;
  name: string;
  description: string;
  category?: string;
  fields: FieldDefinition[];
  grid?: {
    columns: number;
    rows: number;
    gap: number;
  };
  positions?: FieldPosition[];
  style?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateFieldLayoutResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    description: string;
    category: string;
    version: number;
    fieldCount: number;
    positionedFields: number;
    gridUtilization: number;
    isValid: boolean;
    validationErrors?: string[];
  };
}

export class CreateFieldLayoutUseCase {
  constructor(
    private readonly layoutRepository: FieldLayoutRepositoryInterface
  ) {}

  async execute(request: CreateFieldLayoutRequest): Promise<CreateFieldLayoutResponse> {
    // Validate required fields
    if (!request.name || !request.description) {
      return {
        success: false,
        message: 'Name and description are required'
      };
    }

    if (!request.fields || request.fields.length === 0) {
      return {
        success: false,
        message: 'At least one field is required'
      };
    }

    // Check for duplicate layout name
    const existingLayout = await this.layoutRepository.findByName(request.name, request.tenantId);
    if (existingLayout) {
      return {
        success: false,
        message: 'A layout with this name already exists'
      };
    }

    try {
      // Create layout entity
      const layout = new FieldLayout(
        generateId(),
        request.tenantId,
        request.name,
        request.description,
        [],
        request.grid || { columns: 12, rows: 10, gap: 16 },
        [],
        request.style || {},
        true, // active by default
        1, // initial version
        request.category || 'default'
      );

      // Add fields
      request.fields.forEach(fieldDef => {
        try {
          layout.addField(fieldDef);
        } catch (error) {
          throw new Error(`Invalid field "${fieldDef.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      // Add positions if provided
      if (request.positions) {
        request.positions.forEach(position => {
          try {
            layout.setFieldPosition(position.fieldId, {
              column: position.column,
              row: position.row,
              width: position.width,
              height: position.height
            });
          } catch (error) {
            throw new Error(`Invalid position for field "${position.fieldId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
      }

      // Add metadata if provided
      if (request.metadata) {
        Object.entries(request.metadata).forEach(([key, value]) => {
          layout.addMetadata(key, value);
        });
      }

      // Add creation metadata
      layout.addMetadata('created_by', 'system');
      layout.addMetadata('creation_source', 'api');
      layout.addMetadata('template_type', request.category || 'custom');

      // Validate the layout
      const validationErrors = layout.getValidationErrors();
      
      // Save the layout (even if there are validation warnings)
      await this.layoutRepository.save(layout);

      return {
        success: true,
        message: validationErrors.length > 0 
          ? 'Field layout created successfully with validation warnings'
          : 'Field layout created successfully',
        data: {
          id: layout.getId(),
          name: layout.getName(),
          description: layout.getDescription(),
          category: layout.getCategory(),
          version: layout.getVersion(),
          fieldCount: layout.getFieldCount(),
          positionedFields: layout.getPositionedFieldCount(),
          gridUtilization: Math.round(layout.getGridUtilization() * 100) / 100,
          isValid: layout.isValid(),
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create field layout';
      return {
        success: false,
        message
      };
    }
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}