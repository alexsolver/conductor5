/**
 * DrizzleBeneficiaryRepository - Clean Architecture Infrastructure Layer
 * Resolves violations: Missing repository implementations
 */

import { Beneficiary } from '../../domain/entities/Beneficiary';
import { beneficiaries } from '../../../../shared/schema-master';
import { eq, and, like, sql } from 'drizzle-orm';

interface BeneficiaryRepositoryInterface {
  save(beneficiary: Beneficiary): Promise<void>;
  findById(id: string, tenantId: string): Promise<Beneficiary | null>;
  findByTenant(tenantId: string, filters?: any): Promise<Beneficiary[]>;
  update(beneficiary: Beneficiary): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}

export class DrizzleBeneficiaryRepository implements BeneficiaryRepositoryInterface {
  constructor(private readonly db: any) {}

  async save(beneficiary: Beneficiary): Promise<void> {
    await this.db.insert(beneficiaries).values({
      id: beneficiary.getId(),
      tenantId: beneficiary.getTenantId(),
      firstName: beneficiary.getFirstName(),
      lastName: beneficiary.getLastName(),
      email: beneficiary.getEmail(),
      phone: beneficiary.getPhone(),
      customerId: beneficiary.getCustomerId(),
      relationshipType: beneficiary.getRelationshipType(),
      isActive: beneficiary.isActive(),
      createdAt: beneficiary.getCreatedAt(),
      updatedAt: beneficiary.getUpdatedAt()
    });
  }

  async findById(id: string, tenantId: string): Promise<Beneficiary | null> {
    const result = await this.db
      .select()
      .from(beneficiaries)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.tenantId, tenantId)))
      .limit(1);

    return result[0] ? this.toDomainEntity(result[0]) : null;
  }

  async findByTenant(tenantId: string, filters?: any): Promise<Beneficiary[]> {
    let query = this.db.select().from(beneficiaries).where(eq(beneficiaries.tenantId, tenantId));

    if (filters?.search) {
      query = query.where(
        sql`CONCAT(${beneficiaries.firstName}, ' ', ${beneficiaries.lastName}) ILIKE ${`%${filters.search}%`}`
      );
    }

    if (filters?.customerId) {
      query = query.where(eq(beneficiaries.customerId, filters.customerId));
    }

    if (typeof filters?.active === 'boolean') {
      query = query.where(eq(beneficiaries.isActive, filters.active));
    }

    const results = await query;
    return results.map(this.toDomainEntity);
  }

  async update(beneficiary: Beneficiary): Promise<void> {
    await this.db
      .update(beneficiaries)
      .set({
        firstName: beneficiary.getFirstName(),
        lastName: beneficiary.getLastName(),
        email: beneficiary.getEmail(),
        phone: beneficiary.getPhone(),
        relationshipType: beneficiary.getRelationshipType(),
        isActive: beneficiary.isActive(),
        updatedAt: beneficiary.getUpdatedAt()
      })
      .where(and(
        eq(beneficiaries.id, beneficiary.getId()),
        eq(beneficiaries.tenantId, beneficiary.getTenantId())
      ));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.db
      .update(beneficiaries)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.tenantId, tenantId)));
  }

  private toDomainEntity(data: any): Beneficiary {
    return new Beneficiary(
      data.id,
      data.tenantId,
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.customerId,
      data.relationshipType,
      data.isActive,
      data.createdAt,
      data.updatedAt
    );
  }
}