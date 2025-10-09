/**
 * Form Validation Engine
 * 
 * Motor de validação para Internal Forms que aplica:
 * - Validadores brasileiros (CPF, CNPJ, CEP, etc)
 * - Validações customizadas por campo
 * - Regras cross-field
 * 
 * @module FormValidator
 * @version 1.0.0
 */

import {
  validateCPF,
  validateCNPJ,
  validateCEP,
  validatePhone,
  validatePIS,
  validateCNH,
  validatePlacaVeiculo,
  validateInscricaoEstadual,
  ValidationResult
} from './brazilian';

export interface FieldValidationRule {
  type: 'cpf' | 'cnpj' | 'cep' | 'phone' | 'pis' | 'cnh' | 'placa' | 'ie' | 'email' | 'url' | 'regex' | 'custom';
  errorMessage?: string;
  params?: Record<string, any>; // Para validações que precisam de parâmetros adicionais (ex: UF para IE)
}

export interface FieldValidationError {
  fieldId: string;
  fieldLabel: string;
  message: string;
}

export interface FormField {
  id: string;
  label: string;
  type: string;
  validationRules?: FieldValidationRule[];
  required?: boolean;
}

/**
 * Valida um único campo baseado em suas regras
 */
export function validateField(
  field: FormField,
  value: any
): FieldValidationError | null {
  // Validação de campo obrigatório
  if (field.required && (!value || value === '')) {
    return {
      fieldId: field.id,
      fieldLabel: field.label,
      message: `${field.label} é obrigatório`
    };
  }

  // Se não há valor e campo não é obrigatório, pula validação
  if (!value || value === '') {
    return null;
  }

  // Aplica validações específicas
  if (!field.validationRules || field.validationRules.length === 0) {
    return null;
  }

  for (const rule of field.validationRules) {
    let result: ValidationResult | null = null;

    switch (rule.type) {
      case 'cpf':
        result = validateCPF(value);
        break;
      
      case 'cnpj':
        result = validateCNPJ(value);
        break;
      
      case 'cep':
        result = validateCEP(value);
        break;
      
      case 'phone':
        result = validatePhone(value);
        break;
      
      case 'pis':
        result = validatePIS(value);
        break;
      
      case 'cnh':
        result = validateCNH(value);
        break;
      
      case 'placa':
        result = validatePlacaVeiculo(value);
        break;
      
      case 'ie':
        const uf = rule.params?.uf || '';
        result = validateInscricaoEstadual(value, uf);
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        result = {
          isValid: emailRegex.test(value),
          message: 'E-mail inválido'
        };
        break;
      
      case 'url':
        try {
          new URL(value);
          result = { isValid: true };
        } catch {
          result = { isValid: false, message: 'URL inválida' };
        }
        break;
      
      case 'regex':
        if (rule.params?.pattern) {
          const regex = new RegExp(rule.params.pattern);
          result = {
            isValid: regex.test(value),
            message: rule.errorMessage || 'Formato inválido'
          };
        }
        break;
      
      case 'custom':
        // Validações customizadas podem ser implementadas aqui
        // Por enquanto, apenas retorna válido
        result = { isValid: true };
        break;
    }

    if (result && !result.isValid) {
      return {
        fieldId: field.id,
        fieldLabel: field.label,
        message: rule.errorMessage || result.message || 'Valor inválido'
      };
    }
  }

  return null;
}

/**
 * Valida um formulário completo
 */
export function validateForm(
  fields: FormField[],
  submissionData: Record<string, any>
): FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  for (const field of fields) {
    const value = submissionData[field.id];
    const error = validateField(field, value);
    
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Valida regras cross-field (campos que dependem de outros)
 * Exemplo: "Data Fim" deve ser maior que "Data Início"
 */
export function validateCrossFieldRules(
  fields: FormField[],
  submissionData: Record<string, any>,
  crossFieldRules?: any[]
): FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  if (!crossFieldRules || crossFieldRules.length === 0) {
    return errors;
  }

  for (const rule of crossFieldRules) {
    // Implementar regras cross-field conforme necessário
    // Exemplo: comparação de datas, soma de valores, etc.
    
    if (rule.type === 'date_range') {
      const startValue = submissionData[rule.startFieldId];
      const endValue = submissionData[rule.endFieldId];
      
      if (startValue && endValue && new Date(endValue) < new Date(startValue)) {
        const endField = fields.find(f => f.id === rule.endFieldId);
        errors.push({
          fieldId: rule.endFieldId,
          fieldLabel: endField?.label || rule.endFieldId,
          message: rule.errorMessage || 'Data final deve ser maior que data inicial'
        });
      }
    }
  }

  return errors;
}

/**
 * Formata valores baseado no tipo de validação
 */
export function formatFieldValue(
  field: FormField,
  value: any
): any {
  if (!value || !field.validationRules) {
    return value;
  }

  for (const rule of field.validationRules) {
    let result: ValidationResult | null = null;

    switch (rule.type) {
      case 'cpf':
        result = validateCPF(value);
        break;
      case 'cnpj':
        result = validateCNPJ(value);
        break;
      case 'cep':
        result = validateCEP(value);
        break;
      case 'phone':
        result = validatePhone(value);
        break;
      case 'pis':
        result = validatePIS(value);
        break;
    }

    if (result?.formatted) {
      return result.formatted;
    }
  }

  return value;
}
