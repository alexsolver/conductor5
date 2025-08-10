/**
 * Email Value Object
 * Clean Architecture - Domain Layer
 * Ensures email format validation and immutability
 */

export class Email {
  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static create(value: string): Email {
    return new Email(value);
  }

  private validate(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    if (email.length > 254) {
      throw new Error('Email too long');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}