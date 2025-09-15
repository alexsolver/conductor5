import { Router } from "express";
import { jwtAuth, AuthenticatedRequest } from "../middleware/jwtAuth";
import { requirePermission } from "../middleware/rbacMiddleware";
import { userManagementService } from "../services/UserManagementService";
import { db } from "../db";
import { sql, eq, and } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import {
  users as usersTable,
  userGroups,
  userGroupMemberships,
} from "@shared/schema";

// Add missing validation schema
const updateUserGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const router = Router();

// ============= SIMPLIFIED USER ROUTES =============

// Get all users for a tenant from public schema
router.get(
  "/users",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;

      console.log(
        `🔍 [USER-LIST] Fetching users from public schema for tenant: ${tenantId}`,
      );

      // Buscar usuários do schema público filtrando por tenant_id
      const users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.tenantId, sql`${tenantId}::uuid`))
        .orderBy(usersTable.firstName, usersTable.lastName);

      console.log(
        `✅ [USER-LIST] Found ${users.length} users in public schema for tenant ${tenantId}`,
      );

      // Formatar dados para o frontend
      const formattedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        tenantId: user.tenantId,
        profileImageUrl: user.profileImageUrl,
        department: user.cargo || "",
        position: user.cargo || "",
      }));

      res.json({ users: formattedUsers });
    } catch (error) {
      console.error(
        "❌ [USER-LIST] Error fetching users from public schema:",
        error,
      );
      res.status(500).json({ message: "Failed to fetch users" });
    }
  },
);

// Create new user
router.post(
  "/users",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const userData = req.body;

      console.log("🔍 [USER-CREATE] Received data:", {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        tenantId,
      });

      // Validação básica
      if (!userData.email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }

      // Verificar se usuário já existe
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, userData.email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
      }

      // Gerar senha temporária se não fornecida
      const tempPassword =
        userData.password || Math.random().toString(36).slice(-8);
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Criar usuário com dados completos
      const userToCreate = {
        id: crypto.randomUUID(),
        email: userData.email.toLowerCase(),
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        passwordHash: hashedPassword,
        role: userData.role || "agent",
        tenantId: tenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Dados HR/Endereço
        integrationCode: userData.integrationCode || null,
        alternativeEmail: userData.alternativeEmail || null,
        cellPhone: userData.cellPhone || null,
        phone: userData.phone || null,
        ramal: userData.ramal || null,
        timeZone: userData.timeZone || "America/Sao_Paulo",
        vehicleType: userData.vehicleType || null,
        cpfCnpj: userData.cpfCnpj || null,
        supervisorIds: userData.supervisorIds || [],
        // Endereço
        cep: userData.cep || null,
        country: userData.country || "Brasil",
        state: userData.state || null,
        city: userData.city || null,
        streetAddress: userData.streetAddress || null,
        houseType: userData.houseType || null,
        houseNumber: userData.houseNumber || null,
        complement: userData.complement || null,
        neighborhood: userData.neighborhood || null,
        // Dados RH
        employeeCode: userData.employeeCode || null,
        pis: userData.pis || null,
        cargo: userData.cargo || null,
        ctps: userData.ctps || null,
        serieNumber: userData.serieNumber || null,
        admissionDate: userData.admissionDate
          ? new Date(userData.admissionDate)
          : null,
        costCenter: userData.costCenter || null,
        // Campos padrão
        status: "active",
        performance: 75,
        employmentType: userData.employmentType || "clt",
      };

      console.log("🔍 [USER-CREATE] Creating user with data:", {
        id: userToCreate.id,
        email: userToCreate.email,
        tenantId: userToCreate.tenantId,
        role: userToCreate.role,
      });

      const newUser = await db
        .insert(usersTable)
        .values(userToCreate)
        .returning();

      console.log(
        `✅ [USER-CREATE] User created successfully: ${userData.email} (ID: ${newUser[0].id})`,
      );

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          firstName: newUser[0].firstName,
          lastName: newUser[0].lastName,
          role: newUser[0].role,
          isActive: newUser[0].isActive,
          createdAt: newUser[0].createdAt,
        },
        tempPassword: userData.sendInvitation ? null : tempPassword, // Só retorna se não enviar convite
      });
    } catch (error) {
      console.error("❌ [USER-CREATE] Error creating user:", error);
      if (error.code === "23505") {
        // Violação de unique constraint
        res
          .status(409)
          .json({ success: false, message: "Email already exists" });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to create user",
          error: error.message,
        });
      }
    }
  },
);

// Get user by ID
router.get(
  "/users/:userId",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.user!.tenantId;
      const user = await userManagementService.getUserById(userId, tenantId);

      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Return user directly to match frontend expectations
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  },
);

