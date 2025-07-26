# PLANO DE IMPLEMENTAÇÃO - SISTEMA DE METADADOS CONFIGURÁVEIS PARA TICKETS
## Solução Database-Driven para Eliminar Valores Hard-Coded

**Objetivo:** Substituir todos os valores hard-coded por um sistema de configuração flexível baseado em banco de dados, mantendo o layout atual da interface.

---

## 🗃️ ESTRUTURA DE BANCO DE DADOS PROPOSTA

### **1. Tabela Principal de Configuração de Campos**
```sql
CREATE TABLE ticket_field_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL, -- 'priority', 'status', 'category', 'location'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    field_type VARCHAR(30) NOT NULL, -- 'select', 'multiselect', 'text'
    is_required BOOLEAN DEFAULT false,
    is_system_field BOOLEAN DEFAULT false, -- Campos essenciais do sistema
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, field_name)
);
```

### **2. Tabela de Opções para Campos Select**
```sql
CREATE TABLE ticket_field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    field_config_id UUID REFERENCES ticket_field_configurations(id) ON DELETE CASCADE,
    option_value VARCHAR(50) NOT NULL,
    display_label VARCHAR(100) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7), -- #FF5733 para badges coloridos
    icon_name VARCHAR(50), -- lucide-react icon names
    css_classes TEXT, -- Classes CSS customizadas
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sla_hours INTEGER, -- Para prioridades
    escalation_rules JSONB, -- Regras de escalação
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, field_config_id, option_value)
);
```

### **3. Tabela de Configuração de Cores e Estilos**
```sql
CREATE TABLE ticket_style_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    style_name VARCHAR(50) NOT NULL, -- 'priority_colors', 'status_colors'
    field_name VARCHAR(50) NOT NULL,
    style_mapping JSONB NOT NULL, -- {"high": {"bg": "#FF5733", "text": "#FFFFFF"}}
    dark_mode_mapping JSONB, -- Cores para modo escuro
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, style_name, field_name)
);
```

### **4. Tabela de Configurações Padrão por Tenant**
```sql
CREATE TABLE ticket_default_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    default_value VARCHAR(100) NOT NULL,
    apply_to_new_tickets BOOLEAN DEFAULT true,
    apply_to_imported_tickets BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, field_name)
);
```

---

## 🔧 APIS NECESSÁRIAS

### **1. API de Configuração de Campos**
```typescript
// GET /api/tickets/field-configurations
// Retorna configurações de campos para o tenant
interface FieldConfiguration {
  id: string;
  fieldName: string;
  displayName: string;
  fieldType: 'select' | 'multiselect' | 'text';
  isRequired: boolean;
  options: FieldOption[];
}

// POST/PUT/DELETE /api/tickets/field-configurations/:id
// CRUD completo para administradores
```

### **2. API de Opções de Campo**
```typescript
// GET /api/tickets/field-options/:fieldName
// Retorna opções específicas para um campo
interface FieldOption {
  id: string;
  value: string;
  label: string;
  color: string;
  icon?: string;
  cssClasses?: string;
  isDefault: boolean;
  slaHours?: number;
}
```

### **3. API de Estilos e Cores**
```typescript
// GET /api/tickets/style-configurations
// Retorna mapeamento de cores para badges e indicadores
interface StyleConfiguration {
  fieldName: string;
  styleMapping: Record<string, {
    bg: string;
    text: string;
    border?: string;
  }>;
  darkModeMapping?: Record<string, any>;
}
```

---

## 🎨 IMPLEMENTAÇÃO NO FRONTEND

### **1. Hook Personalizado para Metadados**
```typescript
// hooks/useTicketMetadata.ts
export function useTicketMetadata() {
  const { data: fieldConfigs } = useQuery({
    queryKey: ['/api/tickets/field-configurations'],
    queryFn: () => apiRequest('GET', '/api/tickets/field-configurations')
  });

  const { data: styleConfigs } = useQuery({
    queryKey: ['/api/tickets/style-configurations'],
    queryFn: () => apiRequest('GET', '/api/tickets/style-configurations')
  });

  // Função dinâmica para gerar schema Zod baseado nas configurações
  const generateDynamicSchema = useCallback(() => {
    const schemaFields: any = {};
    
    fieldConfigs?.forEach((config: FieldConfiguration) => {
      if (config.fieldType === 'select' && config.options.length > 0) {
        const values = config.options.map(opt => opt.value);
        schemaFields[config.fieldName] = config.isRequired 
          ? z.enum(values as [string, ...string[]])
          : z.enum(values as [string, ...string[]]).optional();
      }
    });
    
    return z.object(schemaFields);
  }, [fieldConfigs]);

  // Função dinâmica para cores de badge
  const getBadgeStyle = useCallback((fieldName: string, value: string) => {
    const styleConfig = styleConfigs?.find(s => s.fieldName === fieldName);
    const colors = styleConfig?.styleMapping[value];
    
    if (colors) {
      return `bg-[${colors.bg}] text-[${colors.text}]`;
    }
    
    // Fallback para cores padrão
    return "bg-gray-100 text-gray-800";
  }, [styleConfigs]);

  return {
    fieldConfigs: fieldConfigs || [],
    styleConfigs: styleConfigs || [],
    generateDynamicSchema,
    getBadgeStyle
  };
}
```

