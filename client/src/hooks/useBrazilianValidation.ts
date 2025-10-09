/**
 * Brazilian Validation Hook
 * 
 * Hook para formatação e validação em tempo real de documentos brasileiros
 * Suporta: CPF, CNPJ, CEP, Telefone
 * 
 * @module useBrazilianValidation
 */

import { useState, useCallback } from 'react';

interface ValidationResult {
  isValid: boolean;
  message?: string;
  formatted?: string;
}

export type ValidationType = 'cpf' | 'cnpj' | 'cep' | 'phone';

/**
 * Remove caracteres não numéricos
 */
function cleanNumeric(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida CPF
 */
function validateCPF(cpf: string): ValidationResult {
  const cleaned = cleanNumeric(cpf);

  if (cleaned.length !== 11) {
    return { isValid: false, message: 'CPF deve conter 11 dígitos' };
  }

  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, message: 'CPF inválido' };
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(cleaned.charAt(9))) {
    return { isValid: false, message: 'CPF inválido' };
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;

  if (digit2 !== parseInt(cleaned.charAt(10))) {
    return { isValid: false, message: 'CPF inválido' };
  }

  const formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  return { isValid: true, formatted };
}

/**
 * Valida CNPJ
 */
function validateCNPJ(cnpj: string): ValidationResult {
  const cleaned = cleanNumeric(cnpj);

  if (cleaned.length !== 14) {
    return { isValid: false, message: 'CNPJ deve conter 14 dígitos' };
  }

  if (/^(\d)\1{13}$/.test(cleaned)) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  const formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
  return { isValid: true, formatted };
}

/**
 * Valida CEP
 */
function validateCEP(cep: string): ValidationResult {
  const cleaned = cleanNumeric(cep);

  if (cleaned.length !== 8) {
    return { isValid: false, message: 'CEP deve conter 8 dígitos' };
  }

  const formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  return { isValid: true, formatted };
}

/**
 * Valida telefone
 */
function validatePhone(phone: string): ValidationResult {
  const cleaned = cleanNumeric(phone);

  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return { isValid: false, message: 'Telefone deve conter 10 ou 11 dígitos' };
  }

  const ddd = parseInt(cleaned.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { isValid: false, message: 'DDD inválido' };
  }

  const formatted = cleaned.length === 11
    ? `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
    : `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;

  return { isValid: true, formatted };
}

/**
 * Formata valor sem validar
 */
function formatValue(value: string, type: ValidationType): string {
  const cleaned = cleanNumeric(value);

  switch (type) {
    case 'cpf':
      if (cleaned.length <= 11) {
        return cleaned
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
      return value;

    case 'cnpj':
      if (cleaned.length <= 14) {
        return cleaned
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
      }
      return value;

    case 'cep':
      if (cleaned.length <= 8) {
        return cleaned.replace(/(\d{5})(\d)/, '$1-$2');
      }
      return value;

    case 'phone':
      if (cleaned.length <= 11) {
        if (cleaned.length <= 10) {
          return cleaned
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
      return value;

    default:
      return value;
  }
}

/**
 * Hook principal de validação brasileira
 */
export function useBrazilianValidation(type: ValidationType) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((val: string) => {
    let result: ValidationResult;

    switch (type) {
      case 'cpf':
        result = validateCPF(val);
        break;
      case 'cnpj':
        result = validateCNPJ(val);
        break;
      case 'cep':
        result = validateCEP(val);
        break;
      case 'phone':
        result = validatePhone(val);
        break;
      default:
        result = { isValid: true };
    }

    setIsValid(result.isValid);
    setError(result.isValid ? undefined : result.message);
    return result;
  }, [type]);

  const handleChange = useCallback((newValue: string) => {
    const formatted = formatValue(newValue, type);
    setValue(formatted);
    
    // Só valida quando o campo está completo
    const cleaned = cleanNumeric(formatted);
    const expectedLength = type === 'cpf' ? 11 : type === 'cnpj' ? 14 : type === 'cep' ? 8 : type === 'phone' ? 10 : 0;
    
    if (cleaned.length >= expectedLength) {
      validate(formatted);
    } else {
      setError(undefined);
      setIsValid(false);
    }
  }, [type, validate]);

  const reset = useCallback(() => {
    setValue('');
    setError(undefined);
    setIsValid(false);
  }, []);

  return {
    value,
    setValue: handleChange,
    error,
    isValid,
    validate: () => validate(value),
    reset,
    rawValue: cleanNumeric(value)
  };
}
