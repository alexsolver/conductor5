/**
 * useCalculatedFields - Hook para campos calculados
 * 
 * Processa fórmulas matemáticas e atualiza campos automaticamente
 * Suporta: +, -, *, /, (), referências a campos {fieldName}
 * 
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { FormField } from '@shared/schema-internal-forms';

interface CalculatedFieldsProps {
  fields: FormField[];
  formData: Record<string, any>;
  onFieldUpdate: (fieldName: string, value: any) => void;
}

export function useCalculatedFields({ fields, formData, onFieldUpdate }: CalculatedFieldsProps) {
  
  useEffect(() => {
    // Filtra campos calculados
    const calculatedFields = fields.filter(f => f.calculated && f.formula);
    
    if (calculatedFields.length === 0) return;

    // Processa cada campo calculado
    calculatedFields.forEach(field => {
      if (!field.formula) return;

      try {
        const result = evaluateFormula(field.formula, formData);
        
        // Só atualiza se o valor mudou
        if (formData[field.name] !== result) {
          onFieldUpdate(field.name, result);
        }
      } catch (error) {
        console.error(`[CALCULATED-FIELD] Error in formula for ${field.name}:`, error);
      }
    });
  }, [fields, formData, onFieldUpdate]);
}

/**
 * Avalia uma fórmula matemática substituindo referências a campos
 * 
 * Exemplos:
 * - "{quantity} * {price}" → "10 * 50" → 500
 * - "{total} * 0.1" → "1000 * 0.1" → 100
 * - "{field1} + {field2} - {field3}" → "100 + 50 - 25" → 125
 */
function evaluateFormula(formula: string, formData: Record<string, any>): number | null {
  // Substitui referências a campos pelos valores
  let processedFormula = formula;
  
  // Encontra todas as referências {fieldName}
  const fieldReferences = formula.match(/\{([^}]+)\}/g) || [];
  
  for (const ref of fieldReferences) {
    const fieldName = ref.slice(1, -1); // Remove { e }
    const value = formData[fieldName];
    
    // Se o campo não existe ou não tem valor, retorna null
    if (value === undefined || value === null || value === '') {
      return null;
    }
    
    // Converte para número
    const numValue = parseFloat(String(value).replace(/[^\d.-]/g, ''));
    
    if (isNaN(numValue)) {
      console.warn(`[CALCULATED-FIELD] Campo ${fieldName} não é um número válido`);
      return null;
    }
    
    // Substitui a referência pelo valor
    processedFormula = processedFormula.replace(ref, String(numValue));
  }
  
  // Remove caracteres perigosos
  const safeFormula = processedFormula.replace(/[^0-9+\-*/().e\s]/g, '');
  
  if (safeFormula !== processedFormula) {
    console.warn(`[CALCULATED-FIELD] Fórmula contém caracteres não permitidos`);
    return null;
  }
  
  try {
    // Avalia a expressão matemática
    // eslint-disable-next-line no-eval
    const result = eval(safeFormula);
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      console.warn(`[CALCULATED-FIELD] Resultado inválido: ${result}`);
      return null;
    }
    
    // Arredonda para 2 casas decimais
    return Math.round(result * 100) / 100;
  } catch (error) {
    console.error(`[CALCULATED-FIELD] Erro ao avaliar fórmula:`, error);
    return null;
  }
}

/**
 * Valida se uma fórmula é válida
 */
export function validateFormula(formula: string, availableFields: string[]): { valid: boolean; error?: string } {
  // Verifica se tem referências
  const fieldReferences = formula.match(/\{([^}]+)\}/g) || [];
  
  if (fieldReferences.length === 0) {
    return { valid: false, error: 'Fórmula deve conter pelo menos uma referência a campo {fieldName}' };
  }
  
  // Verifica se todos os campos existem
  for (const ref of fieldReferences) {
    const fieldName = ref.slice(1, -1);
    
    if (!availableFields.includes(fieldName)) {
      return { valid: false, error: `Campo ${fieldName} não existe` };
    }
  }
  
  // Remove referências e valida sintaxe matemática
  let testFormula = formula;
  for (const ref of fieldReferences) {
    testFormula = testFormula.replace(ref, '1');
  }
  
  // Remove caracteres perigosos
  const safeFormula = testFormula.replace(/[^0-9+\-*/().e\s]/g, '');
  
  if (safeFormula !== testFormula) {
    return { valid: false, error: 'Fórmula contém caracteres não permitidos. Use apenas: +, -, *, /, (), números' };
  }
  
  try {
    // eslint-disable-next-line no-eval
    const result = eval(safeFormula);
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return { valid: false, error: 'Fórmula produz resultado inválido' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Sintaxe de fórmula inválida' };
  }
}

/**
 * Formata uma fórmula para exibição amigável
 */
export function formatFormula(formula: string): string {
  return formula
    .replace(/\{([^}]+)\}/g, '<$1>')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
}
