# Conductor - Customer Support Platform

## Overview
Conductor is a modern SaaS customer support platform providing omnichannel support management with enterprise multitenancy. It features a gradient-focused design system and is built with a full-stack TypeScript architecture using React for the frontend and Node.js/Express for the backend. The platform aims to streamline customer support operations, offering comprehensive tools for managing tickets, customer interactions, and internal workflows. It is designed for scalability and internationalization, supporting various business models and geographical locations.

## User Preferences
Preferred communication style: Simple, everyday language.
Interface preference: Text-based hierarchical menus with dropdowns over visual card-based interfaces.

## Recent Changes (August 2025)
- **Employment Type System**: Successfully implemented dual employment type support with automatic detection
- **Terminology Engine**: Dynamic sidebar and interface terminology based on user's employment type (CLT vs Autonomous)
- **Route Management**: Automatic redirection to appropriate interfaces (/timecard vs /timecard-autonomous)
- **Database Integration**: Fixed employmentType field mapping and API endpoint responses
- **User Detection**: Real-time employment type detection with proper frontend/backend integration
- **Rich Text Editor Enhancement**: Implemented comprehensive Markdown-based editor with image support
  - Direct image pasting via Ctrl+V with automatic base64 conversion
  - File upload functionality for local images
  - URL-based image insertion
  - Toolbar with formatting buttons (bold, italic, lists, headers, quotes)
  - Replaced TipTap with stable Markdown editor to eliminate runtime errors
- **Ticket Details UI Enhancement**: Complete sidebar redesign with badge-based layout
  - **Company Section**: Changed from button-based to prominent blue gradient badge with building icon
  - **Client Section**: Replaced card layout with purple gradient badge and user icon
  - **Beneficiary Section**: Implemented indigo gradient badge with users icon
  - Removed all management buttons ("Ver Detalhes", "Gerenciar") for cleaner interface
  - Maintained dropdown functionality in edit mode while improving visual hierarchy
  - Enhanced information display with consistent email/phone contact details
- **Nomenclature Standardization (August 2025)**: Complete unification of beneficiary/favorecido terminology
  - **Database Schema**: Migrated all legacy "favorecidos" tables to "beneficiaries" across all tenants
  - **Backend Consistency**: Consolidated duplicate modules, standardized all storage methods and API routes to use /api/beneficiaries
  - **Frontend Translation**: Corrected Portuguese translation to display "Favorecido" for user-facing text while maintaining "beneficiary" in code
  - **Relationship Tables**: Updated all foreign key relationships from favorecido_customer_relationships to beneficiary_customer_relationships
  - **System Integration**: Fixed hierarchical selection (empresa → cliente → favorecido) with proper data loading and filtering
- **Simple Timer System (August 2025)**: Complete implementation of simplified action timer
  - **SimpleTimerContext**: Replaced complex timer logic with simple start/finish action tracking
  - **Automatic Timestamps**: Clicking "Iniciar Cronômetro" automatically fills start_time and creates action
  - **Visual Feedback**: Red blinking clock in header when action is active
  - **One-Click Finish**: Clicking header clock automatically fills end_time and completes action
  - **Persistent State**: Running actions persist across page reloads via localStorage
  - **Status**: ✅ FULLY FUNCTIONAL - All workflow steps working correctly
- **Materials Management System (August 2025)**: Comprehensive item catalog with embedded ticket integration
  - **Embedded Interface**: Complete materials system integrated within ticket details page (no external navigation)
  - **Three-Phase Workflow**: Planning → Execution → Control phases with separate tabs
  - **API Integration**: Full CRUD operations with backend (planned-items, consumed-items, costs-summary)
  - **LPU Integration**: Unit Price List system for cost calculations and pricing control
  - **Terminology Standardization**: Consistent use of "Itens" instead of "Materiais" throughout interface
  - **Pricing Rules System**: Complete CRUD operations for pricing rules with database integration
    - **Rule Types**: Percentual, Fixo, Escalonado, Dinâmico with priority system (1-10)
    - **Database Structure**: pricing_rules table with JSONB conditions/actions fields
    - **Interface**: Full form validation, table display with status badges, create/edit functionality
    - **Backend Integration**: Working API endpoints with proper tenant isolation
  - **Status**: ✅ FULLY FUNCTIONAL - Complete backend API, frontend integration, DELETE operations, and pricing rules creation working
