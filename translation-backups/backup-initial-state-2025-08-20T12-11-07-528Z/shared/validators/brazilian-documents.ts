// 🇧🇷 VALIDADORES DE DOCUMENTOS BRASILEIROS
// Implementação de validação para CPF, CNPJ e RG conforme padrões oficiais

/**
 * Valida CPF (Cadastro de Pessoas Físicas)
 * Formato esperado: 999.999.999-99 ou 99999999999
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return true; // Campo opcional

  // Remove formatação
  const numbers = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;
  
  return true;
}

/**
 * Valida CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * Formato esperado: 99.999.999/9999-99 ou 99999999999999
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return true; // Campo opcional

  // Remove formatação
  const numbers = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(numbers[12])) return false;
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(numbers[13])) return false;
  
  return true;
}

/**
 * Valida CPF ou CNPJ automaticamente baseado no tamanho
 * Formato: Aceita CPF (11 dígitos) ou CNPJ (14 dígitos)
 */
export function validateCpfCnpj(document: string): boolean {
  if (!document) return true; // Campo opcional
  
  const numbers = document.replace(/[^\d]/g, '');
  
  if (numbers.length === 11) {
    return validateCPF(document);
  } else if (numbers.length === 14) {
    return validateCNPJ(document);
  }
  
  return false; // Tamanho inválido
}

/**
 * Valida RG (Registro Geral)
 * Formato: Aceita vários formatos estaduais
 * RG não possui algoritmo de validação padrão nacional
 */
export function validateRG(rg: string): boolean {
  if (!rg) return true; // Campo opcional
  
  // Remove formatação
  const numbers = rg.replace(/[^\d]/g, '');
  
  // RG deve ter entre 7 e 12 dígitos (varia por estado)
  if (numbers.length < 7 || numbers.length > 12) return false;
  
  // Verifica se não são todos dígitos iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  return true;
}

/**
 * Formata CPF para exibição
 * Input: 99999999999 -> Output: 999.999.999-99
 */
export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/[^\d]/g, '');
  if (numbers.length !== 11) return cpf;
  
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ para exibição
 * Input: 99999999999999 -> Output: 99.999.999/9999-99
 */
export function formatCNPJ(cnpj: string): string {
  const numbers = cnpj.replace(/[^\d]/g, '');
  if (numbers.length !== 14) return cnpj;
  
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF ou CNPJ automaticamente
 */
export function formatCpfCnpj(document: string): string {
  const numbers = document.replace(/[^\d]/g, '');
  
  if (numbers.length === 11) {
    return formatCPF(document);
  } else if (numbers.length === 14) {
    return formatCNPJ(document);
  }
  
  return document; // Retorna sem formatação se inválido
}

/**
 * Detecta o tipo de documento
 */
export function getDocumentType(document: string): 'CPF' | 'CNPJ' | 'INVALID' {
  const numbers = document.replace(/[^\d]/g, '');
  
  if (numbers.length === 11) return 'CPF';
  if (numbers.length === 14) return 'CNPJ';
  return 'INVALID';
}

/**
 * Máscara para input em tempo real
 * Input: 1234567890 -> Output: 123.456.789-0x
 */
export function applyCpfCnpjMask(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');
  
  if (numbers.length <= 11) {
    // Aplica máscara de CPF
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (match, g1, g2, g3, g4) => {
      let result = g1;
      if (g2) result += '.' + g2;
      if (g3) result += '.' + g3;
      if (g4) result += '-' + g4;
      return result;
    });
  } else {
    // Aplica máscara de CNPJ
    return numbers.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (match, g1, g2, g3, g4, g5) => {
      let result = g1;
      if (g2) result += '.' + g2;
      if (g3) result += '.' + g3;
      if (g4) result += '/' + g4;
      if (g5) result += '-' + g5;
      return result;
    });
  }
}