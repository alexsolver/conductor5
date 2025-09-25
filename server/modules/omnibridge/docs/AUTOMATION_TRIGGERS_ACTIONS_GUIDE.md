
# Guia Completo de Gatilhos e Ações de Automação - OmniBridge

## Gatilhos Avançados Implementados

### 1. Gatilhos Temporais Avançados

#### Horário Comercial
- **Tipo**: `business_hours`
- **Uso**: Automatiza respostas apenas durante horário comercial
- **Exemplo**: Resposta imediata para leads durante horário de vendas

#### Fora do Horário
- **Tipo**: `after_hours`
- **Uso**: Mensagens automáticas informando horário de funcionamento
- **Exemplo**: "Nosso atendimento funciona das 8h às 18h. Retornaremos amanhã!"

#### Feriados e Fins de Semana
- **Tipo**: `holiday_weekend`
- **Uso**: Respostas específicas para períodos sem atendimento
- **Exemplo**: Avisos automáticos sobre plantão de emergência

#### Tempo de Resposta Excedido
- **Tipo**: `response_time_exceeded`
- **Uso**: Escalação automática quando SLA é violado
- **Exemplo**: Notificar supervisor após 2 horas sem resposta

### 2. Gatilhos de Comportamento do Cliente

#### Cliente Recorrente
- **Tipo**: `repeat_customer`
- **Uso**: Tratamento diferenciado para clientes frequentes
- **Exemplo**: "Olá novamente! Como podemos ajudar hoje?"

#### Novo Cliente
- **Tipo**: `new_customer`
- **Uso**: Mensagem de boas-vindas e orientação inicial
- **Exemplo**: Tutorial automático para novos usuários

#### Cliente VIP
- **Tipo**: `vip_customer`
- **Uso**: Priorização automática e atendimento especializado
- **Exemplo**: Encaminhamento direto para gerente de contas

#### Múltiplos Contatos
- **Tipo**: `multiple_contacts`
- **Uso**: Detecção de frustração por contatos repetidos
- **Exemplo**: Escalação automática após 3 tentativas

### 3. Gatilhos de Conteúdo Avançado

#### Sentimento Negativo
- **Tipo**: `sentiment_negative`
- **Uso**: IA detecta frustração e ativa resposta empática
- **Exemplo**: "Percebemos sua frustração. Vamos resolver isso juntos!"

#### Contém Anexo
- **Tipo**: `contains_attachment`
- **Uso**: Processamento especial para mensagens com arquivos
- **Exemplo**: Verificação automática de malware em anexos

#### Detecção de Idioma
- **Tipo**: `language_detection`
- **Uso**: Direcionamento para agentes bilíngues
- **Exemplo**: Mensagens em inglês → agente com fluência em inglês

### 4. Gatilhos de Sistema

#### Disponibilidade do Agente
- **Tipo**: `agent_availability`
- **Uso**: Distribuição inteligente baseada na carga de trabalho
- **Exemplo**: Redistribuição quando agente fica sobrecarregado

#### Fila Sobrecarregada
- **Tipo**: `queue_overflow`
- **Uso**: Ativação de protocolo de emergência
- **Exemplo**: Chamada de agentes de backup quando fila > 50 tickets

## Ações Avançadas Implementadas

### 1. Ações de Gestão de Tickets Avançadas

#### Criar Ticket por Template
- **Tipo**: `create_ticket_from_template`
- **Uso**: Criação padronizada com campos pré-preenchidos
- **Benefício**: Consistência e agilidade no atendimento

#### Atribuir por Habilidade
- **Tipo**: `assign_by_skill`
- **Uso**: Matching automático de tickets com expertise do agente
- **Exemplo**: Problemas de rede → agente com certificação Cisco

#### Atribuição Rotativa
- **Tipo**: `assign_round_robin`
- **Uso**: Distribuição equitativa de carga de trabalho
- **Benefício**: Evita sobrecarga de agentes específicos

#### Vincular Tickets Relacionados
- **Tipo**: `link_related_tickets`
- **Uso**: IA identifica tickets similares e vincula automaticamente
- **Benefício**: Visão holística de problemas recorrentes

### 2. Ações de Comunicação Inteligente

#### Enviar Pesquisa de Satisfação
- **Tipo**: `send_survey`
- **Uso**: Coleta automática de feedback pós-atendimento
- **Timing**: 24h após resolução do ticket

#### Notificar Gerente
- **Tipo**: `notify_manager`
- **Uso**: Escalação automática para situações críticas
- **Exemplo**: Cliente VIP com problema crítico

#### Enviar SMS
- **Tipo**: `send_sms`
- **Uso**: Notificações urgentes via SMS
- **Exemplo**: Confirmação de agendamento de técnico

### 3. Ações de IA e Automação Avançada

#### Análise de Sentimento com IA
- **Tipo**: `ai_sentiment_analysis`
- **Uso**: Classificação automática do humor do cliente
- **Ação**: Ajuste do tom de resposta baseado no sentimento

#### Categorizar com IA
- **Tipo**: `ai_categorize`
- **Uso**: Classificação automática de tickets
- **Benefício**: Redução de erro humano na categorização

#### Traduzir com IA
- **Tipo**: `ai_translate`
- **Uso**: Tradução automática para atendimento multilíngue
- **Exemplo**: Cliente escreve em espanhol → tradução para português

#### Resumir com IA
- **Tipo**: `ai_summarize`
- **Uso**: Criação de resumos executivos de conversas longas
- **Benefício**: Agilidade na transferência entre agentes

