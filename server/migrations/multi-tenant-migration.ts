import { db } from '../db';
import { logger } from '../middleware/logger';

/**
 * Migração para criar as tabelas de multi-tenancy
 */
export async function runMultiTenantMigration() {
  try {
    logger.info('Starting multi-tenant migration...');

    // Criar tabela de relacionamentos usuário-tenant
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_tenant_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_primary BOOLEAN DEFAULT FALSE,
        granted_by UUID REFERENCES users(id),
        granted_at TIMESTAMP DEFAULT NOW(),
        last_accessed TIMESTAMP,
        permissions JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, tenant_id)
      )
    `);

    // Criar índices para performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_relationships_user_id 
      ON user_tenant_relationships(user_id)
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_relationships_tenant_id 
      ON user_tenant_relationships(tenant_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_relationships_active 
      ON user_tenant_relationships(is_active)
    `);

    // Criar tabela de convites
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_tenant_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        message TEXT,
        permissions JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        expires_at TIMESTAMP,
        responded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CHECK (user_id IS NOT NULL OR email IS NOT NULL)
      )
    `);

    // Criar índices para convites
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_invitations_tenant_id 
      ON user_tenant_invitations(tenant_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_invitations_user_id 
      ON user_tenant_invitations(user_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_invitations_email 
      ON user_tenant_invitations(email)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_invitations_status 
      ON user_tenant_invitations(status)
    `);

    // Criar tabela de logs de acesso
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_tenant_access_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // Criar índices para logs
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_access_log_user_id 
      ON user_tenant_access_log(user_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_access_log_tenant_id 
      ON user_tenant_access_log(tenant_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_tenant_access_log_timestamp 
      ON user_tenant_access_log(timestamp)
    `);

    // Migrar dados existentes - criar relacionamentos para usuários existentes
    await db.execute(`
      INSERT INTO user_tenant_relationships (user_id, tenant_id, role, is_active, is_primary, granted_at)
      SELECT 
        u.id, 
        u.tenant_id, 
        u.role, 
        u.is_active, 
        TRUE, -- É o tenant primário
        u.created_at
      FROM users u 
      WHERE u.tenant_id IS NOT NULL
      ON CONFLICT (user_id, tenant_id) DO NOTHING
    `);

    logger.info('Multi-tenant migration completed successfully');
    return true;

  } catch (error) {
    logger.error('Error running multi-tenant migration:', error);
    throw error;
  }
}

/**
 * Rollback da migração (apenas para desenvolvimento)
 */
export async function rollbackMultiTenantMigration() {
  try {
    logger.info('Rolling back multi-tenant migration...');

    await db.execute('DROP TABLE IF EXISTS user_tenant_access_log');
    await db.execute('DROP TABLE IF EXISTS user_tenant_invitations');
    await db.execute('DROP TABLE IF EXISTS user_tenant_relationships');

    logger.info('Multi-tenant migration rollback completed');
    return true;

  } catch (error) {
    logger.error('Error rolling back multi-tenant migration:', error);
    throw error;
  }
}