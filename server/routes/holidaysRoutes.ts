import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { db } from '../db';
import { holidays } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();

// Apply JWT authentication to all routes
router.use(jwtAuth);

// Get holidays by municipality and state
router.get('/holidays', async (req: AuthenticatedRequest, res) => {
  try {
    const { municipio, estado, ano } = req.query;

    if (!municipio || !estado || !ano) {
      return res.status(400).json({
        success: false,
        message: 'Município, estado e ano são obrigatórios'
      });
    }

    try {
      // Use Drizzle to query the database for holidays
      const result = await db.select().from(holidays).where(and(eq(holidays.municipio, municipio), eq(holidays.estado, estado), eq(holidays.ano, parseInt(ano as string, 10))));

      if (result && result.length > 0) {
        // Holidays found in the database
        const formattedResult = {
          federais: result.filter(h => h.tipo === 'federal').map(h => ({ data: h.data, nome: h.nome, incluir: h.incluir })),
          estaduais: result.filter(h => h.tipo === 'estadual').map(h => ({ data: h.data, nome: h.nome, incluir: h.incluir })),
          municipais: result.filter(h => h.tipo === 'municipal').map(h => ({ data: h.data, nome: h.nome, incluir: h.incluir }))
        };

        res.json({
          success: true,
          data: formattedResult
        });
      } else {
        // No holidays found in the database, return empty arrays
        res.json({
          success: true,
          data: {
            federais: [],
            estaduais: [],
            municipais: []
          }
        });
      }
    } catch (dbError) {
      console.error('Error querying holidays from database:', dbError);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar feriados no banco de dados'
      });
    }
  } catch (error) {
    console.error('Error in holidays endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export { router as holidaysRoutes };