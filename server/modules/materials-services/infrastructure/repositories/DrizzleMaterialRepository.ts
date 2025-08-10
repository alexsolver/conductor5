import { Material } from '../../domain/entities/Material';
import { IMaterialRepository } from '../../domain/ports/IMaterialRepository';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

export class DrizzleMaterialRepository implements IMaterialRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<Material | null> {
    // Implementar busca por ID usando Drizzle
    const material = await this.db.query.material.findFirst({
      where: (mat, { eq }) => eq(mat.id, id),
    });
    return material ? new Material(material) : null;
  }

  async findAll(tenantId: string): Promise<Material[]> {
    // Implementar busca de todos usando Drizzle
    const materials = await this.db.query.material.findMany();
    return materials.map(mat => new Material(mat));
  }

  async create(material: Material): Promise<Material> {
    // Implementar criação usando Drizzle
    const [createdMaterial] = await this.db.insert(schema.material).values({ ...material }).returning();
    return new Material(createdMaterial);
  }

  async update(id: string, material: Partial<Material>, tenantId: string): Promise<Material | null> {
    // Implementar atualização usando Drizzle
    const [updatedMaterial] = await this.db.update(schema.material).set({ ...material }).where(eq(schema.material.id, id)).returning();
    return updatedMaterial ? new Material(updatedMaterial) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // Implementar exclusão usando Drizzle
    const result = await this.db.delete(schema.material).where(eq(schema.material.id, id));
    return result.count > 0;
  }
}