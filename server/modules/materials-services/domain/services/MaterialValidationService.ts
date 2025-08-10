
export class MaterialValidationService {
  static validateMaterialData(material: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!material.name || material.name.trim().length < 2) {
      errors.push('Nome do material deve ter pelo menos 2 caracteres');
    }

    if (!material.category) {
      errors.push('Categoria é obrigatória');
    }

    if (!material.tenantId) {
      errors.push('Tenant ID é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateServiceData(service: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!service.name || service.name.trim().length < 2) {
      errors.push('Nome do serviço deve ter pelo menos 2 caracteres');
    }

    if (!service.type) {
      errors.push('Tipo do serviço é obrigatório');
    }

    if (!service.tenantId) {
      errors.push('Tenant ID é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
