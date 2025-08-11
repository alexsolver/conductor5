/**
 * Customer Company Controller
 * Clean Architecture - Application Layer
 * Handles HTTP requests for customer company operations
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateCompanyUseCase } from '../use-cases/CreateCompanyUseCase';
import { GetCompaniesUseCase } from '../use-cases/GetCompaniesUseCase';
import { UpdateCompanyUseCase } from '../use-cases/UpdateCompanyUseCase';
import { ManageCompanyMembershipUseCase } from '../use-cases/ManageCompanyMembershipUseCase';

// Request validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  website: z.string().optional().refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
    message: "Invalid URL format"
  }),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  subscriptionTier: z.enum(['basic', 'premium', 'enterprise']).optional(),
});

const updateCompanySchema = createCompanySchema.partial().extend({
  contractType: z.enum(['monthly', 'yearly', 'custom']).optional(),
  maxUsers: z.number().min(1).optional(),
  maxTickets: z.number().min(1).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
  isActive: z.boolean().optional(),
});

const addMembershipSchema = z.object({
  customerId: z.string().uuid(),
  companyId: z.string().uuid(),
  role: z.enum(['member', 'admin', 'owner', 'contact']).optional(),
  title: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
  permissions: z.object({
    canCreateTickets: z.boolean().optional(),
    canViewAllTickets: z.boolean().optional(),
    canManageUsers: z.boolean().optional(),
    canViewBilling: z.boolean().optional(),
    canManageSettings: z.boolean().optional(),
  }).optional(),
  isPrimary: z.boolean().optional(),
});

const updateMembershipSchema = z.object({
  role: z.enum(['member', 'admin', 'owner', 'contact']).optional(),
  title: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
  permissions: z.object({
    canCreateTickets: z.boolean().optional(),
    canViewAllTickets: z.boolean().optional(),
    canManageUsers: z.boolean().optional(),
    canViewBilling: z.boolean().optional(),
    canManageSettings: z.boolean().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

const queryParamsSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
  subscriptionTier: z.enum(['basic', 'premium', 'enterprise']).optional(),
  isActive: z.string().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly getCompaniesUseCase: GetCompaniesUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly manageMembershipUseCase: ManageCompanyMembershipUseCase
  ) {}

  async createCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const validatedData = createCompanySchema.parse(req.body);

      const result = await this.createCompanyUseCase.execute({
        tenantId: req.user.tenantId,
        createdBy: req.user.id,
        ...validatedData,
      });

      const { logInfo } = await import('../../../../utils/logger');
      logInfo('Customer company created successfully', {
        companyId: result.company.getId(),
        tenantId: req.user.tenantId,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: {
          id: result.company.getId(),
          name: result.company.getName(),
          displayName: result.company.getDisplayName(),
          description: result.company.getDescription(),
          industry: result.company.getIndustry(),
          size: result.company.getSize(),
          email: result.company.getEmail(),
          phone: result.company.getPhone(),
          website: result.company.getWebsite(),
          address: result.company.getAddress(),
          subscriptionTier: result.company.getSubscriptionTier(),
          contractType: result.company.getContractType(),
          maxUsers: result.company.getMaxUsers(),
          maxTickets: result.company.getMaxTickets(),
          status: result.company.getStatus(),
          isActive: result.company.isActiveCompany(),
          createdAt: result.company.getCreatedAt(),
          updatedAt: result.company.getUpdatedAt(),
        },
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to create customer company', error, {
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create customer company',
      });
    }
  }

  async getCompanies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const validatedQuery = queryParamsSchema.parse(req.query);

      const result = await this.getCompaniesUseCase.execute({
        tenantId: req.user.tenantId,
        ...validatedQuery,
      });

      const companiesData = result.companies.map(company => ({
        id: company.getId(),
        name: company.getName(),
        displayName: company.getDisplayName(),
        description: company.getDescription(),
        industry: company.getIndustry(),
        size: company.getSize(),
        email: company.getEmail(),
        phone: company.getPhone(),
        website: company.getWebsite(),
        subscriptionTier: company.getSubscriptionTier(),
        contractType: company.getContractType(),
        status: company.getStatus(),
        isActive: company.isActiveCompany(),
        createdAt: company.getCreatedAt(),
        updatedAt: company.getUpdatedAt(),
      }));

      res.json({
        success: true,
        data: companiesData,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to get customer companies', error, {
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve customer companies',
      });
    }
  }

  async getCompanyById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      // Use the get companies use case with specific ID filter
      const result = await this.getCompaniesUseCase.execute({
        tenantId: req.user.tenantId,
        search: id, // This will search by ID in the repository
        limit: 1,
      });

      if (result.companies.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Company not found',
        });
        return;
      }

      const company = result.companies[0];

      res.json({
        success: true,
        data: {
          id: company.getId(),
          name: company.getName(),
          displayName: company.getDisplayName(),
          description: company.getDescription(),
          industry: company.getIndustry(),
          size: company.getSize(),
          email: company.getEmail(),
          phone: company.getPhone(),
          website: company.getWebsite(),
          address: company.getAddress(),
          subscriptionTier: company.getSubscriptionTier(),
          contractType: company.getContractType(),
          maxUsers: company.getMaxUsers(),
          maxTickets: company.getMaxTickets(),
          status: company.getStatus(),
          isActive: company.isActiveCompany(),
          createdAt: company.getCreatedAt(),
          updatedAt: company.getUpdatedAt(),
        },
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to get customer company by ID', error, {
        companyId: req.params.id,
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve customer company',
      });
    }
  }

  async updateCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const { id } = req.params;
      const validatedData = updateCompanySchema.parse(req.body);

      const result = await this.updateCompanyUseCase.execute({
        id,
        tenantId: req.user.tenantId,
        updatedBy: req.user.id,
        ...validatedData,
      });

      const { logInfo } = await import('../../../../utils/logger');
      logInfo('Customer company updated successfully', {
        companyId: result.company.getId(),
        tenantId: req.user.tenantId,
        userId: req.user.id,
      });

      res.json({
        success: true,
        data: {
          id: result.company.getId(),
          name: result.company.getName(),
          displayName: result.company.getDisplayName(),
          description: result.company.getDescription(),
          industry: result.company.getIndustry(),
          size: result.company.getSize(),
          email: result.company.getEmail(),
          phone: result.company.getPhone(),
          website: result.company.getWebsite(),
          address: result.company.getAddress(),
          subscriptionTier: result.company.getSubscriptionTier(),
          contractType: result.company.getContractType(),
          maxUsers: result.company.getMaxUsers(),
          maxTickets: result.company.getMaxTickets(),
          status: result.company.getStatus(),
          isActive: result.company.isActiveCompany(),
          createdAt: result.company.getCreatedAt(),
          updatedAt: result.company.getUpdatedAt(),
        },
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to update customer company', error, {
        companyId: req.params.id,
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update customer company',
      });
    }
  }

  async deleteCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const { id } = req.params;

      // For now, we'll use a simple approach - find and check if exists
      const companies = await this.getCompaniesUseCase.execute({
        tenantId: req.user.tenantId,
        search: id,
        limit: 1,
      });

      if (companies.companies.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Company not found',
        });
        return;
      }

      // Delete functionality implementation in progress - requires cleanup of related data
      res.status(501).json({
        success: false,
        message: 'Delete functionality not implemented yet',
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to delete customer company', error, {
        companyId: req.params.id,
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete customer company',
      });
    }
  }

  // Membership Management Endpoints
  async addMembership(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const validatedData = addMembershipSchema.parse(req.body);

      const result = await this.manageMembershipUseCase.addMembership({
        tenantId: req.user.tenantId,
        addedBy: req.user.id,
        ...validatedData,
      });

      const { logInfo } = await import('../../../../utils/logger');
      logInfo('Customer company membership added successfully', {
        membershipId: result.membership.getId(),
        customerId: result.membership.getCustomerId(),
        companyId: result.membership.getCompanyId(),
        tenantId: req.user.tenantId,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: {
          id: result.membership.getId(),
          customerId: result.membership.getCustomerId(),
          companyId: result.membership.getCompanyId(),
          role: result.membership.getRole(),
          title: result.membership.getTitle(),
          department: result.membership.getDepartment(),
          permissions: result.membership.getPermissions(),
          isActive: result.membership.isActiveMembership(),
          isPrimary: result.membership.isPrimaryMembership(),
          joinedAt: result.membership.getJoinedAt(),
        },
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to add customer company membership', error, {
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add membership',
      });
    }
  }

  async updateMembership(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const { membershipId } = req.params;
      const validatedData = updateMembershipSchema.parse(req.body);

      const result = await this.manageMembershipUseCase.updateMembership({
        membershipId,
        ...validatedData,
      });

      const { logInfo } = await import('../../../../utils/logger');
      logInfo('Customer company membership updated successfully', {
        membershipId: result.membership.getId(),
        tenantId: req.user.tenantId,
        userId: req.user.id,
      });

      res.json({
        success: true,
        data: {
          id: result.membership.getId(),
          customerId: result.membership.getCustomerId(),
          companyId: result.membership.getCompanyId(),
          role: result.membership.getRole(),
          title: result.membership.getTitle(),
          department: result.membership.getDepartment(),
          permissions: result.membership.getPermissions(),
          isActive: result.membership.isActiveMembership(),
          isPrimary: result.membership.isPrimaryMembership(),
          joinedAt: result.membership.getJoinedAt(),
          leftAt: result.membership.getLeftAt(),
        },
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to update customer company membership', error, {
        membershipId: req.params.membershipId,
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update membership',
      });
    }
  }

  async getCustomerMemberships(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const { customerId } = req.params;

      const memberships = await this.manageMembershipUseCase.getCustomerMemberships(
        customerId,
        req.user.tenantId
      );

      const membershipData = memberships.map(membership => ({
        id: membership.getId(),
        customerId: membership.getCustomerId(),
        companyId: membership.getCompanyId(),
        role: membership.getRole(),
        title: membership.getTitle(),
        department: membership.getDepartment(),
        permissions: membership.getPermissions(),
        isActive: membership.isActiveMembership(),
        isPrimary: membership.isPrimaryMembership(),
        joinedAt: membership.getJoinedAt(),
        leftAt: membership.getLeftAt(),
      }));

      res.json({
        success: true,
        data: membershipData,
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to get customer memberships', error, {
        customerId: req.params.customerId,
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve customer memberships',
      });
    }
  }

  async getCompanyMemberships(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.tenantId) {
        res.status(401).json({ message: 'Tenant context required' });
        return;
      }

      const { companyId } = req.params;

      const memberships = await this.manageMembershipUseCase.getCompanyMemberships(
        companyId,
        req.user.tenantId
      );

      const membershipData = memberships.map(membership => ({
        id: membership.getId(),
        customerId: membership.getCustomerId(),
        companyId: membership.getCompanyId(),
        role: membership.getRole(),
        title: membership.getTitle(),
        department: membership.getDepartment(),
        permissions: membership.getPermissions(),
        isActive: membership.isActiveMembership(),
        isPrimary: membership.isPrimaryMembership(),
        joinedAt: membership.getJoinedAt(),
        leftAt: membership.getLeftAt(),
      }));

      res.json({
        success: true,
        data: membershipData,
      });
    } catch (error: unknown) {
      const { logError } = await import('../../../../utils/logger');
      logError('Failed to get company memberships', error, {
        companyId: req.params.companyId,
        tenantId: req.user?.tenantId,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve company memberships',
      });
    }
  }
}