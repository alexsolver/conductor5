/**
 * CLEAN ARCHITECTURE ROUTES - COMPANIES MODULE
 * Nova implementação seguindo Clean Architecture - 1qa.md compliance
 * Montado em /api/companies/v2/* para integração gradual
 */

import { Router } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../../middleware/jwtAuth';
import { CompanyController } from './application/controllers/CompanyController';
import { CompanyDomainService } from './domain/entities/Company';
import { CreateCompanyUseCase } from './application/use-cases/CreateCompanyUseCase';
import { UpdateCompanyUseCase } from './application/use-cases/UpdateCompanyUseCase';
import { FindCompanyUseCase } from './application/use-cases/FindCompanyUseCase';
import { DeleteCompanyUseCase } from './application/use-cases/DeleteCompanyUseCase';
import { DrizzleCompanyRepository } from './infrastructure/repositories/DrizzleCompanyRepository';
import { Response } from 'express';
import { schemaManager } from '../../core/schemaManager';
import { and, eq, desc } from 'drizzle-orm';

const cleanCompaniesRouter = Router();

// Dependency Injection Setup
const companyRepository = new DrizzleCompanyRepository();
const companyDomainService = new CompanyDomainService();

const createCompanyUseCase = new CreateCompanyUseCase(companyRepository, companyDomainService);
const updateCompanyUseCase = new UpdateCompanyUseCase(companyRepository, companyDomainService);
const findCompanyUseCase = new FindCompanyUseCase(companyRepository, companyDomainService);
const deleteCompanyUseCase = new DeleteCompanyUseCase(companyRepository, companyDomainService);

const companyController = new CompanyController(
  createCompanyUseCase,
  updateCompanyUseCase,
  findCompanyUseCase,
  deleteCompanyUseCase,
  companyDomainService
);

// ==========================================
// CLEAN ARCHITECTURE ROUTES - COMPANIES V2
// ==========================================

// GET /api/companies/v2/ - List all companies with filters and pagination
cleanCompaniesRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.listCompanies(req, res);
});

// GET /api/companies/v2/search - Search companies by term
cleanCompaniesRouter.get('/search', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.searchCompanies(req, res);
});

// GET /api/companies/v2/stats - Get company statistics
cleanCompaniesRouter.get('/stats', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.getCompanyStatistics(req, res);
});

// POST /api/companies/v2/ - Create new company
cleanCompaniesRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.createCompany(req, res);
});

// GET /api/companies/v2/:id - Get company by ID
cleanCompaniesRouter.get('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.getCompany(req, res);
});

// GET /api/companies/v2/:id/profile - Get company profile (extended info)
cleanCompaniesRouter.get('/:id/profile', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.getCompanyProfile(req, res);
});

// PUT /api/companies/v2/:id - Update company
cleanCompaniesRouter.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.updateCompany(req, res);
});

// DELETE /api/companies/v2/:id - Delete company (soft delete)
cleanCompaniesRouter.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.deleteCompany(req, res);
});

// POST /api/companies/v2/:id/restore - Restore deleted company
cleanCompaniesRouter.post('/:id/restore', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.restoreCompany(req, res);
});

// POST /api/companies/v2/bulk/update - Bulk update companies
cleanCompaniesRouter.post('/bulk/update', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.bulkUpdateCompanies(req, res);
});

// POST /api/companies/v2/validate/:type - Validate company data (create/update)
cleanCompaniesRouter.post('/validate/:type', jwtAuth, async (req: AuthenticatedRequest, res) => {
  await companyController.validateCompanyData(req, res);
});

// ==========================================
// SPECIALIZED QUERY ROUTES
// ==========================================

// GET /api/companies/v2/by-status/:status - Get companies by status
cleanCompaniesRouter.get('/by-status/:status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.params;
    const companies = await findCompanyUseCase.findByStatus(status, req.user?.tenantId || '');

    res.json({
      success: true,
      message: `Found ${companies.length} companies with status: ${status}`,
      data: companies,
      count: companies.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to find companies by status',
      code: 'FIND_BY_STATUS_ERROR'
    });
  }
});

// GET /api/companies/v2/by-size/:size - Get companies by size
cleanCompaniesRouter.get('/by-size/:size', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { size } = req.params;
    const companies = await findCompanyUseCase.findBySize(size, req.user?.tenantId || '');

    res.json({
      success: true,
      message: `Found ${companies.length} companies with size: ${size}`,
      data: companies,
      count: companies.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to find companies by size',
      code: 'FIND_BY_SIZE_ERROR'
    });
  }
});

