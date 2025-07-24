import { z } from 'zod';

export const SupplierEntitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  documentNumber: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('Brasil'),
  contactPerson: z.string().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateSupplierSchema = SupplierEntitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial().extend({
  id: z.string().uuid(),
});

export type SupplierEntity = z.infer<typeof SupplierEntitySchema>;
export type CreateSupplierEntity = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierEntity = z.infer<typeof UpdateSupplierSchema>;

export class Supplier {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly active: boolean,
    public readonly documentNumber?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly zipCode?: string,
    public readonly country?: string,
    public readonly contactPerson?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static fromEntity(entity: SupplierEntity): Supplier {
    return new Supplier(
      entity.id,
      entity.tenantId,
      entity.name,
      entity.active,
      entity.documentNumber,
      entity.email,
      entity.phone,
      entity.address,
      entity.city,
      entity.state,
      entity.zipCode,
      entity.country,
      entity.contactPerson,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toEntity(): SupplierEntity {
    return {
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      active: this.active,
      documentNumber: this.documentNumber,
      email: this.email,
      phone: this.phone,
      address: this.address,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country || 'Brasil',
      contactPerson: this.contactPerson,
      createdAt: this.createdAt!,
      updatedAt: this.updatedAt!,
    };
  }

  isActive(): boolean {
    return this.active;
  }

  getFullAddress(): string {
    const parts = [this.address, this.city, this.state, this.zipCode].filter(Boolean);
    return parts.join(', ');
  }
}