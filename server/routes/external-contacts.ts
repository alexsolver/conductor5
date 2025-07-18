import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// Validation schemas
const createSolicitanteSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  documento: z.string().optional(),
  tipoPessoa: z.enum(["fisica", "juridica"]).default("fisica"),
  companyId: z.string().optional(),
  locationId: z.string().optional(),
  preferenciaContato: z.enum(["email", "telefone", "ambos"]).default("email"),
  idioma: z.string().default("pt-BR"),
  observacoes: z.string().optional(),
});

const createFavorecidoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  companyId: z.string().optional(),
  locationId: z.string().optional(),
  customerId: z.string().optional(),
  podeInteragir: z.boolean().default(false),
  tipoVinculo: z.enum(["colaborador", "gerente_local", "parceiro", "auditor", "outro"]).default("outro"),
  observacoes: z.string().optional(),
});

// In-memory storage for demo purposes
const solicitantesStorage: any[] = [];
const favorecidosStorage: any[] = [];

// GET /api/external-contacts/solicitantes - List all solicitantes
router.get('/solicitantes', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "TenantId é obrigatório"
      });
    }

    // Filter by tenant
    const tenantSolicitantes = solicitantesStorage.filter(s => s.tenantId === tenantId);

    console.log('Solicitantes fetched successfully', {
      context: {
        tenantId,
        count: tenantSolicitantes.length
      }
    });

    res.json({
      success: true,
      data: tenantSolicitantes,
      total: tenantSolicitantes.length
    });

  } catch (error) {
    console.error('Error fetching solicitantes:', error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// POST /api/external-contacts/solicitantes - Create new solicitante
router.post('/solicitantes', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "TenantId é obrigatório"
      });
    }
    
    const validatedData = createSolicitanteSchema.parse(req.body);
    
    // Create new solicitante
    const newSolicitante = {
      id: crypto.randomUUID(),
      ...validatedData,
      tenantId,
      active: true,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to storage
    solicitantesStorage.push(newSolicitante);

    console.log('Solicitante created successfully', {
      context: {
        tenantId,
        solicitanteId: newSolicitante.id,
        email: newSolicitante.email
      }
    });

    res.status(201).json({
      success: true,
      data: newSolicitante,
      message: "Solicitante criado com sucesso"
    });

  } catch (error) {
    console.error('Failed to create solicitante', {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: {
        tenantId: req.user?.tenantId,
        requestBody: req.body
      }
    });
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// GET /api/external-contacts/favorecidos - List all favorecidos
router.get('/favorecidos', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "TenantId é obrigatório"
      });
    }

    // Filter by tenant
    const tenantFavorecidos = favorecidosStorage.filter(f => f.tenantId === tenantId);

    console.log('Favorecidos fetched successfully', {
      context: {
        tenantId,
        count: tenantFavorecidos.length
      }
    });

    res.json({
      success: true,
      data: tenantFavorecidos,
      total: tenantFavorecidos.length
    });

  } catch (error) {
    console.error('Error fetching favorecidos:', error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// POST /api/external-contacts/favorecidos - Create new favorecido
router.post('/favorecidos', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "TenantId é obrigatório"
      });
    }
    
    const validatedData = createFavorecidoSchema.parse(req.body);
    
    // Create new favorecido
    const newFavorecido = {
      id: crypto.randomUUID(),
      ...validatedData,
      tenantId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to storage
    favorecidosStorage.push(newFavorecido);

    console.log('Favorecido created successfully', {
      context: {
        tenantId,
        favorecidoId: newFavorecido.id,
        email: newFavorecido.email
      }
    });

    res.status(201).json({
      success: true,
      data: newFavorecido,
      message: "Favorecido criado com sucesso"
    });

  } catch (error) {
    console.error('Failed to create favorecido', {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: {
        tenantId: req.user?.tenantId,
        requestBody: req.body
      }
    });
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

export default router;