// MASTER DATABASE CONFIGURATION - SINGLE SOURCE OF TRUTH
// Consolidates all database logic into one unified implementation
// Replaces: db.ts, db-unified.ts, and SchemaManager fragments

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema-master";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// ========================================
// UNIFIED SCHEMA MANAGER
// ========================================

class UnifiedSchemaManager {
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache
  private readonly schemaCache = new Map<string, { validated: boolean; timestamp: number }>();

  // All 17 required tables for tenant schemas
  private readonly REQUIRED_TABLES = [
    'customers', 'tickets', 'ticket_messages', 'activity_logs', 'locations',
    'customer_companies', 'skills', 'certifications', 'user_skills', 
    'favorecidos', 'external_contacts', 'customer_company_memberships',
    'time_records', 'daily_timesheet', 'work_schedules', 'time_bank', 
    'schedule_templates', 'absence_requests', 'compliance_alerts'
  ] as const;

  async validateTenantSchema(tenantId: string): Promise<boolean> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const cacheKey = `validate_${schemaName}`;
    const cached = this.schemaCache.get(cacheKey);

    // Return cached result if still valid
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.validated;
    }

    try {
      const isValid = await this.performSchemaValidation(schemaName);
      
      // Cache the result
      this.schemaCache.set(cacheKey, {
        validated: isValid,
        timestamp: Date.now()
      });

      return isValid;
    } catch (error) {
      console.error(`Schema validation failed for ${schemaName}:`, error);
      return false;
    }
  }

  private async performSchemaValidation(schemaName: string): Promise<boolean> {
    // Check if schema exists
    const schemaExists = await this.checkSchemaExists(schemaName);
    if (!schemaExists) {
      console.log(`Schema ${schemaName} does not exist, creating...`);
      await this.createTenantSchema(schemaName);
      return true;
    }

    // Check if all required tables exist
    const tableCount = await this.countTables(schemaName);
    if (tableCount < this.REQUIRED_TABLES.length) {
      console.log(`Schema ${schemaName} missing tables (${tableCount}/${this.REQUIRED_TABLES.length}), recreating...`);
      await this.autoHealSchema(schemaName);
      return true;
    }

    console.log(`✅ Schema ${schemaName} validation passed (${tableCount} tables)`);
    return true;
  }

  private async checkSchemaExists(schemaName: string): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      ) as exists
    `);
    return result[0]?.exists === true;
  }

  private async countTables(schemaName: string): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = ${schemaName}
      AND table_name = ANY(${this.REQUIRED_TABLES})
    `);
    return Number(result[0]?.count || 0);
  }

  private async autoHealSchema(schemaName: string): Promise<void> {
    console.log(`🔧 Auto-healing schema: ${schemaName}`);
    
    try {
      // Drop and recreate schema to ensure clean state
      await db.execute(sql`DROP SCHEMA IF EXISTS ${sql.identifier(schemaName)} CASCADE`);
      await this.createTenantSchema(schemaName);
      
      console.log(`✅ Schema ${schemaName} auto-healing completed`);
    } catch (error) {
      console.error(`❌ Schema ${schemaName} auto-healing failed:`, error);
      throw error;
    }
  }

  async createTenantSchema(schemaName: string): Promise<void> {
    const schemaId = sql.identifier(schemaName);
    const tenantId = schemaName.replace('tenant_', '').replace(/_/g, '-');

    try {
      // Create schema
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${schemaId}`);

      // Create all tenant tables using the unified approach
      await this.createAllTenantTables(schemaId, tenantId);

      console.log(`✅ Tenant schema ${schemaName} created successfully`);
    } catch (error) {
      console.error(`❌ Failed to create tenant schema ${schemaName}:`, error);
      throw error;
    }
  }

  private async createAllTenantTables(schemaId: any, tenantId: string): Promise<void> {
    // Execute all table creation in parallel for better performance
    await Promise.all([
      this.createCoreBusinessTables(schemaId, tenantId),
      this.createTimecardTables(schemaId, tenantId),
      this.createSupportTables(schemaId, tenantId)
    ]);
  }

  private async createCoreBusinessTables(schemaId: any, tenantId: string): Promise<void> {
    // Customers table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        cpf_cnpj VARCHAR(20),
        address VARCHAR(500),
        address_number VARCHAR(20),
        complement VARCHAR(100),
        neighborhood VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT customers_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Tickets table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(50) DEFAULT 'medium' NOT NULL,
        status VARCHAR(50) DEFAULT 'open' NOT NULL,
        urgency VARCHAR(50) DEFAULT 'medium',
        impact VARCHAR(50) DEFAULT 'medium',
        category VARCHAR(100),
        subcategory VARCHAR(100),
        requester_id UUID,
        beneficiary_id UUID,
        assigned_to UUID,
        assignment_group VARCHAR(100),
        location VARCHAR(255),
        business_impact VARCHAR(100),
        symptoms TEXT,
        workaround TEXT,
        due_date TIMESTAMP,
        trigger_date TIMESTAMP,
        original_due_date TIMESTAMP,
        resolution_date TIMESTAMP,
        closed_date TIMESTAMP,
        days_in_status INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT tickets_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Ticket Messages table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        ticket_id UUID NOT NULL,
        user_id UUID,
        message TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT ticket_messages_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Activity Logs table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        user_id UUID,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT activity_logs_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Locations table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500),
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        country VARCHAR(50),
        latitude VARCHAR(20),
        longitude VARCHAR(20),
        contact_info JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT locations_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);
  }

  private async createTimecardTables(schemaId: any, tenantId: string): Promise<void> {
    // Time Records table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.time_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        user_id UUID NOT NULL,
        record_type VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        location JSONB,
        method VARCHAR(20) DEFAULT 'web',
        ip_address VARCHAR(45),
        device_info JSONB,
        notes TEXT,
        is_validated BOOLEAN DEFAULT false,
        validated_by UUID,
        validated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT time_records_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Daily Timesheet table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.daily_timesheet (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        user_id UUID NOT NULL,
        work_date DATE NOT NULL,
        clock_in TIMESTAMP,
        clock_out TIMESTAMP,
        total_worked_minutes INTEGER DEFAULT 0,
        total_break_minutes INTEGER DEFAULT 0,
        overtime_minutes INTEGER DEFAULT 0,
        scheduled_minutes INTEGER,
        status VARCHAR(20) DEFAULT 'incomplete',
        work_schedule_id UUID,
        exceptions JSONB DEFAULT '[]',
        approved_by UUID,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT daily_timesheet_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Work Schedules table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.work_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        schedule_type VARCHAR(50) NOT NULL,
        work_days JSONB NOT NULL,
        daily_hours INTEGER DEFAULT 8,
        weekly_hours INTEGER DEFAULT 40,
        start_time VARCHAR(8),
        end_time VARCHAR(8),
        break_duration INTEGER DEFAULT 60,
        flex_time_window INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        effective_from DATE NOT NULL,
        effective_to DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT work_schedules_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Time Bank table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.time_bank (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        user_id UUID NOT NULL,
        reference_month VARCHAR(7) NOT NULL,
        credit_minutes INTEGER DEFAULT 0,
        debit_minutes INTEGER DEFAULT 0,
        net_balance INTEGER DEFAULT 0,
        max_credit_limit INTEGER DEFAULT 600,
        expiration_date DATE,
        compensation_used INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT time_bank_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Schedule Templates table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.schedule_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        schedule_type VARCHAR(50) NOT NULL,
        rotation_cycle_days INTEGER,
        configuration JSONB NOT NULL,
        requires_approval BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT schedule_templates_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Absence Requests table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.absence_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        user_id UUID NOT NULL,
        absence_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INTEGER NOT NULL,
        reason TEXT NOT NULL,
        medical_certificate VARCHAR(500),
        cover_user_id UUID,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by UUID,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT absence_requests_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Compliance Alerts table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.compliance_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        user_id UUID NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        related_date DATE,
        status VARCHAR(20) DEFAULT 'open',
        acknowledged_by UUID,
        acknowledged_at TIMESTAMP,
        resolved_by UUID,
        resolved_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT compliance_alerts_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);
  }

  private async createSupportTables(schemaId: any, tenantId: string): Promise<void> {
    // Customer Companies table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.customer_companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        description TEXT,
        size VARCHAR(50),
        subscription_tier VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT customer_companies_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Skills table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        level VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT skills_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Certifications table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.certifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        issuer VARCHAR(255),
        description TEXT,
        validity_months INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT certifications_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // User Skills table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.user_skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        user_id UUID NOT NULL,
        skill_id UUID NOT NULL,
        current_level VARCHAR(50),
        experience_years INTEGER,
        certification_ids JSONB DEFAULT '[]',
        last_validated TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT user_skills_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Favorecidos table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.favorecidos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        full_name VARCHAR(500),
        email VARCHAR(255),
        phone VARCHAR(50),
        cell_phone VARCHAR(50),
        company VARCHAR(255),
        cpf VARCHAR(20),
        rg VARCHAR(20),
        integration_code VARCHAR(100),
        contact_type VARCHAR(50),
        relationship VARCHAR(100),
        preferred_contact_method VARCHAR(50),
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT favorecidos_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // External Contacts table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.external_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        role VARCHAR(100),
        contact_type VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT external_contacts_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);

    // Customer Company Memberships table
    await db.execute(sql`
      CREATE TABLE ${schemaId}.customer_company_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(36) NOT NULL,
        customer_id UUID NOT NULL,
        company_id UUID NOT NULL,
        role VARCHAR(100),
        permissions JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT customer_company_memberships_tenant_id_check CHECK (LENGTH(tenant_id) = 36)
      )
    `);
  }

  async ensurePublicTables(): Promise<void> {
    try {
      // Create public schema tables if they don't exist
      await this.createPublicSchemaTables();
      console.log('✅ Public schema tables ensured');
    } catch (error) {
      console.error('❌ Failed to ensure public schema tables:', error);
      throw error;
    }
  }

  private async createPublicSchemaTables(): Promise<void> {
    // Sessions table (mandatory for Replit Auth)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)
    `);

    // Tenants table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) NOT NULL UNIQUE,
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Users table (public schema for cross-tenant access)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        first_name VARCHAR,
        last_name VARCHAR,
        role VARCHAR(50) DEFAULT 'agent' NOT NULL,
        tenant_id UUID REFERENCES tenants(id),
        profile_image_url VARCHAR,
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  // Clear schema cache
  clearCache(): void {
    this.schemaCache.clear();
    console.log('🧹 Schema cache cleared');
  }

  // Get cache statistics
  getCacheStats(): { totalEntries: number; validEntries: number } {
    const now = Date.now();
    let validEntries = 0;
    
    for (const [, entry] of this.schemaCache) {
      if ((now - entry.timestamp) < this.CACHE_TTL) {
        validEntries++;
      }
    }

    return {
      totalEntries: this.schemaCache.size,
      validEntries
    };
  }
}

// Export singleton instance
export const unifiedSchemaManager = new UnifiedSchemaManager();

// Compatibility exports for existing code
export { db as default };
export * from "@shared/schema-master";