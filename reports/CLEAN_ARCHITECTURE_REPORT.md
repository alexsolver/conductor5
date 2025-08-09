# Clean Architecture Validation Report

**Data:** 2025-08-09  
**Score:** 29/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 18
- ⚠️ **Altos:** 70
- 📋 **Médios:** 27
- 💡 **Baixos:** 4
- **Total:** 119

## Principais Problemas por Módulo

### 🔥 beneficiaries
- **Total de problemas:** 6
- **Críticos:** 2 | **Altos:** 3
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

### 🔥 knowledge-base
- **Total de problemas:** 15
- **Críticos:** 2 | **Altos:** 9
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Domain Layer violando dependência: drizzle-orm/neon-http

### 🔥 materials-services
- **Total de problemas:** 56
- **Críticos:** 8 | **Altos:** 36
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

### ⚠️ people
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Application Layer violando dependência: express

### 🔥 schedule-management
- **Total de problemas:** 3
- **Críticos:** 1 | **Altos:** 1
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Repository contém possível lógica de negócio
  - Entity ScheduleEntity não possui Repository correspondente

### 🔥 shared
- **Total de problemas:** 4
- **Críticos:** 2 | **Altos:** 0
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Repository indexRepository deve implementar interface

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


## Plano de Correção

### 🔥 beneficiaries
- **Prioridade:** immediate
- **Tempo estimado:** 4h
- **Ações:** 5

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **move_code:** Resolver acoplamento: Entity misturada com DTOs - violação de responsabilidade
5. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

### 🔥 knowledge-base
- **Prioridade:** immediate
- **Tempo estimado:** 8h
- **Ações:** 10

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada domain
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **refactor_code:** Refatorar dependência inválida na camada application
7. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
8. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
9. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
10. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

### 🔥 materials-services
- **Prioridade:** immediate
- **Tempo estimado:** 30h
- **Ações:** 37

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada domain
4. **refactor_code:** Refatorar dependência inválida na camada domain
5. **refactor_code:** Refatorar dependência inválida na camada domain
6. **refactor_code:** Refatorar dependência inválida na camada domain
7. **refactor_code:** Refatorar dependência inválida na camada domain
8. **refactor_code:** Refatorar dependência inválida na camada domain
9. **refactor_code:** Refatorar dependência inválida na camada domain
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
21. **refactor_code:** Refatorar dependência inválida na camada application
22. **refactor_code:** Refatorar dependência inválida na camada application
23. **refactor_code:** Refatorar dependência inválida na camada application
24. **refactor_code:** Refatorar dependência inválida na camada application
25. **refactor_code:** Refatorar dependência inválida na camada application
26. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
27. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
28. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
29. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
30. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
31. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
32. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
33. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
34. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
35. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
36. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
37. **create_file:** Criar Repository com interface

### 🔥 saas-admin
- **Prioridade:** immediate
- **Tempo estimado:** 4h
- **Ações:** 7

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **rename_file:** Padronizar nomenclatura: Nome da classe SaasConfigEntity não corresponde ao arquivo SaasConfig
5. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
6. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
7. **create_file:** Criar Repository com interface

### 🔥 technical-skills
- **Prioridade:** immediate
- **Tempo estimado:** 5h
- **Ações:** 5

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **create_file:** Criar Repository com interface

### 🔥 schedule-management
- **Prioridade:** immediate
- **Tempo estimado:** 3h
- **Ações:** 3

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
3. **create_file:** Criar Repository com interface

### 🔥 shared
- **Prioridade:** immediate
- **Tempo estimado:** 3h
- **Ações:** 4

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
4. **create_file:** Criar Repository com interface

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

### ⚠️ people
- **Prioridade:** high
- **Tempo estimado:** 1h
- **Ações:** 1

1. **refactor_code:** Refatorar dependência inválida na camada application

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
- **beneficiaries:** 5 ações (4h)
- **knowledge-base:** 10 ações (8h)
- **materials-services:** 37 ações (30h)
- **saas-admin:** 7 ações (4h)
- **technical-skills:** 5 ações (5h)
- **schedule-management:** 3 ações (3h)
- **shared:** 4 ações (3h)
- **timecard:** 7 ações (5h)

### Prioridade Alta ⚠️
- **customers:** 3 ações (3h)
- **tickets:** 2 ações (2h)
- **people:** 1 ações (1h)

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
