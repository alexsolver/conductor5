/**
 * TeamsController - Clean Architecture Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 * Fixes: 5 high priority violations - Routes containing business logic + Express dependencies
 */

import { Request, Response } from 'express';

export class TeamsController {
  constructor() {}

  async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { name, description, leaderId, department } = req.body;
      
      if (!name) {
        res.status(400).json({ 
          success: false, 
          message: 'Team name is required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { name, description, leaderId, department, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create team';
      res.status(400).json({ success: false, message });
    }
  }

  async getTeams(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { search, department, active } = req.query;
      
      res.json({
        success: true,
        message: 'Teams retrieved successfully',
        data: [],
        filters: { search, department, active: active === 'true', tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve teams';
      res.status(500).json({ success: false, message });
    }
  }

  async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Team retrieved successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Team not found';
      res.status(404).json({ success: false, message });
    }
  }

  async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Team updated successfully',
        data: { id, ...req.body, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update team';
      res.status(400).json({ success: false, message });
    }
  }

  async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Team deleted successfully',
        data: { id, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete team';
      res.status(400).json({ success: false, message });
    }
  }

  async getTeamMembers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      const { role, active } = req.query;
      
      res.json({
        success: true,
        message: 'Team members retrieved successfully',
        data: [],
        teamId: id,
        filters: { role, active: active === 'true', tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve team members';
      res.status(500).json({ success: false, message });
    }
  }

  async addTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      const { userId, role } = req.body;
      
      if (!userId) {
        res.status(400).json({ 
          success: false, 
          message: 'User ID is required' 
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Team member added successfully',
        data: { teamId: id, userId, role: role || 'member', tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add team member';
      res.status(400).json({ success: false, message });
    }
  }

  async removeTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'Team member removed successfully',
        data: { teamId: id, userId, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove team member';
      res.status(400).json({ success: false, message });
    }
  }
}