
import { Request, Response } from 'express';
import { IJourneyRepository } from '../../domain/repositories/IJourneyRepository';
import { DrizzleJourneyRepository } from '../../infrastructure/repositories/DrizzleJourneyRepository';

export class JourneyController {
  private journeyRepository: IJourneyRepository;

  constructor() {
    this.journeyRepository = new DrizzleJourneyRepository();
  }

  async startJourney(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const { location, notes } = req.body;

      // Verificar se já existe uma jornada ativa
      const activeJourney = await this.journeyRepository.findActiveByUserId(user.id, tenantId);
      if (activeJourney) {
        return res.status(400).json({
          message: 'Usuário já possui uma jornada ativa',
          activeJourney
        });
      }

      const journey = await this.journeyRepository.create({
        tenantId,
        userId: user.id,
        startTime: new Date(),
        status: 'active',
        location,
        notes
      });

      // Criar checkpoint de início
      await this.journeyRepository.createCheckpoint({
        journeyId: journey.id,
        tenantId,
        type: 'check_in',
        timestamp: new Date(),
        location,
        notes: 'Início da jornada'
      });

      res.status(201).json(journey);
    } catch (error) {
      console.error('Error starting journey:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async endJourney(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const { location, notes } = req.body;

      // Buscar jornada ativa
      const activeJourney = await this.journeyRepository.findActiveByUserId(user.id, tenantId);
      if (!activeJourney) {
        return res.status(404).json({ message: 'Nenhuma jornada ativa encontrada' });
      }

      const endTime = new Date();
      const totalHours = (endTime.getTime() - activeJourney.startTime.getTime()) / (1000 * 60 * 60);

      const journey = await this.journeyRepository.update(activeJourney.id, tenantId, {
        endTime,
        status: 'completed',
        totalHours: Number(totalHours.toFixed(2))
      });

      // Criar checkpoint de fim
      await this.journeyRepository.createCheckpoint({
        journeyId: journey.id,
        tenantId,
        type: 'check_out',
        timestamp: endTime,
        location,
        notes: notes || 'Fim da jornada'
      });

      // Criar métricas da jornada
      await this.journeyRepository.createMetrics({
        journeyId: journey.id,
        tenantId,
        date: new Date(),
        totalWorkingHours: Number(totalHours.toFixed(2)),
        breakHours: 0,
        overtimeHours: totalHours > 8 ? Number((totalHours - 8).toFixed(2)) : 0,
        productivity: 100
      });

      res.json(journey);
    } catch (error) {
      console.error('Error ending journey:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async pauseJourney(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const { location, notes } = req.body;

      const activeJourney = await this.journeyRepository.findActiveByUserId(user.id, tenantId);
      if (!activeJourney) {
        return res.status(404).json({ message: 'Nenhuma jornada ativa encontrada' });
      }

      const journey = await this.journeyRepository.update(activeJourney.id, tenantId, {
        status: 'paused'
      });

      await this.journeyRepository.createCheckpoint({
        journeyId: journey.id,
        tenantId,
        type: 'break_start',
        timestamp: new Date(),
        location,
        notes: notes || 'Início da pausa'
      });

      res.json(journey);
    } catch (error) {
      console.error('Error pausing journey:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async resumeJourney(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const { location, notes } = req.body;

      const pausedJourney = await this.journeyRepository.findActiveByUserId(user.id, tenantId);
      if (!pausedJourney || pausedJourney.status !== 'paused') {
        return res.status(404).json({ message: 'Nenhuma jornada pausada encontrada' });
      }

      const journey = await this.journeyRepository.update(pausedJourney.id, tenantId, {
        status: 'active'
      });

      await this.journeyRepository.createCheckpoint({
        journeyId: journey.id,
        tenantId,
        type: 'break_end',
        timestamp: new Date(),
        location,
        notes: notes || 'Fim da pausa'
      });

      res.json(journey);
    } catch (error) {
      console.error('Error resuming journey:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getCurrentJourney(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;

      const journey = await this.journeyRepository.findActiveByUserId(user.id, tenantId);
      
      if (!journey) {
        return res.status(404).json({ message: 'Nenhuma jornada ativa encontrada' });
      }

      const checkpoints = await this.journeyRepository.findCheckpointsByJourneyId(journey.id, tenantId);

      res.json({
        journey,
        checkpoints
      });
    } catch (error) {
      console.error('Error getting current journey:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getJourneyHistory(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const { startDate, endDate, userId } = req.query;

      const targetUserId = userId || user.id;
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date();

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const journeys = await this.journeyRepository.findByUserId(targetUserId, tenantId);
      const metrics: any[] = []; // TODO: Implement metrics by user if needed

      res.json({
        journeys,
        metrics
      });
    } catch (error) {
      console.error('Error getting journey history:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async updateLocation(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      const { location } = req.body;

      const activeJourney = await this.journeyRepository.findActiveByUserId(user.id, tenantId);
      if (!activeJourney) {
        return res.status(404).json({ message: 'Nenhuma jornada ativa encontrada' });
      }

      await this.journeyRepository.createCheckpoint({
        journeyId: activeJourney.id,
        tenantId,
        type: 'location_update',
        timestamp: new Date(),
        location,
        notes: 'Atualização de localização'
      });

      res.json({ message: 'Localização atualizada com sucesso' });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getTodayMetrics(req: Request, res: Response) {
    try {
      const { tenantId, user } = req as any;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Return basic metrics for now - can be expanded with real data later
      const totalMetrics = {
        totalWorkingHours: 0,
        breakHours: 0,
        overtimeHours: 0,
        ticketsCompleted: 0,
        customerVisits: 0,
        productivity: 0
      };
      
      res.json(totalMetrics);
    } catch (error) {
      console.error('Error getting today metrics:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getJourneyCheckpoints(req: Request, res: Response) {
    try {
      const { tenantId } = req as any;
      const { journeyId } = req.params;
      
      const checkpoints = await this.journeyRepository.findCheckpointsByJourneyId(journeyId, tenantId);
      res.json(checkpoints);
    } catch (error) {
      console.error('Error getting journey checkpoints:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}