// GET /api/companies/v2/by-subscription/:tier - Get companies by subscription tier
cleanCompaniesRouter.get('/by-subscription/:tier', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { tier } = req.params;
    const companies = await findCompanyUseCase.findBySubscription(tier, req.user?.tenantId || '');

    res.json({
      success: true,
      message: `Found ${companies.length} companies with subscription: ${tier}`,
      data: companies,
      count: companies.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to find companies by subscription',
      code: 'FIND_BY_SUBSCRIPTION_ERROR'
    });
  }
});

// GET /api/companies/v2/by-industry/:industry - Get companies by industry
cleanCompaniesRouter.get('/by-industry/:industry', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { industry } = req.params;
    const companies = await findCompanyUseCase.findByIndustry(industry, req.user?.tenantId || '');

    res.json({
      success: true,
      message: `Found ${companies.length} companies in industry: ${industry}`,
      data: companies,
      count: companies.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to find companies by industry',
      code: 'FIND_BY_INDUSTRY_ERROR'
    });
  }
});

// GET /api/companies/v2/by-location - Get companies by location (state/city)
cleanCompaniesRouter.get('/by-location', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { state, city } = req.query;
    const companies = await findCompanyUseCase.findByLocation(
      (state as string) || undefined,
      (city as string) || undefined,
      req.user?.tenantId
    );

    res.json({
      success: true,
      message: `Found ${companies.length} companies in location`,
      data: companies,
      count: companies.length,
      filters: { state, city }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to find companies by location',
      code: 'FIND_BY_LOCATION_ERROR'
    });
  }
});

// GET /api/companies/v2/recent/:days - Get recent companies
cleanCompaniesRouter.get('/recent/:days', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const companies = await findCompanyUseCase.findRecentCompanies(req.user?.tenantId || '', days);

    res.json({
      success: true,
      message: `Found ${companies.length} companies created in last ${days} days`,
      data: companies,
      count: companies.length,
      period: `${days} days`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to find recent companies',
      code: 'FIND_RECENT_ERROR'
    });
  }
});

// ==========================================
// VALIDATION AND UTILITY ROUTES
// ==========================================

// GET /api/companies/v2/check/cnpj/:cnpj - Check if CNPJ exists
cleanCompaniesRouter.get('/check/cnpj/:cnpj', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { cnpj } = req.params;
    const company = await findCompanyUseCase.findByCNPJ(cnpj, req.user?.tenantId || undefined);

    res.json({
      success: true,
      message: company ? 'CNPJ already exists' : 'CNPJ is available',
      data: {
        exists: !!company,
        cnpj: cnpj,
        company: company ? { id: company.id, name: company.name } : null
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to check CNPJ',
      code: 'CHECK_CNPJ_ERROR'
    });
  }
});

// GET /api/companies/v2/check/email/:email - Check if email exists
cleanCompaniesRouter.get('/check/email/:email', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { email } = req.params;
    const company = await findCompanyUseCase.findByEmail(email, req.user?.tenantId || undefined);

    res.json({
      success: true,
      message: company ? 'Email already exists' : 'Email is available',
      data: {
        exists: !!company,
        email: email,
        company: company ? { id: company.id, name: company.name } : null
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to check email',
      code: 'CHECK_EMAIL_ERROR'
    });
  }
});

// ==========================================
// HEALTH CHECK
// ==========================================

// GET /api/companies/v2/health - Health check for Clean Architecture implementation
cleanCompaniesRouter.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Companies Clean Architecture v2 is operational',
    version: '2.0.0',
    architecture: 'Clean Architecture',
    compliance: '1qa.md',
    features: [
      'Domain-driven design',
      'Brazilian CNPJ validation',
      'Multi-tenant isolation',
      'Business rule enforcement',
      'Advanced filtering & search',
      'Comprehensive statistics',
      'Bulk operations',
      'Data validation',
      'Audit trail support'
    ],
    endpoints: {
      crud: ['GET /', 'POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id'],
      specialized: [
        'GET /search', 'GET /stats', 'GET /:id/profile',
        'GET /by-status/:status', 'GET /by-size/:size',
        'GET /by-subscription/:tier', 'GET /by-industry/:industry',
        'GET /by-location', 'GET /recent/:days'
      ],
      validation: ['POST /validate/:type', 'GET /check/cnpj/:cnpj', 'GET /check/email/:email'],
      bulk: ['POST /bulk/update', 'POST /:id/restore']
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/companies - Get all companies for tenant
const router = Router(); // Assuming 'router' is intended to be used here based on the provided change.
router.get('/', jwtAuth, async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const { db: tenantDb, schema: tenantSchema } = await schemaManager.getTenantDb(tenantId);
    const { companies } = tenantSchema;

    const allCompanies = await tenantDb
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenantId, tenantId),
        eq(companies.isActive, true)
      ))
      .orderBy(desc(companies.createdAt));

    res.json({
      success: true,
      data: allCompanies
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;