# GUIA PRÁTICO - COMO CONFIGURAR TICKETS HIERÁRQUICOS

## 🎯 COMO FUNCIONA O SISTEMA

O sistema permite que diferentes empresas clientes tenham suas próprias configurações de tickets (prioridades, status, categorias) enquanto outras usam as configurações padrão do seu tenant.

**Exemplo prático:**
- Empresa A (Tech): vê prioridades como "P1, P2, P3, P4"  
- Empresa B (Hospital): vê prioridades como "Emergencial, Urgente, Moderado, Eletivo"
- Empresas sem configuração específica: veem "Baixa, Média, Alta, Crítica" (padrão)

## 🚀 PASSO A PASSO PARA CONFIGURAR

### PASSO 1: Criar Exemplos Automáticos (Para Testar)

Primeiro, vamos criar configurações de exemplo para 3 empresas diferentes:

```bash
# No seu navegador, acesse:
POST http://localhost:5000/api/ticket-metadata-hierarchical/examples

# Ou via curl:
curl -X POST "http://localhost:5000/api/ticket-metadata-hierarchical/examples" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

**Isso cria automaticamente:**
- Tech Company: P1, P2, P3, P4
- Healthcare Company: Emergencial, Urgente, Moderado, Eletivo  
- Financial Company: Alto Risco, Médio Risco, Baixo Risco, Sem Risco

### PASSO 2: Testar as Configurações

Agora teste se cada empresa vê configurações diferentes:

```bash
# Tech Company vê P1-P4
GET http://localhost:5000/api/ticket-metadata-hierarchical/customer/tech-company-uuid/field/priority

# Healthcare vê severidades médicas
GET http://localhost:5000/api/ticket-metadata-hierarchical/customer/healthcare-company-uuid/field/priority

# Empresa sem configuração específica vê padrão do tenant
GET http://localhost:5000/api/ticket-metadata-hierarchical/customer/empresa-qualquer-uuid/field/priority
```

### PASSO 3: Comparar Configurações

Veja como diferentes empresas recebem configurações diferentes:

```bash
POST http://localhost:5000/api/ticket-metadata-hierarchical/compare
{
  "customerIds": ["tech-company-uuid", "healthcare-company-uuid", "financial-company-uuid"],
  "fieldName": "priority"
}
```

## 🏢 CRIAR CONFIGURAÇÃO PARA UMA EMPRESA REAL

Para criar configuração específica para uma empresa cliente real:

```bash
POST http://localhost:5000/api/ticket-metadata-hierarchical/customer/ID_DA_EMPRESA_CLIENTE/configuration
{
  "fieldName": "priority",
  "displayName": "Prioridade Customizada",
  "options": [
    { "value": "baixa", "label": "Baixa Prioridade", "color": "#10B981", "isDefault": true },
    { "value": "media", "label": "Média Prioridade", "color": "#F59E0B" },
    { "value": "alta", "label": "Alta Prioridade", "color": "#EF4444" }
  ]
}
```

**Substitua:**
- `ID_DA_EMPRESA_CLIENTE`: pelo ID real da empresa no seu sistema
- Customize os valores, labels e cores conforme a empresa preferir

## 📋 CASOS DE USO PRÁTICOS

### Caso 1: Empresa de TI
```json
{
  "fieldName": "priority",
  "displayName": "Severidade Técnica", 
  "options": [
    { "value": "p1", "label": "P1 - Crítico", "color": "#DC2626" },
    { "value": "p2", "label": "P2 - Alto", "color": "#EA580C" },
    { "value": "p3", "label": "P3 - Médio", "color": "#CA8A04", "isDefault": true },
    { "value": "p4", "label": "P4 - Baixo", "color": "#16A34A" }
  ]
}
```

### Caso 2: Hospital/Clínica
```json
{
  "fieldName": "priority",
  "displayName": "Gravidade Médica",
  "options": [
    { "value": "emergencia", "label": "Emergência", "color": "#B91C1C" },
    { "value": "urgente", "label": "Urgente", "color": "#DC2626" },
    { "value": "moderado", "label": "Moderado", "color": "#D97706", "isDefault": true },
    { "value": "eletivo", "label": "Eletivo", "color": "#059669" }
  ]
}
```

### Caso 3: Empresa Financeira
```json
{
  "fieldName": "priority", 
  "displayName": "Nível de Risco",
  "options": [
    { "value": "alto_risco", "label": "Alto Risco", "color": "#991B1B" },
    { "value": "medio_risco", "label": "Médio Risco", "color": "#B45309", "isDefault": true },
    { "value": "baixo_risco", "label": "Baixo Risco", "color": "#047857" }
  ]
}
```

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

### Verificação 1: Ver Configuração Completa da Empresa
```bash
GET http://localhost:5000/api/ticket-metadata-hierarchical/customer/ID_DA_EMPRESA/configuration
```

### Verificação 2: Testar Campo Específico
```bash
GET http://localhost:5000/api/ticket-metadata-hierarchical/customer/ID_DA_EMPRESA/field/priority
```

### Verificação 3: Ver Hierarquia Funcionando
- Empresa COM configuração específica = vê configuração customizada
- Empresa SEM configuração específica = vê configuração padrão do tenant
- Sistema sempre funciona = fallback garantido

## 🔄 WORKFLOW TÍPICO

1. **Cliente novo pede customização** → você cria configuração específica para ele
2. **Cliente usa tickets** → ele vê as prioridades/status no formato que pediu
3. **Outros clientes** → continuam vendo configurações padrão (sem impacto)
4. **Compatibilidade garantida** → sistema existente funciona normal

## 💡 DICAS IMPORTANTES

- **IDs de Empresa**: Use os IDs reais das empresas cadastradas no seu sistema
- **Cores**: Use códigos hexadecimais (#FF0000) para manter consistência visual
- **Labels**: Use termos familiares para cada empresa cliente
- **isDefault**: Sempre marque uma opção como padrão
- **Backup Automático**: Configurações antigas continuam funcionando

## 🛠️ FERRAMENTAS DE TESTE

No seu navegador, você pode usar tools como:
- **Postman**: Para testar as APIs facilmente
- **Thunder Client** (VS Code): Extension para testar APIs
- **curl**: Via linha de comando conforme exemplos acima

---

**RESULTADO**: Cada empresa cliente vê tickets com terminologia familiar, aumentando satisfação e adoção do sistema.