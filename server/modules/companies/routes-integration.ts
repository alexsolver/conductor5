/**
 * COMPANIES MODULE - INTEGRATION ROUTE LAYER
 * Sistema de integração gradual entre legacy e Clean Architecture
 * Seguindo padrão estabelecido nos módulos Customers, Tickets, Users, Auth
 */

import { Router } from 'express';
import { AuthenticatedRequest, jwtAuth } from '../../middleware/jwtAuth';

// Legacy imports (legacy system)
import { companies } from '@shared/schema';
import { db } from '../../db';
import { eq, like, and, desc, asc, count } from 'drizzle-orm';

// Clean Architecture imports
import cleanCompaniesRouter from './routes-clean';

const companiesIntegrationRouter = Router();

// ==========================================
// CLEAN ARCHITECTURE ROUTES (PRIMARY)
// ==========================================

// Mount Clean Architecture routes at /v2 endpoint
companiesIntegrationRouter.use('/v2', cleanCompaniesRouter);

// ==========================================
// LEGACY COMPATIBILITY ROUTES
// ==========================================

// GET /api/companies - List companies (Legacy compatibility)
companiesIntegrationRouter.get('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required',
        code: 'TENANT_REQUIRED'
      });
    }

    const companiesList = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenantId, tenantId),
        eq(companies.isActive, true)
      ))
      .orderBy(asc(companies.name));

    const formattedCompanies = companiesList.map(company => ({
      id: company.id,
      tenantId: company.tenantId,
      name: company.name,
      displayName: company.displayName || company.name,
      description: company.description,
      email: company.email,
      phone: company.phone,
      address: company.address,
      taxId: company.taxId,
      registrationNumber: company.registrationNumber,
      size: company.size,
      subscriptionTier: company.subscriptionTier,
      status: company.status,
      isActive: company.isActive,
      createdAt: company.createdAt?.toISOString(),
      updatedAt: company.updatedAt?.toISOString()
    }));

    res.json({
      success: true,
      message: `Found ${companiesList.length} companies`,
      data: formattedCompanies,
      count: companiesList.length
    });
  } catch (error) {
    console.error('[COMPANIES-LIST-LEGACY]', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve companies',
      code: 'LIST_COMPANIES_ERROR'
    });
  }
});

// GET /api/companies/:id - Get company by ID (Legacy compatibility)
companiesIntegrationRouter.get('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const company = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.id, id),
        eq(companies.tenantId, tenantId || ''),
        eq(companies.isActive, true)
      ))
      .limit(1);

    if (company.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    const companyData = company[0];
    
    res.json({
      success: true,
      message: 'Company retrieved successfully',
      data: {
        id: companyData.id,
        tenantId: companyData.tenantId,
        name: companyData.name,
        displayName: companyData.displayName || companyData.name,
        description: companyData.description,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        taxId: companyData.taxId,
        registrationNumber: companyData.registrationNumber,
        size: companyData.size,
        subscriptionTier: companyData.subscriptionTier,
        status: companyData.status,
        isActive: companyData.isActive,
        createdAt: companyData.createdAt?.toISOString(),
        updatedAt: companyData.updatedAt?.toISOString()
      }
    });
  } catch (error) {
    console.error('[COMPANIES-GET-LEGACY]', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve company',
      code: 'GET_COMPANY_ERROR'
    });
  }
});

// POST /api/companies - Create company (Legacy compatibility)
companiesIntegrationRouter.post('/', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required',
        code: 'TENANT_REQUIRED'
      });
    }

    const {
      name,
      displayName,
      description,
      email,
      phone,
      address,
      taxId,
      registrationNumber,
      size,
      subscriptionTier,
      status = 'active'
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required',
        code: 'NAME_REQUIRED'
      });
    }

    const [newCompany] = await db
      .insert(companies)
      .values({
        tenantId,
        name: name.trim(),
        displayName: displayName?.trim() || name.trim(),
        description: description?.trim(),
        email: email?.toLowerCase().trim(),
        phone: phone?.replace(/\D/g, ''),
        address: address?.trim(),
        taxId: taxId?.replace(/\D/g, ''),
        registrationNumber: registrationNumber?.trim(),
        size: size || 'medium',
        subscriptionTier: subscriptionTier || 'basic',
        status,
        isActive: true,
        createdBy: req.user?.email,
        updatedBy: req.user?.email,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        id: newCompany.id,
        tenantId: newCompany.tenantId,
        name: newCompany.name,
        displayName: newCompany.displayName,
        description: newCompany.description,
        email: newCompany.email,
        phone: newCompany.phone,
        address: newCompany.address,
        taxId: newCompany.taxId,
        registrationNumber: newCompany.registrationNumber,
        size: newCompany.size,
        subscriptionTier: newCompany.subscriptionTier,
        status: newCompany.status,
        isActive: newCompany.isActive,
        createdAt: newCompany.createdAt?.toISOString(),
        updatedAt: newCompany.updatedAt?.toISOString()
      }
    });
  } catch (error) {
    console.error('[COMPANIES-CREATE-LEGACY]', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create company',
      code: 'CREATE_COMPANY_ERROR'
    });
  }
});

