# Clean Architecture Validation Report

**Data:** 2025-08-10  
**Score:** 34/100  
**Status:** ❌ REPROVADO

## Resumo de Problemas

- 🔥 **Críticos:** 16
- ⚠️ **Altos:** 73
- 📋 **Médios:** 63
- 💡 **Baixos:** 5
- **Total:** 157

## Principais Problemas por Módulo

### 🔥 beneficiaries
- **Total de problemas:** 5
- **Críticos:** 2 | **Altos:** 3
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

### 📋 field-layout
- **Total de problemas:** 2
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura dto ausente na camada application
  - Estrutura services ausente na camada application

### 🔥 knowledge-base
- **Total de problemas:** 14
- **Críticos:** 1 | **Altos:** 9
- **Principais problemas:**
  - Routes contém lógica de negócio ou acesso a dados
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Application Layer violando dependência: express

### 🔥 materials-services
- **Total de problemas:** 53
- **Críticos:** 5 | **Altos:** 35
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

### 🔥 schedule-management
- **Total de problemas:** 11
- **Críticos:** 3 | **Altos:** 1
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain
  - Estrutura use-cases ausente na camada application

### 🔥 technical-skills
- **Total de problemas:** 14
- **Críticos:** 1 | **Altos:** 8
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain
  - Estrutura use-cases ausente na camada application

### 📋 template-audit
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 0
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain
  - Estrutura services ausente na camada application

### ⚠️ template-hierarchy
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Camada domain ausente no módulo template-hierarchy
  - Estrutura use-cases ausente na camada application
  - Estrutura dto ausente na camada application

### ⚠️ template-versions
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Camada domain ausente no módulo template-versions
  - Estrutura use-cases ausente na camada application
  - Estrutura dto ausente na camada application

### ⚠️ ticket-templates
- **Total de problemas:** 5
- **Críticos:** 0 | **Altos:** 2
- **Principais problemas:**
  - Camada domain ausente no módulo ticket-templates
  - Estrutura use-cases ausente na camada application
  - Estrutura dto ausente na camada application

### ⚠️ tickets
- **Total de problemas:** 4
- **Críticos:** 0 | **Altos:** 1
- **Principais problemas:**
  - Estrutura services ausente na camada domain
  - Estrutura dto ausente na camada application
  - Routes contém lógica de negócio ou acesso a dados

### 🔥 timecard
- **Total de problemas:** 16
- **Críticos:** 1 | **Altos:** 6
- **Principais problemas:**
  - Estrutura events ausente na camada domain
  - Estrutura services ausente na camada domain
  - Estrutura use-cases ausente na camada application

### 🔥 shared
- **Total de problemas:** 6
- **Críticos:** 2 | **Altos:** 0
- **Principais problemas:**
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Domain Layer violando dependência: drizzle-orm/neon-http
  - Repository index deve terminar com 'Repository'

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


## Plano de Correção

### 🔥 beneficiaries
- **Prioridade:** immediate
- **Tempo estimado:** 4h
- **Ações:** 4

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **move_code:** Resolver acoplamento: Entity misturada com DTOs - violação de responsabilidade

### 🔥 knowledge-base
- **Prioridade:** immediate
- **Tempo estimado:** 7h
- **Ações:** 9

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada application
4. **refactor_code:** Refatorar dependência inválida na camada application
5. **refactor_code:** Refatorar dependência inválida na camada application
6. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
7. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
8. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
9. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

### 🔥 materials-services
- **Prioridade:** immediate
- **Tempo estimado:** 27h
- **Ações:** 35

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada domain
3. **refactor_code:** Refatorar dependência inválida na camada domain
4. **refactor_code:** Refatorar dependência inválida na camada domain
5. **refactor_code:** Refatorar dependência inválida na camada domain
6. **refactor_code:** Refatorar dependência inválida na camada domain
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
21. **refactor_code:** Refatorar dependência inválida na camada application
22. **refactor_code:** Refatorar dependência inválida na camada application
23. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
24. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
25. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
26. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
27. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
28. **rename_file:** Padronizar nomenclatura: Use Case index deve terminar com 'UseCase'
29. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
30. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
31. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
32. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
33. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
34. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
35. **create_file:** Criar Repository com interface

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

### 🔥 schedule-management
- **Prioridade:** immediate
- **Tempo estimado:** 5h
- **Ações:** 10

1. **create_directory:** Criar diretório/arquivo events na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain
3. **create_directory:** Criar diretório/arquivo use-cases na camada application
4. **create_directory:** Criar diretório/arquivo dto na camada application
5. **create_directory:** Criar diretório/arquivo services na camada application
6. **refactor_code:** Refatorar dependência inválida na camada domain
7. **refactor_code:** Refatorar dependência inválida na camada domain
8. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
9. **rename_file:** Padronizar nomenclatura: Nome da classe CustomerModule não corresponde ao arquivo Schedule
10. **create_file:** Criar Repository com interface

