# Clean Architecture Validation Report

**Data:** 2025-08-09  
**Score:** 30/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 18
- ⚠️ **Altos:** 66
- 📋 **Médios:** 36
- 💡 **Baixos:** 4
- **Total:** 124

## Principais Problemas por Módulo

### 🔥 beneficiaries
- **Total de problemas:** 5
- **Críticos:** 2 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO
  - Domain Layer violando dependência: ../../application/dto/CreateBeneficiaryDTO

### ⚠️ customers
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
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
- **Total de problemas:** 8
- **Críticos:** 1 | **Altos:** 2
- **Principais problemas:**
  - Routes não utiliza controllers - lógica direta nas rotas
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http

### 🔥 technical-skills
- **Total de problemas:** 10
- **Críticos:** 1 | **Altos:** 7
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express

### ⚠️ tickets
- **Total de problemas:** 3
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Routes não utiliza controllers - lógica direta nas rotas
  - Routes contém lógica de negócio ou acesso a dados
  - Repository contém possível lógica de negócio

### ⚠️ people
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Application Layer violando dependência: express
  - Use Case index deve terminar com 'UseCase'

### 🔥 schedule-management
- **Total de problemas:** 2
- **Críticos:** 1 | **Altos:** 0
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Repository contém possível lógica de negócio

### 🔥 shared
- **Total de problemas:** 5
- **Críticos:** 2 | **Altos:** 0
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Use Case index deve terminar com 'UseCase'

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

### 📋 field-layouts
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'

### 📋 tenant-admin
- **Total de problemas:** 1
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Use Case index deve terminar com 'UseCase'


## Plano de Correção

### 🔥 beneficiaries
- **Prioridade:** immediate
- **Tempo estimado:** 3h
- **Ações:** 4

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **move_code:** Resolver acoplamento: Entity misturada com DTOs - violação de responsabilidade
4. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

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
34. **rename_file:** Padronizar nomenclatura: Repository LPUCacheWarmer deve terminar com 'Repository'
35. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
36. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
37. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

### 🔥 saas-admin
- **Prioridade:** immediate
- **Tempo estimado:** 5h
- **Ações:** 8

1. **create_directory:** Criar controllers na camada Application e usar nas rotas
2. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
3. **refactor_code:** Refatorar dependência inválida na camada domain
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
6. **rename_file:** Padronizar nomenclatura: Repository index deve terminar com 'Repository'
7. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
8. **create_file:** Criar Repository com interface

### 🔥 technical-skills
- **Prioridade:** immediate
- **Tempo estimado:** 5h
- **Ações:** 6

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **rename_file:** Padronizar nomenclatura: Nome da classe SkillEntity não corresponde ao arquivo Skill
6. **rename_file:** Padronizar nomenclatura: Repository DrizzleUserSkillRepository_FIXED deve terminar com 'Repository'

### 🔥 schedule-management
- **Prioridade:** immediate
- **Tempo estimado:** 2h
- **Ações:** 2

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### 🔥 shared
- **Prioridade:** immediate
- **Tempo estimado:** 3h
- **Ações:** 5

1. **refactor_code:** Refatorar dependência inválida na camada domain
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'
4. **rename_file:** Padronizar nomenclatura: Repository index deve terminar com 'Repository'
5. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

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
- **Tempo estimado:** 2h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada application

### ⚠️ tickets
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 3

1. **create_directory:** Criar controllers na camada Application e usar nas rotas
2. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
3. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### ⚠️ people
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 2

1. **refactor_code:** Refatorar dependência inválida na camada application
2. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

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

### 💡 field-layouts
- **Prioridade:** low
- **Tempo estimado:** 15min
- **Ações:** 1

1. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'

### 💡 tenant-admin
- **Prioridade:** low
- **Tempo estimado:** 15min
- **Ações:** 1

1. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'


## Recomendações

### Prioridade Imediata 🔥
- **beneficiaries:** 4 ações (3h)
- **knowledge-base:** 10 ações (8h)
- **materials-services:** 37 ações (30h)
- **saas-admin:** 8 ações (5h)
- **technical-skills:** 6 ações (5h)
- **schedule-management:** 2 ações (2h)
- **shared:** 5 ações (3h)
- **timecard:** 7 ações (5h)

### Prioridade Alta ⚠️
- **customers:** 2 ações (2h)
- **tickets:** 3 ações (2h)
- **people:** 2 ações (2h)

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