### **2. Componente Select Dinâmico**
```typescript
// components/DynamicSelect.tsx
interface DynamicSelectProps {
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DynamicSelect({ fieldName, value, onChange, placeholder }: DynamicSelectProps) {
  const { data: options } = useQuery({
    queryKey: ['/api/tickets/field-options', fieldName],
    queryFn: () => apiRequest('GET', `/api/tickets/field-options/${fieldName}`)
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option: FieldOption) => (
          <SelectItem key={option.id} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon && <Icon name={option.icon} size={16} />}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### **3. Badge Dinâmico com Cores Configuráveis**
```typescript
// components/DynamicBadge.tsx
interface DynamicBadgeProps {
  fieldName: string;
  value: string;
  children: React.ReactNode;
}

export function DynamicBadge({ fieldName, value, children }: DynamicBadgeProps) {
  const { getBadgeStyle } = useTicketMetadata();
  const dynamicStyles = getBadgeStyle(fieldName, value);
  
  return (
    <Badge className={`${dynamicStyles} dark:opacity-90`}>
      {children}
    </Badge>
  );
}
```

---

## 📝 MIGRAÇÃO DOS COMPONENTES EXISTENTES

### **1. TicketsTable.tsx - Substituição de Enums**
```typescript
// ANTES (Hard-coded)
const ticketSchema = z.object({
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

// DEPOIS (Dinâmico)
export default function TicketsTable() {
  const { generateDynamicSchema } = useTicketMetadata();
  const ticketSchema = generateDynamicSchema();
  
  // Resto do componente permanece igual
}
```

### **2. TicketDetails.tsx - SelectItems Dinâmicos**
```typescript
// ANTES (Hard-coded)
<Select>
  <SelectItem value="hardware">Hardware</SelectItem>
  <SelectItem value="software">Software</SelectItem>
  <SelectItem value="rede">Rede</SelectItem>
</Select>

// DEPOIS (Dinâmico)
<DynamicSelect 
  fieldName="category" 
  value={form.watch('category')} 
  onChange={(value) => form.setValue('category', value)}
  placeholder="Selecione uma categoria"
/>
```

### **3. Função de Cores Dinâmica**
```typescript
// ANTES (Hard-coded)
function getPriorityBadgeStyle(priority: string) {
  switch (priority.toLowerCase()) {
    case "urgent": return "bg-red-100 text-red-800";
    case "high": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

// DEPOIS (Dinâmico)
function PriorityBadge({ priority }: { priority: string }) {
  return (
    <DynamicBadge fieldName="priority" value={priority}>
      {priority}
    </DynamicBadge>
  );
}
```

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### **Fase 1: Infraestrutura (5-7 dias)**
- [ ] Criar tabelas no banco de dados
- [ ] Implementar APIs básicas de CRUD para configurações
- [ ] Criar seed data com configurações padrão para novos tenants
- [ ] Testes unitários das APIs

### **Fase 2: Hooks e Componentes Base (3-4 dias)**
- [ ] Implementar hook useTicketMetadata
- [ ] Criar componentes DynamicSelect e DynamicBadge
- [ ] Função de geração de schema Zod dinâmico
- [ ] Testes dos componentes

### **Fase 3: Migração Gradual (5-6 dias)**
- [ ] Migrar TicketsTable.tsx para usar sistema dinâmico
- [ ] Migrar TicketDetails.tsx para selects dinâmicos
- [ ] Migrar TicketEdit.tsx para configurações dinâmicas
- [ ] Substituir funções de cores hard-coded

### **Fase 4: Interface de Administração (4-5 dias)**
- [ ] Página de configuração de metadados para administradores
- [ ] Interface para criação/edição de opções de campo
- [ ] Sistema de cores e ícones personalizáveis
- [ ] Validação e preview das configurações

### **Fase 5: Testes e Polimento (3-4 dias)**
- [ ] Testes de integração com dados reais
- [ ] Validação de performance com múltiplos tenants
- [ ] Documentação para administradores
- [ ] Treinamento de equipe

---

## 📊 BENEFÍCIOS ESPERADOS

### **Para o Produto:**
✅ Sistema completamente flexível e configurável  
✅ Eliminação de 100% dos valores hard-coded  
✅ Capacidade de atender empresas com processos únicos  
✅ Redução drástica de customizações de código  

### **Para os Clientes:**
✅ Alinhamento com identidade visual da empresa  
✅ Processos de tickets refletindo realidade organizacional  
✅ Configuração self-service por administradores  
✅ Dados reais em vez de informações simuladas  

### **Para a Equipe:**
✅ Redução de requests de customização  
✅ Facilidade de onboarding de novos clientes  
✅ Manutenção simplificada do código  
✅ Base sólida para futuras funcionalidades  

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### **Compatibilidade:**
- Sistema deve manter compatibilidade com tickets existentes
- Migração gradual sem impacto no layout atual
- Fallbacks para configurações não definidas

### **Performance:**
- Cache inteligente para configurações de campo
- Lazy loading de opções raramente usadas
- Otimização de queries para múltiplos tenants

### **Segurança:**
- Validação rigorosa de permissões para configurações
- Audit trail de mudanças de configuração
- Isolamento completo entre tenants

---

**RESUMO:** Esta implementação transformará o módulo de tickets de um sistema rígido para uma plataforma verdadeiramente configurável, mantendo toda a funcionalidade e layout atuais enquanto elimina completamente os valores hard-coded identificados na análise.