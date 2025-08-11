
/**
 * TimecardController - Clean Architecture Application Layer
 * Fixes dependency injection and follows AGENT_CODING_STANDARDS.md
 */

import { Request, Response } from 'express';
import { ClockInUseCase } from '../use-cases/ClockInUseCase';
import { ClockOutUseCase } from '../use-cases/ClockOutUseCase';
import { CreateTimecardUseCase } from '../use-cases/CreateTimecardUseCase';
import { GetTimecardStatusUseCase } from '../use-cases/GetTimecardStatusUseCase';
import { GetTimecardReportsUseCase } from '../use-cases/GetTimecardReportsUseCase';
import { CreateTimecardDTO } from '../dto/CreateTimecardDTO';
import { TimecardClockDTO } from '../dto/TimecardClockDTO';

export class TimecardController {
  constructor(
    private readonly clockInUseCase: ClockInUseCase,
    private readonly clockOutUseCase: ClockOutUseCase,
    private readonly createTimecardUseCase: CreateTimecardUseCase,
    private readonly getTimecardStatusUseCase: GetTimecardStatusUseCase,
    private readonly getTimecardReportsUseCase: GetTimecardReportsUseCase
  ) {}

  async clockIn(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = req.user!;
      const clockDTO = new TimecardClockDTO({
        userId,
        tenantId,
        location: req.body.location,
        notes: req.body.notes,
        timestamp: new Date()
      });

      const result = await this.clockInUseCase.execute(clockDTO);
      
      res.status(200).json({
        success: true,
        message: 'Clock in realizado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Error in clockIn:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async clockOut(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = req.user!;
      const clockDTO = new TimecardClockDTO({
        userId,
        tenantId,
        location: req.body.location,
        notes: req.body.notes,
        timestamp: new Date()
      });

      const result = await this.clockOutUseCase.execute(clockDTO);
      
      res.status(200).json({
        success: true,
        message: 'Clock out realizado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Error in clockOut:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async createTimecard(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = req.user!;
      const createDTO = new CreateTimecardDTO({
        ...req.body,
        userId,
        tenantId
      });

      const result = await this.createTimecardUseCase.execute(createDTO);
      
      res.status(201).json({
        success: true,
        message: 'Timecard criado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Error in createTimecard:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getCurrentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = req.user!;
      
      const result = await this.getTimecardStatusUseCase.execute({
        userId,
        tenantId
      });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getCurrentStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getReports(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = req.user!;
      const { period, startDate, endDate } = req.params;
      
      const result = await this.getTimecardReportsUseCase.execute({
        userId,
        tenantId,
        period,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getReports:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}