### 🔥 technical-skills
- **Prioridade:** immediate
- **Tempo estimado:** 6h
- **Ações:** 10

1. **create_directory:** Criar diretório/arquivo events na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain
3. **create_directory:** Criar diretório/arquivo use-cases na camada application
4. **create_directory:** Criar diretório/arquivo dto na camada application
5. **create_directory:** Criar diretório/arquivo services na camada application
6. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
7. **refactor_code:** Refatorar dependência inválida na camada domain
8. **refactor_code:** Refatorar dependência inválida na camada application
9. **refactor_code:** Refatorar dependência inválida na camada application
10. **create_file:** Criar Repository com interface

### 🔥 timecard
- **Prioridade:** immediate
- **Tempo estimado:** 6h
- **Ações:** 12

1. **create_directory:** Criar diretório/arquivo events na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain
3. **create_directory:** Criar diretório/arquivo use-cases na camada application
4. **create_directory:** Criar diretório/arquivo dto na camada application
5. **create_directory:** Criar diretório/arquivo services na camada application
6. **refactor_code:** Refatorar dependência inválida na camada domain
7. **refactor_code:** Refatorar dependência inválida na camada application
8. **refactor_code:** Refatorar dependência inválida na camada application
9. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio
10. **rename_file:** Padronizar nomenclatura: Entity index não segue padrão PascalCase
11. **create_directory:** Criar interface I[Entity]Repository no domain e implementar
12. **create_file:** Criar Repository com interface

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

### ⚠️ customers
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 2

1. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
2. **refactor_code:** Refatorar dependência inválida na camada application

### ⚠️ template-hierarchy
- **Prioridade:** high
- **Tempo estimado:** 50min
- **Ações:** 5

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar diretório/arquivo use-cases na camada application
3. **create_directory:** Criar diretório/arquivo dto na camada application
4. **create_directory:** Criar diretório/arquivo services na camada application
5. **create_directory:** Criar estrutura da camada infrastructure

### ⚠️ template-versions
- **Prioridade:** high
- **Tempo estimado:** 50min
- **Ações:** 5

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar diretório/arquivo use-cases na camada application
3. **create_directory:** Criar diretório/arquivo dto na camada application
4. **create_directory:** Criar diretório/arquivo services na camada application
5. **create_directory:** Criar estrutura da camada infrastructure

### ⚠️ ticket-templates
- **Prioridade:** high
- **Tempo estimado:** 50min
- **Ações:** 5

1. **create_directory:** Criar estrutura da camada domain
2. **create_directory:** Criar diretório/arquivo use-cases na camada application
3. **create_directory:** Criar diretório/arquivo dto na camada application
4. **create_directory:** Criar diretório/arquivo services na camada application
5. **create_directory:** Criar estrutura da camada infrastructure

### ⚠️ tickets
- **Prioridade:** high
- **Tempo estimado:** 2h
- **Ações:** 4

1. **create_directory:** Criar diretório/arquivo services na camada domain
2. **create_directory:** Criar diretório/arquivo dto na camada application
3. **move_code:** Resolver acoplamento: Routes contém lógica de negócio ou acesso a dados
4. **move_code:** Resolver acoplamento: Repository contém possível lógica de negócio

### 💡 field-layout
- **Prioridade:** low
- **Tempo estimado:** 20min
- **Ações:** 2

1. **create_directory:** Criar diretório/arquivo dto na camada application
2. **create_directory:** Criar diretório/arquivo services na camada application

### 💡 template-audit
- **Prioridade:** low
- **Tempo estimado:** 40min
- **Ações:** 4

1. **create_directory:** Criar diretório/arquivo events na camada domain
2. **create_directory:** Criar diretório/arquivo services na camada domain
3. **create_directory:** Criar diretório/arquivo services na camada application
4. **create_directory:** Criar interface I[Entity]Repository no domain e implementar

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


## Recomendações

### Prioridade Imediata 🔥
- **beneficiaries:** 4 ações (4h)
- **knowledge-base:** 9 ações (7h)
- **materials-services:** 35 ações (27h)
- **saas-admin:** 6 ações (4h)
- **schedule-management:** 10 ações (5h)
- **technical-skills:** 10 ações (6h)
- **timecard:** 12 ações (6h)
- **shared:** 6 ações (4h)

### Prioridade Alta ⚠️
- **customers:** 2 ações (2h)
- **template-hierarchy:** 5 ações (50min)
- **template-versions:** 5 ações (50min)
- **ticket-templates:** 5 ações (50min)
- **tickets:** 4 ações (2h)

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
