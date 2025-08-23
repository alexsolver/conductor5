
import { ICustomFieldRepository } from '../../domain/repositories/ICustomFieldRepository';
import { db } from '../../../../db';
import { customFields } from '../../../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class SimplifiedCustomFieldRepository implements ICustomFieldRepository {
  async create(fieldData: any): Promise<any> {
    console.log('[CUSTOM-FIELDS-REPO] Create method called with:', fieldData);

    try {
      // ✅ 1QA.MD: Validate required fields
      if (!fieldData.tenantId) {
        throw new Error('Tenant ID is required for custom field creation');
      }

      if (!fieldData.moduleType) {
        throw new Error('Module type is required for custom field creation');
      }

      if (!fieldData.fieldName) {
        throw new Error('Field name is required for custom field creation');
      }

      // ✅ 1QA.MD: Ensure required fields are set
      const dataToInsert = {
        id: randomUUID(),
        ...fieldData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        displayOrder: fieldData.displayOrder || 0
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
      // ✅ 1QA.MD: Validate input parameters
      if (!moduleType || !tenantId) {
        console.warn('[CUSTOM-FIELDS-REPO] Missing required parameters');
        return [];
      }

      console.log('[CUSTOM-FIELDS-REPO] Executing query with params:', {
        moduleType,
        tenantId,
        timestamp: new Date().toISOString()
      });

      const result = await db
        .select()
        .from(customFields)
        .where(and(
          eq(customFields.moduleType, moduleType),
          eq(customFields.tenantId, tenantId),
          eq(customFields.isActive, true)
        ))
        .orderBy(customFields.displayOrder);

      console.log(`[CUSTOM-FIELDS-REPO] Query executed successfully. Found ${result.length} fields:`, result);
      return result;
    } catch (error) {
      console.error('[CUSTOM-FIELDS-REPO] Database error in findByModule:', error);
      console.error('[CUSTOM-FIELDS-REPO] Error details:', {
        message: error.message,
        stack: error.stack,
        moduleType,
        tenantId
      });
      
      // ✅ 1QA.MD: Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async findById(fieldId: string, tenantId: string): Promise<any | null> {
    console.log(`[CUSTOM-FIELDS-REPO] Finding field by ID: ${fieldId}, tenant: ${tenantId}`);

    try {
      if (!fieldId || !tenantId) {
        return null;
      }

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
      if (!fieldId || !tenantId) {
        throw new Error('Field ID and Tenant ID are required for update');
      }

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
      if (!fieldId || !tenantId) {
        throw new Error('Field ID and Tenant ID are required for delete');
      }

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
      if (!tenantId) {
        return [];
      }

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
