import { z } from 'zod';

export const ItemEntitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  active: z.boolean(),
  type: z.enum(['Material', 'Serviço']),
  name: z.string().min(1, 'Nome é obrigatório'),
  integrationCode: z.string().optional(),
  description: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  defaultMaintenancePlan: z.string().optional(),
  group: z.string().optional(),
  defaultChecklist: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateItemSchema = ItemEntitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateItemSchema = CreateItemSchema.partial().extend({
  id: z.string().uuid(),
});

export type ItemEntity = z.infer<typeof ItemEntitySchema>;
export type CreateItemEntity = z.infer<typeof CreateItemSchema>;
export type UpdateItemEntity = z.infer<typeof UpdateItemSchema>;

export class Item {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly active: boolean,
    public readonly type: 'Material' | 'Serviço',
    public readonly name: string,
    public readonly integrationCode?: string,
    public readonly description?: string,
    public readonly unitOfMeasure?: string,
    public readonly defaultMaintenancePlan?: string,
    public readonly group?: string,
    public readonly defaultChecklist?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static fromEntity(entity: ItemEntity): Item {
    return new Item(
      entity.id,
      entity.tenantId,
      entity.active,
      entity.type,
      entity.name,
      entity.integrationCode,
      entity.description,
      entity.unitOfMeasure,
      entity.defaultMaintenancePlan,
      entity.group,
      entity.defaultChecklist,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toEntity(): ItemEntity {
    return {
      id: this.id,
      tenantId: this.tenantId,
      active: this.active,
      type: this.type,
      name: this.name,
      integrationCode: this.integrationCode,
      description: this.description,
      unitOfMeasure: this.unitOfMeasure,
      defaultMaintenancePlan: this.defaultMaintenancePlan,
      group: this.group,
      defaultChecklist: this.defaultChecklist,
      createdAt: this.createdAt!,
      updatedAt: this.updatedAt!,
    };
  }

  isActive(): boolean {
    return this.active;
  }

  isMaterial(): boolean {
    return this.type === 'Material';
  }

  isService(): boolean {
    return this.type === 'Serviço';
  }
}