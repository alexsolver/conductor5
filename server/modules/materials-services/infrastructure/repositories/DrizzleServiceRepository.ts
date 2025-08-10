import { Service } from '../../domain/entities/Service';
import { IServiceRepository } from '../../domain/ports/IServiceRepository';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

export class DrizzleServiceRepository implements IServiceRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async findById(id: string, tenantId: string): Promise<Service | null> {
    const service = await this.db.query.services.findFirst({
      where: (services, { eq }) => eq(services.id, id),
    });
    return service ? { ...service, id: service.id.toString() } : null;
  }

  async findAll(tenantId: string): Promise<Service[]> {
    const services = await this.db.query.services.findMany();
    return services.map(service => ({ ...service, id: service.id.toString() }));
  }

  async create(service: Service): Promise<Service> {
    const [newService] = await this.db
      .insert(schema.services)
      .values({ ...service, id: service.id.toString() })
      .returning();
    return { ...newService, id: newService.id.toString() };
  }

  async update(id: string, service: Partial<Service>, tenantId: string): Promise<Service | null> {
    const [updatedService] = await this.db
      .update(schema.services)
      .set(service)
      .where(eq(schema.services.id, id))
      .returning();
    return updatedService ? { ...updatedService, id: updatedService.id.toString() } : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.services)
      .where(eq(schema.services.id, id));
    return result.count > 0;
  }
}