
/**
 * Componente para representar um campo no canvas que pode ser arrastado e editado
 */

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { FieldComponent } from './DragDropCanvas'
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  GripVertical, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy,
  Type,
  Hash,
  AtSign,
  Phone,
  Calendar,
  ChevronDown,
  CheckSquare,
  Upload,
  MapPin,
  Calculator,
  Link,
  FileText,
  Image,
  AlertTriangle
} from 'lucide-react'

interface DraggableFieldItemProps {
  field: FieldComponent
  isSelected: boolean
  onSelect: (id: string) => void
  onUpdate: (id: string, updates: Partial<FieldComponent>) => void
  onDelete: (id: string) => void
  readonly?: boolean
}

const getFieldIcon = (type: string) => {
  // Localization temporarily disabled

  const icons = {
    text: Type,
    textarea: FileText,
    number: Hash,
    email: AtSign,
    phone: Phone,
    select: ChevronDown,
    multiselect: CheckSquare,
    radio: CheckSquare,
    checkbox: CheckSquare,
    date: Calendar,
    datetime: Calendar,
    upload: Upload,
    image: Image,
    location: MapPin,
    calculated: Calculator,
    url: Link
  }
  return icons[type as keyof typeof icons] || Type
}

const getFieldTypeLabel = (type: string) => {
  const labels = {
    text: 'Texto',
    textarea: 'Texto Longo',
    number: 'Número',
    email: 'Email',
    phone: 'Telefone',
    select: 'Lista Suspensa',
    multiselect: 'Múltipla Seleção',
    radio: 'Botões de Opção',
    checkbox: 'Caixa de Seleção',
    date: 'Data',
    datetime: 'Data e Hora',
    upload: 'Upload',
    image: 'Imagem',
    location: 'Localização',
    calculated: 'Calculado',
    url: 'URL'
  }
  return labels[type as keyof typeof labels] || type
}

const getValidationSummary = (field: FieldComponent) => {
  const validations = []
  
  if (field.properties?.required) {
    validations.push('Obrigatório')
  }
  
  if (field.properties?.minLength) {
    validations.push("
  }
  
  if (field.properties?.maxLength) {
    validations.push("
  }
  
  if (field.properties?.min !== undefined) {
    validations.push("
  }
  
  if (field.properties?.max !== undefined) {
    validations.push("
  }

  return validations
}

export const DraggableFieldItem: React.FC<DraggableFieldItemProps> = ({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  readonly = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: field.id,
    disabled: readonly
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const Icon = getFieldIcon(field.type)
  const validations = getValidationSummary(field)
  const hasErrors = field.validation && Object.keys(field.validation).some(key => 
    field.validation[key] === false
  )

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate(field.id, {
      properties: {
        ...field.properties,
        hidden: !field.properties?.hidden
      }
    })
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implementar duplicação
    console.log('Duplicar campo:', field.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja remover este campo?')) {
      onDelete(field.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isDragging ? 'z-50' : ''}
      "
      onClick={() => onSelect(field.id)}
    >
      <Card className={`
        hover:shadow-md transition-shadow cursor-pointer
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        ${hasErrors ? 'border-red-300 bg-red-50' : 'bg-white'}
        ${field.properties?.hidden ? 'opacity-60' : ''}
      >
        <CardContent className="p-4>
          {/* Header */}
          <div className="flex items-center justify-between mb-3>
            <div className="flex items-center gap-2 flex-1 min-w-0>
              {!readonly && (
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
              )}
              
              <Icon className={`w-5 h-5 flex-shrink-0 ${
                hasErrors ? 'text-red-500' : 'text-blue-600'
              "} />
              
              <div className="flex-1 min-w-0>
                <h4 className="font-medium text-sm truncate>
                  {field.label}
                </h4>
                <p className="text-xs text-gray-500>
                  {getFieldTypeLabel(field.type)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1>
              {hasErrors && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              
              {field.properties?.required && (
                <Badge variant="destructive" className="text-xs px-1>
                  *
                </Badge>
              )}
              
              {field.properties?.hidden && (
                <Badge variant="secondary" className="text-xs px-1>
                  Oculto
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2>
            {/* Field key */}
            <div className="text-xs text-gray-600>
              <span className="font-mono bg-gray-100 px-1 rounded>
                {field.id}
              </span>
            </div>

            {/* Validations */}
            {validations.length > 0 && (
              <div className="flex flex-wrap gap-1>
                {validations.map((validation, index) => (
                  <Badge key={index} variant="outline" className="text-xs>
                    {validation}
                  </Badge>
                ))}
              </div>
            )}

            {/* Properties summary */}
            {field.properties?.placeholder && (
              <div className="text-xs text-gray-500 italic>
                "{field.properties.placeholder}"
              </div>
            )}

            {/* Options count for select fields */}
            {(['select', 'multiselect', 'radio'].includes(field.type) && field.properties?.options) && (
              <div className="text-xs text-gray-500>
                {field.properties.options.length} opçõe{field.properties.options.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Actions */}
          {!readonly && (
            <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleVisibility}
                className="h-8 w-8 p-0"
                title={field.properties?.hidden ? 'Mostrar campo' : 'Ocultar campo'}
              >
                {field.properties?.hidden ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                className="h-8 w-8 p-0"
                title="Duplicar campo"
              >
                <Copy className="w-3 h-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelect(field.id)}
                className="h-8 w-8 p-0"
                title='[TRANSLATION_NEEDED]'
              >
                <Settings className="w-3 h-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Remover campo"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
