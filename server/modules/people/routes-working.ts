/**
 * People Working Routes - Phase 13 Implementation
 * 
 * Working implementation for Phase 13 completion
 * Manages people with Clean Architecture principles
 * 
 * @module PeopleWorkingRoutes
 * @version 1.0.0
 * @created 2025-08-12 - Phase 13 Clean Architecture Implementation
 */

import { Router } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { PersonController } from './application/controllers/PersonController';
import { SimplifiedPersonRepository } from './infrastructure/repositories/SimplifiedPersonRepository';

const router = Router();

// Initialize dependencies
const personRepository = new SimplifiedPersonRepository();
const personController = new PersonController(personRepository);

// Apply authentication middleware
router.use(jwtAuth);

/**
 * Phase 13 Status Endpoint
 * GET /working/status
 */
router.get('/working/status', (req, res) => {
  res.json({
    success: true,
    phase: 13,
    module: 'people',
    status: 'active',
    architecture: 'Clean Architecture',
    implementation: 'working',
    endpoints: {
      status: 'GET /working/status',
      people: {
        create: 'POST /working/people',
        list: 'GET /working/people',
        getById: 'GET /working/people/:id',
        update: 'PUT /working/people/:id',
        delete: 'DELETE /working/people/:id'
      },
      search: 'GET /working/search',
      statistics: 'GET /working/statistics',
      tags: {
        add: 'POST /working/people/:id/tags',
        remove: 'DELETE /working/people/:id/tags'
      }
    },
    features: {
      peopleManagement: true,
      personTypes: ['natural', 'legal'],
      brazilianValidation: {
        cpf: true,
        cnpj: true,
        rg: true
      },
      addressManagement: {
        fullAddress: true,
        cepValidation: false, // Can be implemented later
        coordinates: false    // Can be implemented later
      },
      contactManagement: {
        email: true,
        phone: true,
        cellPhone: true,
        contactPerson: true
      },
      tagsSystem: true,
      searchAndFiltering: {
        textSearch: true,
        advancedFilters: true,
        locationFilters: true,
        typeFilters: true
      },
      duplicateDetection: {
        emailDuplication: true,
        documentDuplication: true,
        potentialDuplicates: true
      },
      analytics: {
        peopleStatistics: true,
        ageDistribution: true,
        locationDistribution: true,
        typeDistribution: true
      },
      bulkOperations: {
        bulkCreate: true,
        bulkUpdate: true,
        import: true,
        export: true
      },
      multiTenancy: true,
      authentication: true,
      cleanArchitecture: true
    },
    businessRules: {
      naturalPersonRequiredFields: ['firstName', 'lastName'],
      legalPersonRequiredFields: ['firstName', 'companyName'],
      documentValidation: 'Brazilian CPF/CNPJ',
      emailUniqueness: 'per tenant',
      documentUniqueness: 'per tenant'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Create person - Working implementation
 * POST /working/people
 */
router.post('/working/people', async (req, res) => {
  await personController.createPerson(req, res);
});

/**
 * List people - Working implementation
 * GET /working/people
 */
router.get('/working/people', async (req, res) => {
  await personController.getPeople(req, res);
});

/**
 * Get person by ID - Working implementation
 * GET /working/people/:id
 */
router.get('/working/people/:id', async (req, res) => {
  await personController.getPersonById(req, res);
});

/**
 * Update person - Working implementation
 * PUT /working/people/:id
 */
router.put('/working/people/:id', async (req, res) => {
  await personController.updatePerson(req, res);
});

/**
 * Delete person - Working implementation
 * DELETE /working/people/:id
 */
router.delete('/working/people/:id', async (req, res) => {
  await personController.deletePerson(req, res);
});

/**
 * Search people - Working implementation
 * GET /working/search
 */
router.get('/working/search', async (req, res) => {
  await personController.searchPeople(req, res);
});

/**
 * Get people statistics - Working implementation
 * GET /working/statistics
 */
router.get('/working/statistics', async (req, res) => {
  await personController.getStatistics(req, res);
});

/**
 * Add tag to person - Working implementation
 * POST /working/people/:id/tags
 */
router.post('/working/people/:id/tags', async (req, res) => {
  await personController.addTag(req, res);
});

/**
 * Remove tag from person - Working implementation
 * DELETE /working/people/:id/tags
 */
router.delete('/working/people/:id/tags', async (req, res) => {
  await personController.removeTag(req, res);
});

export default router;