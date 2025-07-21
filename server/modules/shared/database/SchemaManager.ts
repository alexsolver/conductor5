// DEPRECATED: HARDCODED SQL SCHEMA MANAGER - USE server/db.ts INSTEAD
// This file contains hardcoded SQL that conflicts with the unified schema-master.ts
// MIGRATION: All schema operations now use the consolidated server/db.ts SchemaManager

// Re-export from main schema manager to maintain modularity
export { schemaManager } from "../../../db";

// DEPRECATED: This hardcoded SQL logic is replaced by unified schema management
const deprecatedCreateTablesQuery = `
          -- Customers table  
          CREATE TABLE IF NOT EXISTS ${schemaName}.customers (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            company VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- External contacts table (solicitantes/favorecidos)
          CREATE TABLE IF NOT EXISTS ${schemaName}.external_contacts (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            document VARCHAR(50),
            type VARCHAR(20) NOT NULL CHECK (type IN ('solicitante', 'favorecido')),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- Tickets table
          CREATE TABLE IF NOT EXISTS ${schemaName}.tickets (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            number VARCHAR(50) UNIQUE NOT NULL,
            subject VARCHAR(500) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'open',
            priority VARCHAR(20) DEFAULT 'medium',
            solicitante_id VARCHAR(36),
            favorecido_id VARCHAR(36),
            assignee_id VARCHAR(36),
            created_by VARCHAR(36),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            resolved_at TIMESTAMP,
            parent_ticket_id VARCHAR(36),
            FOREIGN KEY (solicitante_id) REFERENCES ${schemaName}.external_contacts(id),
            FOREIGN KEY (favorecido_id) REFERENCES ${schemaName}.external_contacts(id)
          );

          -- Ticket relationships table
          CREATE TABLE IF NOT EXISTS ${schemaName}.ticket_relationships (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            source_ticket_id VARCHAR(36) NOT NULL,
            target_ticket_id VARCHAR(36) NOT NULL,
            relationship_type VARCHAR(50) NOT NULL,
            description TEXT,
            created_by VARCHAR(36),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (source_ticket_id) REFERENCES ${schemaName}.tickets(id) ON DELETE CASCADE,
            FOREIGN KEY (target_ticket_id) REFERENCES ${schemaName}.tickets(id) ON DELETE CASCADE
          );

          -- Knowledge Base Articles table
          CREATE TABLE IF NOT EXISTS ${schemaName}.knowledge_base_articles (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            title VARCHAR(500) NOT NULL,
            excerpt TEXT,
            content TEXT NOT NULL,
            category VARCHAR(100) DEFAULT 'general',
            tags JSONB DEFAULT '[]',
            author VARCHAR(255) DEFAULT 'system',
            status VARCHAR(50) DEFAULT 'published',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- Locations table
          CREATE TABLE IF NOT EXISTS ${schemaName}.locations (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            address TEXT,
            postal_code VARCHAR(20),
            city VARCHAR(100),
            state VARCHAR(100),
            country VARCHAR(100),
            category VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- Customer Companies table
          CREATE TABLE IF NOT EXISTS ${schemaName}.customer_companies (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            industry VARCHAR(100),
            size VARCHAR(50),
            website VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- Customer Company Memberships table
          CREATE TABLE IF NOT EXISTS ${schemaName}.customer_company_memberships (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            customer_id VARCHAR(36) NOT NULL,
            company_id VARCHAR(36) NOT NULL,
            role VARCHAR(100),
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (customer_id) REFERENCES ${schemaName}.customers(id),
            FOREIGN KEY (company_id) REFERENCES ${schemaName}.customer_companies(id)
          );

          -- Internal Forms table
          CREATE TABLE IF NOT EXISTS ${schemaName}.internal_forms (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            fields JSONB NOT NULL DEFAULT '[]',
            is_active BOOLEAN DEFAULT true,
            created_by VARCHAR(36),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- Form Submissions table
          CREATE TABLE IF NOT EXISTS ${schemaName}.form_submissions (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            form_id VARCHAR(36) NOT NULL,
            submitted_data JSONB NOT NULL,
            submitted_by VARCHAR(36),
            submitted_at TIMESTAMP DEFAULT NOW(),
            processed BOOLEAN DEFAULT false,
            processed_at TIMESTAMP,
            ticket_id VARCHAR(36),
            FOREIGN KEY (form_id) REFERENCES ${schemaName}.internal_forms(id),
            FOREIGN KEY (ticket_id) REFERENCES ${schemaName}.tickets(id)
          );

          -- Skills table
          CREATE TABLE IF NOT EXISTS ${schemaName}.skills (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- User Skills table
          CREATE TABLE IF NOT EXISTS ${schemaName}.user_skills (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            skill_id VARCHAR(36) NOT NULL,
            proficiency_level VARCHAR(50) DEFAULT 'beginner',
            years_of_experience INTEGER DEFAULT 0,
            certification_details TEXT,
            last_used_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (skill_id) REFERENCES ${schemaName}.skills(id)
          );

          -- Projects table
          CREATE TABLE IF NOT EXISTS ${schemaName}.projects (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'planning',
            priority VARCHAR(20) DEFAULT 'medium',
            start_date DATE,
            end_date DATE,
            estimated_hours INTEGER,
            actual_hours INTEGER DEFAULT 0,
            budget DECIMAL(12, 2),
            client_id VARCHAR(36),
            project_manager_id VARCHAR(36),
            tags TEXT[],
            created_by VARCHAR(36),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (client_id) REFERENCES ${schemaName}.customers(id)
          );

          -- Project Actions table
          CREATE TABLE IF NOT EXISTS ${schemaName}.project_actions (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            project_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            action_type VARCHAR(100) NOT NULL,
            trigger_conditions JSONB DEFAULT '{}',
            action_config JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (project_id) REFERENCES ${schemaName}.projects(id) ON DELETE CASCADE
          );

          -- Ticket Templates table
          CREATE TABLE IF NOT EXISTS ${schemaName}.ticket_templates (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100) DEFAULT 'Geral',
            priority VARCHAR(20) DEFAULT 'medium',
            urgency VARCHAR(20) DEFAULT 'medium',
            impact VARCHAR(20) DEFAULT 'medium',
            default_title VARCHAR(500),
            default_description TEXT,
            default_tags TEXT,
            estimated_hours INTEGER DEFAULT 0,
            requires_approval BOOLEAN DEFAULT false,
            auto_assign BOOLEAN DEFAULT false,
            default_assignee_role VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_by VARCHAR(36),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- Email Templates table
          CREATE TABLE IF NOT EXISTS ${schemaName}.email_templates (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            subject VARCHAR(500),
            content TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- Emails table for IMAP integration
          CREATE TABLE IF NOT EXISTS ${schemaName}.emails (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(36) NOT NULL,
            message_id VARCHAR(255) NOT NULL,
            thread_id VARCHAR(255),
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255),
            to_email VARCHAR(255) NOT NULL,
            cc_emails TEXT DEFAULT '[]',
            bcc_emails TEXT DEFAULT '[]',
            subject VARCHAR(998),
            body_text TEXT,
            body_html TEXT,
            has_attachments BOOLEAN DEFAULT false,
            attachment_count INTEGER DEFAULT 0,
            attachment_details TEXT DEFAULT '[]',
            email_headers TEXT DEFAULT '{}',
            priority VARCHAR(20) DEFAULT 'medium',
            is_read BOOLEAN DEFAULT false,
            is_processed BOOLEAN DEFAULT false,
            rule_matched VARCHAR(255),
            ticket_created VARCHAR(36),
            email_date TIMESTAMP,
            received_at TIMESTAMP DEFAULT NOW(),
            processed_at TIMESTAMP
          );

          -- Integrations table
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            icon VARCHAR(100),
            status VARCHAR(50) DEFAULT 'disconnected',
            config JSONB DEFAULT '{}',
            features TEXT[],
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `;

const expectedTables = [
        'customers', 'external_contacts', 'tickets', 'ticket_relationships',
        'knowledge_base_articles', 'locations', 'customer_companies', 
        'customer_company_memberships', 'internal_forms', 'form_submissions',
        'skills', 'user_skills', 'projects', 'project_actions', 
      ];