/**
 * Person Controller - Phase 13 Implementation
 * 
 * Controlador para operações de pessoas
 * Camada de aplicação seguindo Clean Architecture
 * 
 * @module PersonController
 * @version 1.0.0
 * @created 2025-08-12 - Phase 13 Clean Architecture Implementation
 */

import type { Request, Response } from 'express';
import type { IPersonRepository } from '../../domain/repositories/IPersonRepository';
import { Person, PersonEntity } from '../../domain/entities/Person';

// AuthenticatedRequest type definition
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

import { z } from 'zod';

// Validation schemas
const createPersonSchema = z.object({
  personType: z.enum(['natural', 'legal'], {
    errorMap: () => ({ message: 'Tipo deve ser "natural" (PF) ou "legal" (PJ)' })
  }),
  firstName: z.string().min(1, 'Nome/Razão social é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  lastName: z.string().max(100, 'Sobrenome deve ter no máximo 100 caracteres').optional(),
  companyName: z.string().max(100, 'Nome da empresa deve ter no máximo 100 caracteres').optional(),
  email: z.string().email('Email inválido').max(255, 'Email deve ter no máximo 255 caracteres').optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  cellPhone: z.string().max(20, 'Celular deve ter no máximo 20 caracteres').optional(),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  rg: z.string().max(20, 'RG deve ter no máximo 20 caracteres').optional(),
  birthDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  address: z.object({
    street: z.string().max(255, 'Rua deve ter no máximo 255 caracteres').optional(),
    number: z.string().max(20, 'Número deve ter no máximo 20 caracteres').optional(),
    complement: z.string().max(100, 'Complemento deve ter no máximo 100 caracteres').optional(),
    neighborhood: z.string().max(100, 'Bairro deve ter no máximo 100 caracteres').optional(),
    city: z.string().max(100, 'Cidade deve ter no máximo 100 caracteres').optional(),
    state: z.string().max(2, 'Estado deve ter 2 caracteres').optional(),
    zipCode: z.string().max(10, 'CEP deve ter no máximo 10 caracteres').optional(),
    country: z.string().max(50, 'País deve ter no máximo 50 caracteres').optional()
  }).optional(),
  contactPerson: z.string().max(100, 'Pessoa de contato deve ter no máximo 100 caracteres').optional(),
  contactPhone: z.string().max(20, 'Telefone de contato deve ter no máximo 20 caracteres').optional(),
  notes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
  tags: z.array(z.string().max(50, 'Tag deve ter no máximo 50 caracteres')).default([]),
  metadata: z.record(z.any()).optional()
});

const updatePersonSchema = createPersonSchema.partial();

const searchPersonSchema = z.object({
  query: z.string().min(1, 'Query de busca é obrigatória').max(100, 'Query deve ter no máximo 100 caracteres'),
  personType: z.enum(['natural', 'legal']).optional(),
  isActive: z.boolean().optional()
});

const tagOperationSchema = z.object({
  tag: z.string().min(1, 'Tag é obrigatória').max(50, 'Tag deve ter no máximo 50 caracteres')
});

export class PersonController {
  constructor(private personRepository: IPersonRepository) {}

  /**
   * Create person
   * POST /api/people-integration/working/people
   */
  async createPerson(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      // Validate input
      const personData = createPersonSchema.parse(req.body);

      // Additional business validation
      if (personData.personType === 'natural') {
        if (!personData.lastName) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Sobrenome é obrigatório para pessoa física'
          });
          return;
        }
        if (personData.companyName) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Nome da empresa não deve ser preenchido para pessoa física'
          });
          return;
        }
      } else {
        if (!personData.companyName) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: 'Nome da empresa é obrigatório para pessoa jurídica'
          });
          return;
        }
      }

      // Check for duplicate email
      if (personData.email) {
        const existingByEmail = await this.personRepository.existsByEmail(personData.email, tenantId);
        if (existingByEmail) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `Email '${personData.email}' já está em uso`
          });
          return;
        }
      }

      // Check for duplicate document
      const document = personData.cpf || personData.cnpj;
      if (document) {
        const existingByDoc = await this.personRepository.existsByDocument(document, tenantId);
        if (existingByDoc) {
          const docType = personData.cpf ? 'CPF' : 'CNPJ';
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `${docType} '${document}' já está em uso`
          });
          return;
        }
      }

      // Create person entity
      const personEntity = PersonEntity.create({
        tenantId,
        ...personData,
        createdBy: req.user?.id
      });

      // Convert to Person interface
      const person: Person = {
        id: personEntity.id,
        tenantId: personEntity.tenantId,
        personType: personEntity.personType,
        firstName: personEntity.firstName,
        lastName: personEntity.lastName || undefined,
        companyName: personEntity.companyName || undefined,
        email: personEntity.email || undefined,
        phone: personEntity.phone || undefined,
        cellPhone: personEntity.cellPhone || undefined,
        cpf: personEntity.cpf || undefined,
        cnpj: personEntity.cnpj || undefined,
        rg: personEntity.rg || undefined,
        birthDate: personEntity.birthDate || undefined,
        address: personEntity.address || undefined,
        contactPerson: personEntity.contactPerson || undefined,
        contactPhone: personEntity.contactPhone || undefined,
        notes: personEntity.notes || undefined,
        tags: personEntity.tags,
        isActive: personEntity.isActive,
        metadata: personEntity.metadata || undefined,
        createdAt: personEntity.createdAt,
        updatedAt: personEntity.updatedAt,
        createdBy: personEntity.createdBy || undefined,
        updatedBy: personEntity.updatedBy || undefined
      };

      // Save to repository
      const createdPerson = await this.personRepository.create(person);

      res.status(201).json({
        success: true,
        data: createdPerson,
        message: 'Pessoa criada com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[PERSON-CONTROLLER] Error creating person:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao criar pessoa'
      });
    }
  }

  /**
   * Get people
   * GET /api/people-integration/working/people
   */
  async getPeople(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { personType, isActive, search, hasEmail, hasPhone, hasDocument, tags, city, state } = req.query;

      const filters = {
        tenantId,
        ...(personType && { personType: personType as 'natural' | 'legal' }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(search && { search: search as string }),
        ...(hasEmail !== undefined && { hasEmail: hasEmail === 'true' }),
        ...(hasPhone !== undefined && { hasPhone: hasPhone === 'true' }),
        ...(hasDocument !== undefined && { hasDocument: hasDocument === 'true' }),
        ...(tags && { tags: Array.isArray(tags) ? tags as string[] : [tags as string] }),
        ...(city && { city: city as string }),
        ...(state && { state: state as string })
      };

      const people = await this.personRepository.findAll(filters);

      res.json({
        success: true,
        data: people,
        pagination: {
          page: 1,
          limit: 100,
          total: people.length,
          totalPages: 1
        },
        message: 'Pessoas recuperadas com sucesso'
      });

    } catch (error) {
      console.error('[PERSON-CONTROLLER] Error fetching people:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar pessoas'
      });
    }
  }

  /**
   * Get person by ID
   * GET /api/people-integration/working/people/:id
   */
  async getPersonById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      const person = await this.personRepository.findById(id, tenantId);
      if (!person) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Pessoa não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: person,
        message: 'Pessoa encontrada com sucesso'
      });

    } catch (error) {
      console.error('[PERSON-CONTROLLER] Error fetching person:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar pessoa'
      });
    }
  }

  /**
   * Update person
   * PUT /api/people-integration/working/people/:id
   */
  async updatePerson(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      // Validate input
      const updateData = updatePersonSchema.parse(req.body);

      // Check if person exists
      const existingPerson = await this.personRepository.findById(id, tenantId);
      if (!existingPerson) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Pessoa não encontrada'
        });
        return;
      }

      // Check for duplicate email (if email is being updated)
      if (updateData.email && updateData.email !== existingPerson.email) {
        const existingByEmail = await this.personRepository.existsByEmail(updateData.email, tenantId, id);
        if (existingByEmail) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `Email '${updateData.email}' já está em uso`
          });
          return;
        }
      }

      // Check for duplicate document (if document is being updated)
      const newDocument = updateData.cpf || updateData.cnpj;
      const currentDocument = existingPerson.cpf || existingPerson.cnpj;
      if (newDocument && newDocument !== currentDocument) {
        const existingByDoc = await this.personRepository.existsByDocument(newDocument, tenantId, id);
        if (existingByDoc) {
          const docType = updateData.cpf ? 'CPF' : 'CNPJ';
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `${docType} '${newDocument}' já está em uso`
          });
          return;
        }
      }

      // Update person
      const updatedPerson = await this.personRepository.update(id, tenantId, {
        ...updateData,
        updatedBy: req.user?.id,
        updatedAt: new Date()
      });

      if (!updatedPerson) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Pessoa não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedPerson,
        message: 'Pessoa atualizada com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[PERSON-CONTROLLER] Error updating person:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao atualizar pessoa'
      });
    }
  }

  /**
   * Delete person
   * DELETE /api/people-integration/working/people/:id
   */
  async deletePerson(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;

      const deleted = await this.personRepository.delete(id, tenantId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Pessoa não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Pessoa desativada com sucesso'
      });

    } catch (error) {
      console.error('[PERSON-CONTROLLER] Error deleting person:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao desativar pessoa'
      });
    }
  }

  /**
   * Search people
   * GET /api/people-integration/working/search
   */
  async searchPeople(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const searchParams = searchPersonSchema.parse(req.query);

      const people = await this.personRepository.search(searchParams.query, tenantId, {
        personType: searchParams.personType,
        isActive: searchParams.isActive
      });

      res.json({
        success: true,
        data: people,
        count: people.length,
        message: 'Busca realizada com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[PERSON-CONTROLLER] Error searching people:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha na busca'
      });
    }
  }

  /**
   * Get person statistics
   * GET /api/people-integration/working/statistics
   */
  async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const statistics = await this.personRepository.getStatistics(tenantId);

      res.json({
        success: true,
        data: statistics,
        message: 'Estatísticas recuperadas com sucesso'
      });

    } catch (error) {
      console.error('[PERSON-CONTROLLER] Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao buscar estatísticas'
      });
    }
  }

  /**
   * Add tag to person
   * POST /api/people-integration/working/people/:id/tags
   */
  async addTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;
      const { tag } = tagOperationSchema.parse(req.body);

      const success = await this.personRepository.addTag(id, tenantId, tag, req.user?.id);
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Pessoa não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Tag adicionada com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[PERSON-CONTROLLER] Error adding tag:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao adicionar tag'
      });
    }
  }

  /**
   * Remove tag from person
   * DELETE /api/people-integration/working/people/:id/tags
   */
  async removeTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Tenant ID not found'
        });
        return;
      }

      const { id } = req.params;
      const { tag } = tagOperationSchema.parse(req.body);

      const success = await this.personRepository.removeTag(id, tenantId, tag, req.user?.id);
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Pessoa não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Tag removida com sucesso'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('[PERSON-CONTROLLER] Error removing tag:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Falha ao remover tag'
      });
    }
  }
}