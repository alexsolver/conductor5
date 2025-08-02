# Conductor - Customer Support Platform

## Overview
Conductor is a modern SaaS customer support platform providing omnichannel support management with enterprise multitenancy. It features a gradient-focused design system and is built with a full-stack TypeScript architecture using React for the frontend and Node.js/Express for the backend. The platform aims to streamline customer support operations, offering comprehensive tools for managing tickets, customer interactions, and internal workflows. It is designed for scalability and internationalization, supporting various business models and geographical locations.

## User Preferences
Preferred communication style: Simple, everyday language.
Interface preference: Text-based hierarchical menus with dropdowns over visual card-based interfaces.

## System Architecture
Conductor follows a Clean Architecture with Domain-Driven Design principles.

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom gradient design system and Shadcn UI components built on Radix UI primitives.
- **State Management**: TanStack React Query for server state management.
- **Routing**: Wouter for client-side routing.
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
- **Key Features**:
    - **Authentication & Authorization**: Local JWT with access/refresh tokens, bcrypt hashing, and a four-tier RBAC system (saas_admin, tenant_admin, agent, customer) with granular permissions and tenant isolation.
    - **Ticket Management**: Comprehensive system with ServiceNow-style fields, advanced specialized fields (attachments, notes, communication, history, internal actions), hierarchical configurations (category → subcategory → action), and dynamic metadata. Full audit trail for internal action deletions with proper history logging using `performed_by` column.
    - **Customer & Beneficiary Management**: Flexible person management system for callers and beneficiaries, including sensitive data protection with agent password verification.
    - **Location Management**: Comprehensive system supporting 7 types of location records (Local, Região, Rota Dinâmica, Trecho, Rota de Trecho, Área, Agrupamento) with advanced UX features like CEP auto-fill, interactive map coordinate collection, and centralized operating hours.
    - **User & Team Management**: Consolidated system for user and team management with HR database schema expansion, user group memberships, and a list-based view for team members.
    - **Project Management**: Full project and project actions system, including automatic project-ticket integration and detailed task tracking.
    - **Timecard/Journey Management**: Comprehensive CLT-compliant electronic timecard system with NSR (sequential numbering), SHA-256 integrity hashing, complete audit trails, digital signatures, automatic backups, and compliance reports. Fully compliant with Portaria 671/2021 MTE requirements for electronic timekeeping systems.
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