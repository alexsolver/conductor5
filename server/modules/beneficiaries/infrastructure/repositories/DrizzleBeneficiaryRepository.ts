
import { eq, and, like, count } from 'drizzle-orm';
import { db } from '../../../../db';
import { beneficiaries } from '../../../../shared/schema';
import { IBeneficiaryRepository, FindOptions } from '../../domain/repositories/IBeneficiaryRepository';
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
      `${beneficiary.first_name} ${beneficiary.last_name}`,
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
      `${beneficiary.first_name} ${beneficiary.last_name}`,
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
      `${beneficiary.first_name} ${beneficiary.last_name}`,
      beneficiary.email,
      beneficiary.tenantId,
      beneficiary.customerId || undefined,
      beneficiary.isActive,
      beneficiary.createdAt,
      beneficiary.updatedAt
    ));
  }

  async save(beneficiary: Beneficiary): Promise<void> {
    const [firstName, ...lastNameParts] = beneficiary.name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    await db.insert(beneficiaries).values({
      id: beneficiary.id,
      firstName: firstName,
      lastName: lastName,
      email: beneficiary.email,
      tenantId: beneficiary.tenantId,
      customerId: beneficiary.customerId,
      isActive: beneficiary.isActive,
      createdAt: beneficiary.createdAt,
      updatedAt: beneficiary.updatedAt
    });
  }

  async update(beneficiary: Beneficiary): Promise<Beneficiary> {
    const [firstName, ...lastNameParts] = beneficiary.name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    await db
      .update(beneficiaries)
      .set({
        firstName: firstName,
        lastName: lastName,
        email: beneficiary.email,
        isActive: beneficiary.isActive,
        updatedAt: beneficiary.updatedAt
      })
      .where(and(eq(beneficiaries.id, beneficiary.id), eq(beneficiaries.tenantId, beneficiary.tenantId)));
    
    return beneficiary;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(beneficiaries)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.tenantId, tenantId)));
    return true;
  }

  async create(beneficiary: Beneficiary): Promise<Beneficiary> {
    await this.save(beneficiary);
    return beneficiary;
  }

  async findByTenant(tenantId: string, options?: FindOptions): Promise<Beneficiary[]> {
    let query = db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.tenantId, tenantId));

    if (options?.search) {
      query = query.where(
        and(
          eq(beneficiaries.tenantId, tenantId),
          like(beneficiaries.name, `%${options.search}%`)
        )
      );
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.page && options?.limit) {
      const offset = (options.page - 1) * options.limit;
      query = query.offset(offset);
    }

    const results = await query;

    return results.map(beneficiary => new Beneficiary(
      beneficiary.id,
      `${beneficiary.first_name} ${beneficiary.last_name}`,
      beneficiary.email,
      beneficiary.tenantId,
      beneficiary.customerId || undefined,
      beneficiary.isActive,
      beneficiary.createdAt,
      beneficiary.updatedAt
    ));
  }

  async countByTenant(tenantId: string, search?: string): Promise<number> {
    let query = db
      .select({ count: count() })
      .from(beneficiaries)
      .where(eq(beneficiaries.tenantId, tenantId));

    if (search) {
      query = query.where(
        and(
          eq(beneficiaries.tenantId, tenantId),
          like(beneficiaries.name, `%${search}%`)
        )
      );
    }

    const result = await query;
    return result[0]?.count || 0;
  }
}
