
import { Request, Response } from 'express';
import { GetUserSkillsUseCase } from '../use-cases/GetUserSkillsUseCase';
import { CreateUserSkillUseCase } from '../use-cases/CreateUserSkillUseCase';

export class UserSkillController {
  constructor(
    private getUserSkillsUseCase: GetUserSkillsUseCase,
    private createUserSkillUseCase: CreateUserSkillUseCase
  ) {}

  async getUserSkills(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user;
      const userSkills = await this.getUserSkillsUseCase.execute({ tenantId, userId });
      
      res.json({
        success: true,
        data: userSkills
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving user skills',
        error: error.message
      });
    }
  }

  async createUserSkill(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user;
      const skillData = req.body;
      
      const userSkill = await this.createUserSkillUseCase.execute({
        ...skillData,
        tenantId,
        userId
      });
      
      res.status(201).json({
        success: true,
        data: userSkill
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating user skill',
        error: error.message
      });
    }
  }
}
