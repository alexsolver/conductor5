export class BaseRepository implements IBaseRepository {
  async create(entity: any): Promise<any> {
    // Implementation
    return entity;
  }

  async findById(id: string): Promise<any | null> {
    // Implementation
    return null;
  }

  async findAll(): Promise<any[]> {
    // Implementation
    return [];
  }

  async update(id: string, entity: any): Promise<any> {
    // Implementation
    return entity;
  }

  async delete(id: string): Promise<void> {
    // Implementation
  }
}