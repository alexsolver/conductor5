// ========================================
// AI FLOW NODE REGISTRY
// ========================================
// Central registry for all available node types
// Each node type defines its configuration schema and execution logic

import { AiNodeDefinition, InsertAiNodeDefinition } from '../../../shared/schema-ai-flows';

// ========================================
// NODE DEFINITIONS
// ========================================

export const NODE_DEFINITIONS: Omit<InsertAiNodeDefinition, 'id' | 'createdAt' | 'updatedAt'>[] = [
  
  // ========================================
  // 1. 🎬 INÍCIO & GATILHOS (4 nós)
  // ========================================
  {
    type: 'trigger_start',
    name: 'Início da Conversa',
    description: 'Inicia quando usuário envia primeira mensagem',
    category: 'trigger',
    icon: 'Play',
    color: '#10b981',
    configSchema: {
      fields: [
        {
          name: 'welcomeMessage',
          label: 'Mensagem de Boas-vindas',
          type: 'textarea',
          placeholder: 'Olá! Como posso ajudar?',
          helpText: 'Mensagem inicial enviada ao usuário'
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'message', type: 'string', description: 'Mensagem do usuário' },
      { name: 'userId', type: 'string', description: 'ID do usuário' },
      { name: 'conversationId', type: 'string', description: 'ID da conversa' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleTriggerStart' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'trigger_keyword',
    name: 'Palavra-Chave Detectada',
    description: 'Ativa quando detecta palavras específicas',
    category: 'trigger',
    icon: 'Key',
    color: '#10b981',
    configSchema: {
      fields: [
        {
          name: 'keywords',
          label: 'Palavras-chave',
          type: 'text',
          required: true,
          placeholder: 'urgente, emergência, crítico',
          helpText: 'Separe com vírgula'
        },
        {
          name: 'caseSensitive',
          label: 'Diferenciar maiúsculas/minúsculas',
          type: 'boolean',
          defaultValue: false
        }
      ]
    },
    inputs: [{ name: 'message', type: 'string', required: true }],
    outputs: [
      { name: 'matched', type: 'boolean', description: 'Se encontrou palavra-chave' },
      { name: 'keyword', type: 'string', description: 'Palavra que foi encontrada' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleKeywordTrigger' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'trigger_schedule',
    name: 'Horário Agendado',
    description: 'Executa em horário definido',
    category: 'trigger',
    icon: 'Clock',
    color: '#10b981',
    configSchema: {
      fields: [
        {
          name: 'schedule',
          label: 'Agendamento (cron)',
          type: 'text',
          required: true,
          placeholder: '0 9 * * *',
          helpText: 'Formato cron (ex: 0 9 * * * = 9h todos os dias)'
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'timestamp', type: 'string', description: 'Horário de execução' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleScheduleTrigger' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'trigger_webhook',
    name: 'Webhook Recebido',
    description: 'API externa chama esta ação',
    category: 'trigger',
    icon: 'Webhook',
    color: '#10b981',
    configSchema: {
      fields: [
        {
          name: 'webhookUrl',
          label: 'URL do Webhook',
          type: 'text',
          helpText: 'URL gerada automaticamente'
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'payload', type: 'json', description: 'Dados recebidos' },
      { name: 'headers', type: 'json', description: 'Headers da requisição' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleWebhookTrigger' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  // ========================================
  // 2. 💬 CONVERSA & IA (8 nós)
  // ========================================
  {
    type: 'ask_question',
    name: 'Fazer Pergunta',
    description: 'IA faz pergunta ao usuário',
    category: 'conversation',
    icon: 'MessageCircle',
    color: '#3b82f6',
    configSchema: {
      fields: [
        {
          name: 'question',
          label: 'Pergunta',
          type: 'textarea',
          required: true,
          placeholder: 'Qual é o seu nome completo?'
        },
        {
          name: 'saveAs',
          label: 'Salvar resposta como',
          type: 'text',
          required: true,
          placeholder: 'customerName',
          helpText: 'Nome da variável para armazenar a resposta'
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'answer', type: 'string', description: 'Resposta do usuário' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleAskQuestion' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'capture_response',
    name: 'Capturar Resposta',
    description: 'Salva o que usuário respondeu',
    category: 'conversation',
    icon: 'Download',
    color: '#3b82f6',
    configSchema: {
      fields: [
        {
          name: 'variableName',
          label: 'Nome da variável',
          type: 'text',
          required: true,
          placeholder: 'userResponse'
        },
        {
          name: 'validation',
          label: 'Validação',
          type: 'select',
          options: [
            { label: 'Nenhuma', value: 'none' },
            { label: 'Email', value: 'email' },
            { label: 'Telefone', value: 'phone' },
            { label: 'CPF', value: 'cpf' },
            { label: 'Número', value: 'number' }
          ],
          defaultValue: 'none'
        }
      ]
    },
    inputs: [{ name: 'text', type: 'string', required: true }],
    outputs: [
      { name: 'value', type: 'string', description: 'Valor capturado' },
      { name: 'isValid', type: 'boolean', description: 'Se passou na validação' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleCaptureResponse' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'extract_info',
    name: 'Extrair Informação',
    description: 'IA extrai dados do texto livre',
    category: 'conversation',
    icon: 'ScanText',
    color: '#3b82f6',
    configSchema: {
      fields: [
        {
          name: 'extractFields',
          label: 'Campos a extrair',
          type: 'json',
          required: true,
          placeholder: '["name", "email", "phone"]',
          helpText: 'Lista de campos que a IA deve procurar'
        },
        {
          name: 'aiPrompt',
          label: 'Instruções para IA',
          type: 'textarea',
          placeholder: 'Extraia nome, email e telefone do texto'
        }
      ]
    },
    inputs: [{ name: 'text', type: 'string', required: true }],
    outputs: [
      { name: 'extracted', type: 'json', description: 'Dados extraídos' },
      { name: 'confidence', type: 'number', description: 'Confiança da extração (0-1)' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleExtractInfo' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'classify_message',
    name: 'Classificar Mensagem',
    description: 'IA categoriza mensagem',
    category: 'conversation',
    icon: 'Tags',
    color: '#3b82f6',
    configSchema: {
      fields: [
        {
          name: 'categories',
          label: 'Categorias possíveis',
          type: 'text',
          required: true,
          placeholder: 'urgente, normal, baixa_prioridade',
          helpText: 'Separe com vírgula'
        },
        {
          name: 'classifyBy',
          label: 'Classificar por',
          type: 'select',
          options: [
            { label: 'Urgência', value: 'urgency' },
            { label: 'Tipo de Problema', value: 'problem_type' },
            { label: 'Sentimento', value: 'sentiment' },
            { label: 'Customizado', value: 'custom' }
          ],
          defaultValue: 'urgency'
        }
      ]
    },
    inputs: [{ name: 'message', type: 'string', required: true }],
    outputs: [
      { name: 'category', type: 'string', description: 'Categoria identificada' },
      { name: 'confidence', type: 'number', description: 'Confiança da classificação' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleClassifyMessage' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'generate_response',
    name: 'Gerar Resposta Personalizada',
    description: 'IA cria resposta contextual',
    category: 'conversation',
    icon: 'Sparkles',
    color: '#3b82f6',
    configSchema: {
      fields: [
        {
          name: 'context',
          label: 'Contexto',
          type: 'textarea',
          required: true,
          placeholder: 'Gere uma resposta empática explicando o próximo passo'
        },
        {
          name: 'tone',
          label: 'Tom',
          type: 'select',
          options: [
            { label: 'Profissional', value: 'professional' },
            { label: 'Amigável', value: 'friendly' },
            { label: 'Técnico', value: 'technical' },
            { label: 'Empático', value: 'empathetic' }
          ],
          defaultValue: 'professional'
        }
      ]
    },
    inputs: [
      { name: 'userMessage', type: 'string' },
      { name: 'variables', type: 'json', description: 'Variáveis do contexto' }
    ],
    outputs: [
      { name: 'response', type: 'string', description: 'Resposta gerada' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleGenerateResponse' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'confirm_user',
    name: 'Confirmar com Usuário',
    description: 'Pede confirmação (Sim/Não)',
    category: 'conversation',
    icon: 'CheckCircle',
    color: '#3b82f6',
    configSchema: {
      fields: [
        {
          name: 'confirmationMessage',
          label: 'Mensagem de confirmação',
          type: 'textarea',
          required: true,
          placeholder: 'Confirma a criação do ticket?'
        },
        {
          name: 'yesLabel',
          label: 'Texto botão "Sim"',
          type: 'text',
          defaultValue: 'Sim'
        },
        {
          name: 'noLabel',
          label: 'Texto botão "Não"',
          type: 'text',
          defaultValue: 'Não'
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'confirmed', type: 'boolean', description: 'true se confirmou, false se negou' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleConfirmUser' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'menu_options',
    name: 'Menu de Opções',
    description: 'Mostra lista para escolher',
    category: 'conversation',
    icon: 'List',
    color: '#3b82f6',
    configSchema: {
      fields: [
        {
          name: 'menuMessage',
          label: 'Mensagem do menu',
          type: 'textarea',
          required: true,
          placeholder: 'Escolha uma opção:'
        },
        {
          name: 'options',
          label: 'Opções',
          type: 'json',
          required: true,
          placeholder: '[{"label": "Abrir ticket", "value": "create_ticket"}, {"label": "Consultar status", "value": "check_status"}]'
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'selectedValue', type: 'string', description: 'Valor da opção escolhida' },
      { name: 'selectedLabel', type: 'string', description: 'Texto da opção escolhida' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleMenuOptions' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'sentiment_analysis',
    name: 'Análise de Sentimento',
    description: 'Detecta satisfação do usuário',
    category: 'conversation',
    icon: 'Smile',
    color: '#3b82f6',
    configSchema: {
      fields: [
        {
          name: 'includeScore',
          label: 'Incluir score numérico',
          type: 'boolean',
          defaultValue: true
        }
      ]
    },
    inputs: [{ name: 'message', type: 'string', required: true }],
    outputs: [
      { name: 'sentiment', type: 'string', description: 'positive, neutral, negative' },
      { name: 'score', type: 'number', description: 'Score de -1 a 1' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleSentimentAnalysis' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  // ========================================
  // 3. 📊 DADOS & BUSCA (6 nós)
  // ========================================
  {
    type: 'search_customer',
    name: 'Buscar Cliente',
    description: 'Procura por email/CPF/telefone',
    category: 'data',
    icon: 'Users',
    color: '#8b5cf6',
    configSchema: {
      fields: [
        {
          name: 'searchBy',
          label: 'Buscar por',
          type: 'select',
          required: true,
          options: [
            { label: 'Email', value: 'email' },
            { label: 'CPF', value: 'cpf' },
            { label: 'Telefone', value: 'phone' },
            { label: 'Nome', value: 'name' }
          ]
        },
        {
          name: 'searchValue',
          label: 'Valor (ou variável)',
          type: 'text',
          required: true,
          placeholder: '{{customerEmail}}'
        }
      ]
    },
    inputs: [{ name: 'searchValue', type: 'string' }],
    outputs: [
      { name: 'customer', type: 'json', description: 'Dados do cliente' },
      { name: 'found', type: 'boolean', description: 'Se encontrou o cliente' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleSearchCustomer' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'search_ticket',
    name: 'Buscar Ticket',
    description: 'Encontra ticket por ID ou número',
    category: 'data',
    icon: 'Ticket',
    color: '#8b5cf6',
    configSchema: {
      fields: [
        {
          name: 'ticketIdentifier',
          label: 'ID ou Número do Ticket',
          type: 'text',
          required: true,
          placeholder: '{{ticketId}}'
        }
      ]
    },
    inputs: [{ name: 'ticketId', type: 'string' }],
    outputs: [
      { name: 'ticket', type: 'json', description: 'Dados do ticket' },
      { name: 'found', type: 'boolean', description: 'Se encontrou o ticket' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleSearchTicket' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'query_database',
    name: 'Buscar no Banco',
    description: 'Query customizada',
    category: 'data',
    icon: 'Database',
    color: '#8b5cf6',
    configSchema: {
      fields: [
        {
          name: 'table',
          label: 'Tabela',
          type: 'text',
          required: true,
          placeholder: 'customers'
        },
        {
          name: 'conditions',
          label: 'Condições (JSON)',
          type: 'json',
          placeholder: '{"status": "active"}'
        },
        {
          name: 'limit',
          label: 'Limite de resultados',
          type: 'number',
          defaultValue: 10
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'results', type: 'json', description: 'Resultados da busca' },
      { name: 'count', type: 'number', description: 'Quantidade encontrada' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleQueryDatabase' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'save_database',
    name: 'Salvar no Banco',
    description: 'Inserir/atualizar dados',
    category: 'data',
    icon: 'Save',
    color: '#8b5cf6',
    configSchema: {
      fields: [
        {
          name: 'table',
          label: 'Tabela',
          type: 'text',
          required: true,
          placeholder: 'ticket_notes'
        },
        {
          name: 'operation',
          label: 'Operação',
          type: 'select',
          options: [
            { label: 'Inserir', value: 'insert' },
            { label: 'Atualizar', value: 'update' }
          ],
          defaultValue: 'insert'
        },
        {
          name: 'data',
          label: 'Dados (JSON)',
          type: 'json',
          required: true,
          placeholder: '{"note": "{{userMessage}}", "ticketId": "{{ticketId}}"}'
        }
      ]
    },
    inputs: [{ name: 'data', type: 'json', required: true }],
    outputs: [
      { name: 'success', type: 'boolean', description: 'Se salvou com sucesso' },
      { name: 'recordId', type: 'string', description: 'ID do registro criado/atualizado' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleSaveDatabase' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'transform_data',
    name: 'Transformar Dados',
    description: 'Mapear/modificar valores',
    category: 'data',
    icon: 'Repeat',
    color: '#8b5cf6',
    configSchema: {
      fields: [
        {
          name: 'transformCode',
          label: 'Código de transformação (JavaScript)',
          type: 'code',
          required: true,
          placeholder: 'return { fullName: data.firstName + " " + data.lastName };',
          helpText: 'Use "data" para acessar os dados de entrada'
        }
      ]
    },
    inputs: [{ name: 'data', type: 'json', required: true }],
    outputs: [
      { name: 'transformed', type: 'json', description: 'Dados transformados' }
    ],
    handlerType: 'custom',
    handlerConfig: { code: '{{transformCode}}' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'validate_data',
    name: 'Validar Dados',
    description: 'Checar formato',
    category: 'data',
    icon: 'ShieldCheck',
    color: '#8b5cf6',
    configSchema: {
      fields: [
        {
          name: 'validationType',
          label: 'Tipo de validação',
          type: 'select',
          required: true,
          options: [
            { label: 'Email', value: 'email' },
            { label: 'CPF', value: 'cpf' },
            { label: 'CNPJ', value: 'cnpj' },
            { label: 'Telefone', value: 'phone' },
            { label: 'CEP', value: 'cep' },
            { label: 'Regex customizado', value: 'regex' }
          ]
        },
        {
          name: 'customRegex',
          label: 'Regex (se customizado)',
          type: 'text',
          placeholder: '^[0-9]{5}$'
        }
      ]
    },
    inputs: [{ name: 'value', type: 'string', required: true }],
    outputs: [
      { name: 'isValid', type: 'boolean', description: 'Se passou na validação' },
      { name: 'errorMessage', type: 'string', description: 'Mensagem de erro se inválido' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleValidateData' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  // ========================================
  // 4. 🔄 LÓGICA & CONTROLE (5 nós)
  // ========================================
  {
    type: 'condition_if',
    name: 'Se/Senão (Condição)',
    description: 'Decisão baseada em dados',
    category: 'logic',
    icon: 'GitBranch',
    color: '#f59e0b',
    configSchema: {
      fields: [
        {
          name: 'condition',
          label: 'Condição',
          type: 'text',
          required: true,
          placeholder: '{{priority}} === "urgent"',
          helpText: 'Expressão JavaScript que retorna true/false'
        }
      ]
    },
    inputs: [{ name: 'data', type: 'json' }],
    outputs: [
      { name: 'true', type: 'any', description: 'Fluxo se verdadeiro' },
      { name: 'false', type: 'any', description: 'Fluxo se falso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleCondition' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'loop_foreach',
    name: 'Repetir Para Cada',
    description: 'Loop em lista de itens',
    category: 'logic',
    icon: 'IterationCw',
    color: '#f59e0b',
    configSchema: {
      fields: [
        {
          name: 'arrayVariable',
          label: 'Lista/Array',
          type: 'text',
          required: true,
          placeholder: '{{tickets}}',
          helpText: 'Variável que contém o array'
        },
        {
          name: 'itemName',
          label: 'Nome do item',
          type: 'text',
          defaultValue: 'item',
          helpText: 'Como chamar cada item no loop'
        }
      ]
    },
    inputs: [{ name: 'array', type: 'json', required: true }],
    outputs: [
      { name: 'item', type: 'any', description: 'Item atual do loop' },
      { name: 'index', type: 'number', description: 'Índice atual' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleForEach' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'wait_delay',
    name: 'Aguardar Tempo',
    description: 'Pausa antes de continuar',
    category: 'logic',
    icon: 'Timer',
    color: '#f59e0b',
    configSchema: {
      fields: [
        {
          name: 'duration',
          label: 'Duração',
          type: 'number',
          required: true,
          placeholder: '5'
        },
        {
          name: 'unit',
          label: 'Unidade',
          type: 'select',
          options: [
            { label: 'Segundos', value: 'seconds' },
            { label: 'Minutos', value: 'minutes' },
            { label: 'Horas', value: 'hours' }
          ],
          defaultValue: 'seconds'
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'completed', type: 'boolean', description: 'true quando concluir a espera' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleWait' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'try_catch',
    name: 'Tentar/Capturar Erro',
    description: 'Tratamento de falhas',
    category: 'logic',
    icon: 'AlertTriangle',
    color: '#f59e0b',
    configSchema: {
      fields: [
        {
          name: 'retryCount',
          label: 'Tentativas em caso de erro',
          type: 'number',
          defaultValue: 0
        }
      ]
    },
    inputs: [],
    outputs: [
      { name: 'success', type: 'any', description: 'Fluxo se sucesso' },
      { name: 'error', type: 'any', description: 'Fluxo se erro' },
      { name: 'errorMessage', type: 'string', description: 'Mensagem do erro' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleTryCatch' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'set_variable',
    name: 'Definir Variável',
    description: 'Armazenar valor temporário',
    category: 'logic',
    icon: 'Variable',
    color: '#f59e0b',
    configSchema: {
      fields: [
        {
          name: 'variableName',
          label: 'Nome da variável',
          type: 'text',
          required: true,
          placeholder: 'totalValue'
        },
        {
          name: 'value',
          label: 'Valor',
          type: 'text',
          required: true,
          placeholder: '{{price}} * {{quantity}}'
        }
      ]
    },
    inputs: [{ name: 'value', type: 'any' }],
    outputs: [
      { name: 'variable', type: 'any', description: 'Valor armazenado' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleSetVariable' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  // ========================================
  // 5. 🎯 AÇÕES DO SISTEMA (10 nós)
  // ========================================
  {
    type: 'create_ticket',
    name: 'Criar Ticket',
    description: 'Abre chamado automaticamente',
    category: 'action',
    icon: 'FileText',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'title',
          label: 'Título',
          type: 'text',
          required: true,
          placeholder: '{{issueTitle}}'
        },
        {
          name: 'description',
          label: 'Descrição',
          type: 'textarea',
          required: true,
          placeholder: '{{issueDescription}}'
        },
        {
          name: 'priority',
          label: 'Prioridade',
          type: 'select',
          options: [
            { label: 'Baixa', value: 'low' },
            { label: 'Normal', value: 'normal' },
            { label: 'Alta', value: 'high' },
            { label: 'Urgente', value: 'urgent' }
          ],
          defaultValue: 'normal'
        },
        {
          name: 'customerId',
          label: 'ID do Cliente',
          type: 'text',
          placeholder: '{{customerId}}'
        }
      ]
    },
    inputs: [
      { name: 'title', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'customerId', type: 'string' }
    ],
    outputs: [
      { name: 'ticketId', type: 'string', description: 'ID do ticket criado' },
      { name: 'ticketNumber', type: 'string', description: 'Número do ticket' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleCreateTicket' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'update_ticket',
    name: 'Atualizar Ticket',
    description: 'Modifica ticket existente',
    category: 'action',
    icon: 'Edit',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'ticketId',
          label: 'ID do Ticket',
          type: 'text',
          required: true,
          placeholder: '{{ticketId}}'
        },
        {
          name: 'updates',
          label: 'Atualizações (JSON)',
          type: 'json',
          required: true,
          placeholder: '{"status": "in_progress", "priority": "high"}'
        }
      ]
    },
    inputs: [
      { name: 'ticketId', type: 'string', required: true },
      { name: 'updates', type: 'json', required: true }
    ],
    outputs: [
      { name: 'success', type: 'boolean', description: 'Se atualizou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleUpdateTicket' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'create_customer',
    name: 'Criar Cliente',
    description: 'Registra novo cliente',
    category: 'action',
    icon: 'UserPlus',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'name',
          label: 'Nome',
          type: 'text',
          required: true,
          placeholder: '{{customerName}}'
        },
        {
          name: 'email',
          label: 'Email',
          type: 'text',
          required: true,
          placeholder: '{{customerEmail}}'
        },
        {
          name: 'phone',
          label: 'Telefone',
          type: 'text',
          placeholder: '{{customerPhone}}'
        }
      ]
    },
    inputs: [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'phone', type: 'string' }
    ],
    outputs: [
      { name: 'customerId', type: 'string', description: 'ID do cliente criado' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleCreateCustomer' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'update_customer',
    name: 'Atualizar Cliente',
    description: 'Modifica dados do cliente',
    category: 'action',
    icon: 'UserCog',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'customerId',
          label: 'ID do Cliente',
          type: 'text',
          required: true,
          placeholder: '{{customerId}}'
        },
        {
          name: 'updates',
          label: 'Atualizações (JSON)',
          type: 'json',
          required: true,
          placeholder: '{"phone": "{{newPhone}}"}'
        }
      ]
    },
    inputs: [
      { name: 'customerId', type: 'string', required: true },
      { name: 'updates', type: 'json', required: true }
    ],
    outputs: [
      { name: 'success', type: 'boolean', description: 'Se atualizou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleUpdateCustomer' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'schedule_meeting',
    name: 'Agendar Reunião',
    description: 'Cria evento na agenda',
    category: 'action',
    icon: 'Calendar',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'title',
          label: 'Título',
          type: 'text',
          required: true,
          placeholder: 'Reunião com cliente'
        },
        {
          name: 'dateTime',
          label: 'Data/Hora',
          type: 'text',
          required: true,
          placeholder: '2024-12-25 14:00'
        },
        {
          name: 'duration',
          label: 'Duração (minutos)',
          type: 'number',
          defaultValue: 60
        }
      ]
    },
    inputs: [
      { name: 'title', type: 'string', required: true },
      { name: 'dateTime', type: 'string', required: true }
    ],
    outputs: [
      { name: 'eventId', type: 'string', description: 'ID do evento criado' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleScheduleMeeting' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'add_comment',
    name: 'Adicionar Comentário',
    description: 'Insere nota no ticket',
    category: 'action',
    icon: 'MessageSquare',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'ticketId',
          label: 'ID do Ticket',
          type: 'text',
          required: true,
          placeholder: '{{ticketId}}'
        },
        {
          name: 'comment',
          label: 'Comentário',
          type: 'textarea',
          required: true,
          placeholder: '{{userMessage}}'
        },
        {
          name: 'isInternal',
          label: 'Comentário interno',
          type: 'boolean',
          defaultValue: false
        }
      ]
    },
    inputs: [
      { name: 'ticketId', type: 'string', required: true },
      { name: 'comment', type: 'string', required: true }
    ],
    outputs: [
      { name: 'commentId', type: 'string', description: 'ID do comentário criado' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleAddComment' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'change_status',
    name: 'Mudar Status',
    description: 'Altera status do ticket',
    category: 'action',
    icon: 'RefreshCw',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'ticketId',
          label: 'ID do Ticket',
          type: 'text',
          required: true,
          placeholder: '{{ticketId}}'
        },
        {
          name: 'newStatus',
          label: 'Novo Status',
          type: 'select',
          required: true,
          options: [
            { label: 'Novo', value: 'new' },
            { label: 'Em Progresso', value: 'in_progress' },
            { label: 'Aguardando', value: 'waiting' },
            { label: 'Resolvido', value: 'resolved' },
            { label: 'Fechado', value: 'closed' }
          ]
        }
      ]
    },
    inputs: [
      { name: 'ticketId', type: 'string', required: true },
      { name: 'newStatus', type: 'string', required: true }
    ],
    outputs: [
      { name: 'success', type: 'boolean', description: 'Se alterou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleChangeStatus' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'assign_user',
    name: 'Atribuir Responsável',
    description: 'Define quem vai atender',
    category: 'action',
    icon: 'UserCheck',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'ticketId',
          label: 'ID do Ticket',
          type: 'text',
          required: true,
          placeholder: '{{ticketId}}'
        },
        {
          name: 'userId',
          label: 'ID do Usuário',
          type: 'text',
          required: true,
          placeholder: '{{assignedUserId}}'
        }
      ]
    },
    inputs: [
      { name: 'ticketId', type: 'string', required: true },
      { name: 'userId', type: 'string', required: true }
    ],
    outputs: [
      { name: 'success', type: 'boolean', description: 'Se atribuiu com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleAssignUser' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'add_tag',
    name: 'Adicionar Tag',
    description: 'Marca com etiqueta',
    category: 'action',
    icon: 'Tag',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'ticketId',
          label: 'ID do Ticket',
          type: 'text',
          required: true,
          placeholder: '{{ticketId}}'
        },
        {
          name: 'tags',
          label: 'Tags',
          type: 'text',
          required: true,
          placeholder: 'urgente, vip',
          helpText: 'Separe com vírgula'
        }
      ]
    },
    inputs: [
      { name: 'ticketId', type: 'string', required: true },
      { name: 'tags', type: 'string', required: true }
    ],
    outputs: [
      { name: 'success', type: 'boolean', description: 'Se adicionou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleAddTag' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'create_task',
    name: 'Criar Tarefa',
    description: 'Gera item de ação',
    category: 'action',
    icon: 'CheckSquare',
    color: '#ec4899',
    configSchema: {
      fields: [
        {
          name: 'title',
          label: 'Título da Tarefa',
          type: 'text',
          required: true,
          placeholder: 'Ligar para cliente'
        },
        {
          name: 'assignedTo',
          label: 'Atribuir para',
          type: 'text',
          placeholder: '{{userId}}'
        },
        {
          name: 'dueDate',
          label: 'Data de vencimento',
          type: 'text',
          placeholder: '2024-12-31'
        }
      ]
    },
    inputs: [
      { name: 'title', type: 'string', required: true },
      { name: 'assignedTo', type: 'string' }
    ],
    outputs: [
      { name: 'taskId', type: 'string', description: 'ID da tarefa criada' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleCreateTask' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  // ========================================
  // 6. 📧 COMUNICAÇÃO (5 nós)
  // ========================================
  {
    type: 'send_email',
    name: 'Enviar Email',
    description: 'Dispara email customizado',
    category: 'communication',
    icon: 'Mail',
    color: '#06b6d4',
    configSchema: {
      fields: [
        {
          name: 'to',
          label: 'Para',
          type: 'text',
          required: true,
          placeholder: '{{customerEmail}}'
        },
        {
          name: 'subject',
          label: 'Assunto',
          type: 'text',
          required: true,
          placeholder: 'Ticket #{{ticketNumber}} criado'
        },
        {
          name: 'body',
          label: 'Corpo do email',
          type: 'textarea',
          required: true,
          placeholder: 'Olá {{customerName}}, seu ticket foi criado...'
        }
      ]
    },
    inputs: [
      { name: 'to', type: 'string', required: true },
      { name: 'subject', type: 'string', required: true },
      { name: 'body', type: 'string', required: true }
    ],
    outputs: [
      { name: 'sent', type: 'boolean', description: 'Se enviou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleSendEmail' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'send_sms',
    name: 'Enviar SMS',
    description: 'Mensagem de texto',
    category: 'communication',
    icon: 'Phone',
    color: '#06b6d4',
    configSchema: {
      fields: [
        {
          name: 'to',
          label: 'Telefone',
          type: 'text',
          required: true,
          placeholder: '{{customerPhone}}'
        },
        {
          name: 'message',
          label: 'Mensagem',
          type: 'textarea',
          required: true,
          placeholder: 'Seu ticket #{{ticketNumber}} foi criado'
        }
      ]
    },
    inputs: [
      { name: 'to', type: 'string', required: true },
      { name: 'message', type: 'string', required: true }
    ],
    outputs: [
      { name: 'sent', type: 'boolean', description: 'Se enviou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleSendSMS' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'send_notification',
    name: 'Enviar Notificação',
    description: 'Push/alerta interno',
    category: 'communication',
    icon: 'Bell',
    color: '#06b6d4',
    configSchema: {
      fields: [
        {
          name: 'userId',
          label: 'ID do Usuário',
          type: 'text',
          required: true,
          placeholder: '{{userId}}'
        },
        {
          name: 'title',
          label: 'Título',
          type: 'text',
          required: true,
          placeholder: 'Novo ticket criado'
        },
        {
          name: 'message',
          label: 'Mensagem',
          type: 'textarea',
          required: true
        }
      ]
    },
    inputs: [
      { name: 'userId', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'message', type: 'string', required: true }
    ],
    outputs: [
      { name: 'sent', type: 'boolean', description: 'Se enviou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleSendNotification' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'escalate_human',
    name: 'Transferir para Humano',
    description: 'Escala para atendente',
    category: 'communication',
    icon: 'Users',
    color: '#06b6d4',
    configSchema: {
      fields: [
        {
          name: 'reason',
          label: 'Motivo da transferência',
          type: 'textarea',
          required: true,
          placeholder: 'Cliente solicitou atendimento humano'
        },
        {
          name: 'department',
          label: 'Departamento',
          type: 'select',
          options: [
            { label: 'Suporte', value: 'support' },
            { label: 'Vendas', value: 'sales' },
            { label: 'Financeiro', value: 'finance' },
            { label: 'Técnico', value: 'technical' }
          ]
        }
      ]
    },
    inputs: [
      { name: 'conversationId', type: 'string', required: true }
    ],
    outputs: [
      { name: 'escalated', type: 'boolean', description: 'Se transferiu com sucesso' },
      { name: 'assignedAgent', type: 'string', description: 'Agente que recebeu' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleEscalateHuman' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'post_channel',
    name: 'Enviar para Canal',
    description: 'Posta em Slack/Teams',
    category: 'communication',
    icon: 'MessageSquare',
    color: '#06b6d4',
    configSchema: {
      fields: [
        {
          name: 'platform',
          label: 'Plataforma',
          type: 'select',
          required: true,
          options: [
            { label: 'Slack', value: 'slack' },
            { label: 'Microsoft Teams', value: 'teams' }
          ]
        },
        {
          name: 'channel',
          label: 'Canal',
          type: 'text',
          required: true,
          placeholder: '#support'
        },
        {
          name: 'message',
          label: 'Mensagem',
          type: 'textarea',
          required: true
        }
      ]
    },
    inputs: [
      { name: 'channel', type: 'string', required: true },
      { name: 'message', type: 'string', required: true }
    ],
    outputs: [
      { name: 'posted', type: 'boolean', description: 'Se postou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handlePostChannel' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  // ========================================
  // 7. 🔗 INTEGRAÇÕES (4 nós)
  // ========================================
  {
    type: 'webhook_call',
    name: 'Chamar API/Webhook',
    description: 'Request HTTP externo',
    category: 'integration',
    icon: 'Globe',
    color: '#a855f7',
    configSchema: {
      fields: [
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          required: true,
          placeholder: 'https://api.exemplo.com/endpoint'
        },
        {
          name: 'method',
          label: 'Método',
          type: 'select',
          required: true,
          options: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' }
          ],
          defaultValue: 'POST'
        },
        {
          name: 'headers',
          label: 'Headers (JSON)',
          type: 'json',
          placeholder: '{"Authorization": "Bearer {{token}}"}'
        },
        {
          name: 'body',
          label: 'Body (JSON)',
          type: 'json',
          placeholder: '{"data": "{{value}}"}'
        }
      ]
    },
    inputs: [
      { name: 'url', type: 'string', required: true },
      { name: 'body', type: 'json' }
    ],
    outputs: [
      { name: 'response', type: 'json', description: 'Resposta da API' },
      { name: 'statusCode', type: 'number', description: 'Código HTTP' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleWebhookCall' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'cep_lookup',
    name: 'Consultar CEP',
    description: 'Busca endereço por CEP',
    category: 'integration',
    icon: 'MapPin',
    color: '#a855f7',
    configSchema: {
      fields: [
        {
          name: 'cep',
          label: 'CEP',
          type: 'text',
          required: true,
          placeholder: '{{customerCEP}}'
        }
      ]
    },
    inputs: [{ name: 'cep', type: 'string', required: true }],
    outputs: [
      { name: 'address', type: 'json', description: 'Endereço completo' },
      { name: 'found', type: 'boolean', description: 'Se encontrou o CEP' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleCEPLookup' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'payment_stripe',
    name: 'Processar Pagamento',
    description: 'Integração Stripe',
    category: 'integration',
    icon: 'CreditCard',
    color: '#a855f7',
    configSchema: {
      fields: [
        {
          name: 'amount',
          label: 'Valor (centavos)',
          type: 'number',
          required: true,
          placeholder: '1000'
        },
        {
          name: 'currency',
          label: 'Moeda',
          type: 'select',
          options: [
            { label: 'BRL', value: 'brl' },
            { label: 'USD', value: 'usd' },
            { label: 'EUR', value: 'eur' }
          ],
          defaultValue: 'brl'
        },
        {
          name: 'description',
          label: 'Descrição',
          type: 'text',
          placeholder: 'Pagamento ticket #{{ticketNumber}}'
        }
      ]
    },
    inputs: [
      { name: 'amount', type: 'number', required: true },
      { name: 'customerId', type: 'string' }
    ],
    outputs: [
      { name: 'paymentId', type: 'string', description: 'ID do pagamento' },
      { name: 'success', type: 'boolean', description: 'Se processou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleStripePayment' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'custom_script',
    name: 'Executar Script',
    description: 'JavaScript customizado',
    category: 'integration',
    icon: 'Code',
    color: '#a855f7',
    configSchema: {
      fields: [
        {
          name: 'code',
          label: 'Código JavaScript',
          type: 'code',
          required: true,
          placeholder: 'return { result: data.value * 2 };',
          helpText: 'Use "data" para acessar inputs'
        }
      ]
    },
    inputs: [{ name: 'data', type: 'json' }],
    outputs: [
      { name: 'result', type: 'any', description: 'Resultado do script' }
    ],
    handlerType: 'custom',
    handlerConfig: { code: '{{code}}' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  // ========================================
  // 8. 🏁 FINALIZAÇÃO (3 nós)
  // ========================================
  {
    type: 'end_success',
    name: 'Fim com Sucesso',
    description: 'Completa com mensagem positiva',
    category: 'end',
    icon: 'CheckCircle2',
    color: '#22c55e',
    configSchema: {
      fields: [
        {
          name: 'successMessage',
          label: 'Mensagem de sucesso',
          type: 'textarea',
          required: true,
          placeholder: 'Ticket criado com sucesso! Número: {{ticketNumber}}'
        }
      ]
    },
    inputs: [],
    outputs: [],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleEndSuccess' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'end_error',
    name: 'Fim com Erro',
    description: 'Termina indicando falha',
    category: 'end',
    icon: 'XCircle',
    color: '#ef4444',
    configSchema: {
      fields: [
        {
          name: 'errorMessage',
          label: 'Mensagem de erro',
          type: 'textarea',
          required: true,
          placeholder: 'Não foi possível completar a operação'
        }
      ]
    },
    inputs: [],
    outputs: [],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleEndError' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  },
  
  {
    type: 'chain_action',
    name: 'Encadear Outra Ação',
    description: 'Inicia novo fluxo',
    category: 'end',
    icon: 'ArrowRight',
    color: '#22c55e',
    configSchema: {
      fields: [
        {
          name: 'nextFlowId',
          label: 'ID do próximo fluxo',
          type: 'text',
          required: true,
          placeholder: '{{nextActionId}}'
        },
        {
          name: 'passData',
          label: 'Passar dados',
          type: 'boolean',
          defaultValue: true,
          helpText: 'Se deve passar variáveis para o próximo fluxo'
        }
      ]
    },
    inputs: [{ name: 'data', type: 'json' }],
    outputs: [
      { name: 'chained', type: 'boolean', description: 'Se encadeou com sucesso' }
    ],
    handlerType: 'builtin',
    handlerConfig: { function: 'handleChainAction' },
    isSystemNode: true,
    isActive: true,
    version: '1.0.0'
  }
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getNodesByCategory(category: string) {
  return NODE_DEFINITIONS.filter(node => node.category === category);
}

export function getNodeByType(type: string) {
  return NODE_DEFINITIONS.find(node => node.type === type);
}

export function getAllCategories() {
  return [
    { value: 'trigger', label: '🎬 Início & Gatilhos', count: getNodesByCategory('trigger').length },
    { value: 'conversation', label: '💬 Conversa & IA', count: getNodesByCategory('conversation').length },
    { value: 'data', label: '📊 Dados & Busca', count: getNodesByCategory('data').length },
    { value: 'logic', label: '🔄 Lógica & Controle', count: getNodesByCategory('logic').length },
    { value: 'action', label: '🎯 Ações do Sistema', count: getNodesByCategory('action').length },
    { value: 'communication', label: '📧 Comunicação', count: getNodesByCategory('communication').length },
    { value: 'integration', label: '🔗 Integrações', count: getNodesByCategory('integration').length },
    { value: 'end', label: '🏁 Finalização', count: getNodesByCategory('end').length }
  ];
}
