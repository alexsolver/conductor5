import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { 
  userLocationAssignments, 
  insertUserLocationAssignmentSchema,
  selectUserLocationAssignmentSchema,
  locations
} from '@shared/schema';
import { logInfo, logError } from '../utils/logger';
import { z } from 'zod';

interface UserLocationAssignmentData {
  locationId: string;
  role: 'assigned' | 'primary_contact' | 'backup_contact' | 'manager';
  isPrimary: boolean;
  accessLevel: 'basic' | 'advanced' | 'admin';
  specialPermissions: string[];
  validFrom?: string;
  validUntil?: string;
  notes?: string;
}

interface UserLocationAssignmentUpdate {
  role?: 'assigned' | 'primary_contact' | 'backup_contact' | 'manager';
  isPrimary?: boolean;
  accessLevel?: 'basic' | 'advanced' | 'admin';
  specialPermissions?: string[];
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
}

export class UserManagementService {
  /**
   * Get user location assignments
   */
  async getUserLocationAssignments(userId: string, tenantId: string) {
    try {
      const assignments = await db
        .select({
          id: userLocationAssignments.id,
          userId: userLocationAssignments.userId,
          locationId: userLocationAssignments.locationId,
          role: userLocationAssignments.role,
          isActive: userLocationAssignments.isActive,
          isPrimary: userLocationAssignments.isPrimary,
          accessLevel: userLocationAssignments.accessLevel,
          specialPermissions: userLocationAssignments.specialPermissions,
          assignedAt: userLocationAssignments.assignedAt,
          validFrom: userLocationAssignments.validFrom,
          validUntil: userLocationAssignments.validUntil,
          notes: userLocationAssignments.notes,
          locationName: locations.name,
          locationAddress: locations.address,
        })
        .from(userLocationAssignments)
        .leftJoin(locations, eq(locations.id, userLocationAssignments.locationId))
        .where(
          and(
            eq(userLocationAssignments.userId, userId),
            eq(userLocationAssignments.tenantId, tenantId)
          )
        )
        .orderBy(desc(userLocationAssignments.assignedAt));

      logInfo('User location assignments retrieved', {
        userId,
        tenantId,
        count: assignments.length
      });

      return assignments;
    } catch (error) {
      logError('Error retrieving user location assignments', error, {
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Assign user to location
   */
  async assignUserToLocation(
    userId: string,
    tenantId: string,
    assignmentData: UserLocationAssignmentData,
    assignedBy: string
  ) {
    try {
      // Validate assignment data
      const validatedData = insertUserLocationAssignmentSchema.parse({
        userId,
        locationId: assignmentData.locationId,
        tenantId,
        role: assignmentData.role,
        isPrimary: assignmentData.isPrimary,
        accessLevel: assignmentData.accessLevel,
        specialPermissions: assignmentData.specialPermissions,
        assignedBy,
        validFrom: assignmentData.validFrom ? new Date(assignmentData.validFrom) : undefined,
        validUntil: assignmentData.validUntil ? new Date(assignmentData.validUntil) : undefined,
        notes: assignmentData.notes,
      });

      // Check if user already has a primary location if this is marked as primary
      if (assignmentData.isPrimary) {
        const existingPrimary = await db
          .select({ id: userLocationAssignments.id })
          .from(userLocationAssignments)
          .where(
            and(
              eq(userLocationAssignments.userId, userId),
              eq(userLocationAssignments.tenantId, tenantId),
              eq(userLocationAssignments.isPrimary, true),
              eq(userLocationAssignments.isActive, true)
            )
          )
          .limit(1);

        if (existingPrimary.length > 0) {
          // Update existing primary to false
          await db
            .update(userLocationAssignments)
            .set({ isPrimary: false })
            .where(
              and(
                eq(userLocationAssignments.userId, userId),
                eq(userLocationAssignments.tenantId, tenantId),
                eq(userLocationAssignments.isPrimary, true)
              )
            );
        }
      }

      // Create the assignment
      const [newAssignment] = await db
        .insert(userLocationAssignments)
        .values(validatedData)
        .returning();

      logInfo('User assigned to location successfully', {
        userId,
        tenantId,
        locationId: assignmentData.locationId,
        role: assignmentData.role,
        assignedBy
      });

      return newAssignment;
    } catch (error) {
      logError('Error assigning user to location', error, {
        userId,
        tenantId,
        locationId: assignmentData.locationId,
        assignedBy
      });
      throw error;
    }
  }

  /**
   * Update user location assignment
   */
  async updateUserLocationAssignment(
    assignmentId: string,
    userId: string,
    tenantId: string,
    updateData: UserLocationAssignmentUpdate,
    updatedBy: string
  ) {
    try {
      // If setting as primary, remove primary flag from other assignments
      if (updateData.isPrimary) {
        await db
          .update(userLocationAssignments)
          .set({ isPrimary: false })
          .where(
            and(
              eq(userLocationAssignments.userId, userId),
              eq(userLocationAssignments.tenantId, tenantId),
              eq(userLocationAssignments.isPrimary, true)
            )
          );
      }

      // Update the assignment
      const [updatedAssignment] = await db
        .update(userLocationAssignments)
        .set({
          ...updateData,
          validFrom: updateData.validFrom ? new Date(updateData.validFrom) : undefined,
          validUntil: updateData.validUntil ? new Date(updateData.validUntil) : undefined,
        })
        .where(
          and(
            eq(userLocationAssignments.id, assignmentId),
            eq(userLocationAssignments.userId, userId),
            eq(userLocationAssignments.tenantId, tenantId)
          )
        )
        .returning();

      if (!updatedAssignment) {
        throw new Error('Assignment not found or unauthorized');
      }

      logInfo('User location assignment updated successfully', {
        assignmentId,
        userId,
        tenantId,
        updatedBy
      });

      return updatedAssignment;
    } catch (error) {
      logError('Error updating user location assignment', error, {
        assignmentId,
        userId,
        tenantId,
        updatedBy
      });
      throw error;
    }
  }

  /**
   * Remove user from location
   */
  async removeUserFromLocation(
    assignmentId: string,
    userId: string,
    tenantId: string,
    removedBy: string
  ) {
    try {
      const [deletedAssignment] = await db
        .delete(userLocationAssignments)
        .where(
          and(
            eq(userLocationAssignments.id, assignmentId),
            eq(userLocationAssignments.userId, userId),
            eq(userLocationAssignments.tenantId, tenantId)
          )
        )
        .returning();

      if (!deletedAssignment) {
        throw new Error('Assignment not found or unauthorized');
      }

      logInfo('User removed from location successfully', {
        assignmentId,
        userId,
        tenantId,
        removedBy
      });

      return deletedAssignment;
    } catch (error) {
      logError('Error removing user from location', error, {
        assignmentId,
        userId,
        tenantId,
        removedBy
      });
      throw error;
    }
  }

  /**
   * Get available locations for assignment
   */
  async getAvailableLocations(tenantId: string) {
    try {
      const availableLocations = await db
        .select({
          id: locations.id,
          name: locations.name,
          address: locations.address,
          type: locations.type,
          status: locations.status,
        })
        .from(locations)
        .where(eq(locations.tenantId, tenantId))
        .orderBy(locations.name);

      logInfo('Available locations retrieved', {
        tenantId,
        count: availableLocations.length
      });

      return availableLocations;
    } catch (error) {
      logError('Error retrieving available locations', error, {
        tenantId
      });
      throw error;
    }
  }

  /**
   * Get tenant user activity (placeholder for existing functionality)
   */
  async getTenantUserActivity(tenantId: string, days: number = 7) {
    try {
      // This is a placeholder - implement based on your existing activity tracking
      const activity = [];
      
      logInfo('Tenant user activity retrieved', {
        tenantId,
        days,
        count: activity.length
      });

      return activity;
    } catch (error) {
      logError('Error retrieving tenant user activity', error, {
        tenantId,
        days
      });
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();