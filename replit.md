# Conductor - Customer Support Platform

## Overview

Conductor is a modern SaaS customer support platform designed to provide omnichannel support management with a focus on enterprise multitenancy. The platform follows a gradient-focused design system and is built with a full-stack TypeScript architecture using React for the frontend and Node.js/Express for the backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom gradient design system
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit's OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with structured error handling
- **Architecture Pattern**: Clean Architecture with Domain-Driven Design
- **Domain Layer**: Pure business entities and domain logic
- **Application Layer**: Use Cases and application services
- **Infrastructure Layer**: Database repositories and external services
- **Domain Events**: Event-driven architecture for decoupling

### Design System
- **Primary Theme**: Gradient-focused design with purple/blue color scheme
- **Gradients**: 
  - Primary: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Secondary: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
  - Success: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
- **Component Library**: Custom components built on Radix UI with gradient styling

## Key Components

### Authentication & Authorization System
- **Provider**: Local JWT authentication with clean architecture
- **Token Management**: Access tokens (15min) and refresh tokens (7 days) with httpOnly cookies
- **Security**: bcrypt password hashing, JWT token verification, comprehensive role-based access control
- **Domain Layer**: User entity with business rules, password service interfaces
- **Role Hierarchy**: Four-tier system (saas_admin, tenant_admin, agent, customer) with granular permissions
- **Authorization**: Permission-based middleware with tenant isolation and cross-tenant access control
- **Admin Functions**: Complete admin interfaces for platform and tenant management

### Database Schema
- **Multi-tenancy**: True schema separation - each tenant has dedicated PostgreSQL schema
- **Schema Structure**:
  - Public schema: Users, Tenants, Sessions (shared resources)
  - Tenant schemas: `tenant_{uuid}` with isolated Customers, Tickets, Messages, Activity Logs
- **Core Entities**:
  - Users (stored in public schema with tenant association)
  - Tenants (public schema for tenant management)
  - Customers (tenant-specific schema for complete isolation)
  - Tickets (tenant-specific schema with references to public users)
  - Ticket Messages (tenant-specific schema)
  - Activity Logs (tenant-specific schema)

### API Structure
- **Authentication**: `/api/auth/*` - User authentication and profile
- **Dashboard**: `/api/dashboard/*` - Statistics and activity feeds
- **Customers**: `/api/customers/*` - Customer management
- **Tickets**: `/api/tickets/*` - Support ticket operations
- **SaaS Admin**: `/api/saas-admin/*` - Platform-wide tenant and user management
- **Tenant Admin**: `/api/tenant-admin/*` - Tenant-specific user and settings management
- **Error Handling**: Centralized error middleware with structured responses
- **Authorization**: Permission-based route protection with role validation

### UI Components
- **Layout**: AppShell with Sidebar and Header components
- **Dashboard**: Metric cards, activity feeds, and charts
- **Forms**: React Hook Form with Zod validation
- **Data Display**: Tables, cards, and badges with gradient styling

## Recent Changes
- **2025-01-16**: Implemented Comprehensive Flexible Person Management System
  - **Person System**: Implemented unified person management allowing same person to have different roles (solicitante, favorecido, agente) across different tickets
  - **Enhanced Schema**: Added beneficiaryId, beneficiaryType, callerType fields to tickets table with successful database migration
  - **PersonSelector Component**: Created unified component for cross-role person selection with real-time search
  - **Unified Search API**: Built /api/people/search endpoint supporting both users and customers with role-based filtering
  - **Form Integration**: Updated ticket creation/editing forms to use flexible person system with auto-population logic
  - **Authentication Fix**: Resolved JWT token expiration issues with automatic token refresh mechanism
  - **FLEXIBLE PERSON SYSTEM OPERATIONAL**: Enterprise-grade person management supporting complex organizational structures

