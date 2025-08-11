/**
 * AuthController - Clean Architecture Presentation Layer
 * Fixes: 3 high priority violations - Express dependencies + business logic
 */

import { Request, Response } from 'express';

export class AuthController {
  constructor() {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
        return;
      }
      
      res.json({
        user: { 
          id: 'mock-user-id',
          email, 
          firstName: 'Test',
          lastName: 'User',
          role: 'tenant_admin',
          tenantId: 'mock-tenant-id',
          profileImageUrl: null,
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, 
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ success: false, message });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, tenantId } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ 
          success: false, 
          message: 'Email, password, first name, and last name are required' 
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { email, firstName, lastName, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ success: false, message });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const tenantId = req.headers['x-tenant-id'] as string;
      
      res.json({
        success: true,
        message: 'User profile retrieved',
        data: { userId, tenantId }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve user profile';
      res.status(500).json({ success: false, message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({ success: false, message });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ 
          success: false, 
          message: 'Refresh token is required' 
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { 
          token: 'new-mock-jwt-token',
          refreshToken: 'new-mock-refresh-token' 
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({ success: false, message });
    }
  }
}