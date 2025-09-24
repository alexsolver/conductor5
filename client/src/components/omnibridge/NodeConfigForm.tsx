import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Field types for different input controls
export type FieldType = 
  | 'text' | 'textarea' | 'number' | 'email' | 'url' | 'password'
  | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'switch'
  | 'date' | 'time' | 'datetime' | 'color' | 'file'
  | 'json' | 'code' | 'regex' | 'cron' | 'duration'
  | 'key-value' | 'array' | 'object';

// Configuration field definition
export interface ConfigField {
  key: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string; description?: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  dependencies?: Array<{
    field: string;
    value: any;
    condition: 'equals' | 'not_equals' | 'includes' | 'not_includes';
  }>;
  group?: string;
  advanced?: boolean;
}

// Configuration schema for each node type
export const NODE_CONFIG_SCHEMAS: Record<string, ConfigField[]> = {
  // ===== TRIGGERS =====
  'trigger-keyword': [
    {
      key: 'keywords',
      label: 'Palavras-chave',
      type: 'textarea',
      description: 'Digite uma palavra-chave por linha',
      placeholder: 'ajuda\nsuporte\nassistência',
      required: true
    },
    {
      key: 'caseSensitive',
      label: 'Diferencia maiúsculas/minúsculas',
      type: 'switch',
      defaultValue: false
    },
    {
      key: 'matchType',
      label: 'Tipo de correspondência',
      type: 'select',
      options: [
        { value: 'exact', label: 'Exata' },
        { value: 'contains', label: 'Contém' },
        { value: 'starts_with', label: 'Inicia com' },
        { value: 'ends_with', label: 'Termina com' }
      ],
      defaultValue: 'contains'
    }
  ],

  'trigger-intent': [
    {
      key: 'intentName',
      label: 'Nome da intenção',
      type: 'text',
      required: true,
      placeholder: 'greeting, help_request, complaint'
    },
    {
      key: 'confidence',
      label: 'Confiança mínima',
      type: 'number',
      validation: { min: 0, max: 1 },
      defaultValue: 0.7,
      description: 'Valor entre 0 e 1'
    },
    {
      key: 'aiModel',
      label: 'Modelo de IA',
      type: 'select',
      options: [
        { value: 'openai', label: 'OpenAI GPT' },
        { value: 'claude', label: 'Anthropic Claude' },
        { value: 'local', label: 'Modelo local' }
      ],
      defaultValue: 'openai'
    }
  ],

  'trigger-time': [
    {
      key: 'schedule',
      label: 'Agendamento',
      type: 'cron',
      description: 'Expressão cron para agendamento',
      placeholder: '0 9 * * 1-5',
      required: true
    },
    {
      key: 'timezone',
      label: 'Fuso horário',
      type: 'select',
      options: [
        { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
        { value: 'America/New_York', label: 'Nova York (UTC-5)' },
        { value: 'Europe/London', label: 'Londres (UTC+0)' },
        { value: 'UTC', label: 'UTC' }
      ],
      defaultValue: 'America/Sao_Paulo'
    }
  ],

  'trigger-event': [
    {
      key: 'eventType',
      label: 'Tipo de evento',
      type: 'select',
      options: [
        { value: 'user_joined', label: 'Usuário entrou' },
        { value: 'user_left', label: 'Usuário saiu' },
        { value: 'message_sent', label: 'Mensagem enviada' },
        { value: 'file_uploaded', label: 'Arquivo enviado' },
        { value: 'payment_received', label: 'Pagamento recebido' }
      ],
      required: true
    },
    {
      key: 'filters',
      label: 'Filtros',
      type: 'key-value',
      description: 'Filtros adicionais para o evento'
    }
  ],

  'trigger-webhook': [
    {
      key: 'endpoint',
      label: 'Endpoint',
      type: 'text',
      placeholder: '/webhook/chatbot',
      required: true
    },
    {
      key: 'method',
      label: 'Método HTTP',
      type: 'select',
      options: [
        { value: 'POST', label: 'POST' },
        { value: 'GET', label: 'GET' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' }
      ],
      defaultValue: 'POST'
    },
    {
      key: 'authentication',
      label: 'Autenticação',
      type: 'select',
      options: [
        { value: 'none', label: 'Nenhuma' },
        { value: 'api_key', label: 'API Key' },
        { value: 'bearer', label: 'Bearer Token' },
        { value: 'basic', label: 'Basic Auth' }
      ],
      defaultValue: 'none'
    },
    {
      key: 'secret',
      label: 'Chave secreta',
      type: 'password',
      dependencies: [
        { field: 'authentication', value: 'none', condition: 'not_equals' }
      ]
    }
  ],

  // ===== CONDITIONS =====
  'condition-text': [
    {
      key: 'text',
      label: 'Texto para comparar',
      type: 'text',
      required: true,
      placeholder: 'Digite o texto'
    },
    {
      key: 'operator',
      label: 'Operador',
      type: 'select',
      options: [
        { value: 'equals', label: 'Igual a' },
        { value: 'not_equals', label: 'Diferente de' },
        { value: 'contains', label: 'Contém' },
        { value: 'not_contains', label: 'Não contém' },
        { value: 'starts_with', label: 'Inicia com' },
        { value: 'ends_with', label: 'Termina com' },
        { value: 'regex', label: 'Regex' }
      ],
      defaultValue: 'equals'
    },
    {
      key: 'caseSensitive',
      label: 'Diferencia maiúsculas/minúsculas',
      type: 'switch',
      defaultValue: false
    }
  ],

  'condition-number': [
    {
      key: 'value',
      label: 'Valor para comparar',
      type: 'number',
      required: true
    },
    {
      key: 'operator',
      label: 'Operador',
      type: 'select',
      options: [
        { value: 'equals', label: 'Igual a' },
        { value: 'not_equals', label: 'Diferente de' },
        { value: 'greater', label: 'Maior que' },
        { value: 'greater_equal', label: 'Maior ou igual' },
        { value: 'less', label: 'Menor que' },
        { value: 'less_equal', label: 'Menor ou igual' },
        { value: 'between', label: 'Entre' }
      ],
      defaultValue: 'equals'
    },
    {
      key: 'maxValue',
      label: 'Valor máximo',
      type: 'number',
      dependencies: [
        { field: 'operator', value: 'between', condition: 'equals' }
      ]
    }
  ],

  // ===== ACTIONS =====
  'action-send-text': [
    {
      key: 'message',
      label: 'Mensagem',
      type: 'textarea',
      required: true,
      placeholder: 'Digite sua mensagem aqui...',
      description: 'Suporte a variáveis: {{user.name}}, {{message.content}}'
    },
    {
      key: 'parseMode',
      label: 'Modo de formatação',
      type: 'select',
      options: [
        { value: 'text', label: 'Texto simples' },
        { value: 'markdown', label: 'Markdown' },
        { value: 'html', label: 'HTML' }
      ],
      defaultValue: 'text'
    },
    {
      key: 'delay',
      label: 'Delay (segundos)',
      type: 'number',
      validation: { min: 0, max: 60 },
      defaultValue: 0,
      advanced: true
    }
  ],

  'action-send-image': [
    {
      key: 'imageUrl',
      label: 'URL da imagem',
      type: 'url',
      placeholder: 'https://exemplo.com/imagem.jpg'
    },
    {
      key: 'imageFile',
      label: 'Arquivo de imagem',
      type: 'file',
      description: 'Alternativamente, faça upload de uma imagem'
    },
    {
      key: 'caption',
      label: 'Legenda',
      type: 'textarea',
      placeholder: 'Legenda da imagem (opcional)'
    }
  ],

  'action-api-call': [
    {
      key: 'url',
      label: 'URL da API',
      type: 'url',
      required: true,
      placeholder: 'https://api.exemplo.com/endpoint'
    },
    {
      key: 'method',
      label: 'Método HTTP',
      type: 'select',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' }
      ],
      defaultValue: 'GET'
    },
    {
      key: 'headers',
      label: 'Cabeçalhos',
      type: 'key-value',
      description: 'Cabeçalhos HTTP personalizados'
    },
    {
      key: 'body',
      label: 'Corpo da requisição',
      type: 'json',
      dependencies: [
        { field: 'method', value: 'GET', condition: 'not_equals' }
      ]
    },
    {
      key: 'timeout',
      label: 'Timeout (segundos)',
      type: 'number',
      validation: { min: 1, max: 300 },
      defaultValue: 30,
      advanced: true
    }
  ],

  // ===== RESPONSES =====
  'response-quick-reply': [
    {
      key: 'text',
      label: 'Texto da mensagem',
      type: 'textarea',
      required: true,
      placeholder: 'Como posso ajudá-lo?'
    },
    {
      key: 'buttons',
      label: 'Botões de resposta rápida',
      type: 'array',
      required: true,
      description: 'Máximo de 10 botões'
    }
  ],

  'response-menu': [
    {
      key: 'title',
      label: 'Título do menu',
      type: 'text',
      required: true,
      placeholder: 'Selecione uma opção'
    },
    {
      key: 'description',
      label: 'Descrição',
      type: 'text',
      placeholder: 'Escolha uma das opções abaixo'
    },
    {
      key: 'items',
      label: 'Itens do menu',
      type: 'array',
      required: true,
      description: 'Lista de opções do menu'
    },
    {
      key: 'multiSelect',
      label: 'Seleção múltipla',
      type: 'switch',
      defaultValue: false
    }
  ],

  // ===== AI PROCESSING =====
  'ai-nlp': [
    {
      key: 'provider',
      label: 'Provedor de IA',
      type: 'select',
      options: [
        { value: 'openai', label: 'OpenAI GPT' },
        { value: 'claude', label: 'Anthropic Claude' },
        { value: 'gemini', label: 'Google Gemini' },
        { value: 'local', label: 'Modelo local' }
      ],
      defaultValue: 'openai',
      required: true
    },
    {
      key: 'model',
      label: 'Modelo',
      type: 'select',
      options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'claude-3', label: 'Claude 3' }
      ],
      defaultValue: 'gpt-3.5-turbo'
    },
    {
      key: 'prompt',
      label: 'Prompt do sistema',
      type: 'textarea',
      required: true,
      placeholder: 'Você é um assistente útil que...'
    },
    {
      key: 'temperature',
      label: 'Temperatura',
      type: 'number',
      validation: { min: 0, max: 2 },
      defaultValue: 0.7,
      description: 'Controla a criatividade das respostas'
    },
    {
      key: 'maxTokens',
      label: 'Máximo de tokens',
      type: 'number',
      validation: { min: 1, max: 4000 },
      defaultValue: 500,
      advanced: true
    }
  ],

  // ===== FLOW CONTROL =====
  'flow-delay': [
    {
      key: 'duration',
      label: 'Duração',
      type: 'duration',
      required: true,
      description: 'Tempo para aguardar antes de continuar'
    },
    {
      key: 'unit',
      label: 'Unidade',
      type: 'select',
      options: [
        { value: 'seconds', label: 'Segundos' },
        { value: 'minutes', label: 'Minutos' },
        { value: 'hours', label: 'Horas' },
        { value: 'days', label: 'Dias' }
      ],
      defaultValue: 'seconds'
    }
  ],

  'flow-branch': [
    {
      key: 'branches',
      label: 'Ramificações',
      type: 'array',
      required: true,
      description: 'Defina as condições para cada ramificação'
    },
    {
      key: 'defaultBranch',
      label: 'Ramificação padrão',
      type: 'text',
      description: 'Para quando nenhuma condição for atendida'
    }
  ],

  // ===== VALIDATION =====
  'validation-email': [
    {
      key: 'errorMessage',
      label: 'Mensagem de erro',
      type: 'text',
      defaultValue: 'Por favor, insira um email válido',
      placeholder: 'Mensagem exibida em caso de erro'
    },
    {
      key: 'allowDomains',
      label: 'Domínios permitidos',
      type: 'array',
      description: 'Lista de domínios permitidos (opcional)'
    },
    {
      key: 'blockDomains',
      label: 'Domínios bloqueados',
      type: 'array',
      description: 'Lista de domínios bloqueados (opcional)'
    }
  ],

  'validation-phone': [
    {
      key: 'format',
      label: 'Formato',
      type: 'select',
      options: [
        { value: 'international', label: 'Internacional (+55 11 99999-9999)' },
        { value: 'national', label: 'Nacional (11 99999-9999)' },
        { value: 'local', label: 'Local (99999-9999)' }
      ],
      defaultValue: 'national'
    },
    {
      key: 'country',
      label: 'País',
      type: 'select',
      options: [
        { value: 'BR', label: 'Brasil' },
        { value: 'US', label: 'Estados Unidos' },
        { value: 'AR', label: 'Argentina' }
      ],
      defaultValue: 'BR'
    }
  ],

  // ===== ADVANCED =====
  'advanced-script': [
    {
      key: 'code',
      label: 'Código JavaScript',
      type: 'code',
      required: true,
      placeholder: '// Seu código aqui\nconst result = input.message;\nreturn result;'
    },
    {
      key: 'timeout',
      label: 'Timeout (segundos)',
      type: 'number',
      validation: { min: 1, max: 30 },
      defaultValue: 10
    },
    {
      key: 'allowUnsafe',
      label: 'Permitir operações inseguras',
      type: 'switch',
      defaultValue: false,
      description: 'CUIDADO: Pode ser perigoso'
    }
  ]
};

