# Microservices Architecture

## Overview

The Conductor platform is organized into independent microservices, each responsible for a specific business domain. This architecture enables independent development, deployment, and scaling of different features.

## Microservice Structure

### 1. Dashboard Service (`/api/dashboard`)
**Responsibility**: Real-time metrics, statistics, and activity monitoring

**Endpoints**:
- `GET /api/dashboard/stats` - Key performance indicators
- `GET /api/dashboard/activity` - Recent activity feed  
- `GET /api/dashboard/metrics` - Additional performance metrics

**Key Features**:
- Real-time statistics aggregation
- Activity logging and retrieval
- Performance monitoring
- Tenant-specific data isolation

### 2. Customers Service (`/api/customers`)
**Responsibility**: Customer relationship management and data

**Endpoints**:
- `GET /api/customers` - List customers with pagination
- `GET /api/customers/:id` - Get specific customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Remove customer
- `GET /api/customers/search/:query` - Search customers

**Key Features**:
- Customer lifecycle management
- Contact information and metadata
- Tag-based organization
- Company associations
- Full-text search capabilities

### 3. Tickets Service (`/api/tickets`)
**Responsibility**: Support ticket management and workflow

**Endpoints**:
- `GET /api/tickets` - List tickets with filters
- `GET /api/tickets/:id` - Get ticket with messages
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `GET /api/tickets/priority/urgent` - Get urgent tickets
- `POST /api/tickets/:id/messages` - Add message to ticket
- `POST /api/tickets/:id/assign` - Assign ticket to agent

**Key Features**:
- Ticket lifecycle management
- Priority and status tracking
- Agent assignment workflow
- Message threading
- SLA monitoring
- Escalation rules

### 4. Knowledge Base Service (`/api/knowledge-base`)
**Responsibility**: Self-service documentation and help articles

**Endpoints**:
- `GET /api/knowledge-base/articles` - List articles with filters
- `GET /api/knowledge-base/articles/:id` - Get specific article
- `GET /api/knowledge-base/categories` - List article categories
- `GET /api/knowledge-base/search` - Search articles
- `POST /api/knowledge-base/articles/:id/rate` - Rate article helpfulness

**Key Features**:
- Article management with markdown support
- Category-based organization
- Full-text search with relevance scoring
- User feedback and ratings
- View tracking and analytics
- Multi-language support (future)

## Microservice Benefits

### Independent Development
- Each service can be developed by separate teams
- Different release cycles for different features
- Technology choices per service domain

### Scalability
- Scale individual services based on demand
- Database isolation per service
- Load balancing per service type

### Fault Isolation
- Service failures don't cascade
- Graceful degradation of features
- Independent monitoring and alerting

### Data Isolation
- Each service manages its own data
- Clear ownership boundaries
- Schema evolution independence

## Cross-Service Communication

### Domain Events
- Services publish events for cross-domain updates
- Loose coupling between services
- Event-driven architecture patterns

### Shared Authentication
- Centralized authentication via Replit Auth
- Tenant context propagation
- Role-based access control

### API Gateway Pattern
- All requests routed through main Express app
- Centralized middleware (auth, logging, etc.)
- Service discovery and routing

## Development Guidelines

### Service Independence
- No direct database access between services
- Communication only through defined APIs
- Independent deployment capabilities

### Data Consistency
- Eventual consistency via domain events
- Saga pattern for distributed transactions
- Compensating actions for rollbacks

### Monitoring & Observability
- Service-specific logging
- Distributed tracing
- Performance metrics per service
- Health check endpoints

This microservice architecture provides a solid foundation for scaling the Conductor platform while maintaining clean separation of concerns and independent development workflows.
# Clean Architecture Implementation

## Estrutura dos Módulos

Cada módulo segue a estrutura Clean Architecture com as seguintes camadas:

### Domain Layer (`domain/`)
- **entities/**: Entidades de negócio puras (sem dependências externas)
- **repositories/**: Interfaces de repositórios (ports)
- **services/**: Serviços de domínio com lógica de negócio
- **events/**: Eventos de domínio
- **value-objects/**: Objetos de valor

### Application Layer (`application/`)
- **use-cases/**: Casos de uso da aplicação
- **controllers/**: Controllers HTTP
- **dto/**: Data Transfer Objects
- **services/**: Serviços de aplicação

### Infrastructure Layer (`infrastructure/`)
- **repositories/**: Implementações concretas dos repositórios
- **clients/**: Clientes para APIs externas
- **config/**: Configurações de infraestrutura

### Presentation Layer
- **routes.ts**: Definição das rotas HTTP na raiz do módulo

## Regras de Dependência

1. **Domain** não pode depender de nenhuma outra camada
2. **Application** pode depender apenas do **Domain**
3. **Infrastructure** pode depender do **Domain** e **Application** (apenas interfaces)
4. **Presentation** pode depender da **Application**

## Padrões de Nomenclatura

- **Entities**: PascalCase singular (ex: `Customer`, `Ticket`)
- **Use Cases**: `[Action]UseCase` (ex: `CreateCustomerUseCase`)
- **Repositories**: `[Entity]Repository` (ex: `CustomerRepository`)
- **Interfaces**: `I[Name]` (ex: `ICustomerRepository`)

## Validação

Execute `npm run validate:architecture` para validar a conformidade com Clean Architecture.
Execute `npm run validate:architecture:fix` para aplicar correções automáticas.
