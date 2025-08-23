import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { db } from '../../../../db';
import { customFields } from '../../../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class SimplifiedCustomFieldRepository implements ICustomFieldRepository {
  async create(fieldData: any): Promise<any> {
    console.log('[CUSTOM-FIELDS-REPO] Create method called with:', fieldData);

    try {
      // ✅ 1QA.MD: Ensure required fields are set
      const dataToInsert = {
        id: randomUUID(),
        ...fieldData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      console.log('[CUSTOM-FIELDS-REPO] Attempting to insert:', dataToInsert);
      const result = await db.insert(customFields).values(dataToInsert).returning();
      console.log('[CUSTOM-FIELDS-REPO] Insert successful:', result);
      return result[0];
    } catch (error) {
      console.error('[CUSTOM-FIELDS-REPO] Database error in create:', error);
      throw new Error(`Failed to create custom field: ${error.message}`);
    }
  }

  async findByModule(moduleType: string, tenantId: string): Promise<any[]> {
    console.log(`[CUSTOM-FIELDS-REPO] Finding fields for module: ${moduleType}, tenant: ${tenantId}`);

    try {
      const result = await db
        .select()
        .from(customFields)
        .where(and(
          eq(customFields.moduleType, moduleType),
          eq(customFields.tenantId, tenantId),
          eq(customFields.isActive, true)
        ))
        .orderBy(customFields.displayOrder);

      console.log(`[CUSTOM-FIELDS-REPO] Found ${result.length} fields`);
      return result;
    } catch (error) {
      console.error('[CUSTOM-FIELDS-REPO] Database error in findByModule:', error);
      return []; // Return empty array instead of throwing to prevent UI crashes
    }
  }

  async findById(fieldId: string, tenantId: string): Promise<any | null> {
    console.log(`[CUSTOM-FIELDS-REPO] Finding field by ID: ${fieldId}, tenant: ${tenantId}`);

    try {
      const result = await db
        .select()
        .from(customFields)
        .where(and(
          eq(customFields.id, fieldId),
          eq(customFields.tenantId, tenantId),
          eq(customFields.isActive, true)
        ));

      console.log('[CUSTOM-FIELDS-REPO] Find by ID result:', result);
      return result[0] || null;
    } catch (error) {
      console.error('[CUSTOM-FIELDS-REPO] Database error in findById:', error);
      return null;
    }
  }

  async update(fieldId: string, tenantId: string, updateData: any): Promise<any> {
    console.log(`[CUSTOM-FIELDS-REPO] Updating field ${fieldId} for tenant ${tenantId}`);

    try {
      const dataToUpdate = {
        ...updateData,
        updatedAt: new Date()
      };

      const result = await db
        .update(customFields)
        .set(dataToUpdate)
        .where(and(
          eq(customFields.id, fieldId),
          eq(customFields.tenantId, tenantId)
        ))
        .returning();

      console.log('[CUSTOM-FIELDS-REPO] Update successful:', result);
      return result[0];
    } catch (error) {
      console.error('[CUSTOM-FIELDS-REPO] Database error in update:', error);
      throw new Error(`Failed to update custom field: ${error.message}`);
    }
  }

  async delete(fieldId: string, tenantId: string): Promise<void> {
    console.log(`[CUSTOM-FIELDS-REPO] Soft deleting field ${fieldId} for tenant ${tenantId}`);

    try {
      await db
        .update(customFields)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(customFields.id, fieldId),
          eq(customFields.tenantId, tenantId)
        ));

      console.log('[CUSTOM-FIELDS-REPO] Soft delete successful');
    } catch (error) {
      console.error('[CUSTOM-FIELDS-REPO] Database error in delete:', error);
      throw new Error(`Failed to delete custom field: ${error.message}`);
    }
  }

  async findAll(tenantId: string): Promise<any[]> {
    console.log(`[CUSTOM-FIELDS-REPO] Finding all active fields for tenant: ${tenantId}`);

    try {
      const result = await db
        .select()
        .from(customFields)
        .where(and(
          eq(customFields.tenantId, tenantId),
          eq(customFields.isActive, true)
        ))
        .orderBy(customFields.moduleType, customFields.displayOrder);

      console.log(`[CUSTOM-FIELDS-REPO] Found ${result.length} fields`);
      return result;
    } catch (error) {
      console.error('[CUSTOM-FIELDS-REPO] Database error in findAll:', error);
      return [];
    }
  }
}