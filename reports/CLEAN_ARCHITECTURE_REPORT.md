# Clean Architecture Validation Report

**Data:** 2025-08-10  
**Score:** 31/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 10
- ⚠️ **Altos:** 60
- 📋 **Médios:** 28
- 💡 **Baixos:** 4
- **Total:** 102

## Principais Problemas por Módulo

### 🔥 materials-services
- **Total de problemas:** 48
- **Críticos:** 2 | **Altos:** 36
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Domain Layer violando dependência: drizzle-orm/neon-http

### 🔥 saas-admin
- **Total de problemas:** 7
- **Críticos:** 1 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express

### 🔥 technical-skills
- **Total de problemas:** 9
- **Críticos:** 1 | **Altos:** 8
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express

### ⚠️ tickets
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Repository contém possível lógica de negócio

### 🔥 beneficiaries
- **Total de problemas:** 4
- **Críticos:** 2 | **Altos:** 2
- **Principais problemas:**
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO
  - Application Layer violando dependência: express

### ⚠️ customers
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Application Layer violando dependência: express

### ⚠️ knowledge-base
- **Total de problemas:** 9
- **Críticos:** 0 | **Altos:** 5
- **Principais problemas:**
  - Application Layer violando dependência: express
  - Application Layer violando dependência: ../../infrastructure/repositories/MediaRepository
  - Application Layer violando dependência: ../../infrastructure/repositories/MediaRepository

### 🔥 schedule-management
- **Total de problemas:** 4
- **Críticos:** 1 | **Altos:** 1
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Repository contém possível lógica de negócio
  - Nome da classe Schedule não corresponde ao arquivo ScheduleEntity

### 🔥 shared
- **Total de problemas:** 7
- **Críticos:** 2 | **Altos:** 0
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Repository contém possível lógica de negócio

### 🔥 timecard
- **Total de problemas:** 9
- **Críticos:** 1 | **Altos:** 4
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express
  - Application Layer violando dependência: drizzle-orm

### 📋 auth
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository contém possível lógica de negócio

### 📋 dashboard
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository contém possível lógica de negócio


## Plano de Correção

### 🔥 materials-services
- **Prioridade:** immediate
- **Tempo estimado:** 25h
- **Ações:** 30

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada domain
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **refactor_code:** Refatorar dependência inválida na camada application
8. **refactor_code:** Refatorar dependência inválida na camada application
9. **refactor_code:** Refatorar dependência inválida na camada application
10. **refactor_code:** Refatorar dependência inválida na camada application
11. **refactor_code:** Refatorar dependência inválida na camada application
12. **refactor_code:** Refatorar dependência inválida na camada application
13. **refactor_code:** Refatorar dependência inválida na camada application
14. **refactor_code:** Refatorar dependência inválida na camada application
15. **refactor_code:** Refatorar dependência inválida na camada application
16. **refactor_code:** Refatorar dependência inválida na camada application
17. **refactor_code:** Refatorar dependência inválida na camada application
18. **refactor_code:** Refatorar dependência inválida na camada application
19. **refactor_code:** Refatorar dependência inválida na camada application
20. **refactor_code:** Refatorar dependência inválida na camada application
21. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
22. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
23. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
24. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
25. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
26. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
27. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
28. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
29. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
30. **create_file:** Criar Repository com interface

### 🔥 saas-admin
- **Prioridade:** immediate
- **Tempo estimado:** 4h
- **Ações:** 6

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
5. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
6. **create_file:** Criar Repository com interface

### 🔥 technical-skills
- **Prioridade:** immediate
- **Tempo estimado:** 5h
- **Ações:** 5

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **create_file:** Criar Repository com interface

### 🔥 beneficiaries
- **Prioridade:** immediate
- **Tempo estimado:** 3h
- **Ações:** 3

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **move_code:** Resolver acoplamento: Entity misturada com DTOs - violação de responsabilidade

### 🔥 schedule-management
- **Prioridade:** immediate
- **Tempo estimado:** 3h
- **Ações:** 4

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
3. **rename_file:** Padronizar nomenclatura: Nome da classe Schedule não corresponde ao arquivo ScheduleEntity
4. **create_file:** Criar Repository com interface

### 🔥 shared
- **Prioridade:** immediate
- **Tempo estimado:** 4h
- **Ações:** 7

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
4. **rename_file:** Padronizar nomenclatura: Repository index deve terminar com 'Repository'
5. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
6. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
7. **create_file:** Criar Repository com interface

### 🔥 timecard
- **Prioridade:** immediate
- **Tempo estimado:** 5h
- **Ações:** 7

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
5. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
6. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
7. **create_file:** Criar Repository com interface

### ⚠️ tickets
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### ⚠️ customers
- **Prioridade:** high
- **Tempo estimado:** 1h
- **Ações:** 1

1. **refactor_code:** Refatorar dependência inválida na camada application

### ⚠️ knowledge-base
- **Prioridade:** high
- **Tempo estimado:** 4h
- **Ações:** 6

1. **refactor_code:** Refatorar dependência inválida na camada application
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
4. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
5. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
6. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

### 💡 auth
- **Prioridade:** low
- **Tempo estimado:** 45min
- **Ações:** 1

1. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### 💡 dashboard
- **Prioridade:** low
- **Tempo estimado:** 45min
- **Ações:** 1

1. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio


## Recomendações

### Prioridade Imediata 🔥
- **materials-services:** 30 ações (25h)
- **saas-admin:** 6 ações (4h)
- **technical-skills:** 5 ações (5h)
- **beneficiaries:** 3 ações (3h)
- **schedule-management:** 4 ações (3h)
- **shared:** 7 ações (4h)
- **timecard:** 7 ações (5h)

### Prioridade Alta ⚠️
- **tickets:** 2 ações (2h)
- **customers:** 1 ações (1h)
- **knowledge-base:** 6 ações (4h)

## Comandos para Correção

```bash
# Validar arquitetura
npm run validate:architecture

# Aplicar correções automáticas
npm run validate:architecture --fix

# Gerar relatório detalhado
npm run validate:architecture --report
```

---
*Relatório gerado automaticamente pelo Clean Architecture Validator*
