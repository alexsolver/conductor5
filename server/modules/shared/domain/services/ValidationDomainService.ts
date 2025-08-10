
export class ValidationDomainService {
  static validateTenantData(data: any): void {
    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!this.isValidUUID(data.tenantId)) {
      throw new Error('Invalid tenant ID format');
    }
  }

  static validatePremiumAccount(data: any): void {
    if (data.type === 'premium' && !data.paymentMethod) {
      throw new Error('Premium accounts require payment method');
    }
  }

  static validateEntityData(data: any): void {
    if (!data.id) {
      throw new Error('Entity ID is required');
    }

    if (!data.createdAt) {
      data.createdAt = new Date();
    }

    data.updatedAt = new Date();
  }

  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