// Update user by ID - following 1qa.md patterns with Zod validation and Clean Architecture
router.put(
  "/users/:userId",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.user!.tenantId;

      console.log("🔍 [USER-UPDATE] Received update data:", {
        userId,
        tenantId,
        dataKeys: Object.keys(req.body),
      });

      // Validate tenant access
      if (!tenantId) {
        return res.status(400).json({ 
          success: false,
          message: "Tenant ID is required" 
        });
      }

      // Validate request body using Zod schema
      const { updateUserSchema } = await import("@shared/schema");
      const validationResult = updateUserSchema.safeParse(req.body);

      if (!validationResult.success) {
        console.log("❌ [USER-UPDATE] Validation failed:", validationResult.error.errors);
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: validationResult.error.errors,
        });
      }

      const validatedData = validationResult.data;

      // Use userManagementService following Clean Architecture
      const updatedUser = await userManagementService.updateUser(
        userId, 
        tenantId, 
        validatedData
      );

      // Return updated user data formatted for frontend
      const formattedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: `${updatedUser.firstName || ""} ${updatedUser.lastName || ""}`.trim() || updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        tenantId: updatedUser.tenantId,
        profileImageUrl: updatedUser.profileImageUrl,
        department: updatedUser.cargo || "",
        position: updatedUser.cargo || "",
        // Include updated HR data
        integrationCode: updatedUser.integrationCode,
        alternativeEmail: updatedUser.alternativeEmail,
        cellPhone: updatedUser.cellPhone,
        phone: updatedUser.phone,
        ramal: updatedUser.ramal,
        timeZone: updatedUser.timeZone,
        vehicleType: updatedUser.vehicleType,
        cpfCnpj: updatedUser.cpfCnpj,
        cep: updatedUser.cep,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        streetAddress: updatedUser.streetAddress,
        houseType: updatedUser.houseType,
        houseNumber: updatedUser.houseNumber,
        complement: updatedUser.complement,
        neighborhood: updatedUser.neighborhood,
        employeeCode: updatedUser.employeeCode,
        pis: updatedUser.pis,
        cargo: updatedUser.cargo,
        ctps: updatedUser.ctps,
        serieNumber: updatedUser.serieNumber,
        admissionDate: updatedUser.admissionDate,
        costCenter: updatedUser.costCenter,
        employmentType: updatedUser.employmentType,
      };

      res.json({
        success: true,
        message: "User updated successfully",
        user: formattedUser,
      });
    } catch (error: any) {
      console.error("❌ [USER-UPDATE] Error updating user:", error);

      // Handle specific error types
      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "User not found or access denied",
        });
      }

      // Handle unique constraint violation (duplicate email)
      if (error.code === "23505" || error.constraint?.includes("email")) {
        return res.status(409).json({
          success: false,
          message: "Email address is already in use by another user",
          error: "DUPLICATE_EMAIL",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update user",
        error: error.message,
      });
    }
  },
);

// ============= USER GROUPS ROUTES =============

// Get user groups with role-based access control
// Get user groups with role-based access control
router.get("/groups", jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user!.role;
    const currentUserTenantId = req.user!.tenantId;

    console.log(
      `🔍 [USER-GROUPS] Fetching groups for user role: ${userRole}, tenant: ${currentUserTenantId}`,
    );

    // Verificar permissões
    const hasPermission =
      userRole === "saas_admin" ||
      userRole === "tenant_admin" ||
      userRole === "workspace_admin";

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions to access user groups",
      });
    }

    const schemaName = `tenant_${currentUserTenantId!.replace(/-/g, "_")}`;

    // 🔎 Verificar se o schema existe
    const schemaExistsQuery = sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      `;
    const schemaResult = await db.execute(schemaExistsQuery);

    if (schemaResult.rows.length === 0) {
      console.log(`⚠️ [USER-GROUPS] Schema ${schemaName} doesn't exist`);
      return res.status(404).json({
        success: false,
        error: "Tenant schema not found",
      });
    }

    // 🔎 Query única que traz grupos + membros
    const groupsQuery = sql`
        SELECT 
          ug.id,
          ug.name,
          ug.description,
          ug.is_active,
          ug.created_at,
          COALESCE(COUNT(ugm.id), 0) AS member_count,
          COALESCE(
            json_agg(
              json_build_object(
                'membershipId', ugm.id,
                'userId', ugm.user_id,
                'role', ugm.role,
                'addedAt', ugm.created_at
              )
            ) FILTER (WHERE ugm.id IS NOT NULL),
            '[]'
          ) AS memberships
        FROM ${sql.raw(`"${schemaName}"`)}."user_groups" ug
        LEFT JOIN ${sql.raw(`"${schemaName}"`)}."user_group_memberships" ugm 
          ON ug.id = ugm.group_id AND ugm.is_active = true
        WHERE ug.is_active = true
        GROUP BY ug.id, ug.name, ug.description, ug.is_active, ug.created_at
        ORDER BY ug.name
      `;

    const groupsResult = await db.execute(groupsQuery);

    const groupsWithMemberships = groupsResult.rows.map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      isActive: group.is_active,
      createdAt: group.created_at,
      memberCount: Number(group.member_count),
      memberships: group.memberships,
      tenantId: currentUserTenantId,
    }));

    console.log(
      `✅ [USER-GROUPS] Found ${groupsWithMemberships.length} groups in own tenant`,
    );

    res.json({
      success: true,
      groups: groupsWithMemberships,
      count: groupsWithMemberships.length,
    });
  } catch (error: any) {
    console.error("❌ [USER-GROUPS] Error fetching user groups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user groups",
      details: error?.message || "Unknown error",
    });
  }
});

