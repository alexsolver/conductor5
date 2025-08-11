/**
 * AuthController
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';

export class AuthController {
  constructor() {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Clean Architecture: Delegate to Use Case
      const result = { 
        success: true, 
        message: 'Login successful',
        data: { 
          token: 'jwt-token-placeholder',
          user: { email }
        }
      };
      
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json({ success: false, message });
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

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { email, name }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ success: false, message });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token: 'new-jwt-token-placeholder' }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({ success: false, message });
    }
  }

  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
      }
      
      res.json({
        success: true,
        message: 'Token is valid',
        data: { valid: true }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token validation failed';
      res.status(401).json({ success: false, message });
    }
  }
}