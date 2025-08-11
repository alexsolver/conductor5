/**
 * FieldLayout Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for field layout management
 */

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
  options?: string[]; // for select, radio
  defaultValue?: any;
  helpText?: string;
}

interface LayoutGrid {
  columns: number;
  rows: number;
  gap: number; // in pixels
}

interface FieldPosition {
  fieldId: string;
  column: number;
  row: number;
  width: number; // column span
  height: number; // row span
}

export class FieldLayout {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private description: string,
    private fields: FieldDefinition[] = [],
    private grid: LayoutGrid = { columns: 12, rows: 10, gap: 16 },
    private positions: FieldPosition[] = [],
    private style: Record<string, any> = {},
    private isActive: boolean = true,
    private version: number = 1,
    private category: string = 'default',
    private metadata: Record<string, any> = {},
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getFields(): FieldDefinition[] { return [...this.fields]; }
  getGrid(): LayoutGrid { return { ...this.grid }; }
  getPositions(): FieldPosition[] { return [...this.positions]; }
  getStyle(): Record<string, any> { return { ...this.style }; }
  isLayoutActive(): boolean { return this.isActive; }
  getVersion(): number { return this.version; }
  getCategory(): string { return this.category; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateBasicInfo(name: string, description: string, category?: string): void {
    if (!name.trim()) {
      throw new Error('Layout name cannot be empty');
    }
    
    this.name = name.trim();
    this.description = description.trim();
    
    if (category) {
      this.category = category;
    }
    
    this.updatedAt = new Date();
  }

  addField(field: FieldDefinition): void {
    // Validate field
    if (!field.id || !field.name || !field.type || !field.label) {
      throw new Error('Field must have id, name, type, and label');
    }
    
    // Check for duplicate field ID
    if (this.fields.some(f => f.id === field.id)) {
      throw new Error('Field with this ID already exists');
    }
    
    // Check for duplicate field name
    if (this.fields.some(f => f.name === field.name)) {
      throw new Error('Field with this name already exists');
    }
    
    this.fields.push(field);
    this.incrementVersion();
  }

  updateField(fieldId: string, updates: Partial<FieldDefinition>): void {
    const fieldIndex = this.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) {
      throw new Error('Field not found');
    }
    
    // Validate name uniqueness if changing name
    if (updates.name && updates.name !== this.fields[fieldIndex].name) {
      if (this.fields.some(f => f.name === updates.name && f.id !== fieldId)) {
        throw new Error('Field name already exists');
      }
    }
    
    this.fields[fieldIndex] = { ...this.fields[fieldIndex], ...updates };
    this.incrementVersion();
  }

  removeField(fieldId: string): void {
    const fieldIndex = this.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) {
      throw new Error('Field not found');
    }
    
    // Remove field
    this.fields.splice(fieldIndex, 1);
    
    // Remove position if exists
    this.positions = this.positions.filter(p => p.fieldId !== fieldId);
    