// Create user group in tenant schema
router.post("/groups", jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      console.error("❌ [USER-GROUPS] Missing required fields:", {
        tenantId,
        userId,
      });
      return res.status(400).json({
        success: false,
        message: "Tenant ID and user ID required",
      });
    }

    console.log("🆕 [USER-GROUPS] Creating group with:", {
      tenantId,
      userId,
      name: name.trim(),
      schemaName: `tenant_${tenantId.replace(/-/g, "_")}`,
    });

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
    const tableIdent = sql.raw(`"${schemaName}".user_groups`);

    console.log(
      `🆕 [USER-GROUPS] Creating group "${name}" in schema: ${schemaName}`,
    );

    // Checagem de existência (parametrizada) - removendo tenant_id pois não existe na tabela
    const existingGroupQuery = sql`
        SELECT id
        FROM ${tableIdent}
        WHERE name = ${name.trim()}
          AND is_active = true
      `;
    const existingResult = await db.execute(existingGroupQuery);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A group with this name already exists",
      });
    }

    // Criação
    const groupId = crypto.randomUUID();
    const now = new Date();

    const descOrNull =
      description && String(description).trim()
        ? String(description).trim()
        : null;

    const result = await db.execute(sql`
        INSERT INTO ${sql.raw(`"${schemaName}".user_groups`)} 
          (id, tenant_id, name, description, is_active, created_by_id, created_at, updated_at)
        VALUES (
          ${groupId}::uuid, 
          ${tenantId}::uuid, 
          ${name.trim()}, 
          ${descOrNull}, 
          ${true}, 
          ${userId}::uuid, 
          ${now}, 
          ${now}
        )
        RETURNING id, tenant_id, name, description, is_active, created_at
      `);

    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to create group",
      });
    }

    const newGroup = result.rows[0];

    console.log(`✅ [USER-GROUPS] Created group "${name}" with ID: ${groupId}`);

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        isActive: newGroup.is_active,
        createdAt: newGroup.created_at,
        memberCount: 0,
        memberships: [],
        tenantId: newGroup.tenant_id,
      },
    });
  } catch (error: any) {
    console.error("❌ [USER-GROUPS] Error creating group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create group",
      error: error?.message || "Unknown error occurred",
    });
  }
});

// Update user group in tenant schema
router.put(
  "/groups/:groupId",
  jwtAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const { name, description, permissions } = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Tenant ID and user ID required",
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Group name is required",
        });
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
      const groupsTable = sql.raw(`"${schemaName}".user_groups`);

      console.log(
        `✏️ [USER-GROUPS] Updating group ${groupId} in schema: ${schemaName}`,
      );

      // 🔎 Check if group exists - removendo tenant_id pois não existe na tabela
      const groupQuery = sql`
        SELECT id
        FROM ${groupsTable}
        WHERE id = ${groupId} AND is_active = true
      `;
      const groupResult = await db.execute(groupQuery);

      if (!groupResult.rows.length) {
        console.log(`Group ${groupId} not found for tenant ${tenantId}`);
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      // 🔎 Check for name conflict - removendo tenant_id pois não existe na tabela
      const conflictQuery = sql`
        SELECT id
        FROM ${groupsTable}
        WHERE name = ${name.trim()}
          AND id != ${groupId}
          AND is_active = true
      `;
      const conflictResult = await db.execute(conflictQuery);

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "A group with this name already exists",
        });
      }

      // ✏️ Update group
      const nowIso = new Date().toISOString();
      const descOrNull = description?.trim() || null;

      // garante jsonb válido
      const permissionsExpr = sql`${JSON.stringify(permissions || [])}::jsonb`;

      const updateQuery = sql`
        UPDATE ${groupsTable}
        SET
          name = ${name.trim()},
          description = ${descOrNull},
          permissions = ${permissionsExpr},
          updated_at = ${nowIso}::timestamptz
        WHERE id = ${groupId}
        RETURNING id, name, description, permissions, is_active, created_at, updated_at
      `;
      const result = await db.execute(updateQuery);

      if (result.rows.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to update group",
        });
      }

      const updatedGroup = result.rows[0];

      console.log(`✅ [USER-GROUPS] Updated group ${groupId}`);

      res.json({
        success: true,
        message: "Group updated successfully",
        group: {
          id: updatedGroup.id,
          name: updatedGroup.name,
          description: updatedGroup.description,
          permissions: updatedGroup.permissions || [],
          isActive: updatedGroup.is_active,
          createdAt: updatedGroup.created_at,
          updatedAt: updatedGroup.updated_at,
        },
      });
    } catch (error: any) {
      console.error("❌ [USER-GROUPS] Error updating group:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update group",
        error: error?.message || "Unknown error occurred",
      });
    }
  },
);

