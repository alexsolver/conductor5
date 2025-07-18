import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { storage } from '../storage';

const router = Router();

// Apply authentication middleware
router.use(jwtAuth);

// Validation schemas
const createSolicitanteSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
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
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  telefone: z.string().optional(),
  companyId: z.string().optional(),
  locationId: z.string().optional(),
  customerId: z.string().optional(),
  podeInteragir: z.boolean().default(false),
  tipoVinculo: z.enum(["colaborador", "gerente_local", "parceiro", "auditor", "outro"]).default("outro"),
  observacoes: z.string().optional(),
});

// Database storage integration - NO MORE IN-MEMORY DATA!

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

    // Fetch solicitantes from database (unified: customers with customerType = 'solicitante')
    const solicitantes = await storage.getSolicitantes(tenantId);

    console.log('Solicitantes fetched successfully from database', {
      context: {
        tenantId,
        count: solicitantes.length
      }
    });

    res.json({
      success: true,
      data: solicitantes,
      total: solicitantes.length
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
    
    // Create new solicitante using unified architecture (customers table with customerType = 'solicitante')
    const newSolicitante = await storage.createSolicitante(tenantId, validatedData);

    console.log('Solicitante created successfully in database', {
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

    // Fetch favorecidos from database
    const favorecidos = await storage.getFavorecidos(tenantId);

    console.log('Favorecidos fetched successfully from database', {
      context: {
        tenantId,
        count: favorecidos.length
      }
    });

    res.json({
      success: true,
      data: favorecidos,
      total: favorecidos.length
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
    
    // Create new favorecido in database using unified architecture (external_contacts table)
    const newFavorecido = await storage.createFavorecido(tenantId, validatedData);

    console.log('Favorecido created successfully in database', {
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