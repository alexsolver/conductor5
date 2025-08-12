/**
 * Brazilian Validation Service - Phase 13 Implementation
 * 
 * Serviço para validação de documentos brasileiros (CPF/CNPJ)
 * Infraestrutura pura sem dependências de domínio
 * 
 * @module BrazilianValidationService
 * @version 1.0.0
 * @created 2025-08-12 - Phase 13 Clean Architecture Implementation
 */

/**
 * Valida CPF brasileiro
 * @param cpf CPF para validar (com ou sem formatação)
 * @returns true se o CPF for válido
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let firstDigit = remainder >= 10 ? 0 : remainder;
  
  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;
  
  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let secondDigit = remainder >= 10 ? 0 : remainder;
  
  return parseInt(cleanCPF.charAt(10)) === secondDigit;
}

/**
 * Valida CNPJ brasileiro
 * @param cnpj CNPJ para validar (com ou sem formatação)
 * @returns true se o CNPJ for válido
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  
  // Remove formatação
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Calcula primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCNPJ.charAt(12)) !== firstDigit) return false;
  
  // Calcula segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCNPJ.charAt(13)) === secondDigit;
}

/**
 * Formata CPF com máscara
 * @param cpf CPF sem formatação
 * @returns CPF formatado (xxx.xxx.xxx-xx)
 */
export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return cpf;
  
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ com máscara
 * @param cnpj CNPJ sem formatação
 * @returns CNPJ formatado (xx.xxx.xxx/xxxx-xx)
 */
export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return cnpj;
  
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Remove formatação de CPF/CNPJ
 * @param document Documento com ou sem formatação
 * @returns Documento limpo (apenas números)
 */
export function cleanDocument(document: string): string {
  if (!document) return '';
  return document.replace(/[^\d]/g, '');
}

/**
 * Detecta se um documento é CPF ou CNPJ
 * @param document Documento para analisar
 * @returns 'CPF', 'CNPJ' ou 'UNKNOWN'
 */
export function detectDocumentType(document: string): 'CPF' | 'CNPJ' | 'UNKNOWN' {
  const clean = cleanDocument(document);
  
  if (clean.length === 11) return 'CPF';
  if (clean.length === 14) return 'CNPJ';
  
  return 'UNKNOWN';
}

/**
 * Valida documento brasileiro (CPF ou CNPJ automaticamente)
 * @param document Documento para validar
 * @returns true se o documento for válido
 */
export function validateBrazilianDocument(document: string): boolean {
  const type = detectDocumentType(document);
  
  switch (type) {
    case 'CPF':
      return validateCPF(document);
    case 'CNPJ':
      return validateCNPJ(document);
    default:
      return false;
  }
}

/**
 * Formata documento brasileiro com máscara apropriada
 * @param document Documento para formatar
 * @returns Documento formatado
 */
export function formatBrazilianDocument(document: string): string {
  const type = detectDocumentType(document);
  
  switch (type) {
    case 'CPF':
      return formatCPF(document);
    case 'CNPJ':
      return formatCNPJ(document);
    default:
      return document;
  }
}