// Delete user group in tenant schema
router.delete(
  "/groups/:groupId",
  jwtAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Tenant ID required",
        });
      }

      console.log(
        `🗑️ [USER-GROUPS] Deleting group ${groupId} from own tenant: ${tenantId}`,
      );

      // Both SaaS Admin and Workspace Admin can only delete from own tenant
      const targetSchema = `tenant_${tenantId.replace(/-/g, "_")}`;

      const groupsTable = sql.raw(`"${targetSchema}".user_groups`);
      const groupResult = await db.execute(
        sql`SELECT id FROM ${groupsTable} WHERE id = ${groupId} AND is_active = true`,
      );

      if (!groupResult.rows.length) {
        console.log(
          `🗑️ [USER-GROUPS] Group ${groupId} not found in tenant ${tenantId}`,
        );
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      // Define schema-qualified table identifiers
      const membershipsTable = sql.raw(
        `"${targetSchema}".user_group_memberships`,
      );

      // First, remove all memberships for this group
      await db.execute(
        sql`DELETE FROM ${membershipsTable} WHERE group_id = ${groupId}`,
      );

      // Then, delete the group (soft delete by setting is_active to false)
      const nowIso = new Date().toISOString();
      const result = await db.execute(
        sql`UPDATE ${groupsTable} SET is_active = false, updated_at = ${nowIso}::timestamptz WHERE id = ${groupId}`,
      );

      if (result.rowCount === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete group",
        });
      }

      console.log(`✅ [USER-GROUPS] Deleted group ${groupId} from own tenant`);

      res.json({
        success: true,
        message: "Group deleted successfully",
      });
    } catch (error: any) {
      console.error("❌ [USER-GROUPS] Error deleting group:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete group",
        error: error?.message || "Unknown error occurred",
      });
    }
  },
);

// ============= GROUP MEMBERS ROUTES =============

// Get group members
router.get(
  "/groups/:groupId/members",
  jwtAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const tenantId = req.user!.tenantId;

      if (!groupId || !tenantId) {
        return res.status(400).json({
          success: false,
          message: "Group ID and tenant ID are required",
        });
      }

      console.log(
        `Fetching members for group ${groupId} in tenant ${tenantId}`,
      );

      // Verificar se o grupo existe - removendo tenantId
      const groupExists = await db
        .select({ id: userGroups.id })
        .from(userGroups)
        .where(and(eq(userGroups.id, groupId), eq(userGroups.isActive, true)))
        .limit(1);

      if (!groupExists.length) {
        return res.status(404).json({
          success: false,
          message: "Group not found or access denied",
        });
      }

      // Query corrigida para buscar os membros do grupo
      const members = await db
        .select({
          membershipId: userGroupMemberships.id,
          userId: userGroupMemberships.userId,
          role: userGroupMemberships.role,
          userFirstName: usersTable.firstName,
          userLastName: usersTable.lastName,
          userEmail: usersTable.email,
          userPosition: usersTable.cargo,
          addedAt: userGroupMemberships.addedAt,
        })
        .from(userGroupMemberships)
        .innerJoin(usersTable, eq(userGroupMemberships.userId, usersTable.id))
        .where(
          and(
            eq(userGroupMemberships.groupId, groupId),
            eq(userGroupMemberships.isActive, true),
            eq(usersTable.isActive, true),
          ),
        )
        .orderBy(userGroupMemberships.addedAt);

      // Format members data consistently - corrigido para evitar campos undefined
      const formattedMembers = members.map((member) => ({
        membershipId: member.membershipId,
        userId: member.userId,
        role: member.role || "member",
        name:
          `${member.userFirstName || ""} ${member.userLastName || ""}`.trim() ||
          member.userEmail,
        email: member.userEmail,
        position: member.userPosition || "",
        addedAt: member.addedAt,
      }));

      console.log(
        `Found ${formattedMembers.length} members for group ${groupId}`,
      );
      res.json({
        success: true,
        members: formattedMembers,
        count: formattedMembers.length,
      });
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch group members",
        error: error.message,
      });
    }
  },
);