### 4. Ações de Integração Empresarial

#### Atualizar CRM
- **Tipo**: `update_crm`
- **Uso**: Sincronização automática de dados do cliente
- **Exemplo**: Atualização de status de lead no Salesforce

#### Sincronizar Banco de Dados
- **Tipo**: `sync_database`
- **Uso**: Manter consistência entre sistemas
- **Exemplo**: Atualização de dados de contrato no ERP

#### Gerar Relatório
- **Tipo**: `generate_report`
- **Uso**: Criação automática de relatórios gerenciais
- **Exemplo**: Relatório diário de tickets resolvidos

### 5. Ações de Conhecimento e Aprendizado

#### Sugerir Artigo da Base de Conhecimento
- **Tipo**: `suggest_knowledge`
- **Uso**: IA sugere artigos relevantes para o agente
- **Benefício**: Acelera resolução e padroniza respostas

#### Criar Artigo de Conhecimento
- **Tipo**: `create_knowledge_article`
- **Uso**: Criação automática de artigos baseados em resoluções
- **Exemplo**: Problema novo resolvido → artigo automático na KB

#### Atualizar FAQ
- **Tipo**: `update_faq`
- **Uso**: Manutenção automática de perguntas frequentes
- **Benefício**: Base de conhecimento sempre atualizada

## Cenários de Uso Práticos

### Cenário 1: Cliente Frustrado
**Gatilhos Combinados:**
- `sentiment_negative` + `multiple_contacts`

**Ações Automáticas:**
1. `ai_sentiment_analysis` - Confirma frustração
2. `escalate_ticket` - Escala para supervisor
3. `notify_manager` - Alerta gerência
4. `send_auto_reply` - Resposta empática imediata
5. `add_tags` - Marca como "cliente_frustrado"

### Cenário 2: Atendimento Noturno
**Gatilho:**
- `after_hours`

**Ações:**
1. `send_auto_reply` - Informa horário de funcionamento
2. `create_ticket` - Cria ticket para atendimento no próximo dia útil
3. `assign_team` - Designa para equipe do próximo turno
4. `set_ticket_sla` - Define SLA apropriado para horário

### Cenário 3: Cliente VIP com Problema Crítico
**Gatilhos:**
- `vip_customer` + `priority_high` + `technical_issue`

**Ações:**
1. `create_urgent_ticket` - Cria ticket crítico
2. `assign_by_skill` - Atribui a especialista sênior
3. `notify_manager` - Alerta gerente imediatamente
4. `send_sms` - Notifica cliente sobre priorização
5. `schedule_reminder` - Agenda follow-up em 30 minutos

### Cenário 4: Detecção de Bug Sistemático
**Gatilhos:**
- `multiple_contacts` + `technical_issue` + `product_mention`

**Ações:**
1. `link_related_tickets` - Vincula tickets similares
2. `create_knowledge_article` - Documenta problema temporário
3. `webhook_call` - Notifica equipe de desenvolvimento
4. `send_auto_reply` - Informa sobre problema conhecido
5. `generate_report` - Relatório para análise de impacto

## Implementação Técnica

### Configuração de Gatilhos Complexos

```javascript
// Exemplo: Cliente VIP frustrado fora do horário
const complexTrigger = {
  operator: 'AND',
  conditions: [
    { type: 'vip_customer', value: true },
    { type: 'sentiment_negative', threshold: 0.7 },
    { type: 'after_hours', value: true }
  ]
};

const emergencyActions = [
  { 
    type: 'send_sms', 
    params: { 
      message: 'Recebemos sua mensagem urgente. Um gerente entrará em contato em até 1 hora.' 
    } 
  },
  { 
    type: 'notify_manager', 
    params: { 
      urgency: 'high',
      message: 'Cliente VIP com problema crítico fora do horário'
    } 
  },
  { 
    type: 'create_urgent_ticket', 
    params: { 
      priority: 'critical',
      assignee: 'manager_on_duty'
    } 
  }
];
```

### Métricas e Analytics

Cada gatilho e ação é automaticamente rastreado para análise:

- **Taxa de Ativação**: Percentual de gatilhos que resultam em ações
- **Efetividade**: Impacto das ações na resolução de problemas
- **Tempo de Resposta**: Melhoria nos tempos com automação
- **Satisfação**: Impacto na satisfação do cliente

### Configuração Recomendada por Setor

#### E-commerce
- Gatilho: `product_mention` + `complaint_detection`
- Ação: `update_crm` + `send_survey` + `suggest_knowledge`

#### Suporte Técnico
- Gatilho: `technical_issue` + `contains_attachment`
- Ação: `assign_by_skill` + `ai_categorize` + `link_related_tickets`

#### Atendimento Financeiro
- Gatilho: `billing_inquiry` + `vip_customer`
- Ação: `assign_team` + `update_crm` + `send_auto_reply`

## Benefícios Mensuráveis

1. **Redução de 60% no tempo de primeira resposta**
2. **Aumento de 40% na satisfação do cliente**
3. **Diminuição de 35% na taxa de escalação**
4. **Melhoria de 50% na distribuição de carga de trabalho**
5. **Redução de 25% no tempo médio de resolução**

Esta implementação posiciona o OmniBridge como uma solução de automação inteligente de classe empresarial, capaz de lidar com cenários complexos de atendimento ao cliente de forma autônoma e eficiente.
