# Clean Architecture Validation Report

**Data:** 2025-08-10  
**Score:** 32/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 12
- ⚠️ **Altos:** 67
- 📋 **Médios:** 35
- 💡 **Baixos:** 5
- **Total:** 119

## Principais Problemas por Módulo

### 🔥 beneficiaries
- **Total de problemas:** 4
- **Críticos:** 2 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO

### ⚠️ customers
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 3
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Application Layer violando dependência: express
  - Application Layer violando dependência: express

### 🔥 materials-services
- **Total de problemas:** 52
- **Críticos:** 2 | **Altos:** 37
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
- **Total de problemas:** 10
- **Críticos:** 1 | **Altos:** 8
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express

### 📋 ticket-templates
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain

### ⚠️ tickets
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Repository contém possível lógica de negócio

### ⚠️ knowledge-base
- **Total de problemas:** 11
- **Críticos:** 0 | **Altos:** 7
- **Principais problemas:**
  - Application Layer violando dependência: express
  - Application Layer violando dependência: express
  - Application Layer violando dependência: express

### 🔥 schedule-management
- **Total de problemas:** 6
- **Críticos:** 3 | **Altos:** 1
- **Principais problemas:**
  - Domain Layer violando dependência: ../infrastructure/repositories/drizzle/drizzle-customer.repository
  - Domain Layer violando dependência: ../infrastructure/repositories/drizzle/drizzle-customer.repository
  - Domain Layer violando dependência: drizzle-orm/neon-http

### 🔥 shared
- **Total de problemas:** 6
- **Críticos:** 2 | **Altos:** 0
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Repository index deve terminar com 'Repository'

### 🔥 timecard
- **Total de problemas:** 11
- **Críticos:** 1 | **Altos:** 6
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

### 📋 custom-fields
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'

### 📋 people
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'

### 📋 template-audit
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Repository DrizzleTemplateAuditRepository deve implementar interface


## Plano de Correção

### 🔥 beneficiaries
- **Prioridade:** immediate
- **Tempo estimado:** 3h
- **Ações:** 3

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application

### 🔥 materials-services
- **Prioridade:** immediate
- **Tempo estimado:** 25h
- **Ações:** 34

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
20. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
21. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
22. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
23. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
24. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
25. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'
26. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
27. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
28. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
29. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
30. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
31. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
32. **create_file:** Criar Repository com interface
33. **create_file:** Criar Repository com interface
34. **create_file:** Criar Repository com interface

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
- **Ações:** 6

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'
6. **create_file:** Criar Repository com interface

### 🔥 schedule-management
- **Prioridade:** immediate
- **Tempo estimado:** 4h
- **Ações:** 5

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
4. **rename_file:** Padronizar nomenclatura: Nome da classe CustomerModule não corresponde ao arquivo Schedule
5. **create_file:** Criar Repository com interface

### 🔥 shared
- **Prioridade:** immediate
- **Tempo estimado:** 4h
- **Ações:** 6

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **rename_file:** Padronizar nomenclatura: Repository index deve terminar com 'Repository'
4. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
5. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
6. **create_file:** Criar Repository com interface

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

### ⚠️ customers
- **Prioridade:** high
- **Tempo estimado:** 3h
- **Ações:** 3

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **refactor_code:** Refatorar dependência inválida na camada application

### ⚠️ tickets
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### ⚠️ knowledge-base
- **Prioridade:** high
- **Tempo estimado:** 5h
- **Ações:** 7

1. **refactor_code:** Refatorar dependência inválida na camada application
2. **refactor_code:** Refatorar dependência inválida na camada application
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
5. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
6. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
7. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

### 💡 ticket-templates
- **Prioridade:** low
- **Tempo estimado:** 20min
- **Ações:** 2

1. **create_directory:** Criar diretório/arquivo events na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain

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

### 💡 custom-fields
- **Prioridade:** low
- **Tempo estimado:** 15min
- **Ações:** 1

1. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

### 💡 people
- **Prioridade:** low
- **Tempo estimado:** 15min
- **Ações:** 1

1. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

### 💡 template-audit
- **Prioridade:** low
- **Tempo estimado:** 10min
- **Ações:** 1

1. **create_directory:** Criar interface I[Entity]Repository no domain e implementar


## Recomendações

### Prioridade Imediata 🔥
- **beneficiaries:** 3 ações (3h)
- **materials-services:** 34 ações (25h)
- **saas-admin:** 6 ações (4h)
- **technical-skills:** 6 ações (5h)
- **schedule-management:** 5 ações (4h)
- **shared:** 6 ações (4h)
- **timecard:** 7 ações (5h)

### Prioridade Alta ⚠️
- **customers:** 3 ações (3h)
- **tickets:** 2 ações (2h)
- **knowledge-base:** 7 ações (5h)

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
