# 🚀 ROADMAP FASE 4+ - EXPANSÃO MODULAR CLEAN ARCHITECTURE

**Status:** 🔄 **EM ANDAMENTO**  
**Data:** Agosto 2025  
**Base:** Clean Architecture conforme 1qa.md  

## 🎯 OBJETIVO

Expandir a padronização Clean Architecture para todos os módulos do sistema Conductor, seguindo o padrão estabelecido nas FASES 1-3 (Tickets, Users, Auth).

## 🔍 ANÁLISE DO CÓDIGO EXISTENTE

- **Verificado:** ✅ Clean Architecture mantida nos módulos base
- **Verificado:** ✅ Código funcionando preservado
- **Verificado:** ✅ Padrão sistêmico respeitado
- **Identificado:** Múltiplos módulos funcionais que necessitam padronização

## 📊 MÓDULOS IDENTIFICADOS PARA PADRONIZAÇÃO

### 🟢 MÓDULOS PRIORITÁRIOS (Alto Impacto)

#### **FASE 4 - CUSTOMERS MODULE**
- **Status:** Legacy routes funcionando
- **Prioridade:** Alta (integração direta com tickets)
- **Complexidade:** Média
- **APIs:** `/api/customers`, `/api/customers/companies`
- **Features:** CRUD customers, company relationships, phone/email validation

#### **FASE 5 - COMPANIES MODULE** 
- **Status:** Legacy routes funcionando
- **Prioridade:** Alta (base para multi-tenancy)
- **Complexidade:** Média
- **APIs:** `/api/companies`
- **Features:** Company management, tenant relationships

#### **FASE 6 - CONTRACTS MODULE**
- **Status:** Dashboard ativo com stats
- **Prioridade:** Alta (business critical)
- **Complexidade:** Alta
- **APIs:** `/api/contracts/*`
- **Features:** Contract management, status tracking, dashboard stats

### 🟡 MÓDULOS SECUNDÁRIOS (Médio Impacto)

#### **FASE 7 - TEAM MANAGEMENT MODULE**
- **Status:** Sistema completo funcionando
- **Prioridade:** Média
- **Complexidade:** Alta (múltiplas sub-features)
- **APIs:** `/api/team-management/*`
- **Features:** Members, departments, performance, skills matrix

#### **FASE 8 - USER MANAGEMENT MODULE**
- **Status:** Sistema robusto com grupos/roles/permissions
- **Prioridade:** Média (complemento ao Users)
- **Complexidade:** Alta
- **APIs:** `/api/user-management/*`
- **Features:** Groups, roles, permissions, invitations, sessions

#### **FASE 9 - TECHNICAL SKILLS MODULE**
- **Status:** Funcional com certifications
- **Prioridade:** Média
- **Complexidade:** Média
- **APIs:** `/api/technical-skills/*`
- **Features:** Skills matrix, certifications, categories

### 🔵 MÓDULOS ESPECIALIZADOS (Baixa Prioridade)

#### **FASE 10+ - OUTROS MÓDULOS**
- Email Config & Monitoring
- Tenant Admin features
- Integrations
- Localization
- Activity/Audit systems

## 🏗️ IMPLEMENTAÇÃO PROPOSTA

### Estrutura Clean Architecture (1qa.md Compliance)

```
server/modules/[module-name]/
├── domain/
│   ├── entities/           → [ModuleName].ts
│   ├── repositories/       → I[ModuleName]Repository.ts
│   ├── services/          → [ModuleName]DomainService.ts
│   └── value-objects/     → Objetos de valor específicos
├── application/
│   ├── controllers/       → [ModuleName]Controller.ts
│   ├── use-cases/         → [Action][ModuleName]UseCase.ts
│   ├── dto/              → Create/Update[ModuleName]DTO.ts
│   └── services/         → [ModuleName]ApplicationService.ts
├── infrastructure/
│   ├── repositories/      → Drizzle[ModuleName]Repository.ts
│   ├── clients/          → Clientes externos
│   └── config/           → Configurações específicas
├── routes.ts             → Legacy (preservado)
└── routes-clean.ts       → Clean Architecture routes
```

