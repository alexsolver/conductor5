# Domain Layer - Clean Architecture

## Overview

This domain layer implements clean architecture principles with domain-driven design patterns. It contains pure business logic with no external dependencies.

## Structure

### Entities (`entities/`)
- **Customer.ts**: Customer business entity with validation and business rules
- **Ticket.ts**: Support ticket entity with status management and assignment logic

### Repository Interfaces (`repositories/`)
- **ICustomerRepository.ts**: Customer data access abstraction
- **ITicketRepository.ts**: Ticket data access abstraction

### Domain Events (`events/`)
- **DomainEvent.ts**: Base domain event classes and specific business events
- Events: CustomerCreated, CustomerUpdated, TicketCreated, TicketAssigned, TicketStatusChanged

## Key Principles

### Business Rules Enforcement
- All validation and business logic is contained within entities
- Entities are immutable - changes create new instances
- Factory methods ensure valid entity creation

### Dependency Inversion
- Domain layer defines interfaces for infrastructure
- No dependencies on external frameworks or libraries
- Pure TypeScript/JavaScript business logic

### Domain Events
- Business events are published when entities change
- Events enable loose coupling between bounded contexts
- Event handlers can trigger side effects (notifications, logging, etc.)

## Usage Examples

### Creating a Customer
```typescript
const customer = Customer.create({
  tenantId: 'tenant-123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

// Business rules are enforced
console.log(customer.fullName); // "John Doe"
console.log(customer.isValidEmail); // true
```

### Updating a Ticket
```typescript
const updatedTicket = ticket.updateStatus('resolved');
// Publishes TicketStatusChanged domain event
```

### Repository Usage
```typescript
const customer = await customerRepository.findById(id, tenantId);
if (customer && customer.isValidEmail) {
  // Business logic here
}
```

This domain layer provides a clean separation of business logic from infrastructure concerns, making the code more testable, maintainable, and aligned with business requirements.