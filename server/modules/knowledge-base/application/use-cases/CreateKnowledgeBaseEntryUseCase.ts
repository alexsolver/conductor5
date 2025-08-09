
import { KnowledgeBaseEntry } from '../../domain/entities/KnowledgeBaseEntry';
import { IKnowledgeBaseRepository } from '../../domain/repositories/IKnowledgeBaseRepository';

export class CreateKnowledgeBaseEntryUseCase {
  constructor(
    private readonly repository: IKnowledgeBaseRepository
  ) {}

  async execute(data: {
    title: string;
    content: string;
    category: string;
    tenantId: string;
  }): Promise<KnowledgeBaseEntry> {
    const entry = new KnowledgeBaseEntry(
      crypto.randomUUID(),
      data.title,
      data.content,
      data.category,
      data.tenantId
    );

    return await this.repository.save(entry);
  }
}
