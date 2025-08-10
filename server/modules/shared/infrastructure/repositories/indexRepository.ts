export class BaseEntityRepository {
  // Implementation here
}

export class SharedRepository {
  async save(data: any): Promise<any> {
    // Pure data access logic only
    return data;
  }

  async findById(id: string): Promise<any | null> {
    return null;
  }

  async findAll(): Promise<any[]> {
    return [];
  }

  async update(id: string, data: any): Promise<any> {
    return data;
  }

  async delete(id: string): Promise<void> {
    // Delete logic
  }
}