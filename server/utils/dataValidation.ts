import { z } from 'zod';

// Data validation utilities
export const locationValidationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  description: z.string().optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }),
  type: z.enum(['local', 'regiao', 'area', 'ponto']),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active')
});

export const regionValidationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  description: z.string().optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  estado: z.string().min(2).max(2),
  municipio: z.string().min(1).max(100),
  bairro: z.string().optional(),
  logradouro: z.string().optional()
});

export function validateLocationData(data: any) {
  return locationValidationSchema.safeParse(data);
}

export function validateRegionData(data: any) {
  return regionValidationSchema.safeParse(data);
}

export interface DataResult<T> {
  data: T[];
  isEmpty: boolean;
  hasError: boolean;
  errorType?: 'schema_missing' | 'permission_denied' | 'network_error' | 'unknown';
  errorMessage?: string;
  fallbackUsed: boolean;
}

export class DataValidator {
  static createResult<T>(
    data: T[], 
    error?: Error, 
    fallbackUsed: boolean = false
  ): DataResult<T> {
    return {
      data,
      isEmpty: data.length === 0 && !error,
      hasError: !!error,
      errorType: error ? this.categorizeError(error) : undefined,
      errorMessage: error?.message,
      fallbackUsed
    };
  }

  private static categorizeError(error: Error): 'schema_missing' | 'permission_denied' | 'network_error' | 'unknown' {
    const message = error.message.toLowerCase();

    if (message.includes('schema') || message.includes('table') || message.includes('column')) {
      return 'schema_missing';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission_denied';
    }
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return 'network_error';
    }

    return 'unknown';
  }

  static isRealError<T>(result: DataResult<T>): boolean {
    return result.hasError && !result.fallbackUsed;
  }
}