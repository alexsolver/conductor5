import { Router } from 'express';
import { eq, and, desc, ilike, isNull, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { 
  externalContacts, 
  extendedCustomers, 
  ticketExternalContacts,
  insertExternalContactSchema,
  insertExtendedCustomerSchema,
  insertTicketExternalContactSchema,
  type ExternalContact,
  type ExtendedCustomer,
  type TicketExternalContact
} from '@shared/schema';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requireTenantAccess } from '../middleware/rbacMiddleware';
import { schemaManager } from '../db';


const router = Router();

// Apply authentication and tenant access middleware
router.use(jwtAuth);
router.use(requireTenantAccess);

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

// GET /api/external-contacts/solicitantes - List all solicitantes
router.get('/solicitantes', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const db = await schemaManager.getTenantDatabase(tenantId);
    
    const { search, limit = 50, offset = 0 } = req.query;
    
    let query = db.select({
      id: extendedCustomers.id,
      firstName: extendedCustomers.firstName,
      lastName: extendedCustomers.lastName,
      email: extendedCustomers.email,
      phone: extendedCustomers.phone,
      documento: extendedCustomers.documento,
      tipoPessoa: extendedCustomers.tipoPessoa,
      company: extendedCustomers.company,
      companyId: extendedCustomers.companyId,
      locationId: extendedCustomers.locationId,
      preferenciaContato: extendedCustomers.preferenciaContato,
      idioma: extendedCustomers.idioma,
      observacoes: extendedCustomers.observacoes,
      active: extendedCustomers.active,
      verified: extendedCustomers.verified,
      createdAt: extendedCustomers.createdAt,
      updatedAt: extendedCustomers.updatedAt,
    })
    .from(extendedCustomers)
    .where(eq(extendedCustomers.tenantId, tenantId))
    .orderBy(desc(extendedCustomers.createdAt));

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        and(
          eq(extendedCustomers.tenantId, tenantId),
          // Use proper OR logic for search
          ilike(extendedCustomers.firstName, searchTerm)
        )
      );
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    
    if (limitNum > 0) {
      query = query.limit(limitNum).offset(offsetNum);
    }

    const solicitantes = await query;

    console.log('Solicitantes fetched successfully', {
      context: {
        tenantId,
        count: solicitantes.length,
        hasSearch: !!search
      }
    });

    res.json({
      success: true,
      data: solicitantes,
      total: solicitantes.length
    });
  } catch (error) {
    console.error('Failed to fetch solicitantes', {
      context: { tenantId: req.user?.tenantId, error: (error as Error).message }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// POST /api/external-contacts/solicitantes - Create new solicitante
router.post('/solicitantes', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const db = await schemaManager.getTenantDatabase(tenantId);
    
    const validatedData = createSolicitanteSchema.parse(req.body);
    
    const newSolicitante = await db.insert(extendedCustomers)
      .values({
        ...validatedData,
        tenantId,
      })
      .returning();

    console.log('Solicitante created successfully', {
      context: {
        tenantId,
        solicitanteId: newSolicitante[0].id,
        email: newSolicitante[0].email
      }
    });

    res.status(201).json({
      success: true,
      data: newSolicitante[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }

    console.error('Failed to create solicitante', {
      context: { tenantId: req.user?.tenantId, error: (error as Error).message }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// GET /api/external-contacts/favorecidos - List all favorecidos
router.get('/favorecidos', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const db = await schemaManager.getTenantDatabase(tenantId);
    
    const { search, limit = 50, offset = 0 } = req.query;
    
    let query = db.select({
      id: externalContacts.id,
      nome: externalContacts.nome,
      email: externalContacts.email,
      telefone: externalContacts.telefone,
      companyId: externalContacts.companyId,
      locationId: externalContacts.locationId,
      customerId: externalContacts.customerId,
      podeInteragir: externalContacts.podeInteragir,
      tipoVinculo: externalContacts.tipoVinculo,
      status: externalContacts.status,
      observacoes: externalContacts.observacoes,
      createdAt: externalContacts.createdAt,
      updatedAt: externalContacts.updatedAt,
    })
    .from(externalContacts)
    .where(eq(externalContacts.tenantId, tenantId))
    .orderBy(desc(externalContacts.createdAt));

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        and(
          eq(externalContacts.tenantId, tenantId),
          ilike(externalContacts.nome, searchTerm)
        )
      );
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    
    if (limitNum > 0) {
      query = query.limit(limitNum).offset(offsetNum);
    }

    const favorecidos = await query;

    console.log('Favorecidos fetched successfully', {
      context: {
        tenantId,
        count: favorecidos.length,
        hasSearch: !!search
      }
    });

    res.json({
      success: true,
      data: favorecidos,
      total: favorecidos.length
    });
  } catch (error) {
    console.error('Failed to fetch favorecidos', {
      context: { tenantId: req.user?.tenantId, error: (error as Error).message }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// POST /api/external-contacts/favorecidos - Create new favorecido
router.post('/favorecidos', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const db = await schemaManager.getTenantDatabase(tenantId);
    
    const validatedData = createFavorecidoSchema.parse(req.body);
    
    const newFavorecido = await db.insert(externalContacts)
      .values({
        ...validatedData,
        tenantId,
      })
      .returning();

    console.log('Favorecido created successfully', {
      context: {
        tenantId,
        favorecidoId: newFavorecido[0].id,
        email: newFavorecido[0].email
      }
    });

    res.status(201).json({
      success: true,
      data: newFavorecido[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }

    console.error('Failed to create favorecido', {
      context: { tenantId: req.user?.tenantId, error: (error as Error).message }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// GET /api/external-contacts/solicitantes/:id - Get specific solicitante
router.get('/solicitantes/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const db = await schemaManager.getTenantDatabase(tenantId);
    const { id } = req.params;
    
    const solicitante = await db.select()
      .from(extendedCustomers)
      .where(and(
        eq(extendedCustomers.id, id),
        eq(extendedCustomers.tenantId, tenantId)
      ))
      .limit(1);

    if (solicitante.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitante não encontrado'
      });
    }

    res.json({
      success: true,
      data: solicitante[0]
    });
  } catch (error) {
    console.error('Failed to fetch solicitante', {
      context: { tenantId: req.user?.tenantId, solicitanteId: req.params.id, error: (error as Error).message }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// GET /api/external-contacts/favorecidos/:id - Get specific favorecido
router.get('/favorecidos/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const db = await schemaManager.getTenantDatabase(tenantId);
    const { id } = req.params;
    
    const favorecido = await db.select()
      .from(externalContacts)
      .where(and(
        eq(externalContacts.id, id),
        eq(externalContacts.tenantId, tenantId)
      ))
      .limit(1);

    if (favorecido.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorecido não encontrado'
      });
    }

    res.json({
      success: true,
      data: favorecido[0]
    });
  } catch (error) {
    console.error('Failed to fetch favorecido', {
      context: { tenantId: req.user?.tenantId, favorecidoId: req.params.id, error: (error as Error).message }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

export default router;