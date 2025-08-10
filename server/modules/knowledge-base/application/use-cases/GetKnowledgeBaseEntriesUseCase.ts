import { IKnowledgeBaseEntryRepository } from '../../domain/ports/IKnowledgeBaseEntryRepository';
import { KnowledgeBaseEntry } from '../../domain/entities/KnowledgeBaseEntry';
import { IMediaRepository } from '../../domain/ports/IMediaRepository';

export class GetKnowledgeBaseEntriesUseCase {
  constructor(
    private readonly knowledgeBaseRepository: IKnowledgeBaseEntryRepository
  ) {}

  async execute(tenantId: string): Promise<KnowledgeBaseEntry[]> {
    return await this.knowledgeBaseRepository.findAll(tenantId);
  }
}