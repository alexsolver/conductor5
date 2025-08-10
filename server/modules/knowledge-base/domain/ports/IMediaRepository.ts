export interface IMediaRepository {
  create(media: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, media: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByType(type: string): Promise<any[]>;
  findByKnowledgeBaseId(knowledgeBaseId: string): Promise<any[]>;
}