    this.incrementVersion();
  }

  updateGrid(columns: number, rows: number, gap: number = 16): void {
    if (columns < 1 || rows < 1) {
      throw new Error('Grid must have at least 1 column and 1 row');
    }
    
    if (gap < 0) {
      throw new Error('Grid gap cannot be negative');
    }
    
    this.grid = { columns, rows, gap };
    
    // Validate and adjust positions if needed
    this.validatePositions();
    this.incrementVersion();
  }

  setFieldPosition(fieldId: string, position: Omit<FieldPosition, 'fieldId'>): void {
    // Check if field exists
    if (!this.fields.some(f => f.id === fieldId)) {
      throw new Error('Field not found');
    }
    
    // Validate position
    this.validatePosition({ ...position, fieldId });
    
    // Remove existing position
    this.positions = this.positions.filter(p => p.fieldId !== fieldId);
    
    // Add new position
    this.positions.push({ ...position, fieldId });
    
    this.updatedAt = new Date();
  }

  removeFieldPosition(fieldId: string): void {
    this.positions = this.positions.filter(p => p.fieldId !== fieldId);
    this.updatedAt = new Date();
  }

  updateStyle(styleUpdates: Record<string, any>): void {
    this.style = { ...this.style, ...styleUpdates };
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  addMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updatedAt = new Date();
  }

  removeMetadata(key: string): void {
    delete this.metadata[key];
    this.updatedAt = new Date();
  }

  // Private methods
  private validatePosition(position: FieldPosition): void {
    if (position.column < 1 || position.column > this.grid.columns) {
      throw new Error(`Column must be between 1 and ${this.grid.columns}`);
    }
    
    if (position.row < 1 || position.row > this.grid.rows) {
      throw new Error(`Row must be between 1 and ${this.grid.rows}`);
    }
    
    if (position.width < 1 || (position.column + position.width - 1) > this.grid.columns) {
      throw new Error('Field width exceeds grid boundaries');
    }
    
    if (position.height < 1 || (position.row + position.height - 1) > this.grid.rows) {
      throw new Error('Field height exceeds grid boundaries');
    }
    
    // Check for overlaps with existing positions
    const hasOverlap = this.positions.some(existingPos => {
      if (existingPos.fieldId === position.fieldId) return false;
      
      return this.positionsOverlap(position, existingPos);
    });
    
    if (hasOverlap) {
      throw new Error('Field position overlaps with existing field');
    }
  }

  private positionsOverlap(pos1: FieldPosition, pos2: FieldPosition): boolean {
    const pos1EndCol = pos1.column + pos1.width - 1;
    const pos1EndRow = pos1.row + pos1.height - 1;
    const pos2EndCol = pos2.column + pos2.width - 1;
    const pos2EndRow = pos2.row + pos2.height - 1;
    
    return !(
      pos1EndCol < pos2.column ||
      pos1.column > pos2EndCol ||
      pos1EndRow < pos2.row ||
      pos1.row > pos2EndRow
    );
  }

  private validatePositions(): void {
    this.positions = this.positions.filter(pos => {
      return (
        pos.column <= this.grid.columns &&
        pos.row <= this.grid.rows &&
        (pos.column + pos.width - 1) <= this.grid.columns &&
        (pos.row + pos.height - 1) <= this.grid.rows
      );
    });
  }

  private incrementVersion(): void {
    this.version++;
    this.updatedAt = new Date();
  }

  // Business queries
  getFieldCount(): number {
    return this.fields.length;
  }

  getPositionedFieldCount(): number {
    return this.positions.length;
  }

  getUnpositionedFields(): FieldDefinition[] {
    const positionedFieldIds = new Set(this.positions.map(p => p.fieldId));
    return this.fields.filter(f => !positionedFieldIds.has(f.id));
  }

  getRequiredFields(): FieldDefinition[] {
    return this.fields.filter(f => f.required);
  }

  getFieldsByType(type: string): FieldDefinition[] {
    return this.fields.filter(f => f.type === type);
  }

  getFieldPosition(fieldId: string): FieldPosition | null {
    return this.positions.find(p => p.fieldId === fieldId) || null;
  }

  hasField(fieldId: string): boolean {
    return this.fields.some(f => f.id === fieldId);
  }

  isComplete(): boolean {
    return this.fields.length > 0 && this.positions.length === this.fields.length;
  }

  getGridUtilization(): number {
    const totalCells = this.grid.columns * this.grid.rows;
    const usedCells = this.positions.reduce((sum, pos) => sum + (pos.width * pos.height), 0);
    return (usedCells / totalCells) * 100;
  }

  getFieldById(fieldId: string): FieldDefinition | null {
    return this.fields.find(f => f.id === fieldId) || null;
  }

  getFieldByName(fieldName: string): FieldDefinition | null {
    return this.fields.find(f => f.name === fieldName) || null;
  }

  canAddField(): boolean {
    return this.getGridUtilization() < 100;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];
    
    if (this.fields.length === 0) {
      errors.push('Layout must have at least one field');
    }
    
    if (this.getUnpositionedFields().length > 0) {
      errors.push('All fields must have positions defined');
    }
    
    // Check for invalid field configurations
    this.fields.forEach(field => {
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        errors.push(`Select field "${field.name}" must have options`);
      }
      
      if (field.validation?.minLength && field.validation?.maxLength) {
        if (field.validation.minLength > field.validation.maxLength) {
          errors.push(`Field "${field.name}" minLength cannot be greater than maxLength`);
        }
      }
    });
    
    return errors;
  }

  isValid(): boolean {
    return this.getValidationErrors().length === 0;
  }
}