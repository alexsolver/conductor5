
export class AuditValidationService {
  static validateAuditLog(auditData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!auditData.entityType) {
      errors.push('Tipo da entidade é obrigatório');
    }

    if (!auditData.entityId) {
      errors.push('ID da entidade é obrigatório');
    }

    if (!auditData.action) {
      errors.push('Ação é obrigatória');
    }

    if (!auditData.userId) {
      errors.push('ID do usuário é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEntityType(entityType: string): boolean {
    const validTypes = ['ticket', 'user', 'customer', 'template', 'material', 'service'];
    return validTypes.includes(entityType.toLowerCase());
  }
}
