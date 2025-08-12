# 🚀 ROADMAP DE PADRONIZAÇÃO DO SISTEMA CONDUCTOR
*Seguindo especificações do 1qa.md para Clean Architecture e padrões sistêmicos*

## 📋 ANÁLISE ATUAL DA ARQUITETURA

### ✅ MÓDULOS COM CLEAN ARCHITECTURE IMPLEMENTADA
- `server/modules/customers/` - ✅ Estrutura completa com domain/application/infrastructure
- `server/modules/dashboard/` - ✅ Estrutura básica implementada

### ❌ MÓDULOS QUE PRECISAM PADRONIZAÇÃO
- `server/modules/auth/` - Estrutura legacy
- `server/modules/tickets/` - Estrutura legacy  
- `server/modules/timecard/` - Estrutura legacy
- `server/modules/users/` - Estrutura legacy
- `server/modules/locations/` - Estrutura legacy
- `server/modules/materials-services/` - Estrutura legacy
- `server/modules/notifications/` - Estrutura legacy
- E mais 15+ módulos

### 🔄 ESTRUTURA ATUAL vs PADRÃO OBRIGATÓRIO

**ATUAL (inconsistente):**
```
server/
├── routes/                    ❌ Misturado com modules
├── controllers/               ❌ Fora dos módulos
├── services/                  ❌ Não segue Clean Architecture
└── modules/[module]/
    ├── routes.ts             ❌ Apenas rotas
    └── controllers/          ❌ Sem domain/application
```

**PADRÃO OBRIGATÓRIO (1qa.md):**
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
└── routes.ts             → Definição de endpoints
```

---

## 🎯 ROADMAP POR FASES

### 🔶 **FASE 1 - MÓDULOS CRÍTICOS (Semana 1-2)**
*Prioridade: Sistema core em produção*

#### 1.1 **TICKETS MODULE** 🎫
**Status:** ❌ Legacy → ✅ Clean Architecture
**Impacto:** CRÍTICO (core business)

**Tarefas:**
- [ ] Criar `server/modules/tickets/domain/entities/Ticket.ts`
- [ ] Implementar `ITicketRepository.ts` interface
- [ ] Migrar `TicketsController.ts` para application layer
- [ ] Criar Use Cases: `CreateTicketUseCase.ts`, `UpdateTicketUseCase.ts`, `DeleteTicketUseCase.ts`
- [ ] Implementar `DrizzleTicketRepository.ts` 
- [ ] Criar DTOs: `CreateTicketDTO.ts`, `UpdateTicketDTO.ts`
- [ ] Refatorar rotas existentes sem quebrar APIs

**Estimativa:** 3-4 dias
**Dependências:** Schema atual (preservar)

#### 1.2 **USERS MODULE** 👤
**Status:** ❌ Legacy → ✅ Clean Architecture

**Tarefas:**
- [ ] Restructurar `server/modules/users/` seguindo padrão
- [ ] Migrar `UserManagementService.ts` para domain layer
- [ ] Criar interfaces de repository
- [ ] Implementar Use Cases para CRUD de usuários
- [ ] Manter compatibilidade com autenticação existente

**Estimativa:** 2-3 dias

#### 1.3 **AUTH MODULE** 🔐
**Status:** ❌ Legacy → ✅ Clean Architecture

**Tarefas:**
- [ ] Reestruturar autenticação seguindo Clean Architecture
- [ ] Criar `AuthDomainService.ts` para regras de negócio
- [ ] Implementar Use Cases: `LoginUseCase.ts`, `RefreshTokenUseCase.ts`
- [ ] Manter middleware `jwtAuth.ts` funcionando
- [ ] Preservar sessões existentes

**Estimativa:** 2-3 dias

### 🔷 **FASE 2 - MÓDULOS DE NEGÓCIO (Semana 3-4)**

#### 2.1 **TIMECARD MODULE** ⏰
**Status:** ❌ Legacy → ✅ Clean Architecture

**Tarefas:**
- [ ] Reestruturar módulo de timecard
- [ ] Implementar `TimecardDomainService.ts` para regras CLT
- [ ] Criar Use Cases para jornada de trabalho
- [ ] Manter compliance CLT existente
- [ ] Preservar backup automático

**Estimativa:** 3-4 dias

#### 2.2 **LOCATIONS MODULE** 📍
**Status:** ❌ Legacy → ✅ Clean Architecture

**Tarefas:**
- [ ] Migrar `LocationsNewController.ts` 
- [ ] Implementar geolocalização no domain layer
- [ ] Criar Use Cases para gestão de localizações
- [ ] Manter integração com ViaCEP

**Estimativa:** 2-3 dias

#### 2.3 **MATERIALS-SERVICES MODULE** 📦
**Status:** ❌ Legacy → ✅ Clean Architecture

**Tarefas:**
- [ ] Reestruturar módulo de materiais e serviços
- [ ] Implementar domain services para LPU
- [ ] Criar Use Cases para catálogo de itens
- [ ] Manter personalização de clientes

**Estimativa:** 3-4 dias

### 🔸 **FASE 3 - MÓDULOS AUXILIARES (Semana 5-6)**

#### 3.1 **NOTIFICATIONS MODULE** 📧
#### 3.2 **TECHNICAL-SKILLS MODULE** 🛠️
#### 3.3 **TEAMS MODULE** 👥
#### 3.4 **TEMPLATE MODULE** 📄

### 🔹 **FASE 4 - CONSOLIDAÇÃO (Semana 7-8)**

#### 4.1 **CLEANUP & MIGRATION**
- [ ] Remover arquivos legacy de `server/routes/`
- [ ] Migrar `server/controllers/` para módulos específicos
- [ ] Consolidar `server/services/` distribuindo pelos módulos
- [ ] Atualizar importações em todo o sistema

#### 4.2 **VALIDATION & TESTING**
- [ ] Validar todos os fluxos existentes
- [ ] Testar APIs sem quebrar integrações
- [ ] Verificar performance pós-migração
- [ ] Documentar mudanças arquiteturais

---

## 🛠️ TEMPLATES DE IMPLEMENTAÇÃO

### Template: Domain Entity
```typescript
// server/modules/[module]/domain/entities/[Entity].ts
export interface [Entity] {
  id: string;
  tenantId: string;
  // ... propriedades específicas
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export class [Entity]DomainService {
  validate(entity: [Entity]): boolean {
    // Regras de negócio puras
  }
}
```

### Template: Repository Interface
```typescript
// server/modules/[module]/domain/repositories/I[Entity]Repository.ts
export interface I[Entity]Repository {
  findById(id: string, tenantId: string): Promise<[Entity] | null>;
  create(entity: Create[Entity]DTO, tenantId: string): Promise<[Entity]>;
  update(id: string, data: Update[Entity]DTO, tenantId: string): Promise<[Entity]>;
  delete(id: string, tenantId: string): Promise<void>;
  findByTenant(tenantId: string): Promise<[Entity][]>;
}
```

### Template: Use Case
```typescript
// server/modules/[module]/application/use-cases/Create[Entity]UseCase.ts
export class Create[Entity]UseCase {
  constructor(
    private repository: I[Entity]Repository,
    private domainService: [Entity]DomainService,
    private logger: Logger
  ) {}

