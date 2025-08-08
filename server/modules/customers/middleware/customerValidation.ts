
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateCPF, validateCNPJ } from '@shared/validators/brazilian-documents';

// Base customer validation schema (without refine for partial usage)
const baseCustomerSchemaFields = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Valid email is required").max(255),
  phone: z.string().max(50).optional(),
  mobilePhone: z.string().max(50).optional(),
  customerType: z.enum(['PF', 'PJ']).default('PF'),
  cpf: z.string().optional().refine((val) => {
    if (!val) return true;
    return validateCPF(val);
  }, "CPF inválido"),
  cnpj: z.string().optional().refine((val) => {
    if (!val) return true;
    return validateCNPJ(val);
  }, "CNPJ inválido"),
  companyName: z.string().max(255).optional(),
  contactPerson: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  addressNumber: z.string().max(50).optional(),
  complement: z.string().max(255).optional(),
  neighborhood: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(20).optional(),
  tags: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
  metadata: z.record(z.any()).default({})
});

// Export the creation schema with validation
export const createCustomerSchema = baseCustomerSchemaFields.refine((data) => {
  if (data.customerType === 'PF' && !data.cpf) {
    return false;
  }
  if (data.customerType === 'PJ' && !data.cnpj) {
    return false;
  }
  return true;
}, {
  message: "CPF é obrigatório para PF e CNPJ é obrigatório para PJ",
  path: ["customerType"]
});

// Update customer validation schema (partial of base schema)
export const updateCustomerSchema = baseCustomerSchemaFields.partial();

// Validation middleware
export const validateCreateCustomer = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = createCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: validation.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }
    req.body = validation.data;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Validation error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const validateUpdateCustomer = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = updateCustomerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: validation.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }
    req.body = validation.data;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Validation error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
