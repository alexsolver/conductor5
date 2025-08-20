
/**
 * Palette de componentes disponíveis para arrastar para o canvas
 */

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { 
  Type, 
  Hash, 
  AtSign, 
  Phone, 
  Calendar, 
  Clock, 
  ChevronDown,
  CheckSquare,
  Circle,
  Upload,
  MapPin,
  Calculator,
  Link,
  FileText,
  Image,
  Star
} from 'lucide-react'

interface ComponentType {
  id: string
  type: string
  label: string
  description: string
  icon: React.ComponentType<any>
  category: 'basic' | 'selection' | 'date' | 'media' | 'advanced'
  defaultProperties: Record<string, any>
  isPopular?: boolean
}

const componentTypes: ComponentType[] = [
  // Básicos
  {
    id: 'text',
    type: 'text',
    label: 'Texto',
    description: 'Campo de texto simples',
    icon: Type,
    category: 'basic',
    defaultProperties: {
      placeholder: 'Digite aqui...',
      maxLength: 255,
      required: false
    },
    isPopular: true
  },
  {
    id: 'textarea',
    type: 'textarea',
    label: 'Texto Longo',
    description: 'Campo de texto multilinha',
    icon: FileText,
    category: 'basic',
    defaultProperties: {
      placeholder: 'Digite uma descrição...',
      rows: 4,
      maxLength: 1000,
      required: false
    },
    isPopular: true
  },
  {
    id: 'number',
    type: 'number',
    label: 'Número',
    description: 'Campo numérico',
    icon: Hash,
    category: 'basic',
    defaultProperties: {
      min: 0,
      max: 999999,
      step: 1,
      required: false
    }
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email',
    description: 'Campo de email com validação',
    icon: AtSign,
    category: 'basic',
    defaultProperties: {
      placeholder: 'exemplo@email.com',
      required: false
    }
  },
  {
    id: 'phone',
    type: 'phone',
    label: 'Telefone',
    description: 'Campo de telefone com máscara',
    icon: Phone,
    category: 'basic',
    defaultProperties: {
      mask: '(99) 99999-9999',
      required: false
    }
  },

  // Seleção
  {
    id: 'select',
    type: 'select',
    label: 'Lista Suspensa',
    description: 'Seleção única de opções',
    icon: ChevronDown,
    category: 'selection',
    defaultProperties: {
      options: [
        { value: 'opcao1', label: 'Opção 1' },
        { value: 'opcao2', label: 'Opção 2' }
      ],
      required: false
    },
    isPopular: true
  },
  {
    id: 'multiselect',
    type: 'multiselect',
    label: 'Múltipla Seleção',
    description: 'Seleção múltipla de opções',
    icon: CheckSquare,
    category: 'selection',
    defaultProperties: {
      options: [
        { value: 'opcao1', label: 'Opção 1' },
        { value: 'opcao2', label: 'Opção 2' }
      ],
      required: false
    }
  },
  {
    id: 'radio',
    type: 'radio',
    label: 'Botões de Opção',
    description: 'Seleção única com botões',
    icon: Circle,
    category: 'selection',
    defaultProperties: {
      options: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' }
      ],
      required: false,
      layout: 'horizontal'
    }
  },
  {
    id: 'checkbox',
    type: 'checkbox',
    label: 'Caixa de Seleção',
    description: 'Campo verdadeiro/falso',
    icon: CheckSquare,
    category: 'selection',
    defaultProperties: {
      label: 'Concordo com os termos',
      required: false
    }
  },

  // Data e Hora
  {
    id: 'date',
    type: 'date',
    label: 'Data',
    description: 'Seletor de data',
    icon: Calendar,
    category: 'date',
    defaultProperties: {
      format: 'dd/MM/yyyy',
      required: false
    },
    isPopular: true
  },
  {
    id: 'datetime',
    type: 'datetime',
    label: 'Data e Hora',
    description: 'Seletor de data e hora',
    icon: Clock,
    category: 'date',
    defaultProperties: {
      format: 'dd/MM/yyyy HH:mm',
      required: false
    }
  },

  // Mídia
  {
    id: 'upload',
    type: 'upload',
    label: 'Upload de Arquivo',
    description: 'Upload de arquivos',
    icon: Upload,
    category: 'media',
    defaultProperties: {
      acceptedTypes: '.jpg,.png,.pdf,.doc,.docx',
      maxSize: 10, // MB
      multiple: false,
      required: false
    }
  },
  {
    id: 'image',
    type: 'image',
    label: 'Upload de Imagem',
    description: 'Upload específico para imagens',
    icon: Image,
    category: 'media',
    defaultProperties: {
      acceptedTypes: '.jpg,.jpeg,.png,.gif,.webp',
      maxSize: 5, // MB
      multiple: true,
      required: false
    }
  },

  // Avançados
  {
    id: 'location',
    type: 'location',
    label: 'Localização',
    description: 'Campo de endereço/localização',
    icon: MapPin,
    category: 'advanced',
    defaultProperties: {
      enableGeolocation: true,
      required: false
    }
  },
  {
    id: 'calculated',
    type: 'calculated',
    label: 'Campo Calculado',
    description: 'Campo com valor calculado',
    icon: Calculator,
    category: 'advanced',
    defaultProperties: {
      formula: '',
      readonly: true,
      required: false
    }
  },
  {
    id: 'url',
    type: 'url',
    label: 'Link/URL',
    description: 'Campo de URL com validação',
    icon: Link,
    category: 'advanced',
    defaultProperties: {
      placeholder: 'https://exemplo.com',
      required: false
    }
  }
]