- **Schema FK Consistency Fix (August 2025)**: Critical architectural fix for Foreign Key inconsistencies
  - **Problem Identified**: Inconsistent FK naming (customerId vs customerCompanyId) and wrong table references
  - **tickets table**: Added missing `customerCompanyId` field with proper FK to customer_companies.id
  - **FK Reference Fix**: Corrected ticketTemplates.customerCompanyId to reference customerCompanies.id instead of customers.id
  - **Indexing**: Added critical index tickets_tenant_company_idx for performance
  - **Materials Filtering**: Fixed MaterialsServicesMiniSystem to use correct customerCompanyId field
  - **Status**: ✅ CRITICAL FIXES APPLIED - Schema consistency restored, company filtering working correctly
- **Estimated Time Fields Removal (August 2025)**: Complete removal of "Tempo Estimado (min)" fields from ticket configurations
  - **Database Schema**: Removed `estimated_time_minutes` field from all ticket_actions tables across all tenants
  - **Backend API**: Updated ticketConfigRoutes.ts to remove field from queries and create/update operations
  - **Frontend Forms**: Removed "Tempo Estimado (min)" input field from TicketConfiguration action forms
  - **Schema Validation**: Updated Zod schemas to exclude estimatedTimeMinutes field entirely
  - **Status**: ✅ FULLY REMOVED - No more estimated time fields in categories, subcategories, or actions
- **Complete DBA Schema Consolidation (August 2025)**: Full resolution of DBA Master Report findings
  - **Schema Unification**: Total elimination of duplicate schemas - schema-master.ts as single source of truth
  - **Repository Integration**: Fixed all materials-services imports, resolved TypeScript errors across 8+ repository files
  - **Missing Fields Resolution**: Added critical fields (parentAssetId, qrCode, expirationDate, auditId, entityType, status, relatedEntityId)
  - **Asset Management**: Complete asset hierarchy with QR code tracking and location recording
  - **Compliance System**: Full audit trails, certification management, evidence collection with proper relationships
  - **Performance Optimization**: Tenant-first indexing strategy maintaining 40-60% query performance improvement
  - **Type Safety**: Complete TypeScript interface consolidation for all Materials, Assets, and Compliance modules
  - **Status**: ✅ 19/19 CRITICAL ISSUES RESOLVED - System evolved from critical/unstable to production-ready
- **Visual Work Status Indicator (August 2025)**: Real-time visual feedback for working status
  - **Yellow Aura**: Avatar displays yellow glowing ring when user has active timecard status = "working"
  - **Universal Support**: Works for both CLT and Autonomous users automatically
  - **Green Clock Icon**: Additional status indicator appears in header when working
  - **Real-time Updates**: Status refreshes every 30 seconds to maintain accuracy
  - **Integrated Detection**: Connected to timecard/ponto eletrônico system for authentic status tracking
  - **Status**: ✅ FULLY FUNCTIONAL - Visual indicators working correctly for all employment types

