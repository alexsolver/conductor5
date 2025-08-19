// ✅ 1QA.MD COMPLIANCE: KNOWLEDGE BASE APPLICATION SERVICE - CLEAN ARCHITECTURE
// Application layer service - dependency injection container

import { DrizzleKnowledgeBaseRepository } from '../../infrastructure/repositories/DrizzleKnowledgeBaseRepository';
import { CreateKnowledgeBaseUseCase } from '../use-cases/CreateKnowledgeBaseUseCase';
import { SearchKnowledgeBaseUseCase } from '../use-cases/SearchKnowledgeBaseUseCase';
import { KnowledgeBaseController } from '../controllers/KnowledgeBaseController';

export class KnowledgeBaseApplicationService {
  private repository: DrizzleKnowledgeBaseRepository;
  private createUseCase: CreateKnowledgeBaseUseCase;
  private searchUseCase: SearchKnowledgeBaseUseCase;
  private controller: KnowledgeBaseController;

  constructor() {
    // Dependency injection setup
    this.repository = new DrizzleKnowledgeBaseRepository();
    this.createUseCase = new CreateKnowledgeBaseUseCase(this.repository);
    this.searchUseCase = new SearchKnowledgeBaseUseCase(this.repository);
    this.controller = new KnowledgeBaseController(this.createUseCase, this.searchUseCase);
  }

  getController(): KnowledgeBaseController {
    return this.controller;
  }

  getRepository(): DrizzleKnowledgeBaseRepository {
    return this.repository;
  }
}