  async execute(data: Create[Entity]DTO, tenantId: string): Promise<[Entity]> {
    // Validação de negócio
    this.domainService.validate(data);
    
    // Persistência via repository
    return await this.repository.create(data, tenantId);
  }
}
```

### Template: Controller
```typescript
// server/modules/[module]/application/controllers/[Entity]Controller.ts
export class [Entity]Controller {
  constructor(
    private createUseCase: Create[Entity]UseCase,
    private updateUseCase: Update[Entity]UseCase,
    private deleteUseCase: Delete[Entity]UseCase,
    private findUseCase: Find[Entity]UseCase
  ) {}

  async create(req: Request, res: Response) {
    try {
      const result = await this.createUseCase.execute(req.body, req.user.tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

---

## 📊 MÉTRICAS DE PROGRESSO

### KPIs por Fase:
- **Fase 1:** 3 módulos críticos migrados (20% do sistema)
- **Fase 2:** 7 módulos core migrados (60% do sistema) 
- **Fase 3:** 15+ módulos migrados (90% do sistema)
- **Fase 4:** 100% sistema padronizado + cleanup

### Critérios de Sucesso:
✅ **Clean Architecture Compliance:** 100%
✅ **API Compatibility:** 100% (sem quebras)
✅ **Performance:** Mantida ou melhorada
✅ **Código Legacy:** 0% restante
✅ **Testes:** Todos os fluxos validados

---

## 🚨 RISCOS E MITIGAÇÕES

### 🔴 **RISCOS CRÍTICOS:**
1. **Quebra de APIs existentes** → Mitigação: Manter interfaces públicas
2. **Performance degradation** → Mitigação: Benchmark antes/depois  
3. **Regressões em funcionalidades** → Mitigação: Testes extensivos
4. **Dependency conflicts** → Mitigação: Migração incremental

### 🟡 **RISCOS MÉDIOS:**
1. Tempo de migração maior que estimado
2. Conflitos de merge em desenvolvimento paralelo
3. Curva de aprendizado da equipe

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Por Módulo Migrado:
- [ ] ✅ Clean Architecture: Camadas respeitadas?
- [ ] ✅ Não-quebra: Código existente preservado?
- [ ] ✅ Padrão: Estrutura de módulos seguida?
- [ ] ✅ Nomenclatura: Consistente com o sistema?
- [ ] ✅ Tenant: Multi-tenancy respeitado?
- [ ] ✅ Tipos: TypeScript strict compliance?
- [ ] ✅ Testes: Fluxos validados?

### Final:
- [ ] ✅ 100% módulos migrados
- [ ] ✅ 0% arquivos legacy restantes  
- [ ] ✅ Performance mantida/melhorada
- [ ] ✅ Documentação atualizada
- [ ] ✅ Equipe treinada nos novos padrões

---

**🎯 OBJETIVO FINAL:** Sistema 100% padronizado seguindo Clean Architecture, mantendo funcionalidades existentes e melhorando manutenibilidade para futuras expansões.