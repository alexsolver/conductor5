/**
 * Brazilian Document Validators
 * 
 * Validadores completos para documentos brasileiros com verificação de dígito.
 * Todos os validadores retornam { isValid: boolean, message?: string }
 * 
 * @module BrazilianValidators
 * @version 1.0.0
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  formatted?: string; // Valor formatado (se aplicável)
}

/**
 * Remove caracteres não numéricos de uma string
 */
function cleanNumeric(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida CPF (Cadastro de Pessoas Físicas)
 * Aceita formatos: 123.456.789-00 ou 12345678900
 */
export function validateCPF(cpf: string): ValidationResult {
  const cleaned = cleanNumeric(cpf);

  if (cleaned.length !== 11) {
    return { isValid: false, message: 'CPF deve conter 11 dígitos' };
  }

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, message: 'CPF inválido' };
  }

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(cleaned.charAt(9))) {
    return { isValid: false, message: 'CPF inválido' };
  }

  // Validação do segundo dígito verificador
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
 * Valida CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * Aceita formatos: 12.345.678/0001-00 ou 12345678000100
 */
export function validateCNPJ(cnpj: string): ValidationResult {
  const cleaned = cleanNumeric(cnpj);

  if (cleaned.length !== 14) {
    return { isValid: false, message: 'CNPJ deve conter 14 dígitos' };
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  // Validação do primeiro dígito verificador
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

  // Validação do segundo dígito verificador
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
 * Valida CEP (Código de Endereçamento Postal)
 * Aceita formatos: 12345-678 ou 12345678
 */
export function validateCEP(cep: string): ValidationResult {
  const cleaned = cleanNumeric(cep);

  if (cleaned.length !== 8) {
    return { isValid: false, message: 'CEP deve conter 8 dígitos' };
  }

  const formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  return { isValid: true, formatted };
}

/**
 * Valida telefone brasileiro
 * Aceita formatos: (11) 98765-4321, (11) 3456-7890, 11987654321, etc
 */
export function validatePhone(phone: string): ValidationResult {
  const cleaned = cleanNumeric(phone);

  // Telefone fixo: 10 dígitos (DDD + 8 dígitos)
  // Celular: 11 dígitos (DDD + 9 dígitos)
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return { isValid: false, message: 'Telefone deve conter 10 ou 11 dígitos' };
  }

  // Verifica se DDD é válido (11-99)
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
 * Valida PIS/PASEP
 * Aceita formatos: 123.45678.90-1 ou 12345678901
 */
export function validatePIS(pis: string): ValidationResult {
  const cleaned = cleanNumeric(pis);

  if (cleaned.length !== 11) {
    return { isValid: false, message: 'PIS deve conter 11 dígitos' };
  }

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights[i];
  }

  const remainder = sum % 11;
  const digit = remainder < 2 ? 0 : 11 - remainder;

  if (digit !== parseInt(cleaned.charAt(10))) {
    return { isValid: false, message: 'PIS inválido' };
  }

  const formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8, 10)}-${cleaned.slice(10, 11)}`;
  return { isValid: true, formatted };
}

/**
 * Valida CNH (Carteira Nacional de Habilitação)
 * Aceita 11 dígitos numéricos
 */
export function validateCNH(cnh: string): ValidationResult {
  const cleaned = cleanNumeric(cnh);

  if (cleaned.length !== 11) {
    return { isValid: false, message: 'CNH deve conter 11 dígitos' };
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, message: 'CNH inválida' };
  }

  // Primeiro dígito verificador
  let dsc = 0;
  let sum1 = 0;
  let sum2 = 0;

  for (let i = 0, j = 9; i < 9; i++, j--) {
    sum1 += parseInt(cleaned.charAt(i)) * j;
  }

  const digit1 = sum1 % 11;
  const realDigit1 = digit1 >= 10 ? 0 : digit1;

  if (realDigit1 !== parseInt(cleaned.charAt(9))) {
    return { isValid: false, message: 'CNH inválida' };
  }

  // Segundo dígito verificador
  for (let i = 0, j = 1; i < 9; i++, j++) {
    sum2 += parseInt(cleaned.charAt(i)) * j;
  }

  const digit2 = sum2 % 11;
  const realDigit2 = digit2 >= 10 ? 0 : digit2;

  if (realDigit2 !== parseInt(cleaned.charAt(10))) {
    return { isValid: false, message: 'CNH inválida' };
  }

  return { isValid: true, formatted: cleaned };
}

/**
 * Valida Placa de Veículo (Mercosul e antiga)
 * Aceita formatos: ABC1234 ou ABC1D23 (Mercosul)
 */
export function validatePlacaVeiculo(placa: string): ValidationResult {
  const cleaned = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Placa antiga: 3 letras + 4 números
  const oldFormat = /^[A-Z]{3}\d{4}$/;
  // Placa Mercosul: 3 letras + 1 número + 1 letra + 2 números
  const mercosulFormat = /^[A-Z]{3}\d[A-Z]\d{2}$/;

  if (oldFormat.test(cleaned)) {
    const formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
    return { isValid: true, formatted };
  }

  if (mercosulFormat.test(cleaned)) {
    const formatted = `${cleaned.slice(0, 3)}${cleaned.slice(3, 4)}${cleaned.slice(4, 5)}${cleaned.slice(5, 7)}`;
    return { isValid: true, formatted };
  }

  return { isValid: false, message: 'Placa inválida' };
}

/**
 * Valida Inscrição Estadual (validação básica - varia por estado)
 * Esta é uma validação genérica. Para validação específica por estado, é necessário implementar regras por UF.
 */
export function validateInscricaoEstadual(ie: string, uf: string): ValidationResult {
  const cleaned = cleanNumeric(ie);

  if (!cleaned || cleaned.length < 8) {
    return { isValid: false, message: 'Inscrição Estadual deve conter no mínimo 8 dígitos' };
  }

  // Validação específica por UF seria implementada aqui
  // Por enquanto, apenas validação de formato básico
  
  return { isValid: true, formatted: cleaned };
}

/**
 * Formata CPF
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanNumeric(cpf);
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanNumeric(cnpj);
  if (cleaned.length !== 14) return cnpj;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
}

/**
 * Formata CEP
 */
export function formatCEP(cep: string): string {
  const cleaned = cleanNumeric(cep);
  if (cleaned.length !== 8) return cep;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
}

/**
 * Formata telefone
 */
export function formatPhone(phone: string): string {
  const cleaned = cleanNumeric(phone);
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
  }
  return phone;
}