interface NodeConfigFormProps {
  nodeType: string;
  nodeName: string;
  nodeCategory: string;
  configuration: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function NodeConfigForm({
  nodeType,
  nodeName,
  nodeCategory,
  configuration,
  onChange,
  onSave,
  onCancel
}: NodeConfigFormProps) {
  const [config, setConfig] = useState<Record<string, any>>(configuration);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get schema for current node type
  const schema = NODE_CONFIG_SCHEMAS[nodeType] || [];
  const basicFields = schema.filter(field => !field.advanced);
  const advancedFields = schema.filter(field => field.advanced);

  useEffect(() => {
    setConfig(configuration);
  }, [configuration]);

  const validateField = (field: ConfigField, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} é obrigatório`;
    }

    if (field.validation) {
      const { min, max, pattern, custom } = field.validation;
      
      if (min !== undefined && typeof value === 'number' && value < min) {
        return `${field.label} deve ser maior que ${min}`;
      }
      
      if (max !== undefined && typeof value === 'number' && value > max) {
        return `${field.label} deve ser menor que ${max}`;
      }
      
      if (pattern && typeof value === 'string' && !new RegExp(pattern).test(value)) {
        return `${field.label} não está no formato correto`;
      }
      
      if (custom) {
        return custom(value);
      }
    }

    return null;
  };

  const handleFieldChange = (field: ConfigField, value: any) => {
    const newConfig = { ...config, [field.key]: value };
    setConfig(newConfig);
    onChange(newConfig);

    // Validate field
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field.key]: error || ''
    }));
  };

  const isFieldVisible = (field: ConfigField): boolean => {
    if (!field.dependencies) return true;

    return field.dependencies.every(dep => {
      const depValue = config[dep.field];
      switch (dep.condition) {
        case 'equals':
          return depValue === dep.value;
        case 'not_equals':
          return depValue !== dep.value;
        case 'includes':
          return Array.isArray(depValue) && depValue.includes(dep.value);
        case 'not_includes':
          return !Array.isArray(depValue) || !depValue.includes(dep.value);
        default:
          return true;
      }
    });
  };

  const renderField = (field: ConfigField) => {
    if (!isFieldVisible(field)) return null;

    const value = config[field.key] ?? field.defaultValue;
    const error = errors[field.key];

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && (
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-10">
                {field.description}
              </div>
            </div>
          )}
        </div>

        {renderFieldInput(field, value)}

        {error && (
          <div className="flex items-center space-x-1 text-red-500 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  const renderFieldInput = (field: ConfigField, value: any) => {
    const commonProps = {
      id: field.key,
      placeholder: field.placeholder,
      'data-testid': `input-${field.key}`
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'password':
        return (
          <Input
            {...commonProps}
            type={field.type}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={value ?? ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={value ?? ''}
            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => handleFieldChange(field, val)}>
            <SelectTrigger data-testid={`select-${field.key}`}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
              data-testid={`switch-${field.key}`}
            />
            <Label className="text-sm">{value ? 'Ativado' : 'Desativado'}</Label>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
              data-testid={`checkbox-${field.key}`}
            />
            <Label className="text-sm">{field.label}</Label>
          </div>
        );

      case 'array':
        return (
          <div className="space-y-2">
            {(value || []).map((item: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newArray = [...(value || [])];
                    newArray[index] = e.target.value;
                    handleFieldChange(field, newArray);
                  }}
                  placeholder={`Item ${index + 1}`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newArray = (value || []).filter((_: any, i: number) => i !== index);
                    handleFieldChange(field, newArray);
                  }}
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFieldChange(field, [...(value || []), ''])}
            >
              Adicionar Item
            </Button>
          </div>
        );

      case 'key-value':
        return (
          <div className="space-y-2">
            {Object.entries(value || {}).map(([key, val], index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={key}
                  onChange={(e) => {
                    const newObj = { ...value };
                    delete newObj[key];
                    newObj[e.target.value] = val;
                    handleFieldChange(field, newObj);
                  }}
                  placeholder="Chave"
                  className="flex-1"
                />
                <Input
                  value={val as string}
                  onChange={(e) => {
                    handleFieldChange(field, { ...value, [key]: e.target.value });
                  }}
                  placeholder="Valor"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newObj = { ...value };
                    delete newObj[key];
                    handleFieldChange(field, newObj);
                  }}
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFieldChange(field, { ...value, '': '' })}
            >
              Adicionar Par
            </Button>
          </div>
        );

      case 'json':
      case 'code':
        return (
          <Textarea
            {...commonProps}
            value={value ? (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) : ''}
            onChange={(e) => {
              try {
                const parsed = field.type === 'json' ? JSON.parse(e.target.value) : e.target.value;
                handleFieldChange(field, parsed);
              } catch {
                handleFieldChange(field, e.target.value);
              }
            }}
            rows={6}
            className="font-mono text-sm"
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );
    }
  };

  const hasErrors = Object.values(errors).some(error => error !== '');

  return (
    <div className="space-y-6" data-testid="node-config-form">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configurar: {nodeName}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary">{nodeCategory}</Badge>
            <Badge variant="outline">{nodeType}</Badge>
          </div>
        </div>
      </div>

      {/* Configuration Fields */}
      <div className="space-y-6">
        {/* Basic Configuration */}
        {basicFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração Básica</CardTitle>
              <CardDescription>
                Configurações essenciais para este nó
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {basicFields.map(renderField)}
            </CardContent>
          </Card>
        )}

        {/* Advanced Configuration */}
        {advancedFields.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Configuração Avançada</CardTitle>
                  <CardDescription>
                    Configurações opcionais para usuários experientes
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                {advancedFields.map(renderField)}
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Validation Errors */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Por favor, corrija os erros acima antes de salvar.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={onSave} 
          disabled={hasErrors}
          data-testid="button-save-config"
        >
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}