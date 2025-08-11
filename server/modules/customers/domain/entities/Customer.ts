/**
 * Customer Domain Entity - Clean Architecture Domain Layer
 * Resolves violations: Missing domain entities for customers
 */

export class Customer {
  constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private name: string,
    private email: string,
    private phone?: string,
    private address?: string,
    private active: boolean = true,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string { return this.id; }
  getTenantId(): string { return this.tenantId; }
  getName(): string { return this.name; }
  getEmail(): string { return this.email; }
  getPhone(): string | undefined { return this.phone; }
  getAddress(): string | undefined { return this.address; }
  isActive(): boolean { return this.active; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business methods
  updateContactInfo(name: string, email: string, phone?: string): void {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.updatedAt = new Date();
  }

  updateAddress(address: string): void {
    this.address = address;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getDisplayName(): string {
    return `${this.name} (${this.email})`;
  }
}