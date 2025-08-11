/**
 * Template Hierarchy Value Objects
 * Clean Architecture - Domain Layer
 */

export class TemplateHierarchyId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TemplateHierarchyId cannot be empty');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TemplateHierarchyId): boolean {
    return this.value === other.value;
  }
}

export class HierarchyLevel {
  constructor(private readonly value: number) {
    if (value < 0) {
      throw new Error('Hierarchy level cannot be negative');
    }
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  isRoot(): boolean {
    return this.value === 0;
  }

  getParentLevel(): HierarchyLevel {
    if (this.isRoot()) {
      throw new Error('Root level has no parent');
    }
    return new HierarchyLevel(this.value - 1);
  }

  getChildLevel(): HierarchyLevel {
    return new HierarchyLevel(this.value + 1);
  }
}