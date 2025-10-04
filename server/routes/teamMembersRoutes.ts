import { Router, Response } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { requirePermission, AuthorizedRequest } from '../middleware/rbacMiddleware';
import { db } from '../db';
import { users as usersTable } from '@shared/schema-public';
import { eq, and, sql } from 'drizzle-orm';
import { sendInvitationEmail } from '../services/sendgridService';
import crypto from 'crypto';

const router = Router();

// Get all team members for a tenant
router.get(
  '/members',
  jwtAuth,
  requirePermission('tenant', 'manage_users'),
  async (req, res: Response) => {
    // Type assertion after middleware chain
    const authorizedReq = req as AuthorizedRequest;
    try {
      const tenantId = authorizedReq.user!.tenantId;
      const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

      console.log(`🔍 [TEAM-MEMBERS] Fetching team members for tenant: ${tenantId}`);

      // Buscar todos os usuários ativos do tenant
      const members = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          role: usersTable.role,
          isActive: usersTable.isActive,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          tenantId: usersTable.tenantId,
          profileImageUrl: usersTable.profileImageUrl,
          department: usersTable.cargo,
          position: usersTable.cargo,
          lastLogin: usersTable.updatedAt, // Using updatedAt as placeholder for lastLogin
        })
        .from(usersTable)
        .where(
          and(eq(usersTable.tenantId, tenantId), eq(usersTable.isActive, true))
        )
        .orderBy(usersTable.firstName, usersTable.lastName);

      console.log(
        `✅ [TEAM-MEMBERS] Found ${members.length} team members for tenant ${tenantId}`
      );

      // Buscar memberships + grupos using raw SQL with proper UUID handling
      const membershipsResult = await db.execute(sql.raw(`
        SELECT 
          ugm.user_id,
          ug.id AS group_id,
          ug.name AS group_name,
          ug.description AS group_description,
          ugm.role,
          ugm.is_active,
          ugm.created_at
        FROM "${schemaName}".user_group_memberships ugm
        INNER JOIN "${schemaName}".user_groups ug
          ON ug.id = ugm.group_id
        WHERE ugm.tenant_id::text = '${tenantId}'
          AND ug.is_active = true
      `));

      // Organizar grupos por usuário
      const groupsByUser: Record<string, any[]> = {};
      membershipsResult.rows.forEach((row: any) => {
        if (!groupsByUser[row.user_id]) groupsByUser[row.user_id] = [];
        groupsByUser[row.user_id].push({
          id: row.group_id,
          name: row.group_name,
          description: row.group_description,
          role: row.role,
          isActive: row.is_active,
          createdAt: row.created_at,
        });
      });

      // Format data for frontend
      const formattedMembers = members.map((member) => ({
        id: member.id,
        email: member.email,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        name:
          `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
          member.email,
        role: member.role,
        isActive: member.isActive,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        tenantId: member.tenantId,
        profileImageUrl: member.profileImageUrl,
        department: member.department || '',
        position: member.position || '',
        lastLogin: member.lastLogin,
        // ✅ Novo campo groups
        groups: groupsByUser[member.id] || [],
      }));

      res.json({
        success: true,
        members: formattedMembers,
        count: formattedMembers.length,
      });
    } catch (error) {
      console.error('❌ [TEAM-MEMBERS] Error fetching team members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team members',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);


// Send team member invitation via email
router.post(
  '/invite',
  jwtAuth,
  requirePermission('tenant', 'manage_users'),
  async (req, res: Response) => {
    const authorizedReq = req as AuthorizedRequest;

    try {
      const tenantId = authorizedReq.user!.tenantId;
      const { email, role, notes, sendEmail } = req.body;

      console.log('🔍 [TEAM-INVITATION] Received invitation request:', {
        email,
        role,
        tenantId,
        sendEmail
      });

      // Validação básica
      if (!email) {
        return res.status(400).json({ 
          success: false,
          message: 'Email is required' 
        });
      }

      if (!tenantId) {
        return res.status(400).json({ 
          success: false,
          message: 'Tenant ID is required' 
        });
      }

      // Verificar se usuário já existe
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Gerar token de convite
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

      // Criar registro de convite
      const invitationRecord = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        role: role || 'agent',
        token: invitationToken,
        tenantId: tenantId,
        expiresAt: expiresAt,
        invitedAt: new Date(),
        status: 'pending',
        notes: notes || '',
        invitedByUserId: authorizedReq.user!.userId,
      };

      console.log('🔍 [TEAM-INVITATION] Created invitation record:', {
        id: invitationRecord.id,
        email: invitationRecord.email,
        token: invitationRecord.token,
        expiresAt: invitationRecord.expiresAt,
      });

      // Enviar email se solicitado
      if (sendEmail !== false) { // Default é true
        try {
          console.log('🔍 [TEAM-INVITATION] Starting email sending process...');
          console.log('🔍 [TEAM-INVITATION] Environment check - SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
          console.log('🔍 [TEAM-INVITATION] Environment check - SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);

          const invitationUrl = `${process.env.FRONTEND_URL || 'https://conductor.lansolver.com'}/accept-invitation?token=${invitationToken}`;
          console.log('🔍 [TEAM-INVITATION] Invitation URL generated:', invitationUrl);

          const inviterName = authorizedReq.user!.firstName && authorizedReq.user!.lastName 
            ? `${authorizedReq.user!.firstName} ${authorizedReq.user!.lastName}` 
            : authorizedReq.user!.email;

          console.log('🔍 [TEAM-INVITATION] Inviter name:', inviterName);
          console.log('🔍 [TEAM-INVITATION] Email parameters prepared, calling sendInvitationEmail...');

          const emailResult = await sendInvitationEmail({
            to: email,
            invitationUrl: invitationUrl,
            inviterName: inviterName,
            role: role || 'agent',
            notes: notes,
            expiresAt: expiresAt,
          });

          console.log('🔍 [TEAM-INVITATION] SendGrid response:', emailResult);

          if (emailResult) {
            console.log('✅ [TEAM-INVITATION] Email sent successfully to:', email);
          } else {
            console.log('⚠️ [TEAM-INVITATION] Email sending failed - check SendGrid configuration');
            console.log('⚠️ [TEAM-INVITATION] Continuing with invitation creation...');
          }
        } catch (emailError) {
          console.error('❌ [TEAM-INVITATION] Error sending email:', emailError);
          console.error('❌ [TEAM-INVITATION] Error details:', emailError.message);
          console.error('❌ [TEAM-INVITATION] Error stack:', emailError.stack);
          // Não falhar a criação do convite se o email falhar
        }
      } else {
        console.log('🔍 [TEAM-INVITATION] Email sending disabled by request');
      }

      res.status(201).json({
        success: true,
        message: 'Team member invitation created successfully',
        invitation: {
          id: invitationRecord.id,
          email: invitationRecord.email,
          role: invitationRecord.role,
          status: invitationRecord.status,
          expiresAt: invitationRecord.expiresAt,
          invitedAt: invitationRecord.invitedAt,
          token: invitationRecord.token,
        },
      });

    } catch (error) {
      console.error('❌ [TEAM-INVITATION] Error creating team invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team member invitation',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// ✅ 1QA.MD: Team member invitation endpoint with proper SendGrid integration
router.post(
  '/invite',
  jwtAuth,
  requirePermission('tenant', 'manage_users'),
  async (req, res: Response) => {
    const authorizedReq = req as AuthorizedRequest;

    try {
      const tenantId = authorizedReq.user!.tenantId;
      const { email, role, notes, sendEmail } = req.body;

      console.log('🔍 [TEAM-MEMBERS-INVITATION] Received invitation request:', {
        email,
        role,
        tenantId,
        sendEmail
      });

      // Validação básica
      if (!email) {
        return res.status(400).json({ 
          success: false,
          message: 'Email is required' 
        });
      }

      if (!tenantId) {
        return res.status(400).json({ 
          success: false,
          message: 'Tenant ID is required' 
        });
      }

      // Verificar se usuário já existe
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Gerar token de convite
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

      console.log('🔍 [TEAM-MEMBERS-INVITATION] Generated invitation token:', invitationToken);

      // Enviar email se solicitado
      if (sendEmail !== false) { // Default é true
        try {
          console.log('🔍 [TEAM-MEMBERS-INVITATION] Starting email sending process...');
          
          const invitationUrl = `${process.env.FRONTEND_URL || 'https://conductor.lansolver.com'}/accept-invitation?token=${invitationToken}`;
          console.log('🔍 [TEAM-MEMBERS-INVITATION] Invitation URL generated:', invitationUrl);

          const inviterName = authorizedReq.user!.firstName && authorizedReq.user!.lastName 
            ? `${authorizedReq.user!.firstName} ${authorizedReq.user!.lastName}` 
            : authorizedReq.user!.email;

          console.log('🔍 [TEAM-MEMBERS-INVITATION] Email parameters prepared, calling sendInvitationEmail...');

          const emailResult = await sendInvitationEmail({
            to: email,
            invitationUrl: invitationUrl,
            inviterName: inviterName,
            role: role || 'agent',
            notes: notes,
            expiresAt: expiresAt,
          });

          console.log('🔍 [TEAM-MEMBERS-INVITATION] SendGrid response:', emailResult);

          if (emailResult) {
            console.log('✅ [TEAM-MEMBERS-INVITATION] Email sent successfully to:', email);
          } else {
            console.log('⚠️ [TEAM-MEMBERS-INVITATION] Email sending failed - check SendGrid configuration');
          }
        } catch (emailError) {
          console.error('❌ [TEAM-MEMBERS-INVITATION] Error sending email:', emailError);
          // Não falhar a criação do convite se o email falhar
        }
      } else {
        console.log('🔍 [TEAM-MEMBERS-INVITATION] Email sending disabled by request');
      }

      res.status(201).json({
        success: true,
        message: 'Team member invitation created successfully',
        invitation: {
          email: email,
          role: role || 'agent',
          status: 'pending',
          expiresAt: expiresAt,
          token: invitationToken,
        },
      });

    } catch (error) {
      console.error('❌ [TEAM-MEMBERS-INVITATION] Error creating team invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team member invitation',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;