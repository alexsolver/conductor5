
import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';

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

    // Integration with Brazilian holidays API
    try {
      const federalResponse = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
      const federalHolidays = await federalResponse.json();

      // For now, return federal holidays and empty arrays for state/municipal
      // In production, integrate with state/municipal APIs
      const result = {
        federais: federalHolidays.map((holiday: any) => ({
          data: holiday.date,
          nome: holiday.name,
          incluir: true
        })),
        estaduais: [],
        municipais: []
      };

      res.json({
        success: true,
        data: result
      });
    } catch (apiError) {
      console.error('Error fetching holidays from API:', apiError);
      res.json({
        success: true,
        data: {
          federais: [],
          estaduais: [],
          municipais: []
        }
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