- **2025-01-16**: Implemented Modular Clean Architecture Restructuring
  - **Modular Structure**: Reorganized from centralized entities to module-specific architecture
  - **Customers Module**: Complete structure with domain/entities, domain/repositories, application/use-cases, application/controllers, infrastructure/repositories
  - **Tickets Module**: Started modular restructuring with comprehensive Ticket entity including ServiceNow-style fields
  - **Shared Infrastructure**: Created shared event publisher and domain interfaces for cross-module communication
  - **Clean Architecture**: Each module now follows proper DDD patterns with clear separation of concerns
  - **Domain Events**: Implemented event-driven architecture for decoupling between modules
  - **MODULAR ARCHITECTURE ACTIVE**: System now uses proper microservice-style modules with complete separation
  - Fixed AppShell import error in Roadmap component and sidebar ticket counter now shows dynamic values

- **2025-01-16**: Successfully Completed Local JWT Authentication System
  - Completely removed Replit OpenID Connect dependencies (openid-client, memoizee)
  - Implemented clean architecture JWT authentication with domain-driven design
  - Created User domain entity with business rules and validation
  - Built authentication microservice with login, register, logout, and user endpoints
  - Added JWT middleware for request authentication and authorization
  - Updated all four microservices (Dashboard, Tickets, Customers, Knowledge Base) to use JWT
  - Created comprehensive AuthProvider with React Query integration
  - Built modern authentication page with login/register forms
  - Updated database schema to support local authentication with password hashing
  - Fixed database schema issues and React Query compatibility
  - Resolved frontend-backend connectivity issues
  - **AUTHENTICATION SYSTEM FULLY OPERATIONAL**: Users can register and login successfully
  - Created admin user account (alex@lansolver.com) for testing
  - Maintained complete microservices architecture with clean separation

- **2025-01-16**: Implemented Comprehensive Role-Based Access Control System
  - **Role Hierarchy**: Created four-tier role system (saas_admin, tenant_admin, agent, customer)
  - **Permission System**: Granular permissions for platform, tenant, ticket, customer, and analytics operations
  - **Authorization Middleware**: Role-based middleware with permission checking and tenant isolation
  - **Admin Routes**: Dedicated API routes for SaaS admin and tenant admin operations
  - **Admin Pages**: Functional UI for SaaS Admin (platform management) and Tenant Admin (tenant management)
  - **Repository Layer**: Created TenantRepository and enhanced UserRepository with admin functions
  - **Dynamic Navigation**: Role-based sidebar navigation showing admin options based on user permissions
  - **User Management**: Tenant admins can create and manage users within their tenant
  - **Tenant Management**: SaaS admins can create and manage tenants across the platform
  - **RBAC SYSTEM FULLY OPERATIONAL**: Complete role-based access control with secure permissions

- **2025-01-16**: Enhanced Customer Schema with 12 Professional Fields
  - **Status Fields**: Added verified, active, suspended status tracking with visual indicators
  - **Localization Fields**: Added timezone, locale, language for international customer support
  - **Professional Fields**: Added externalId, role, notes, avatar, signature for comprehensive profiles
  - **Advanced Form**: Created tabbed form with 4 sections (Basic, Status, Locale, Advanced) for organized data entry
  - **Table Enhancement**: Updated customers table to show status badges and role indicators
  - **Schema Migration**: Successfully migrated database with all 12 new professional customer fields
  - **PROFESSIONAL CUSTOMER MANAGEMENT**: Now matches enterprise standards with comprehensive customer profiling