### Padrão de Controller (1qa.md)
```typescript
export class ModuleController {
  constructor(
    private useCase: ModuleUseCase,
    private logger: Logger
  ) {}
  
  async handleRequest(req: Request, res: Response) {
    try {
      const result = await this.useCase.execute(req.body);
      res.json(result);
    } catch (error) {
      this.logger.error(error);
      res.status(500).json({ error: 'Internal error' });
    }
  }
}
```

### Padrão de Repository (1qa.md)
```typescript
export class DrizzleModuleRepository implements IModuleRepository {
  async findById(id: string, tenantId: string): Promise<Module | null> {
    // Implementação específica com Drizzle
    // Validação de tenant obrigatória
    if (!tenantId) throw new Error('Tenant ID required');
    
    return await db.select()
      .from(moduleTable)
      .where(and(
        eq(moduleTable.id, id),
        eq(moduleTable.tenantId, tenantId)
      ));
  }
}
```

## ✅ VALIDAÇÃO (1qa.md Checklist)

Para cada módulo implementado:

### 🔍 CHECKLIST OBRIGATÓRIO
- [ ] Clean Architecture: Camadas respeitadas?
- [ ] Não-quebra: Código existente preservado?
- [ ] Padrão: Estrutura de módulos seguida?
- [ ] Nomenclatura: Consistente com o sistema?
- [ ] Tenant: Multi-tenancy respeitado?
- [ ] Tipos: TypeScript strict compliance?
- [ ] Testes: Fluxos validados?

### 🚨 VIOLAÇÕES CRÍTICAS A EVITAR
- ❌ NUNCA importar express no Domain Layer
- ❌ NUNCA acessar banco direto nos Use Cases
- ❌ NUNCA alterar schemas em produção sem validação
- ❌ NUNCA quebrar APIs existentes
- ❌ NUNCA misturar responsabilidades entre camadas
- ❌ NUNCA ignorar validação de tenant
- ❌ NUNCA criar dependências circulares

## 🎯 ESTRATÉGIA DE EXECUÇÃO

### 1. **Abordagem Incremental**
- Um módulo por vez
- Preservar 100% funcionalidade existente
- Criar rotas `-clean` paralelas
- Deprecar gradually as rotas legacy

### 2. **Validação Contínua**
- Testes de regressão após cada módulo
- Verificação de performance
- Monitoramento de erros LSP
- Feedback loop constante

### 3. **Documentação Paralela**
- Arquivo de progresso para cada fase
- Checklist de compliance 1qa.md
- Métricas de cobertura
- Templates reutilizáveis

## 📋 TEMPLATES REUTILIZÁVEIS

### Entity Template
```typescript
export interface ModuleName {
  id: string;
  tenantId: string;
  // Properties específicas...
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
}

export class ModuleNameDomainService {
  validate(entity: Partial<ModuleName>): boolean {
    // Business rules validation
  }
}
```

### Use Case Template
```typescript
export class ActionModuleNameUseCase {
  constructor(
    private repository: IModuleNameRepository,
    private domainService: ModuleNameDomainService
  ) {}

  async execute(dto: ActionModuleNameDTO): Promise<ModuleName> {
    // Validation
    this.domainService.validate(dto);
    
    // Business logic
    // Repository operations
    
    return result;
  }
}
```

## 🚀 PRÓXIMO PASSO: FASE 4 - CUSTOMERS

Iniciar implementação do módulo Customers seguindo o padrão estabelecido, começando com análise das rotas existentes e mapeamento das entidades de domínio.

---

**ROADMAP ATIVO:** FASE 1-3 ✅ COMPLETAS | FASE 4+ 🔄 EXPANSÃO MODULAR**