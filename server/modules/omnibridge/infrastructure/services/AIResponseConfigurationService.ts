
export interface AIResponseConfiguration {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  tone: 'professional' | 'friendly' | 'technical' | 'sales' | 'empathetic' | 'formal';
  language: 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR';
  customInstructions: string;
  template: string;
  includeOriginalMessage: boolean;
  maxResponseLength: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AIResponseConfigurationService {
  private static readonly DEFAULT_CONFIGURATIONS: AIResponseConfiguration[] = [
    {
      id: 'customer-service-default',
      tenantId: 'system',
      name: 'Atendimento ao Cliente Padrão',
      description: 'Configuração padrão para atendimento ao cliente',
      tone: 'professional',
      language: 'pt-BR',
      customInstructions: 'Responda de forma cordial e profissional. Demonstre empatia e ofereça soluções práticas. Mantenha um tom respeitoso e prestativo.',
      template: 'Olá! Obrigado por entrar em contato conosco. {response} Caso precise de mais alguma coisa, estou à disposição.',
      includeOriginalMessage: false,
      maxResponseLength: 500,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'technical-support-default',
      tenantId: 'system',
      name: 'Suporte Técnico Especializado',
      description: 'Configuração para respostas técnicas especializadas',
      tone: 'technical',
      language: 'pt-BR',
      customInstructions: 'Forneça uma resposta técnica precisa e detalhada. Inclua etapas de diagnóstico quando apropriado. Use linguagem técnica mas acessível.',
      template: 'Identifiquei sua questão técnica. {response} Se o problema persistir, por favor forneça mais detalhes sobre o erro.',
      includeOriginalMessage: true,
      maxResponseLength: 800,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'sales-response-default',
      tenantId: 'system',
      name: 'Resposta de Vendas Otimizada',
      description: 'Configuração para respostas focadas em conversão',
      tone: 'sales',
      language: 'pt-BR',
      customInstructions: 'Responda com foco em benefícios e valor agregado. Seja persuasivo mas não agressivo. Inclua informações sobre próximos passos.',
      template: 'Que ótima oportunidade de ajudá-lo! {response} Gostaria de agendar uma conversa para detalhar melhor como podemos atender suas necessidades?',
      includeOriginalMessage: false,
      maxResponseLength: 600,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'empathetic-support-default',
      tenantId: 'system',
      name: 'Suporte Empático para Reclamações',
      description: 'Configuração empática para lidar com reclamações',
      tone: 'empathetic',
      language: 'pt-BR',
      customInstructions: 'Demonstre empatia genuína e compreensão. Reconheça o problema e ofereça soluções concretas. Seja humano e acolhedor.',
      template: 'Compreendo sua frustração e peço desculpas pelo inconveniente. {response} Vou acompanhar pessoalmente para garantir que isso seja resolvido.',
      includeOriginalMessage: false,
      maxResponseLength: 400,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  static getConfigurationByTone(tone: string): AIResponseConfiguration {
    const config = this.DEFAULT_CONFIGURATIONS.find(c => c.tone === tone) || this.DEFAULT_CONFIGURATIONS[0];
    return { ...config };
  }

  static getConfigurationById(id: string): AIResponseConfiguration | null {
    const config = this.DEFAULT_CONFIGURATIONS.find(c => c.id === id);
    return config ? { ...config } : null;
  }

  static getAllConfigurations(): AIResponseConfiguration[] {
    return this.DEFAULT_CONFIGURATIONS.map(c => ({ ...c }));
  }

  static createCustomConfiguration(config: Partial<AIResponseConfiguration>, tenantId: string): AIResponseConfiguration {
    return {
      id: config.id || `custom-${Date.now()}`,
      tenantId,
      name: config.name || 'Configuração Personalizada',
      description: config.description || 'Configuração criada pelo usuário',
      tone: config.tone || 'professional',
      language: config.language || 'pt-BR',
      customInstructions: config.customInstructions || 'Responda de forma profissional e prestativa.',
      template: config.template || '{response}',
      includeOriginalMessage: config.includeOriginalMessage || false,
      maxResponseLength: config.maxResponseLength || 500,
      enabled: config.enabled !== undefined ? config.enabled : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static validateConfiguration(config: Partial<AIResponseConfiguration>): string[] {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Nome da configuração é obrigatório');
    }

    if (config.name && config.name.length > 100) {
      errors.push('Nome da configuração deve ter no máximo 100 caracteres');
    }

    if (!config.customInstructions || config.customInstructions.trim().length === 0) {
      errors.push('Instruções personalizadas são obrigatórias');
    }

    if (config.customInstructions && config.customInstructions.length > 1000) {
      errors.push('Instruções personalizadas devem ter no máximo 1000 caracteres');
    }

    if (config.maxResponseLength && (config.maxResponseLength < 50 || config.maxResponseLength > 2000)) {
      errors.push('Tamanho máximo da resposta deve estar entre 50 e 2000 caracteres');
    }

    const validTones = ['professional', 'friendly', 'technical', 'sales', 'empathetic', 'formal'];
    if (config.tone && !validTones.includes(config.tone)) {
      errors.push(`Tom deve ser um dos seguintes: ${validTones.join(', ')}`);
    }

    const validLanguages = ['pt-BR', 'en-US', 'es-ES', 'fr-FR'];
    if (config.language && !validLanguages.includes(config.language)) {
      errors.push(`Idioma deve ser um dos seguintes: ${validLanguages.join(', ')}`);
    }

    return errors;
  }
}