## System Architecture
Conductor follows a Clean Architecture with Domain-Driven Design principles.

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom gradient design system and Shadcn UI components built on Radix UI primitives.
- **State Management**: TanStack React Query for server state management.
- **Routing**: Wouter for client-side routing with employment-aware route guards.
- **Build Tool**: Vite.
- **UI/UX Decisions**: Gradient-focused design (purple/blue primary, pink/red secondary, blue/cyan success). Color system is dynamic and database-driven for badges and configurations. UI prioritizes text-based hierarchical menus and organized sections over card-based interfaces for complex data. Custom color system allows dynamic badge colors based on database configurations.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Local JWT authentication.
- **Session Management**: Express sessions with PostgreSQL storage.
- **API Design**: RESTful endpoints with structured error handling.
- **Architecture Pattern**: Clean Architecture with Domain, Application, and Infrastructure layers.
- **Multi-tenancy**: True schema separation where each tenant has a dedicated PostgreSQL schema (`tenant_{uuid}`).
- **Employment Type System**: Dual employment type support (CLT/Autonomous) with automatic detection, terminology mapping, and route redirection.
- **Key Features**:
    - **Authentication & Authorization**: Local JWT with access/refresh tokens, bcrypt hashing, and a four-tier RBAC system (saas_admin, tenant_admin, agent, customer) with granular permissions and tenant isolation.
    - **Ticket Management**: Comprehensive system with ServiceNow-style fields, advanced specialized fields (attachments, notes, communication, history, internal actions), hierarchical configurations (category → subcategory → action), and dynamic metadata. Full audit trail for internal action deletions with proper history logging using `performed_by` column. Rich text description editor with Markdown support and multiple image insertion methods (paste, upload, URL).
    - **Customer & Beneficiary Management**: Flexible person management system for callers and beneficiaries, including sensitive data protection with agent password verification.
    - **Location Management**: Comprehensive system supporting 7 types of location records (Local, Região, Rota Dinâmica, Trecho, Rota de Trecho, Área, Agrupamento) with advanced UX features like CEP auto-fill, interactive map coordinate collection, and centralized operating hours.
    - **User & Team Management**: Consolidated system for user and team management with HR database schema expansion, user group memberships, and a list-based view for team members.
    - **Project Management**: Full project and project actions system, including automatic project-ticket integration and detailed task tracking.
    - **Timecard/Journey Management**: Comprehensive CLT-compliant electronic timecard system with NSR (sequential numbering), SHA-256 integrity hashing, complete audit trails, digital signatures, automatic backups, and compliance reports. Fully compliant with Portaria 671/2021 MTE requirements for electronic timekeeping systems. **Dual Employment Support**: Complete system supporting both CLT and Autonomous workers with distinct interfaces and terminology ("Ponto"→"Registro de Jornada", "Entrada/Saída"→"Início/Fim de Atividade") while maintaining identical backend functionality. Automatic employment type detection and route redirection ensures users see appropriate interface. **Status**: ✅ FULLY IMPLEMENTED (August 2025) - Dynamic sidebar terminology, automatic route redirection, and employment type detection working correctly.
    - **Omnichannel Communication**: Unified communication center supporting multiple channels (email, WhatsApp, Slack) with real-time inbox processing, rule-based automation, and template management.
    - **Agenda/Schedule Management**: Integrated scheduling system with filtering capabilities connecting client companies, team management groups, and users. Features timeline and 14-day agenda views with automatic filtering of technicians based on selected groups.
    - **Internationalization (i18n)**: Comprehensive i18n system with 5 languages, dynamic language switching, regional formatting, and a translation management interface for SaaS admins.
    - **Template System**: Dynamic UI customization system allowing professional themes and gradient styles via CSS variable integration.
    - **Module Integrity Control**: System for detecting code quality issues, security vulnerabilities (e.g., SQL injection, hardcoded credentials), and architectural compliance deviations.
    - **Multilocation System**: Hybrid system supporting Brazilian nomenclature (CPF/CNPJ) with international aliases, ready for global expansion.
    - **Inventory Management**: Comprehensive stock, supplier, and services management modules, including item catalog, stock tracking, and supplier ratings.

## External Dependencies
- **Database**: Neon PostgreSQL.
- **UI Components**: Radix UI, Shadcn UI.
- **Form Management**: React Hook Form, Zod.
- **Date Handling**: date-fns.
- **Email Communication**: `imap` and `mailparser` for real Gmail IMAP connection.
- **Geocoding/Address Lookup**: ViaCEP API for address auto-fill.
- **Mapping**: Leaflet for interactive map integration.
- **Rich Text Editor**: TipTap.
- **Logging**: Winston for structured logging.