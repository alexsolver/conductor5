/**
 * Dynamic Validation System - Zod schemas baseados em configurações do banco
 * Substitui hard-coded enums por validações dinâmicas
 */

import { z } from 'zod';

// Cache para armazenar as opções dinâmicas
let fieldOptionsCache: Record<string, string[]> = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para buscar opções de campo da API
async function fetchFieldOptions(): Promise<Record<string, string[]>> {
  // Verificar cache
  if (fieldOptionsCache && Object.keys(fieldOptionsCache).length > 0 && 
      Date.now() - cacheTimestamp < CACHE_DURATION) {
    return fieldOptionsCache;
  }

  try {
    // Em ambiente de servidor Node.js
    if (typeof window === 'undefined') {
      // Para validações do servidor, usar opções padrão como fallback
      return {
        priority: ['low', 'medium', 'high', 'critical'],
        status: ['new', 'open', 'in_progress', 'resolved', 'closed'],
        impact: ['low', 'medium', 'high', 'critical'],
        urgency: ['low', 'medium', 'high'],
        contactType: ['email', 'phone', 'chat', 'portal'],
        callerType: ['user', 'customer'],
        beneficiaryType: ['user', 'customer']
      };
    }

    // Em ambiente do browser, buscar da API
    const response = await fetch('/api/ticket-config/field-options');
    const result = await response.json();
    
    if (result.success && result.data) {
      // Agrupar por fieldName
      const options: Record<string, string[]> = {};
      result.data.forEach((option: any) => {
        if (!options[option.fieldName]) {
          options[option.fieldName] = [];
        }
        if (option.value && !options[option.fieldName].includes(option.value)) {
          options[option.fieldName].push(option.value);
        }
      });
      
      fieldOptionsCache = options;
      cacheTimestamp = Date.now();
      return options;
    }
  } catch (error) {
    console.warn('Erro ao buscar field options, usando fallbacks:', error);
  }

  // Fallback para valores padrão se a API falhar
  const fallbackOptions = {
    priority: ['low', 'medium', 'high', 'critical'],
    status: ['new', 'open', 'in_progress', 'resolved', 'closed'],
    impact: ['low', 'medium', 'high', 'critical'],
    urgency: ['low', 'medium', 'high'],
    contactType: ['email', 'phone', 'chat', 'portal'],
    callerType: ['user', 'customer'],
    beneficiaryType: ['user', 'customer']
  };
  
  fieldOptionsCache = fallbackOptions;
  cacheTimestamp = Date.now();
  return fallbackOptions;
}

// Função para criar enum dinâmico
export function createDynamicEnum(fieldName: string, fallbackValues: string[]) {
  return z.string().refine(async (value) => {
    const options = await fetchFieldOptions();
    const validValues = options[fieldName] || fallbackValues;
    return validValues.includes(value);
  }, {
    message: `Valor inválido para ${fieldName}`
  }).or(z.enum(fallbackValues as [string, ...string[]])); // Fallback imediato
}

// Função síncrona para criar enum com validação mais flexível
export function createFlexibleEnum(fieldName: string, fallbackValues: string[]) {
  return z.string().refine((value) => {
    // Se temos cache válido, usar ele
    if (fieldOptionsCache && fieldOptionsCache[fieldName] && 
        Date.now() - cacheTimestamp < CACHE_DURATION) {
      return fieldOptionsCache[fieldName].includes(value);
    }
    // Senão, aceitar valores do fallback
    return fallbackValues.includes(value);
  }, {
    message: `Valor deve ser um dos seguintes: ${fallbackValues.join(', ')}`
  });
}

// Enums dinâmicos exportados
export const DynamicTicketPriorityEnum = createFlexibleEnum('priority', ['low', 'medium', 'high', 'critical']);
export const DynamicTicketStatusEnum = createFlexibleEnum('status', ['new', 'open', 'in_progress', 'resolved', 'closed']);
export const DynamicTicketImpactEnum = createFlexibleEnum('impact', ['low', 'medium', 'high', 'critical']);
export const DynamicTicketUrgencyEnum = createFlexibleEnum('urgency', ['low', 'medium', 'high']);
export const DynamicContactTypeEnum = createFlexibleEnum('contactType', ['email', 'phone', 'chat', 'portal']);
export const DynamicCallerTypeEnum = createFlexibleEnum('callerType', ['user', 'customer']);

// Função utilitária para invalidar cache
export function invalidateFieldOptionsCache() {
  fieldOptionsCache = {};
  cacheTimestamp = 0;
}

// Função para pré-carregar o cache (útil em inicialização)
export async function preloadFieldOptions() {
  try {
    await fetchFieldOptions();
    console.log('✅ Field options cache preloaded');
  } catch (error) {
    console.warn('⚠️ Failed to preload field options cache:', error);
  }
}