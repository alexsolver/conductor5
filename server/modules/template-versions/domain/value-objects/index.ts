/**
 * Template Versions Value Objects
 * Clean Architecture - Domain Layer
 */

export class TemplateVersionId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TemplateVersionId cannot be empty');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TemplateVersionId): boolean {
    return this.value === other.value;
  }
}

export class VersionNumber {
  constructor(private readonly value: string) {
    if (!this.isValidVersionNumber(value)) {
      throw new Error('Invalid version number format');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  private isValidVersionNumber(version: string): boolean {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return versionRegex.test(version);
  }

  isNewerThan(other: VersionNumber): boolean {
    const [major1, minor1, patch1] = this.value.split('.').map(Number);
    const [major2, minor2, patch2] = other.value.split('.').map(Number);
    
    return major1 > major2 || 
           (major1 === major2 && minor1 > minor2) || 
           (major1 === major2 && minor1 === minor2 && patch1 > patch2);
  }
}