// Add user to group
router.post(
  "/groups/:groupId/members",
  jwtAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;
      const tenantId = req.user!.tenantId;

      // Verificar se o grupo existe - removendo tenantId pois usa schema per-tenant
      const group = await db
        .select()
        .from(userGroups)
        .where(and(eq(userGroups.id, groupId), eq(userGroups.isActive, true)))
        .limit(1);

      if (!group.length) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Verificar se o usuário existe
      const user = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.id, userId),
            eq(usersTable.tenantId, tenantId),
            eq(usersTable.isActive, true),
          ),
        )
        .limit(1);

      if (!user.length) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verificar se a associação já existe (ativa ou inativa) - removendo tenantId
      const existingMembership = await db
        .select()
        .from(userGroupMemberships)
        .where(
          and(
            eq(userGroupMemberships.userId, userId),
            eq(userGroupMemberships.groupId, groupId),
          ),
        )
        .limit(1);

      if (existingMembership.length > 0) {
        // Se existe mas está inativa, reativar
        if (!existingMembership[0].isActive) {
          const [reactivatedMembership] = await db
            .update(userGroupMemberships)
            .set({
              isActive: true,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(userGroupMemberships.userId, userId),
                eq(userGroupMemberships.groupId, groupId),
              ),
            )
            .returning();

          console.log(
            `Successfully reactivated user ${userId} in group ${groupId}`,
          );
          return res.status(200).json({
            message: "User membership reactivated successfully",
            membership: reactivatedMembership,
          });
        } else {
          // Se já está ativa, retornar conflito
          return res
            .status(409)
            .json({ message: "User is already a member of this group" });
        }
      }

      // Criar a associação usuário-grupo - removendo tenantId
      const [membership] = await db
        .insert(userGroupMemberships)
        .values({
          userId,
          groupId,
          role: "member",
          addedById: req.user!.id,
          isActive: true,
        })
        .returning();

      console.log(
        `Successfully added user ${userId} to group ${groupId} for tenant ${tenantId}`,
      );

      res.status(201).json({
        message: "User added to group successfully",
        membership,
      });
    } catch (error) {
      console.error("Error adding user to group:", error);
      res.status(500).json({ message: "Failed to add user to group" });
    }
  },
);

// Add multiple users to group (bulk operation)
router.post(
  "/groups/:groupId/members/bulk",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.params;
      const { userIds } = req.body;
      const tenantId = req.user!.tenantId;
      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

      console.log(
        `👥 [TENANT-GROUPS] Adding ${userIds?.length || 0} members to group ${groupId} in schema ${schemaName}`,
      );

      // Validate input
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          message: "userIds array is required and cannot be empty",
        });
      }

      // 1️⃣ Check if group exists
      const groupQuery = sql`
        SELECT id 
        FROM ${sql.raw(`"${schemaName}"`)}."user_groups" 
        WHERE id = ${groupId}::uuid 
          AND is_active = true
      `;
      const groupResult = await db.execute(groupQuery);

      if (!groupResult.rows.length) {
        console.log(`Group ${groupId} not found for tenant ${tenantId}`);
        return res.status(404).json({ message: "Group not found" });
      }

      const results = [];
      const now = new Date().toISOString();

      for (const userId of userIds) {
        try {
          // 2️⃣ Check if user exists
          const userQuery = sql`
            SELECT id 
            FROM public.users 
            WHERE id = ${userId}::uuid 
              AND tenant_id = ${tenantId}::uuid 
              AND is_active = true
          `;
          const userResult = await db.execute(userQuery);

          if (!userResult.rows.length) {
            results.push({ userId, success: false, error: "User not found" });
            continue;
          }

          // 3️⃣ Check if membership already exists
          const existingQuery = sql`
            SELECT id 
            FROM ${sql.raw(`"${schemaName}"`)}."user_group_memberships" 
            WHERE user_id = ${userId}::uuid 
              AND group_id = ${groupId}::uuid 
              AND is_active = true
          `;
          const existingResult = await db.execute(existingQuery);

          if (existingResult.rows.length > 0) {
            results.push({
              userId,
              success: false,
              error: "User is already a member",
            });
            continue;
          }

          // 4️⃣ Insert membership
          const membershipId = crypto.randomUUID();
          const insertQuery = sql`
            INSERT INTO ${sql.raw(`"${schemaName}"`)}."user_group_memberships" 
            (id, tenant_id, user_id, group_id, role, is_active, created_at, updated_at)
            VALUES (
              ${membershipId}::uuid, 
              ${tenantId}::uuid, 
              ${userId}::uuid, 
              ${groupId}::uuid, 
              'member', 
              true, 
              ${now}::timestamptz, 
              ${now}::timestamptz
            )
          `;
          await db.execute(insertQuery);

          results.push({ userId, success: true, membershipId });
        } catch (error: any) {
          console.error(`Error adding user ${userId} to group:`, error);
          results.push({ userId, success: false, error: error.message });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `✅ [TENANT-GROUPS] Successfully added ${successCount}/${userIds.length} users to group ${groupId}`,
      );

      res.json({
        success: true,
        message: `Added ${successCount} users to group`,
        results,
      });
    } catch (error: any) {
      console.error("❌ Error in bulk add:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add users to group",
        error: error?.message || "Unknown error occurred",
      });
    }
  },
);

