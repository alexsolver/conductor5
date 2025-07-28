
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

export interface ValidationMetadata {
  validatedAt: string;
  validatorVersion: string;
  schemaVersion: string;
  tenantId?: string;
}

export class LocationDataValidator {
  private static readonly REQUIRED_FIELDS = {
    local: ['nome', 'tenantId'],
    regiao: ['nome', 'tenantId'],
    'rota-dinamica': ['nomeRota', 'idRota', 'previsaoDias', 'tenantId'],
    trecho: ['localAId', 'localBId', 'tenantId'],
    'rota-trecho': ['idRota', 'tenantId'],
    area: ['nome', 'tipoArea', 'tenantId'],
    agrupamento: ['nome', 'tenantId']
  };

  static validateLocationData(data: any, recordType: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Check required fields
    const requiredFields = this.REQUIRED_FIELDS[recordType as keyof typeof this.REQUIRED_FIELDS] || [];
    
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push({
          field,
          message: `Campo obrigatório '${field}' está ausente ou vazio`,
          code: 'REQUIRED_FIELD_MISSING',
          severity: 'critical'
        });
      }
    }

    // Validate specific field types
    if (recordType === 'local') {
      this.validateLocalFields(data, errors, warnings);
    } else if (recordType === 'regiao') {
      this.validateRegiaoFields(data, errors, warnings);
    } else if (recordType === 'rota-dinamica') {
      this.validateRotaDinamicaFields(data, errors, warnings);
    }

    // General validations
    this.validateGeneralFields(data, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        validatorVersion: '1.0.0',
        schemaVersion: '2025.1',
        tenantId: data.tenantId
      }
    };
  }

  private static validateLocalFields(data: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // CEP validation
    if (data.cep && !/^\d{5}-?\d{3}$/.test(data.cep)) {
      errors.push({
        field: 'cep',
        message: 'CEP deve estar no formato 00000-000 ou 00000000',
        code: 'INVALID_CEP_FORMAT',
        severity: 'high'
      });
    }

    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({
        field: 'email',
        message: 'Email deve ter um formato válido',
        code: 'INVALID_EMAIL_FORMAT',
        severity: 'medium'
      });
    }

    // Coordinates validation
    if (data.latitude && (parseFloat(data.latitude) < -90 || parseFloat(data.latitude) > 90)) {
      errors.push({
        field: 'latitude',
        message: 'Latitude deve estar entre -90 e 90',
        code: 'INVALID_LATITUDE',
        severity: 'high'
      });
    }

    if (data.longitude && (parseFloat(data.longitude) < -180 || parseFloat(data.longitude) > 180)) {
      errors.push({
        field: 'longitude',
        message: 'Longitude deve estar entre -180 e 180',
        code: 'INVALID_LONGITUDE',
        severity: 'high'
      });
    }

    // Suggest improvements
    if (!data.latitude || !data.longitude) {
      warnings.push({
        field: 'coordinates',
        message: 'Coordenadas não informadas',
        suggestion: 'Adicione coordenadas para melhorar a precisão da localização'
      });
    }
  }

  private static validateRegiaoFields(data: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Validate relationships
    if (data.clientesVinculados && !Array.isArray(data.clientesVinculados)) {
      errors.push({
        field: 'clientesVinculados',
        message: 'Clientes vinculados deve ser um array',
        code: 'INVALID_ARRAY_FORMAT',
        severity: 'medium'
      });
    }

    if (data.locaisAtendimento && !Array.isArray(data.locaisAtendimento)) {
      errors.push({
        field: 'locaisAtendimento',
        message: 'Locais de atendimento deve ser um array',
        code: 'INVALID_ARRAY_FORMAT',
        severity: 'medium'
      });
    }
  }

  private static validateRotaDinamicaFields(data: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Validate previsaoDias
    if (data.previsaoDias && (data.previsaoDias < 1 || data.previsaoDias > 30)) {
      errors.push({
        field: 'previsaoDias',
        message: 'Previsão de dias deve estar entre 1 e 30',
        code: 'INVALID_RANGE',
        severity: 'medium'
      });
    }

    // Validate diasSemana if provided
    if (data.diasSemana && !Array.isArray(data.diasSemana)) {
      errors.push({
        field: 'diasSemana',
        message: 'Dias da semana deve ser um array',
        code: 'INVALID_ARRAY_FORMAT',
        severity: 'medium'
      });
    }
  }

  private static validateGeneralFields(data: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Validate boolean fields
    if (data.ativo !== undefined && typeof data.ativo !== 'boolean') {
      errors.push({
        field: 'ativo',
        message: 'Campo ativo deve ser verdadeiro ou falso',
        code: 'INVALID_BOOLEAN',
        severity: 'medium'
      });
    }

    // Validate string lengths
    if (data.nome && data.nome.length > 200) {
      errors.push({
        field: 'nome',
        message: 'Nome não pode ter mais de 200 caracteres',
        code: 'STRING_TOO_LONG',
        severity: 'medium'
      });
    }

    if (data.descricao && data.descricao.length > 1000) {
      warnings.push({
        field: 'descricao',
        message: 'Descrição muito longa',
        suggestion: 'Considere reduzir o tamanho da descrição para melhor legibilidade'
      });
    }
  }

  static sanitizeData(data: any): any {
    const sanitized = { ...data };

    // Trim string fields
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    }

    // Normalize CEP
    if (sanitized.cep) {
      sanitized.cep = sanitized.cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
    }

    // Normalize coordinates
    if (sanitized.latitude) {
      sanitized.latitude = parseFloat(sanitized.latitude).toString();
    }
    if (sanitized.longitude) {
      sanitized.longitude = parseFloat(sanitized.longitude).toString();
    }

    return sanitized;
  }
}
