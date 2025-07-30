// HOLIDAY CONTROLLER
// Controller REST API para gerenciamento de feriados multilocation
// Integração completa com sistema de controle de jornadas

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { DrizzleHolidayRepository } from '../repositories/DrizzleHolidayRepository';
import { insertHolidaySchema } from '../../shared/schema.js';
const { pool } = require("../db.js");

const router = Router();
const holidayRepository = new DrizzleHolidayRepository(pool);

// Zod schemas for validation
const holidayQuerySchema = z.object({
  countryCode: z.string().optional(),
  regionCode: z.string().optional(),
  type: z.enum(['national', 'regional', 'corporate', 'optional']).optional(),
  year: z.coerce.number().int().min(2020).max(2030).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

const dateCheckSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  countryCode: z.string(),
  regionCode: z.string().optional()
});

// ========================================
// BASIC CRUD ENDPOINTS
// ========================================

/**
 * GET /api/holidays
 * Listar feriados com filtros opcionais
 */
router.get('/', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const query = holidayQuerySchema.parse(req.query);

    let holidays;

    if (query.startDate && query.endDate) {
      // Date range query
      holidays = await holidayRepository.getHolidaysByDateRange(
        tenantId,
        query.startDate,
        query.endDate,
        {
          countryCode: query.countryCode,
          regionCode: query.regionCode,
          type: query.type
        }
      );
    } else if (query.countryCode) {
      if (query.regionCode) {
        holidays = await holidayRepository.getHolidaysByRegion(
          tenantId,
          query.countryCode,
          query.regionCode,
          query.year
        );
      } else {
        holidays = await holidayRepository.getHolidaysByCountry(
          tenantId,
          query.countryCode,
          query.year
        );
      }
    } else if (query.type) {
      holidays = await holidayRepository.getHolidaysByType(
        tenantId,
        query.type,
        query.countryCode
      );
    } else {
      // Get all holidays with basic filters
      const currentYear = new Date().getFullYear();
      holidays = await holidayRepository.getHolidaysByDateRange(
        tenantId,
        `${query.year || currentYear}-01-01`,
        `${query.year || currentYear}-12-31`,
        {
          countryCode: query.countryCode,
          type: query.type
        }
      );
    }

    // Apply limit
    const limitedHolidays = holidays.slice(0, query.limit);

    res.json({
      holidays: limitedHolidays,
      total: holidays.length,
      filters: {
        countryCode: query.countryCode,
        regionCode: query.regionCode,
        type: query.type,
        year: query.year
      }
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(400).json({ 
      error: 'Invalid query parameters',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * POST /api/holidays
 * Criar novo feriado
 */
router.post('/', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const holidayData = insertHolidaySchema.parse({
      ...req.body,
      tenantId
    });

    // Check for overlapping holidays
    const overlap = await holidayRepository.checkOverlappingHoliday(
      tenantId,
      holidayData.date,
      holidayData.countryCode,
      holidayData.regionCode
    );

    if (overlap) {
      return res.status(409).json({ 
        error: 'Conflicting holiday',
        message: 'A holiday already exists for this date, country, and region'
      });
    }

    const created = await holidayRepository.createHoliday(holidayData);

    res.status(201).json({
      message: 'Holiday created successfully',
      holiday: created
    });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(400).json({ 
      error: 'Invalid holiday data',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * GET /api/holidays/:id
 * Obter feriado por ID
 */
router.get('/:id', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const holiday = await holidayRepository.getHolidayById(tenantId, id);

    if (!holiday) {
      return res.status(404).json({ 
        error: 'Holiday not found',
        message: 'No holiday found with the specified ID'
      });
    }

    res.json({ holiday });
  } catch (error) {
    console.error('Error fetching holiday:', error);
    res.status(500).json({ 
      error: 'Failed to fetch holiday',
      message: error.message
    });
  }
});

/**
 * PUT /api/holidays/:id
 * Atualizar feriado
 */
router.put('/:id', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    // Validate update data (excluding tenantId which shouldn't be changed)
    const updateData = insertHolidaySchema.omit({ tenantId: true }).parse(req.body);

    // Check if holiday exists
    const existing = await holidayRepository.getHolidayById(tenantId, id);
    if (!existing) {
      return res.status(404).json({ 
        error: 'Holiday not found',
        message: 'No holiday found with the specified ID'
      });
    }

    // Check for overlapping holidays (excluding current one)
    if (updateData.date) {
      const overlap = await holidayRepository.checkOverlappingHoliday(
        tenantId,
        updateData.date,
        updateData.countryCode || existing.countryCode,
        updateData.regionCode !== undefined ? updateData.regionCode : existing.regionCode,
        id // Exclude current holiday
      );

      if (overlap) {
        return res.status(409).json({ 
          error: 'Conflicting holiday',
          message: 'Another holiday already exists for this date, country, and region'
        });
      }
    }

    const updated = await holidayRepository.updateHoliday(tenantId, id, updateData);

    res.json({
      message: 'Holiday updated successfully',
      holiday: updated
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(400).json({ 
      error: 'Invalid update data',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * DELETE /api/holidays/:id
 * Remover feriado
 */
router.delete('/:id', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await holidayRepository.deleteHoliday(tenantId, id);

    if (!deleted) {
      return res.status(404).json({ 
        error: 'Holiday not found',
        message: 'No holiday found with the specified ID'
      });
    }

    res.json({
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ 
      error: 'Failed to delete holiday',
      message: error.message
    });
  }
});

// ========================================
// SPECIALIZED ENDPOINTS
// ========================================

/**
 * GET /api/holidays/check/:date
 * Verificar se uma data é feriado
 */
router.get('/check/:date', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { date } = req.params;
    const query = dateCheckSchema.parse({ date, ...req.query });

    const holiday = await holidayRepository.checkHolidayByDate(
      tenantId,
      query.date,
      query.countryCode,
      query.regionCode
    );

    res.json({
      date: query.date,
      isHoliday: !!holiday,
      holiday: holiday || null,
      countryCode: query.countryCode,
      regionCode: query.regionCode
    });
  } catch (error) {
    console.error('Error checking holiday:', error);
    res.status(400).json({ 
      error: 'Invalid date or parameters',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * GET /api/holidays/upcoming
 * Obter próximos feriados
 */
router.get('/upcoming', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { countryCode, regionCode, limit } = req.query;

    const queryParams = z.object({
      countryCode: z.string(),
      regionCode: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(20).default(5)
    }).parse({ countryCode, regionCode, limit });

    const holidays = await holidayRepository.getUpcomingHolidays(
      tenantId,
      queryParams.countryCode,
      queryParams.limit,
      queryParams.regionCode
    );

    res.json({
      upcomingHolidays: holidays,
      total: holidays.length,
      countryCode: queryParams.countryCode,
      regionCode: queryParams.regionCode
    });
  } catch (error) {
    console.error('Error fetching upcoming holidays:', error);
    res.status(400).json({ 
      error: 'Invalid parameters',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * GET /api/holidays/working-days/:year/:month
 * Calcular dias úteis do mês considerando feriados
 */
router.get('/working-days/:year/:month', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { year, month } = req.params;
    const { countryCode, regionCode } = req.query;

    const params = z.object({
      year: z.coerce.number().int().min(2020).max(2030),
      month: z.coerce.number().int().min(1).max(12),
      countryCode: z.string(),
      regionCode: z.string().optional()
    }).parse({ year, month, countryCode, regionCode });

    const workingDaysData = await holidayRepository.getWorkingDaysInMonth(
      tenantId,
      params.year,
      params.month,
      params.countryCode,
      params.regionCode
    );

    res.json({
      year: params.year,
      month: params.month,
      countryCode: params.countryCode,
      regionCode: params.regionCode,
      ...workingDaysData
    });
  } catch (error) {
    console.error('Error calculating working days:', error);
    res.status(400).json({ 
      error: 'Invalid parameters',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * POST /api/holidays/import
 * Importar múltiplos feriados (bulk)
 */
router.post('/import', jwtAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { holidays: holidayList } = req.body;

    if (!Array.isArray(holidayList) || holidayList.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid import data',
        message: 'holidays must be a non-empty array'
      });
    }

    // Validate each holiday
    const validatedHolidays = holidayList.map(holiday => 
      insertHolidaySchema.parse({ ...holiday, tenantId })
    );

    // Check for overlaps in the batch
    const dateCountryRegionMap = new Map();
    for (const holiday of validatedHolidays) {
      const key = `${holiday.date}-${holiday.countryCode}-${holiday.regionCode || ''}`;
      if (dateCountryRegionMap.has(key)) {
        return res.status(400).json({ 
          error: 'Duplicate holidays in batch',
          message: `Multiple holidays found for ${holiday.date} in ${holiday.countryCode}`
        });
      }
      dateCountryRegionMap.set(key, true);
    }

    // Import holidays
    const created = await holidayRepository.createMultipleHolidays(validatedHolidays);

    res.status(201).json({
      message: 'Holidays imported successfully',
      imported: created.length,
      holidays: created
    });
  } catch (error) {
    console.error('Error importing holidays:', error);
    res.status(400).json({ 
      error: 'Import failed',
      details: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

export default router;