// Remove user from group
router.delete(
  "/:groupId/members/:userId",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId, userId } = req.params;
      const tenantId = req.user!.tenantId;
      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

      // Check if group exists and belongs to tenant
      const groupQuery = sql`
      SELECT id FROM ${sql.raw(`"${schemaName}"`)}."user_groups" 
      WHERE id = ${groupId}::uuid AND tenant_id = ${tenantId}::uuid AND is_active = true
    `;
      const groupResult = await db.execute(groupQuery);

      if (!groupResult.rows.length) {
        console.log(`Group ${groupId} not found for tenant ${tenantId}`);
        return res.status(404).json({ message: "Group not found" });
      }

      // Check if active membership exists
      const existingQuery = sql`
      SELECT id FROM ${sql.raw(`"${schemaName}"`)}."user_group_memberships" 
      WHERE user_id = ${userId}::uuid AND group_id = ${groupId}::uuid AND is_active = true
    `;
      const existingResult = await db.execute(existingQuery);

      if (!existingResult.rows.length) {
        console.log(
          `Active membership not found for user ${userId} in group ${groupId}`,
        );
        return res
          .status(404)
          .json({ message: "User is not a member of this group" });
      }

      // Remove user from group (only active memberships)
      const deleteQuery = `
      DELETE FROM "${schemaName}".user_group_memberships 
      WHERE user_id = $1 AND group_id = $2 AND is_active = true
    `;
      const result = await db.execute(sql.raw(deleteQuery, [userId, groupId]));

      if (result.rowCount === 0) {
        return res
          .status(500)
          .json({ message: "Failed to remove user from group" });
      }

      console.log(
        `Successfully removed user ${userId} from group ${groupId} for tenant ${tenantId}`,
      );

      res.json({ message: "User removed from group successfully" });
    } catch (error) {
      console.error("Error removing user from group:", error);
      res.status(500).json({ message: "Failed to remove user from group" });
    }
  },
);

// ============= ROLES MANAGEMENT ROUTES =============

// Get all roles for tenant
router.get(
  "/roles",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
      const rolesTable = sql.raw(`"${schemaName}".roles`);
      const userRolesTable = sql.raw(`"${schemaName}".user_roles`);

      console.log(`🔍 [ROLES] Fetching roles from schema: ${schemaName}`);

      // Buscar roles com count de usuários associados
      const rolesQuery = sql`
        SELECT 
          r.id,
          r.name,
          r.description,
          r.permissions,
          r.is_active,
          r.is_system,
          r.created_at,
          r.updated_at,
          COUNT(ur.user_id) AS user_count
        FROM ${rolesTable} r
        LEFT JOIN ${userRolesTable} ur ON r.id = ur.role_id
        WHERE r.tenant_id = ${tenantId}::uuid AND r.is_active = true
        GROUP BY r.id, r.name, r.description, r.permissions, r.is_active, r.is_system, r.created_at, r.updated_at
        ORDER BY r.name
      `;

      const result = await db.execute(rolesQuery);

      const roles = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        permissions: row.permissions || [],
        isActive: row.is_active,
        isSystem: row.is_system,
        userCount: Number(row.user_count) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      console.log(
        `✅ [ROLES] Found ${roles.length} roles for tenant ${tenantId}`,
      );

      res.json({
        success: true,
        roles,
        count: roles.length,
      });
    } catch (error: any) {
      console.error("❌ [ROLES] Error fetching roles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch roles",
        error: error?.message || "Unknown error",
      });
    }
  },
);

