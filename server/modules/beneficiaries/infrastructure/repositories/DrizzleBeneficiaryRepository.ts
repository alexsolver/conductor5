
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../db';
import { beneficiaries } from '../../../../shared/schema';
import { IBeneficiaryRepository } from '../../domain/repositories/IBeneficiaryRepository';
import { Beneficiary } from '../../domain/entities/Beneficiary';

export class DrizzleBeneficiaryRepository implements IBeneficiaryRepository {
  async findById(id: string, tenantId: string): Promise<Beneficiary | null> {
    const result = await db
      .select()
      .from(beneficiaries)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.tenantId, tenantId)))
      .limit(1);

    if (result.length === 0) return null;

    const beneficiary = result[0];
    return new Beneficiary(
      beneficiary.id,
      beneficiary.name,
      beneficiary.email,
      beneficiary.tenantId,
      beneficiary.customerId || undefined,
      beneficiary.isActive,
      beneficiary.createdAt,
      beneficiary.updatedAt
    );
  }

  async findAll(tenantId: string): Promise<Beneficiary[]> {
    const results = await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.tenantId, tenantId));

    return results.map(beneficiary => new Beneficiary(
      beneficiary.id,
      beneficiary.name,
      beneficiary.email,
      beneficiary.tenantId,
      beneficiary.customerId || undefined,
      beneficiary.isActive,
      beneficiary.createdAt,
      beneficiary.updatedAt
    ));
  }

  async findByCustomerId(customerId: string, tenantId: string): Promise<Beneficiary[]> {
    const results = await db
      .select()
      .from(beneficiaries)
      .where(and(eq(beneficiaries.customerId, customerId), eq(beneficiaries.tenantId, tenantId)));

    return results.map(beneficiary => new Beneficiary(
      beneficiary.id,
      beneficiary.name,
      beneficiary.email,
      beneficiary.tenantId,
      beneficiary.customerId || undefined,
      beneficiary.isActive,
      beneficiary.createdAt,
      beneficiary.updatedAt
    ));
  }

  async save(beneficiary: Beneficiary): Promise<void> {
    await db.insert(beneficiaries).values({
      id: beneficiary.id,
      name: beneficiary.name,
      email: beneficiary.email,
      tenantId: beneficiary.tenantId,
      customerId: beneficiary.customerId,
      isActive: beneficiary.isActive,
      createdAt: beneficiary.createdAt,
      updatedAt: beneficiary.updatedAt
    });
  }

  async update(beneficiary: Beneficiary): Promise<void> {
    await db
      .update(beneficiaries)
      .set({
        name: beneficiary.name,
        email: beneficiary.email,
        isActive: beneficiary.isActive,
        updatedAt: beneficiary.updatedAt
      })
      .where(and(eq(beneficiaries.id, beneficiary.id), eq(beneficiaries.tenantId, beneficiary.tenantId)));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await db
      .delete(beneficiaries)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.tenantId, tenantId)));
  }
}
