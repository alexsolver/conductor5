/**
 * Entity Field Catalog
 * Comprehensive catalog of all system entities and their fields for AI Agent form builders
 */

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'date' 
  | 'datetime' 
  | 'select' 
  | 'multiselect' 
  | 'boolean' 
  | 'file' 
  | 'location' 
  | 'user' 
  | 'cpf' 
  | 'cnpj' 
  | 'currency' 
  | 'url';

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  description: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: { value: string; label: string }[];
  defaultValue?: any;
  aiExtractionHints?: {
    keywords: string[];
    examples: string[];
    context: string;
  };
}

export interface EntityDefinition {
  id: string;
  name: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  fields: FieldDefinition[];
  requiredFields: string[];
}

/**
 * Complete catalog of all system entities
 */
export const EntityCatalog: Record<string, EntityDefinition> = {
  ticket: {
    id: 'ticket',
    name: 'ticket',
    label: 'Ticket',
    icon: 'Ticket',
    description: 'Chamado de suporte ao cliente',
    color: 'from-purple-500 to-blue-500',
    requiredFields: ['title', 'description'],
    fields: [
      {
        id: 'title',
        name: 'title',
        label: 'Título',
        type: 'text',
        description: 'Título ou assunto do chamado',
        required: true,
        validation: {
          min: 5,
          max: 200,
          message: 'O título deve ter entre 5 e 200 caracteres'
        },
        aiExtractionHints: {
          keywords: ['problema', 'erro', 'solicitação', 'pedido', 'questão', 'assunto'],
          examples: ['Problema com impressora', 'Sistema travando', 'Solicitação de acesso'],
          context: 'Resumo conciso do problema ou solicitação do usuário'
        }
      },
      {
        id: 'description',
        name: 'description',
        label: 'Descrição',
        type: 'textarea',
        description: 'Descrição detalhada do chamado',
        required: true,
        validation: {
          min: 10,
          max: 5000,
          message: 'A descrição deve ter entre 10 e 5000 caracteres'
        },
        aiExtractionHints: {
          keywords: ['detalhes', 'informações', 'aconteceu', 'ocorreu', 'situação'],
          examples: ['Quando tento imprimir, aparece erro...', 'O sistema congela ao abrir...'],
          context: 'Descrição completa do problema, incluindo o que aconteceu, quando e como reproduzir'
        }
      },
      {
        id: 'priority',
        name: 'priority',
        label: 'Prioridade',
        type: 'select',
        description: 'Nível de prioridade do chamado',
        required: true,
        defaultValue: 'medium',
        options: [
          { value: 'low', label: 'Baixa' },
          { value: 'medium', label: 'Média' },
          { value: 'high', label: 'Alta' },
          { value: 'urgent', label: 'Urgente' }
        ],
        aiExtractionHints: {
          keywords: ['urgente', 'prioridade', 'crítico', 'importante', 'grave', 'emergência'],
          examples: ['É urgente', 'Preciso resolver hoje', 'Não é tão urgente'],
          context: 'Determinar urgência baseado em palavras-chave, impacto no negócio e prazo mencionado'
        }
      },
      {
        id: 'category',
        name: 'category',
        label: 'Categoria',
        type: 'select',
        description: 'Categoria do chamado',
        required: false,
        options: [
          { value: 'hardware', label: 'Hardware' },
          { value: 'software', label: 'Software' },
          { value: 'network', label: 'Rede' },
          { value: 'access', label: 'Acesso' },
          { value: 'support', label: 'Suporte' },
          { value: 'other', label: 'Outro' }
        ],
        aiExtractionHints: {
          keywords: ['computador', 'impressora', 'mouse', 'teclado', 'sistema', 'aplicativo', 'internet', 'wifi', 'senha', 'acesso', 'login'],
          examples: ['Impressora não funciona', 'Sistema travando', 'Sem internet', 'Esqueci senha'],
          context: 'Classificar baseado no tipo de equipamento, sistema ou serviço mencionado'
        }
      },
      {
        id: 'impact',
        name: 'impact',
        label: 'Impacto',
        type: 'select',
        description: 'Impacto no negócio',
        required: false,
        options: [
          { value: 'low', label: 'Baixo' },
          { value: 'medium', label: 'Médio' },
          { value: 'high', label: 'Alto' },
          { value: 'critical', label: 'Crítico' }
        ],
        aiExtractionHints: {
          keywords: ['afeta', 'pessoas', 'equipe', 'todos', 'parado', 'bloqueado'],
          examples: ['Afeta toda a equipe', 'Só eu estou com problema', 'Trabalho parado'],
          context: 'Determinar quantas pessoas ou processos estão afetados'
        }
      },
      {
        id: 'urgency',
        name: 'urgency',
        label: 'Urgência',
        type: 'select',
        description: 'Urgência para resolução',
        required: false,
        options: [
          { value: 'low', label: 'Baixa' },
          { value: 'medium', label: 'Média' },
          { value: 'high', label: 'Alta' },
          { value: 'critical', label: 'Crítica' }
        ],
        aiExtractionHints: {
          keywords: ['urgente', 'rápido', 'agora', 'imediato', 'prazo', 'deadline'],
          examples: ['Preciso urgente', 'Pode ser amanhã', 'Não tem pressa'],
          context: 'Avaliar o prazo e a necessidade imediata de resolução'
        }
      },
      {
        id: 'assignedToId',
        name: 'assignedToId',
        label: 'Atribuído para',
        type: 'user',
        description: 'Usuário responsável pelo chamado',
        required: false,
        aiExtractionHints: {
          keywords: ['atribuir', 'responsável', 'técnico', 'atendente', 'nome'],
          examples: ['Para o João', 'Responsável: Maria', 'Técnico disponível'],
          context: 'Identificar menção a pessoa específica ou solicitar atribuição automática'
        }
      },
      {
        id: 'locationId',
        name: 'locationId',
        label: 'Local',
        type: 'select',
        description: 'Local físico relacionado',
        required: false,
        aiExtractionHints: {
          keywords: ['sala', 'andar', 'prédio', 'local', 'endereço', 'onde'],
          examples: ['Sala 205', 'Andar 3', 'Matriz'],
          context: 'Extrair informações sobre localização física mencionada'
        }
      },
      {
        id: 'dueDate',
        name: 'dueDate',
        label: 'Data de Vencimento',
        type: 'date',
        description: 'Prazo para resolução',
        required: false,
        aiExtractionHints: {
          keywords: ['prazo', 'até', 'deadline', 'data', 'vencimento', 'entregar'],
          examples: ['Até amanhã', 'Prazo 25/12', 'Preciso até sexta'],
          context: 'Extrair data mencionada ou calcular baseado em expressões relativas (amanhã, semana que vem)'
        }
      },
      {
        id: 'tags',
        name: 'tags',
        label: 'Tags',
        type: 'multiselect',
        description: 'Etiquetas para categorização',
        required: false,
        aiExtractionHints: {
          keywords: ['categoria', 'tipo', 'classificação'],
          examples: ['Impressora', 'VPN', 'Email'],
          context: 'Identificar palavras-chave relevantes para categorização'
        }
      }
    ]
  },

  client: {
    id: 'client',
    name: 'client',
    label: 'Cliente',
    icon: 'Building2',
    description: 'Empresa ou pessoa física cliente',
    color: 'from-blue-500 to-cyan-500',
    requiredFields: ['name', 'email'],
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'Nome / Razão Social',
        type: 'text',
        description: 'Nome completo ou razão social',
        required: true,
        validation: {
          min: 3,
          max: 200,
          message: 'O nome deve ter entre 3 e 200 caracteres'
        },
        aiExtractionHints: {
          keywords: ['nome', 'empresa', 'razão social', 'companhia', 'organização'],
          examples: ['Empresa ABC Ltda', 'João Silva', 'Acme Corporation'],
          context: 'Nome completo da pessoa ou nome empresarial'
        }
      },
      {
        id: 'email',
        name: 'email',
        label: 'E-mail',
        type: 'email',
        description: 'E-mail principal de contato',
        required: true,
        validation: {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          message: 'E-mail inválido'
        },
        aiExtractionHints: {
          keywords: ['email', 'e-mail', 'correio eletrônico', 'contato'],
          examples: ['contato@empresa.com', 'joao@email.com'],
          context: 'Endereço de e-mail válido para contato'
        }
      },
      {
        id: 'phone',
        name: 'phone',
        label: 'Telefone',
        type: 'phone',
        description: 'Telefone de contato',
        required: false,
        validation: {
          pattern: '^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$',
          message: 'Telefone inválido'
        },
        aiExtractionHints: {
          keywords: ['telefone', 'celular', 'fone', 'contato', 'whatsapp'],
          examples: ['(11) 98765-4321', '11987654321', '(11) 3456-7890'],
          context: 'Número de telefone com DDD'
        }
      },
      {
        id: 'cnpj',
        name: 'cnpj',
        label: 'CNPJ',
        type: 'cnpj',
        description: 'CNPJ da empresa',
        required: false,
        validation: {
          pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$',
          message: 'CNPJ inválido'
        },
        aiExtractionHints: {
          keywords: ['cnpj', 'cadastro nacional', 'empresa'],
          examples: ['12.345.678/0001-90', '12345678000190'],
          context: 'CNPJ com 14 dígitos numéricos'
        }
      },
      {
        id: 'cpf',
        name: 'cpf',
        label: 'CPF',
        type: 'cpf',
        description: 'CPF do cliente pessoa física',
        required: false,
        validation: {
          pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$',
          message: 'CPF inválido'
        },
        aiExtractionHints: {
          keywords: ['cpf', 'documento', 'rg'],
          examples: ['123.456.789-00', '12345678900'],
          context: 'CPF com 11 dígitos numéricos'
        }
      },
      {
        id: 'address',
        name: 'address',
        label: 'Endereço',
        type: 'textarea',
        description: 'Endereço completo',
        required: false,
        aiExtractionHints: {
          keywords: ['endereço', 'rua', 'avenida', 'número', 'bairro', 'cidade', 'estado', 'cep'],
          examples: ['Rua ABC, 123 - Centro - São Paulo/SP', 'Av. Paulista, 1000 - CEP 01310-100'],
          context: 'Endereço completo com rua, número, bairro, cidade e estado'
        }
      },
      {
        id: 'website',
        name: 'website',
        label: 'Website',
        type: 'url',
        description: 'Website da empresa',
        required: false,
        validation: {
          pattern: '^https?://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
          message: 'URL inválida'
        },
        aiExtractionHints: {
          keywords: ['site', 'website', 'url', 'endereço web'],
          examples: ['https://empresa.com.br', 'www.empresa.com'],
          context: 'URL do website da empresa'
        }
      },
      {
        id: 'notes',
        name: 'notes',
        label: 'Observações',
        type: 'textarea',
        description: 'Observações adicionais',
        required: false,
        aiExtractionHints: {
          keywords: ['observação', 'nota', 'detalhe', 'informação adicional'],
          examples: ['Cliente VIP', 'Contato preferencial por email'],
          context: 'Informações adicionais relevantes sobre o cliente'
        }
      }
    ]
  },

  location: {
    id: 'location',
    name: 'location',
    label: 'Local',
    icon: 'MapPin',
    description: 'Local físico ou endereço',
    color: 'from-green-500 to-emerald-500',
    requiredFields: ['name', 'address'],
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'Nome do Local',
        type: 'text',
        description: 'Nome de identificação do local',
        required: true,
        validation: {
          min: 3,
          max: 200,
          message: 'O nome deve ter entre 3 e 200 caracteres'
        },
        aiExtractionHints: {
          keywords: ['local', 'nome', 'identificação', 'sala', 'prédio', 'andar'],
          examples: ['Matriz São Paulo', 'Sala 205', 'Filial Campinas'],
          context: 'Nome para identificar o local'
        }
      },
      {
        id: 'address',
        name: 'address',
        label: 'Endereço',
        type: 'textarea',
        description: 'Endereço completo',
        required: true,
        aiExtractionHints: {
          keywords: ['endereço', 'rua', 'avenida', 'número', 'bairro', 'cidade', 'estado', 'cep'],
          examples: ['Rua ABC, 123 - Centro - São Paulo/SP', 'Av. Paulista, 1000'],
          context: 'Endereço completo com rua, número, bairro, cidade e estado'
        }
      },
      {
        id: 'city',
        name: 'city',
        label: 'Cidade',
        type: 'text',
        description: 'Cidade',
        required: false,
        aiExtractionHints: {
          keywords: ['cidade', 'município'],
          examples: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'],
          context: 'Nome da cidade'
        }
      },
      {
        id: 'state',
        name: 'state',
        label: 'Estado',
        type: 'text',
        description: 'Estado (UF)',
        required: false,
        aiExtractionHints: {
          keywords: ['estado', 'uf'],
          examples: ['SP', 'RJ', 'MG'],
          context: 'Sigla do estado (UF)'
        }
      },
      {
        id: 'zipCode',
        name: 'zipCode',
        label: 'CEP',
        type: 'text',
        description: 'Código postal',
        required: false,
        validation: {
          pattern: '^\\d{5}-?\\d{3}$',
          message: 'CEP inválido'
        },
        aiExtractionHints: {
          keywords: ['cep', 'código postal'],
          examples: ['01310-100', '12345-678'],
          context: 'CEP com 8 dígitos numéricos'
        }
      },
      {
        id: 'coordinates',
        name: 'coordinates',
        label: 'Coordenadas',
        type: 'text',
        description: 'Coordenadas geográficas (lat, lng)',
        required: false,
        aiExtractionHints: {
          keywords: ['coordenadas', 'latitude', 'longitude', 'gps'],
          examples: ['-23.550520, -46.633308', 'lat: -23.5505, lng: -46.6333'],
          context: 'Coordenadas geográficas no formato latitude, longitude'
        }
      },
      {
        id: 'type',
        name: 'type',
        label: 'Tipo de Local',
        type: 'select',
        description: 'Classificação do local',
        required: false,
        options: [
          { value: 'office', label: 'Escritório' },
          { value: 'warehouse', label: 'Depósito' },
          { value: 'store', label: 'Loja' },
          { value: 'datacenter', label: 'Data Center' },
          { value: 'remote', label: 'Remoto' },
          { value: 'other', label: 'Outro' }
        ],
        aiExtractionHints: {
          keywords: ['escritório', 'depósito', 'loja', 'data center', 'filial', 'matriz'],
          examples: ['Escritório central', 'Depósito de estoque', 'Loja shopping'],
          context: 'Tipo ou função do local'
        }
      },
      {
        id: 'notes',
        name: 'notes',
        label: 'Observações',
        type: 'textarea',
        description: 'Observações adicionais',
        required: false,
        aiExtractionHints: {
          keywords: ['observação', 'nota', 'detalhe', 'acesso'],
          examples: ['Acesso pela entrada lateral', 'Portaria 24h'],
          context: 'Informações adicionais sobre o local, acesso, horário, etc'
        }
      }
    ]
  },

  beneficiary: {
    id: 'beneficiary',
    name: 'beneficiary',
    label: 'Favorecido',
    icon: 'UserCheck',
    description: 'Pessoa beneficiária ou contato associado',
    color: 'from-orange-500 to-red-500',
    requiredFields: ['name', 'email'],
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'Nome Completo',
        type: 'text',
        description: 'Nome completo do favorecido',
        required: true,
        validation: {
          min: 3,
          max: 200,
          message: 'O nome deve ter entre 3 e 200 caracteres'
        },
        aiExtractionHints: {
          keywords: ['nome', 'favorecido', 'beneficiário', 'pessoa', 'contato'],
          examples: ['João Silva', 'Maria Santos'],
          context: 'Nome completo da pessoa'
        }
      },
      {
        id: 'email',
        name: 'email',
        label: 'E-mail',
        type: 'email',
        description: 'E-mail de contato',
        required: true,
        validation: {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          message: 'E-mail inválido'
        },
        aiExtractionHints: {
          keywords: ['email', 'e-mail', 'correio eletrônico'],
          examples: ['joao@email.com', 'maria@empresa.com'],
          context: 'Endereço de e-mail válido'
        }
      },
      {
        id: 'phone',
        name: 'phone',
        label: 'Telefone',
        type: 'phone',
        description: 'Telefone de contato',
        required: false,
        validation: {
          pattern: '^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$',
          message: 'Telefone inválido'
        },
        aiExtractionHints: {
          keywords: ['telefone', 'celular', 'fone', 'whatsapp'],
          examples: ['(11) 98765-4321', '11987654321'],
          context: 'Número de telefone com DDD'
        }
      },
      {
        id: 'cpf',
        name: 'cpf',
        label: 'CPF',
        type: 'cpf',
        description: 'CPF do favorecido',
        required: false,
        validation: {
          pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$',
          message: 'CPF inválido'
        },
        aiExtractionHints: {
          keywords: ['cpf', 'documento'],
          examples: ['123.456.789-00', '12345678900'],
          context: 'CPF com 11 dígitos numéricos'
        }
      },
      {
        id: 'position',
        name: 'position',
        label: 'Cargo',
        type: 'text',
        description: 'Cargo ou função',
        required: false,
        aiExtractionHints: {
          keywords: ['cargo', 'função', 'posição', 'papel'],
          examples: ['Gerente', 'Analista', 'Coordenador'],
          context: 'Cargo ou função da pessoa na organização'
        }
      },
      {
        id: 'department',
        name: 'department',
        label: 'Departamento',
        type: 'text',
        description: 'Departamento ou setor',
        required: false,
        aiExtractionHints: {
          keywords: ['departamento', 'setor', 'área'],
          examples: ['TI', 'Financeiro', 'Vendas'],
          context: 'Departamento ou setor onde a pessoa trabalha'
        }
      },
      {
        id: 'notes',
        name: 'notes',
        label: 'Observações',
        type: 'textarea',
        description: 'Observações adicionais',
        required: false,
        aiExtractionHints: {
          keywords: ['observação', 'nota', 'detalhe'],
          examples: ['Contato preferencial', 'Disponível das 9h às 18h'],
          context: 'Informações adicionais sobre o favorecido'
        }
      }
    ]
  }
};

/**
 * Get entity definition by ID
 */
export function getEntityDefinition(entityId: string): EntityDefinition | undefined {
  return EntityCatalog[entityId];
}

/**
 * Get all entities
 */
export function getAllEntities(): EntityDefinition[] {
  return Object.values(EntityCatalog);
}

/**
 * Get field definition from entity
 */
export function getFieldDefinition(entityId: string, fieldId: string): FieldDefinition | undefined {
  const entity = getEntityDefinition(entityId);
  return entity?.fields.find(f => f.id === fieldId);
}

/**
 * Get required fields for entity
 */
export function getRequiredFields(entityId: string): FieldDefinition[] {
  const entity = getEntityDefinition(entityId);
  if (!entity) return [];
  return entity.fields.filter(f => entity.requiredFields.includes(f.id));
}

/**
 * Get optional fields for entity
 */
export function getOptionalFields(entityId: string): FieldDefinition[] {
  const entity = getEntityDefinition(entityId);
  if (!entity) return [];
  return entity.fields.filter(f => !entity.requiredFields.includes(f.id));
}
