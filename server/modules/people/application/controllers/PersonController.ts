import { Request, Response } from 'express';
import { CreatePersonUseCase } from '../use-cases/CreatePersonUseCase';
import { UpdatePersonUseCase } from '../use-cases/UpdatePersonUseCase';
import { SearchPeopleUseCase } from '../use-cases/SearchPeopleUseCase';

export class PersonController {
  constructor(
    private createPersonUseCase: CreatePersonUseCase,
    private updatePersonUseCase: UpdatePersonUseCase,
    private searchPeopleUseCase?: SearchPeopleUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const person = await this.createPersonUseCase.execute(req.body);
      res.status(201).json(person);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const person = await this.updatePersonUseCase.execute(req.params.id, req.body);
      if (!person) {
        res.status(404).json({ error: 'Person not found' });
        return;
      }
      res.json(person);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      if (!this.searchPeopleUseCase) {
        res.status(500).json({ error: 'Search use case not configured' });
        return;
      }

      const { companyId, types, query, limit } = req.query;

      const result = await this.searchPeopleUseCase.execute({
        companyId: companyId as string,
        types: types ? (types as string).split(',') as ('user' | 'customer' | 'beneficiary')[] : undefined,
        query: query as string,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });

      res.json(result);
    } catch (error) {
      console.error('Error searching people:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}