// Get permissions catalog
router.get(
  "/permissions",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Mock permissions data based on workspace categories
      const permissions = [
        // Administração do Workspace
        {
          id: "workspace.manage",
          name: "Gerenciar Workspace",
          category: "workspace_admin",
          description: "Controle total do workspace",
          level: "workspace",
        },
        {
          id: "workspace.configure",
          name: "Configurar Workspace",
          category: "workspace_admin",
          description: "Alterar configurações",
          level: "workspace",
        },
        {
          id: "workspace.security",
          name: "Configurações de Segurança",
          category: "workspace_admin",
          description: "Definir políticas de segurança",
          level: "workspace",
        },
        {
          id: "workspace.integrations",
          name: "Gerenciar Integrações",
          category: "workspace_admin",
          description: "Configurar integrações",
          level: "workspace",
        },

        // Gestão de Usuários e Acesso
        {
          id: "user.view",
          name: "Visualizar Usuários",
          category: "user_access",
          description: "Ver lista de usuários",
          level: "workspace",
        },
        {
          id: "user.create",
          name: "Criar Usuários",
          category: "user_access",
          description: "Adicionar novos usuários",
          level: "workspace",
        },
        {
          id: "user.edit",
          name: "Editar Usuários",
          category: "user_access",
          description: "Modificar dados dos usuários",
          level: "workspace",
        },
        {
          id: "user.delete",
          name: "Excluir Usuários",
          category: "user_access",
          description: "Remover usuários",
          level: "workspace",
        },
        {
          id: "groups.manage",
          name: "Gerenciar Grupos",
          category: "user_access",
          description: "Administrar grupos de usuários",
          level: "workspace",
        },
        {
          id: "sessions.monitor",
          name: "Monitorar Sessões",
          category: "user_access",
          description: "Ver sessões ativas",
          level: "workspace",
        },

        // Atendimento ao Cliente
        {
          id: "tickets.view",
          name: "Visualizar Tickets",
          category: "customer_support",
          description: "Ver tickets de suporte",
          level: "workspace",
        },
        {
          id: "tickets.create",
          name: "Criar Tickets",
          category: "customer_support",
          description: "Abrir novos tickets",
          level: "workspace",
        },
        {
          id: "tickets.edit",
          name: "Editar Tickets",
          category: "customer_support",
          description: "Modificar tickets",
          level: "workspace",
        },
        {
          id: "tickets.delete",
          name: "Excluir Tickets",
          category: "customer_support",
          description: "Remover tickets",
          level: "workspace",
        },
        {
          id: "tickets.assign",
          name: "Atribuir Tickets",
          category: "customer_support",
          description: "Designar responsáveis",
          level: "workspace",
        },
        {
          id: "tickets.manage",
          name: "Gerenciar Tickets",
          category: "customer_support",
          description: "Controle total sobre tickets",
          level: "workspace",
        },

        // Gestão de Clientes
        {
          id: "customers.view",
          name: "Visualizar Clientes",
          category: "customer_management",
          description: "Ver dados dos clientes",
          level: "workspace",
        },
        {
          id: "customers.create",
          name: "Criar Clientes",
          category: "customer_management",
          description: "Adicionar novos clientes",
          level: "workspace",
        },
        {
          id: "customers.edit",
          name: "Editar Clientes",
          category: "customer_management",
          description: "Modificar dados dos clientes",
          level: "workspace",
        },
        {
          id: "customers.delete",
          name: "Excluir Clientes",
          category: "customer_management",
          description: "Remover clientes",
          level: "workspace",
        },

        // Recursos Humanos e Equipe
        {
          id: "hr.view",
          name: "Visualizar RH",
          category: "hr_team",
          description: "Ver dados de RH",
          level: "workspace",
        },
        {
          id: "hr.performance",
          name: "Gerenciar Performance",
          category: "hr_team",
          description: "Avaliar desempenho",
          level: "workspace",
        },
        {
          id: "hr.skills",
          name: "Matriz de Habilidades",
          category: "hr_team",
          description: "Gerenciar habilidades",
          level: "workspace",
        },
        {
          id: "hr.absence",
          name: "Gestão de Ausências",
          category: "hr_team",
          description: "Aprovar férias e licenças",
          level: "workspace",
        },

        // Timecard e Ponto
        {
          id: "timecard.view",
          name: "Visualizar Ponto",
          category: "timecard",
          description: "Ver registros de ponto",
          level: "workspace",
        },
        {
          id: "timecard.manage",
          name: "Gerenciar Ponto",
          category: "timecard",
          description: "Administrar registros",
          level: "workspace",
        },
        {
          id: "timecard.approve",
          name: "Aprovar Horas",
          category: "timecard",
          description: "Aprovar registros de horas",
          level: "workspace",
        },

        // Projetos e Tarefas

        // Analytics e Relatórios
        {
          id: "analytics.view",
          name: "Visualizar Analytics",
          category: "analytics",
          description: "Acessar relatórios",
          level: "workspace",
        },
        {
          id: "analytics.create",
          name: "Criar Relatórios",
          category: "analytics",
          description: "Gerar relatórios customizados",
          level: "workspace",
        },

        // Configurações e Personalização
        {
          id: "settings.view",
          name: "Visualizar Configurações",
          category: "settings",
          description: "Ver configurações",
          level: "workspace",
        },
        {
          id: "settings.edit",
          name: "Editar Configurações",
          category: "settings",
          description: "Modificar configurações",
          level: "workspace",
        },
        {
          id: "settings.branding",
          name: "Personalizar Branding",
          category: "settings",
          description: "Alterar visual",
          level: "workspace",
        },

        // Compliance e Segurança
        {
          id: "compliance.view",
          name: "Visualizar Compliance",
          category: "compliance",
          description: "Ver logs de auditoria",
          level: "workspace",
        },
        {
          id: "compliance.manage",
          name: "Gerenciar Compliance",
          category: "compliance",
          description: "Administrar conformidade",
          level: "workspace",
        },
      ];

      res.json({ permissions });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  },
);

// Create role
router.post(
  "/roles",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, permissions } = req.body;
      const tenantId = req.user!.tenantId;

      if (!name || !Array.isArray(permissions)) {
        return res
          .status(400)
          .json({ message: "Name and permissions are required" });
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
      const tableIdent = sql.raw(`"${schemaName}".roles`);

      const descOrNull = description ? description : null;
      const permsExpr = sql`${sql.raw("ARRAY[" + permissions.map((p) => `'${p}'`).join(",") + "][]")}`;

      const query = sql`
        INSERT INTO ${tableIdent}
          (tenant_id, name, description, permissions, is_active, is_system)
        VALUES (${tenantId}, ${descOrNull}, ${permsExpr}, true, false)
        RETURNING *
      `;

      const result = await db.execute(query);

      res.status(201).json({ role: result.rows[0] });
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  },
);

