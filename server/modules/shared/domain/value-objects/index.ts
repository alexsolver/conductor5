/**
 * Shared Value Objects
 * Clean Architecture - Domain Layer
 * Common value objects used across multiple bounded contexts
 */

export class TenantId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId cannot be empty');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }
}

export class Email {
  constructor(private readonly value: string) {
    if (!this.isValidEmail(value)) {
      throw new Error('Invalid email format');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export class UserId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}

export class DateTime {
  constructor(private readonly value: Date) {
    this.value = value;
  }

  getValue(): Date {
    return this.value;
  }

  toString(): string {
    return this.value.toISOString();
  }

  isBefore(other: DateTime): boolean {
    return this.value < other.value;
  }

  isAfter(other: DateTime): boolean {
    return this.value > other.value;
  }
}