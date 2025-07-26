// Field Layout Repository - In-memory storage for demo purposes
// In production, this would integrate with the existing database

export interface FieldConfiguration {
  id: string;
  moduleType: string;
  pageType: string;
  fieldType: string;
  label: string;
  section: string;
  position: number;
  isRequired: boolean;
  isVisible: boolean;
  validationRules?: Record<string, any>;
  componentProps?: Record<string, any>;
  customId?: string;
  icon?: string;
}

export interface LayoutSection {
  id: string;
  name: string;
  description: string;
  position: number;
  fields: FieldConfiguration[];
}

export interface FieldLayout {
  id: string;
  moduleType: string;
  pageType: string;
  customerId?: string;
  sections: LayoutSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class FieldLayoutRepository {
  private layouts: Map<string, FieldLayout> = new Map();

  constructor() {
    this.initializeDefaultLayouts();
  }

  private initializeDefaultLayouts() {
    // Default layout for tickets edit page
    const ticketsEditLayout: FieldLayout = {
      id: 'tickets-edit-default',
      moduleType: 'tickets',
      pageType: 'edit',
      sections: [
        {
          id: 'main',
          name: 'Seção Principal',
          description: 'Campos principais do formulário',
          position: 0,
          fields: []
        },
        {
          id: 'details',
          name: 'Detalhes',
          description: 'Informações detalhadas',
          position: 1,
          fields: []
        },
        {
          id: 'metadata',
          name: 'Metadados',
          description: 'Informações adicionais',
          position: 2,
          fields: []
        },
        {
          id: 'sidebar',
          name: 'Barra Lateral',
          description: 'Informações de apoio',
          position: 3,
          fields: []
        }
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.layouts.set('tickets-edit-default', ticketsEditLayout);
  }

  async getLayout(moduleType: string, pageType: string, customerId?: string): Promise<FieldLayout | null> {
    const key = customerId 
      ? `${moduleType}-${pageType}-${customerId}`
      : `${moduleType}-${pageType}-default`;
    
    const layout = this.layouts.get(key);
    if (layout) {
      return layout;
    }

    // Return default layout if specific not found
    const defaultKey = `${moduleType}-${pageType}-default`;
    return this.layouts.get(defaultKey) || null;
  }

  async saveLayout(layout: Partial<FieldLayout>): Promise<FieldLayout> {
    const key = layout.customerId 
      ? `${layout.moduleType}-${layout.pageType}-${layout.customerId}`
      : `${layout.moduleType}-${layout.pageType}-default`;

    const existingLayout = this.layouts.get(key);
    
    const savedLayout: FieldLayout = {
      id: existingLayout?.id || key,
      moduleType: layout.moduleType!,
      pageType: layout.pageType!,
      customerId: layout.customerId,
      sections: layout.sections || [],
      isActive: layout.isActive ?? true,
      createdAt: existingLayout?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.layouts.set(key, savedLayout);
    return savedLayout;
  }

  async addFieldToLayout(
    moduleType: string, 
    pageType: string, 
    sectionId: string, 
    field: Omit<FieldConfiguration, 'id' | 'position'>,
    customerId?: string
  ): Promise<FieldLayout | null> {
    const layout = await this.getLayout(moduleType, pageType, customerId);
    if (!layout) return null;

    const section = layout.sections.find(s => s.id === sectionId);
    if (!section) return null;

    const newField: FieldConfiguration = {
      ...field,
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: section.fields.length,
    };

    section.fields.push(newField);
    
    return this.saveLayout(layout);
  }

  async removeFieldFromLayout(
    moduleType: string,
    pageType: string,
    fieldId: string,
    customerId?: string
  ): Promise<FieldLayout | null> {
    const layout = await this.getLayout(moduleType, pageType, customerId);
    if (!layout) return null;

    layout.sections.forEach(section => {
      section.fields = section.fields
        .filter(f => f.id !== fieldId)
        .map((field, index) => ({ ...field, position: index }));
    });

    return this.saveLayout(layout);
  }

  // Demo method to add sample fields
  async addDemoFields(moduleType: string, pageType: string): Promise<FieldLayout | null> {
    const layout = await this.getLayout(moduleType, pageType);
    if (!layout) return null;

    // Add sample fields to different sections
    const sampleFields = [
      {
        fieldType: 'text',
        label: 'Número do Contrato',
        section: 'main',
        isRequired: true,
        isVisible: true,
        icon: 'Hash',
        moduleType,
        pageType
      },
      {
        fieldType: 'select',
        label: 'Tipo de Solicitação',
        section: 'main',
        isRequired: false,
        isVisible: true,
        icon: 'Tag',
        componentProps: {
          options: [
            { value: 'incident', label: 'Incidente' },
            { value: 'request', label: 'Solicitação' },
            { value: 'change', label: 'Mudança' }
          ]
        },
        moduleType,
        pageType
      },
      {
        fieldType: 'textarea',
        label: 'Observações Técnicas',
        section: 'details',
        isRequired: false,
        isVisible: true,
        icon: 'AlignLeft',
        moduleType,
        pageType
      },
      {
        fieldType: 'date',
        label: 'Data Prevista',
        section: 'metadata',
        isRequired: false,
        isVisible: true,
        icon: 'CalendarIcon',
        moduleType,
        pageType
      },
      {
        fieldType: 'checkbox',
        label: 'Urgente?',
        section: 'sidebar',
        isRequired: false,
        isVisible: true,
        icon: 'AlertTriangle',
        moduleType,
        pageType
      }
    ];

    for (const field of sampleFields) {
      await this.addFieldToLayout(moduleType, pageType, field.section, field);
    }

    return this.getLayout(moduleType, pageType);
  }
}

export default FieldLayoutRepository;