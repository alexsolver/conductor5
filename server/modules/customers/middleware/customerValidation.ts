import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateCPF, validateCNPJ } from '../../../../shared/validators/brazilian-documents';

// Enhanced customer schema with comprehensive validation
export const baseCustomerSchema = z.object({
  firstName: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo')
    .transform(val => val.trim().replace(/\s+/g, ' ')), // Sanitize whitespace
  lastName: z.string()
    .min(1, 'Sobrenome é obrigatório')
    .max(100, 'Sobrenome muito longo')
    .transform(val => val.trim().replace(/\s+/g, ' ')),
  email: z.string()
    .email('Email inválido')
    .transform(val => val.toLowerCase().trim()),
  phone: z.string()
    .optional()
    .transform(val => val ? val.replace(/\D/g, '') : val), // Remove non-digits
  customerType: z.enum(['PF', 'PJ'], { required_error: 'Tipo de cliente é obrigatório' }),
  document: z.string()
    .optional()
    .transform(val => val ? val.replace(/\D/g, '') : val) // Remove formatting if present
    .refine((val, ctx) => {
      if (!val) return true; // Allow empty document
      const customerType = (ctx.parent as any).customerType;
      if (customerType === 'PF') {
        return validateCPF(val);
      } else if (customerType === 'PJ') {
        return validateCNPJ(val);
      }
      return true;
    }, 'Documento inválido para o tipo de cliente'),
  companyName: z.string()
    .optional()
    .transform(val => val ? val.trim().replace(/\s+/g, ' ') : val),
  isActive: z.boolean().optional().default(true),
  // Additional validation fields
  address: z.string().optional(),
  zipCode: z.string()
    .optional()
    .transform(val => val ? val.replace(/\D/g, '') : val)
    .refine(val => !val || /^\d{8}$/.test(val), 'CEP deve ter 8 dígitos'),
  city: z.string().optional(),
  state: z.string()
    .optional()
    .refine(val => !val || val.length === 2, 'Estado deve ter 2 caracteres'),
  country: z.string().optional().default('BR')
});

// Export the creation schema without document requirement
export const createCustomerSchema = baseCustomerSchema;


// Update customer validation schema (partial of base schema)
// Note: .partial() will make all fields optional, which might not be desired for certain updates.
// Consider creating a specific update schema if needed, or using .partial({ document: false }) for required fields.
export const updateCustomerSchema = baseCustomerSchema.partial();

// Validation middleware for CREATE operations with enhanced logging
export const validateCreateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { logInfo, logWarn } = await import('../../../utils/logger');

    // Log validation attempt
    logInfo('Customer validation started', {
      operation: 'CREATE',
      customerType: req.body?.customerType,
      hasDocument: !!req.body?.document,
      tenantId: (req as any).user?.tenantId
    });

    const validation = createCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      logWarn('Customer validation failed', {
        operation: 'CREATE',
        errors: validation.error.errors,
        tenantId: (req as any).user?.tenantId
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        validatorVersion: '2.0.0'
      });
    }

    // Log successful validation
    logInfo('Customer validation successful', {
      operation: 'CREATE',
      customerType: validation.data.customerType,
      tenantId: (req as any).user?.tenantId
    });

    req.body = validation.data;
    next();
  } catch (error) {
    const { logError } = await import('../../../utils/logger');
    logError('Customer validation error', error, {
      operation: 'CREATE',
      tenantId: (req as any).user?.tenantId
    });

    res.status(500).json({
      success: false,
      error: 'Validation error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};

// Validation middleware for UPDATE operations
export const validateUpdateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { logInfo, logWarn } = await import('../../../utils/logger');

    // Log validation attempt for update
    logInfo('Customer validation started', {
      operation: 'UPDATE',
      customerType: req.body?.customerType,
      hasDocument: !!req.body?.document,
      tenantId: (req as any).user?.tenantId
    });

    // Use updateCustomerSchema for partial updates
    const validation = updateCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      logWarn('Customer validation failed', {
        operation: 'UPDATE',
        errors: validation.error.errors,
        tenantId: (req as any).user?.tenantId
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        validatorVersion: '2.0.0'
      });
    }

    // Log successful validation for update
    logInfo('Customer validation successful', {
      operation: 'UPDATE',
      customerType: validation.data.customerType,
      tenantId: (req as any).user?.tenantId
    });

    // Merge validated data with existing data if necessary, or simply replace
    // For partial updates, it's common to merge. Zod's safeParse already returns the validated data.
    // The body of the request will contain only the fields that were present and passed validation.
    req.body = validation.data;
    next();
  } catch (error) {
    const { logError } = await import('../../../utils/logger');
    logError('Customer validation error', error, {
      operation: 'UPDATE',
      tenantId: (req as any).user?.tenantId
    });

    res.status(500).json({
      success: false,
      error: 'Validation error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};