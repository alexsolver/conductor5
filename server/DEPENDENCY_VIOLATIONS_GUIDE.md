# Dependency Violations Fix Guide

## Critical Issues to Fix:

### 1. Domain Layer Violations
- Remove all imports of express, drizzle-orm, or other external libraries from domain layer
- Use interfaces and dependency injection instead

### 2. Application Layer Violations  
- Avoid direct database access in controllers
- Use repository interfaces through dependency injection

### 3. Infrastructure Layer
- Implement all domain interfaces
- Keep external library dependencies isolated

## Next Steps:
1. Review each module's imports
2. Create interfaces for external dependencies
3. Use dependency injection container