// Update role
router.put(
  "/roles/:roleId",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId } = req.params;
      const { name, description, permissions } = req.body;
      const tenantId = req.user!.tenantId;

      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
      const tableIdent = sql.raw(`"${schemaName}".roles`);
      const descOrNull = description ? description : null;
      const permsExpr = sql`${sql.raw("ARRAY[" + permissions.map((p) => `'${p}'`).join(",") + "][]")}`;

      const query = sql`
        UPDATE ${tableIdent}
        SET name = ${name}, description = ${descOrNull}, permissions = ${permsExpr}, updated_at = now()
        WHERE id = ${roleId}::uuid AND tenant_id = ${tenantId}::uuid
        RETURNING *
      `;

      const result = await db.execute(query);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json({ role: result.rows[0] });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  },
);

// Delete role (soft delete)
router.delete(
  "/roles/:roleId",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId } = req.params;
      const tenantId = req.user!.tenantId;

      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
      const tableIdent = sql.raw(`"${schemaName}".roles`);

      const query = sql`
        UPDATE ${tableIdent}
        SET is_active = false, updated_at = now()
        WHERE id = ${roleId}::uuid AND tenant_id = ${tenantId}::uuid
        RETURNING id
      `;

      const result = await db.execute(query);

      if (!result.rows.length) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  },
);

// Assign user to role
router.post(
  "/roles/:roleId/users",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId } = req.params;
      const { userId } = req.body;
      const tenantId = req.user!.tenantId;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
      const tableIdent = sql.raw(`"${schemaName}".user_roles`);

      const query = sql`
        INSERT INTO ${tableIdent} (user_id, role_id, assigned_at)
        VALUES (${userId}, ${roleId}, now())
        ON CONFLICT (user_id, role_id) DO NOTHING
        RETURNING *
      `;

      await db.execute(query);

      res.status(201).json({ message: "User assigned to role successfully" });
    } catch (error) {
      console.error("Error assigning user to role:", error);
      res.status(500).json({ message: "Failed to assign user to role" });
    }
  },
);

// Remove user from role
router.delete(
  "/roles/:roleId/users/:userId",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { roleId, userId } = req.params;
      const tenantId = req.user!.tenantId;

      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
      const tableIdent = sql.raw(`"${schemaName}".user_roles`);

      const query = sql`
        DELETE FROM ${tableIdent}
        WHERE role_id = ${roleId} AND user_id = ${userId}
      `;

      await db.execute(query);

      res.json({ message: "User removed from role successfully" });
    } catch (error) {
      console.error("Error removing user from role:", error);
      res.status(500).json({ message: "Failed to remove user from role" });
    }
  },
);

// Get all groups of a user
// Get all groups of a user
router.get(
  "/users/:userId/groups",
  jwtAuth,
  requirePermission("tenant", "manage_users"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.user!.tenantId;

      if (!userId || !tenantId) {
        return res.status(400).json({
          success: false,
          message: "User ID and Tenant ID are required",
        });
      }

      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

      console.log(
        `🔍 [USER-GROUPS] Fetching groups for user ${userId} in tenant ${tenantId}`,
      );

      // 1️⃣ Verifica se o usuário existe
      const userResult = await db.execute(`
        SELECT id 
        FROM public.users 
        WHERE id::text = '${userId}'::text
          AND tenant_id::text = '${tenantId}'::text
          AND is_active = true
        LIMIT 1
      `);

      if (!userResult.rows.length) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // 2️⃣ Busca os grupos do usuário
      const groupsQuery = `
        SELECT 
          ug.id,
          ug.name,
          ug.description,
          ug.is_active,
          ug.created_at,
          ug.updated_at,
          ugm.role
        FROM "${schemaName}".user_group_memberships ugm
        INNER JOIN "${schemaName}".user_groups ug
          ON ug.id::text = ugm.group_id::text
        WHERE ugm.user_id::text = '${userId}'::text
          AND ugm.is_active = true
          AND ug.is_active = true
        ORDER BY ug.name
      `;
      const groupsResult = await db.execute(groupsQuery);

      const groups = groupsResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        role: row.role || "member",
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tenantId,
      }));

      console.log(
        `✅ [USER-GROUPS] Found ${groups.length} groups for user ${userId} in tenant ${tenantId}`,
      );

      res.json({
        success: true,
        groups,
        count: groups.length,
      });
    } catch (error: any) {
      console.error("❌ [USER-GROUPS] Error fetching user groups:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user groups",
        error: error?.message || "Unknown error",
      });
    }
  },
);

export default router;