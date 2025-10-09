/**
 * Auto Validators - Integração com APIs gratuitas para validação automática
 * 
 * Validadores que usam APIs públicas e gratuitas para validar dados brasileiros:
 * - CPF/CNPJ: Validação local (algoritmo)
 * - CEP: ViaCEP API (gratuita)
 * - Telefone: Validação de formato brasileiro
 */

import { validateCPF, validateCNPJ, validateCpfCnpj } from '@/../../shared/validators/brazilian-documents';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  data?: any;
}

/**
 * Valida CPF usando algoritmo local
 */
export async function validateCPFAuto(cpf: string): Promise<ValidationResult> {
  const isValid = validateCPF(cpf);
  
  return {
    valid: isValid,
    message: isValid ? 'CPF válido' : 'CPF inválido',
  };
}

/**
 * Valida CNPJ usando algoritmo local
 */
export async function validateCNPJAuto(cnpj: string): Promise<ValidationResult> {
  const isValid = validateCNPJ(cnpj);
  
  return {
    valid: isValid,
    message: isValid ? 'CNPJ válido' : 'CNPJ inválido',
  };
}

/**
 * Valida CPF ou CNPJ automaticamente
 */
export async function validateCPFCNPJAuto(document: string): Promise<ValidationResult> {
  const isValid = validateCpfCnpj(document);
  const numbers = document.replace(/\D/g, '');
  const type = numbers.length === 11 ? 'CPF' : numbers.length === 14 ? 'CNPJ' : 'documento';
  
  return {
    valid: isValid,
    message: isValid ? `${type} válido` : `${type} inválido`,
  };
}

/**
 * Valida e busca endereço via CEP usando ViaCEP (API gratuita)
 */
export async function validateCEPAuto(cep: string): Promise<ValidationResult> {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    return {
      valid: false,
      message: 'CEP deve ter 8 dígitos',
    };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      return {
        valid: false,
        message: 'Erro ao consultar CEP',
      };
    }

    const data = await response.json();

    if (data.erro) {
      return {
        valid: false,
        message: 'CEP não encontrado',
      };
    }

    return {
      valid: true,
      message: 'CEP válido',
      data: {
        cep: data.cep,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        fullAddress: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`,
      },
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Erro ao validar CEP',
    };
  }
}

/**
 * Valida telefone brasileiro (formato)
 */
export async function validatePhoneBRAuto(phone: string): Promise<ValidationResult> {
  const numbers = phone.replace(/\D/g, '');
  
  // Telefone brasileiro: 10 dígitos (fixo) ou 11 dígitos (celular)
  if (numbers.length !== 10 && numbers.length !== 11) {
    return {
      valid: false,
      message: 'Telefone deve ter 10 (fixo) ou 11 (celular) dígitos',
    };
  }

  // Validar DDD (deve ser entre 11 e 99)
  const ddd = parseInt(numbers.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return {
      valid: false,
      message: 'DDD inválido',
    };
  }

  // Celular deve começar com 9
  if (numbers.length === 11 && numbers[2] !== '9') {
    return {
      valid: false,
      message: 'Número de celular deve começar com 9',
    };
  }

  const type = numbers.length === 11 ? 'Celular' : 'Fixo';
  
  return {
    valid: true,
    message: `${type} válido`,
    data: {
      type,
      ddd: numbers.substring(0, 2),
      number: numbers.substring(2),
      formatted: numbers.length === 11 
        ? `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`
        : `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`,
    },
  };
}

/**
 * Valida email (formato básico)
 */
export async function validateEmailAuto(email: string): Promise<ValidationResult> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    valid: isValid,
    message: isValid ? 'Email válido' : 'Email inválido',
  };
}

/**
 * Auto-validator dispatcher - escolhe o validador correto baseado no tipo
 */
export async function autoValidate(
  value: string, 
  type: 'cpf' | 'cnpj' | 'cpf_cnpj' | 'cep' | 'phone_br' | 'email'
): Promise<ValidationResult> {
  switch (type) {
    case 'cpf':
      return validateCPFAuto(value);
    case 'cnpj':
      return validateCNPJAuto(value);
    case 'cpf_cnpj':
      return validateCPFCNPJAuto(value);
    case 'cep':
      return validateCEPAuto(value);
    case 'phone_br':
      return validatePhoneBRAuto(value);
    case 'email':
      return validateEmailAuto(value);
    default:
      return {
        valid: true,
        message: 'Validação não configurada',
      };
  }
}
