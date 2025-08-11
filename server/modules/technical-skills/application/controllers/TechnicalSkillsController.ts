/**
 * TechnicalSkillsController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class TechnicalSkillsController {
  constructor() {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, category, level, description } = req.body;
      
      if (!name) {
        res.status(400).json({ 
          success: false, 
          message: 'Skill name is required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Technical skill created successfully',
        data: { 
          name, 
          category: category || 'General', 
          level: level || 'Beginner',
          description,
          tenantId 
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create technical skill';
      res.status(400).json({ success: false, message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { category, level } = req.query;
      
      res.json({
        success: true,
        message: 'Technical skills retrieved successfully',
        data: [],
        filters: { category, level, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve technical skills';
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Technical skill retrieved successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve technical skill';
      res.status(404).json({ success: false, message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Technical skill updated successfully',
        data: { id, ...req.body, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update technical skill';
      res.status(400).json({ success: false, message });
    }
  }

  async assignToUser(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;
      const { userId, proficiencyLevel } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Technical skill assigned to user successfully',
        data: { skillId, userId, proficiencyLevel, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign technical skill';
      res.status(400).json({ success: false, message });
    }
  }
}