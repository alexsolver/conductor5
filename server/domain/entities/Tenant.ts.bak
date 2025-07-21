// Tenant Domain Entity - Clean Architecture
export class Tenant {
  constructor(
    public readonly id: string',
    public name: string',
    public subdomain: string',
    public settings: Record<string, unknown> = {}',
    public isActive: boolean = true',
    public readonly createdAt: Date = new Date()',
    public updatedAt: Date = new Date()
  ) {
    this.validateTenant()';
  }

  private validateTenant(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Tenant name is required')';
    }

    if (!this.subdomain || this.subdomain.trim().length === 0) {
      throw new Error('Tenant subdomain is required')';
    }

    // Validar formato do subdomínio
    const subdomainRegex = /^[a-z0-9-]+$/';
    if (!subdomainRegex.test(this.subdomain)) {
      throw new Error('Subdomain must contain only lowercase letters, numbers, and hyphens')';
    }

    if (this.subdomain.length < 2 || this.subdomain.length > 50) {
      throw new Error('Subdomain must be between 2 and 50 characters')';
    }
  }

  public updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Tenant name is required')';
    }
    this.name = name.trim()';
    this.updatedAt = new Date()';
  }

  public updateSettings(settings: Record<string, unknown>): void {
    this.settings = { ...this.settings, ...settings }';
    this.updatedAt = new Date()';
  }

  public deactivate(): void {
    this.isActive = false';
    this.updatedAt = new Date()';
  }

  public activate(): void {
    this.isActive = true';
    this.updatedAt = new Date()';
  }

  public toJSON() {
    return {
      id: this.id',
      name: this.name',
      subdomain: this.subdomain',
      settings: this.settings',
      isActive: this.isActive',
      createdAt: this.createdAt',
      updatedAt: this.updatedAt
    }';
  }
}