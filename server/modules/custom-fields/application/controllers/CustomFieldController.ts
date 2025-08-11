/**
 * Custom Field Controller
 * Clean Architecture - Presentation Layer
 * Handles HTTP requests and delegates to Use Cases
 */

import { Request, Response } from 'express';
import { CreateCustomFieldUseCase } from '../use-cases/CreateCustomFieldUseCase';
import { GetCustomFieldsUseCase } from '../use-cases/GetCustomFieldsUseCase';

export class CustomFieldController {
  constructor(
    private createCustomFieldUseCase: CreateCustomFieldUseCase,
    private getCustomFieldsUseCase: GetCustomFieldsUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createCustomFieldUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create custom field';
      res.status(400).json({ message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const result = await this.getCustomFieldsUseCase.execute({ tenantId });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve custom fields';
      res.status(500).json({ message });
    }
  }
}