interface DraggableComponentProps {
  component: ComponentType
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ component }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: {
      type: component.type,
      label: component.label,
      defaultProperties: component.defaultProperties
    }
  })

  const style = transform ? {
    transform: "px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1
  } : undefined

  const Icon = component.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="relative group cursor-grab active:cursor-grabbing"
    >
      <Card className="hover:shadow-md transition-shadow border-2 hover:border-blue-300">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-sm">{component.label}</span>
            {component.isPopular && (
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <p className="text-xs text-gray-600 leading-tight">
            {component.description}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export const ComponentPalette: React.FC = () => {
  const categorizedComponents = {
    basic: componentTypes.filter(c => c.category === 'basic'),
    selection: componentTypes.filter(c => c.category === 'selection'),
    date: componentTypes.filter(c => c.category === 'date'),
    media: componentTypes.filter(c => c.category === 'media'),
    advanced: componentTypes.filter(c => c.category === 'advanced')
  }

  const popularComponents = componentTypes.filter(c => c.isPopular)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-1">Componentes</h3>
        <p className="text-sm text-gray-600">Arraste para adicionar ao template</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="popular" className="text-xs">Populares</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="p-2">
            <div className="space-y-2">
              {popularComponents.map(component => (
                <DraggableComponent key={component.id} component={component} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="p-2">
            <div className="space-y-2">
              {componentTypes.map(component => (
                <DraggableComponent key={component.id} component={component} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="p-2 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Básicos</Badge>
              </div>
              <div className="space-y-2">
                {categorizedComponents.basic.map(component => (
                  <DraggableComponent key={component.id} component={component} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Seleção</Badge>
              </div>
              <div className="space-y-2">
                {categorizedComponents.selection.map(component => (
                  <DraggableComponent key={component.id} component={component} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Data/Hora</Badge>
              </div>
              <div className="space-y-2">
                {categorizedComponents.date.map(component => (
                  <DraggableComponent key={component.id} component={component} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Mídia</Badge>
              </div>
              <div className="space-y-2">
                {categorizedComponents.media.map(component => (
                  <DraggableComponent key={component.id} component={component} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Avançados</Badge>
              </div>
              <div className="space-y-2">
                {categorizedComponents.advanced.map(component => (
                  <DraggableComponent key={component.id} component={component} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
