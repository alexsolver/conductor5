# 📝 PADRÕES DE NOMENCLATURA - CONDUCTOR PLATFORM

## 🇧🇷 PADRÃO HÍBRIDO BRASILEIRO-INTERNACIONAL ADOTADO

### **CAMPOS LEGAIS BRASILEIROS** (Português)
```typescript
// Documentos legais brasileiros - mantidos em português
cpf: varchar("cpf", { length: 14 })           // CPF padrão brasileiro
cnpj: varchar("cnpj", { length: 18 })         // CNPJ padrão brasileiro  
rg: varchar("rg", { length: 20 })             // RG regional brasileiro
pis: varchar("pis", { length: 20 })           // PIS federal brasileiro
ctps: varchar("ctps", { length: 50 })         // Carteira de Trabalho
```

**JUSTIFICATIVA**: Terminologia legal obrigatória, reconhecida pela Receita Federal

### **CAMPOS DE NEGÓCIO** (Inglês Internacional)
```typescript
// Campos de negócio - padrão internacional
firstName: varchar("first_name", { length: 100 })
lastName: varchar("last_name", { length: 100 })
email: varchar("email", { length: 255 })
phone: varchar("phone", { length: 20 })
address: text("address")
city: varchar("city", { length: 100 })
```

**JUSTIFICATIVA**: Compatibilidade internacional, integração com sistemas externos

### **CAMPOS DE SISTEMA** (Inglês Técnico)
```typescript
// Campos de sistema - sempre inglês
id: uuid("id").primaryKey()
tenantId: uuid("tenant_id")
isActive: boolean("is_active")
createdAt: timestamp("created_at")
updatedAt: timestamp("updated_at")
```

**JUSTIFICATIVA**: Convenções universais de desenvolvimento

## 📞 SISTEMA DUAL DE TELEFONES

### **PADRÃO DEFINIDO**
```typescript
phone: varchar("phone", { length: 20 })          // Telefone fixo/comercial
cellPhone: varchar("cell_phone", { length: 20 }) // Celular/WhatsApp
```

### **CASOS DE USO**
- **phone**: Telefone fixo, comercial, recepção, contato principal
- **cellPhone**: Celular pessoal, WhatsApp, SMS, contato móvel urgente

### **APLICAÇÃO POR ENTIDADE**
| Entidade | Phone (Fixo) | CellPhone (Móvel) |
|----------|--------------|-------------------|
| Users | Ramal/Fixo | Celular pessoal |
| Customers | Comercial | WhatsApp |
| Favorecidos | Principal | Contato móvel |
| Suppliers | Empresa | Contato direto |

## 🏢 PADRÕES DE NOME POR ENTIDADE

### **PESSOAS FÍSICAS** (firstName + lastName)
```typescript
// Aplicado em: users, favorecidos, contacts
firstName: varchar("first_name", { length: 100 })
lastName: varchar("last_name", { length: 100 })
```

### **PESSOAS JURÍDICAS** (name + tradeName)
```typescript
// Aplicado em: customers, suppliers, companies
name: varchar("name", { length: 255 })           // Razão social
tradeName: varchar("trade_name", { length: 255 }) // Nome fantasia
```

### **ENTIDADES ABSTRATAS** (name único)
```typescript
// Aplicado em: projects, tickets, assets, locations
name: varchar("name", { length: 255 })
// OU
title: varchar("title", { length: 255 }) // Para documentos
```

## 🏷️ STATUS DEFAULTS POR CONTEXTO

### **FLUXO DE ATENDIMENTO**
```typescript
tickets.status: "open"          // Pronto para atendimento
tickets.priority: "medium"      // Prioridade padrão
```

### **FLUXO DE PROJETO** 
```typescript
projects.status: "planning"     // Fase inicial de planejamento
projectActions.status: "pending" // Aguardando execução
```

### **ESTADO BINÁRIO**
```typescript
users.isActive: true           // Ativo por padrão
favorecidos.isActive: true     // Ativo por padrão
customers.isActive: true       // Ativo por padrão
```

### **FLUXO FINANCEIRO**
```typescript
contracts.status: "draft"      // Rascunho inicial
invoices.status: "pending"     // Aguardando pagamento
```

## 🌐 CÓDIGOS DE INTEGRAÇÃO

### **PADRÃO UNIFICADO**
```typescript
// Todos os sistemas usam integration_code
integrationCode: varchar("integration_code", { length: 100 })
```

### **APLICAÇÃO**
- **ERP Integration**: Código único para sincronização
- **Customer Code**: Identificação externa do cliente
- **Employee Code**: Código de funcionário RH
- **Asset Code**: Código patrimonial

## 🇧🇷 CAMPOS REGIONAIS BRASILEIROS

### **ENDEREÇO BRASILEIRO**
```typescript
cep: varchar("cep", { length: 10 })               // CEP brasileiro
state: varchar("state", { length: 2 })            // UF (2 caracteres)
country: varchar("country").default("Brasil")     // País padrão
neighborhood: varchar("neighborhood", { length: 100 }) // Bairro
```

### **DADOS RH BRASILEIROS**
```typescript
cargo: varchar("cargo", { length: 100 })          // Cargo brasileiro
admissionDate: date("admission_date")             // Data de admissão
costCenter: varchar("cost_center", { length: 100 }) // Centro de custo
```

## 📋 APLICAÇÃO DOS PADRÕES

### ✅ **ENTIDADES CONFORMES**
- ✅ users: firstName/lastName + campos RH brasileiros
- ✅ favorecidos: firstName/lastName + cpf/cnpj/rg
- ✅ customers: name/tradeName + integrationCode
- ✅ locations: name + address brasileiro

### 🔄 **ENTIDADES EM MIGRAÇÃO**
- tickets: status defaults padronizados
- projects: status defaults alinhados
- contracts: nomenclatura revisada

## 🎯 BENEFÍCIOS DO PADRÃO HÍBRIDO

1. **🇧🇷 Compliance Legal**: Campos brasileiros conforme legislação
2. **🌐 Integração Global**: Campos de negócio em inglês
3. **🔧 Manutenibilidade**: Padrões técnicos consistentes
4. **📊 Relatórios**: Terminologia familiar aos usuários brasileiros
5. **🚀 Escalabilidade**: Preparado para expansão internacional

---

**APROVADO**: Padrão Híbrido Brasileiro-Internacional v1.0
**DATA**: Janeiro 2025
**APLICAÇÃO**: Todas as novas entidades devem seguir estes padrões