// PUT /api/companies/:id - Update company (Legacy compatibility)
companiesIntegrationRouter.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const existingCompany = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.id, id),
        eq(companies.tenantId, tenantId || ''),
        eq(companies.isActive, true)
      ))
      .limit(1);

    if (existingCompany.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    const {
      name,
      displayName,
      description,
      email,
      phone,
      address,
      size,
      subscriptionTier,
      status
    } = req.body;

    const updateData: any = {
      updatedBy: req.user?.email,
      updatedAt: new Date()
    };

    if (name) updateData.name = name.trim();
    if (displayName) updateData.displayName = displayName.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone.replace(/\D/g, '');
    if (address !== undefined) updateData.address = address?.trim();
    if (size) updateData.size = size;
    if (subscriptionTier) updateData.subscriptionTier = subscriptionTier;
    if (status) updateData.status = status;

    const [updatedCompany] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: {
        id: updatedCompany.id,
        tenantId: updatedCompany.tenantId,
        name: updatedCompany.name,
        displayName: updatedCompany.displayName,
        description: updatedCompany.description,
        email: updatedCompany.email,
        phone: updatedCompany.phone,
        address: updatedCompany.address,
        taxId: updatedCompany.taxId,
        registrationNumber: updatedCompany.registrationNumber,
        size: updatedCompany.size,
        subscriptionTier: updatedCompany.subscriptionTier,
        status: updatedCompany.status,
        isActive: updatedCompany.isActive,
        createdAt: updatedCompany.createdAt?.toISOString(),
        updatedAt: updatedCompany.updatedAt?.toISOString()
      }
    });
  } catch (error) {
    console.error('[COMPANIES-UPDATE-LEGACY]', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update company',
      code: 'UPDATE_COMPANY_ERROR'
    });
  }
});

// DELETE /api/companies/:id - Delete company (Soft delete - Legacy compatibility)
companiesIntegrationRouter.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const existingCompany = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.id, id),
        eq(companies.tenantId, tenantId || ''),
        eq(companies.isActive, true)
      ))
      .limit(1);

    if (existingCompany.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    await db
      .update(companies)
      .set({
        isActive: false,
        status: 'inactive',
        updatedBy: req.user?.email,
        updatedAt: new Date()
      })
      .where(eq(companies.id, id));

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('[COMPANIES-DELETE-LEGACY]', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete company',
      code: 'DELETE_COMPANY_ERROR'
    });
  }
});

// GET /api/companies/search/:term - Search companies (Legacy compatibility)
companiesIntegrationRouter.get('/search/:term', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { term } = req.params;
    const tenantId = req.user?.tenantId;

    const searchResults = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenantId, tenantId || ''),
        eq(companies.isActive, true),
        like(companies.name, `%${term}%`)
      ))
      .orderBy(asc(companies.name))
      .limit(50);

    const formattedResults = searchResults.map(company => ({
      id: company.id,
      tenantId: company.tenantId,
      name: company.name,
      displayName: company.displayName || company.name,
      description: company.description,
      email: company.email,
      phone: company.phone,
      address: company.address,
      taxId: company.taxId,
      size: company.size,
      status: company.status,
      createdAt: company.createdAt?.toISOString()
    }));

    res.json({
      success: true,
      message: `Found ${searchResults.length} companies matching "${term}"`,
      data: formattedResults,
      count: searchResults.length
    });
  } catch (error) {
    console.error('[COMPANIES-SEARCH-LEGACY]', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to search companies',
      code: 'SEARCH_COMPANIES_ERROR'
    });
  }
});

// ==========================================
// INTEGRATION STATUS ENDPOINT
// ==========================================

// GET /api/companies/health - Health check and architecture status
companiesIntegrationRouter.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Companies Integration Layer is operational',
    architecture: {
      legacy: {
        status: 'operational',
        endpoints: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id', 'GET /search/:term'],
        description: 'Direct database access for backward compatibility'
      },
      cleanArchitecture: {
        status: 'operational',
        prefix: '/v2',
        description: 'Full Clean Architecture implementation with domain/application/infrastructure layers',
        compliance: '1qa.md'
      }
    },
    migration: {
      status: 'gradual_integration',
      strategy: 'dual_system_approach',
      recommendation: 'Use /v2 endpoints for new development'
    },
    features: {
      multiTenancy: true,
      businessValidation: true,
      auditTrail: true,
      softDelete: true,
      search: true,
      filtering: true
    },
    timestamp: new Date().toISOString()
  });
});

export default companiesIntegrationRouter;