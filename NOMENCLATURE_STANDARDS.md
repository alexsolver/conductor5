
# GUIA DE NOMENCLATURA - PORTUGUÊS/INGLÊS

## ENTIDADES PRINCIPAIS

### 1. CUSTOMERS (Solicitantes)
- **Contexto**: Usuários internos do sistema, solicitantes de tickets
- **Idioma**: Inglês (internacional)
- **Campos**: firstName, lastName, email, phone, company
- **Justificativa**: Terminologia padrão em sistemas SaaS internacionais

### 2. FAVORECIDOS (Beneficiários externos)
- **Contexto**: Entidade específica brasileira, pessoas beneficiadas
- **Idioma**: Português (contexto brasileiro)
- **Campos**: nome, cpf, cnpj, rg, telefone, celular, endereco
- **Justificativa**: Conceito específico brasileiro sem equivalente direto

## PADRÕES DE NOMENCLATURA

### Campos Internacionais (Inglês)
- `email`, `phone` - Padrão global
- `firstName`, `lastName` - Formato internacional
- `company`, `status`, `priority` - Terminologia SaaS

### Campos Brasileiros (Português)
- `cpf`, `cnpj`, `rg` - Documentos específicos do Brasil
- `telefone`, `celular` - Termos brasileiros comuns
- `endereco`, `cidade`, `estado`, `cep` - Endereçamento brasileiro

### Campos Sistema (Inglês)
- `tenantId`, `createdAt`, `updatedAt` - Padrão técnico
- `isActive` - Convenção boolean internacional

## COEXISTÊNCIA CONTROLADA

✅ **CORRETO**: Manter ambos idiomas com contexto claro
❌ **ERRADO**: Misturar idiomas na mesma entidade sem justificativa

### Exemplo Correto:
```typescript
// Entidade internacional
customers: { firstName, lastName, email, phone }

// Entidade brasileira  
favorecidos: { nome, cpf, telefone, endereco }
```

### Exemplo Incorreto:
```typescript
// Mistura sem contexto
entity: { firstName, nome, email, telefone }
```
