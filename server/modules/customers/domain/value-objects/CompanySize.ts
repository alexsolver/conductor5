/**
 * CompanySize Value Object
 * Clean Architecture - Domain Layer
 * Represents valid company size classifications
 */

export class CompanySize {
  private constructor(private readonly value: 'small' | 'medium' | 'large' | 'enterprise') {
    this.validate(value);
  }

  static create(value: string): CompanySize {
    return new CompanySize(value as 'small' | 'medium' | 'large' | 'enterprise');
  }

  static readonly SMALL = new CompanySize('small');
  static readonly MEDIUM = new CompanySize('medium');
  static readonly LARGE = new CompanySize('large');
  static readonly ENTERPRISE = new CompanySize('enterprise');

  private validate(value: string): void {
    const validSizes = ['small', 'medium', 'large', 'enterprise'];
    if (!validSizes.includes(value)) {
      throw new Error(`Invalid company size: ${value}`);
    }
  }

  getValue(): 'small' | 'medium' | 'large' | 'enterprise' {
    return this.value;
  }

  equals(other: CompanySize): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}