- **2025-01-16**: Expanded Ticket Schema with Professional ServiceNow-Style Fields
  - **Enhanced Schema**: Added 20+ professional fields including ServiceNow standard fields
  - **Basic Fields**: Added number (auto-generated), shortDescription, category, subcategory, impact, urgency, state
  - **Assignment Fields**: Added callerId, openedById, assignmentGroup, location for complete assignment tracking
  - **Control Fields**: Added openedAt, resolvedAt, closedAt, resolutionCode, resolutionNotes, workNotes
  - **CI/CMDB Fields**: Added configurationItem, businessService for enterprise asset management
  - **Communication Fields**: Added contactType, notify, closeNotes for comprehensive communication tracking
  - **Business Fields**: Added businessImpact, symptoms, rootCause, workaround for thorough analysis
  - **Advanced Form**: Created comprehensive ticket creation form with 6 sections (Basic Info, Priority & Impact, Assignment, Business Impact, etc.)
  - **Table Enhancement**: Updated tickets table to show Number, Category, State, Impact alongside existing fields
  - **Legacy Compatibility**: Maintained backward compatibility with existing subject/status fields
  - **Professional UI**: Expanded dialog to 900px width with organized sections for complex form
  - **ENTERPRISE TICKET SYSTEM**: Now matches ServiceNow professional standards with comprehensive field coverage

## Data Flow

### Request Flow
1. Client makes authenticated request
2. Replit auth middleware validates session
3. Route handler extracts user and tenant context
4. SchemaManager provides tenant-specific database connection
5. Database operations execute in isolated tenant schema
6. Response returned with proper error handling

### Schema Isolation
1. Each tenant gets dedicated PostgreSQL schema `tenant_{uuid}`
2. SchemaManager maintains connection pool per tenant
3. Tenant data completely isolated - no cross-tenant data access possible
4. Shared resources (users, sessions) remain in public schema

### Clean Architecture Implementation

#### Domain Layer (server/domain/)
- **Entities**: Pure business objects with invariants (Customer, Ticket)
- **Repository Interfaces**: Abstractions for data access (ICustomerRepository, ITicketRepository)
- **Domain Events**: Business event definitions (CustomerCreated, TicketAssigned)
- **Business Rules**: Entity methods enforce business logic and validation

#### Application Layer (server/application/)
- **Use Cases**: Orchestrate business logic (CreateCustomerUseCase, GetCustomersUseCase)
- **Controllers**: Handle HTTP requests and responses
- **Services**: Cross-cutting concerns (DependencyContainer)
- **DTOs**: Request/Response data transfer objects

#### Infrastructure Layer (server/infrastructure/)
- **Repositories**: Concrete implementations using Drizzle ORM
- **Event Publishers**: Handle domain event distribution
- **Database**: Schema management and connection handling
- **External Services**: Third-party integrations

### State Management
- **Server State**: TanStack React Query for API data
- **Client State**: React hooks for local component state
- **Authentication State**: Global auth hook with user context
- **Domain Events**: Event-driven updates across bounded contexts

### Real-time Updates
- **Architecture**: Polling-based updates via React Query
- **Frequency**: Configurable refresh intervals for different data types
- **Caching**: Query caching with stale-while-revalidate pattern

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL with connection pooling
- **Authentication**: Replit OpenID Connect
- **UI Framework**: Radix UI primitives
- **Styling**: Tailwind CSS with PostCSS
- **Validation**: Zod for schema validation
- **Date Handling**: date-fns for date formatting

### Development Tools
- **Build**: Vite with TypeScript compilation
- **Code Quality**: ESLint and TypeScript strict mode
- **Development**: Hot reload with Vite middleware
- **Error Tracking**: Runtime error overlay for development

## Deployment Strategy

### Development Environment
- **Platform**: Replit with integrated development tools
- **Hot Reload**: Vite development server with Express integration
- **Database**: Neon PostgreSQL with environment-based configuration
- **Session Storage**: PostgreSQL-backed sessions

### Production Considerations
- **Build Process**: Vite build for frontend, esbuild for backend
- **Environment Variables**: Database URL, session secrets, auth configuration
- **Static Assets**: Served through Vite's static file handling
- **Database Migrations**: Drizzle Kit for schema management

### Security Features
- **HTTPS**: Enforced in production with secure cookies
- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: Implemented at middleware level
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Prevention**: Drizzle ORM with parameterized queries

### Monitoring and Logging
- **Request Logging**: Structured logging with response times
- **Error Tracking**: Centralized error handling with stack traces
- **Performance**: Query timing and caching metrics
- **Development**: Runtime error modal for debugging