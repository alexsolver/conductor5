/**
 * Panel de preview que renderiza o template como será visto pelo usuário final
 */
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Calendar } from '../ui/calendar'
import { Badge } from '../ui/badge'
import { FieldComponent } from './DragDropCanvas'
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  CalendarDays, 
  Upload, 
  MapPin, 
  Calculator,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
interface PreviewPanelProps {
  fields: FieldComponent[]
}
interface FieldPreviewProps {
  field: FieldComponent
}
const FieldPreview: React.FC<FieldPreviewProps> = ({
  // Localization temporarily disabled
 field }) => {
  const renderField = () => {
    const { type, properties = {} } = field
    const isRequired = properties.required || false
    const placeholder = properties.placeholder || ''
    switch (type) {
      case 'text':
        return (
          <Input
            placeholder={placeholder}
            disabled
            className="w-full"
          />
        )
      case 'textarea':
        return (
          <Textarea
            placeholder={placeholder}
            rows={properties.rows || 4}
            disabled
            className="w-full resize-none"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            placeholder={placeholder}
            min={properties.min}
            max={properties.max}
            step={properties.step}
            disabled
            className="w-full"
          />
        )
      case 'email':
        return (
          <Input
            type="email"
            placeholder={placeholder}
            disabled
            className="w-full"
          />
        )
      case 'phone':
        return (
          <Input
            type="tel"
            placeholder={properties.mask || '(99) 99999-9999'}
            disabled
            className="w-full"
          />
        )
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="w-full>
              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
            </SelectTrigger>
            <SelectContent>
              {(properties.options || []).map((option: any, index: number) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'multiselect':
        return (
          <div className="border rounded-md p-3 bg-gray-50>
            <div className="flex flex-wrap gap-1 mb-2>
              <Badge variant="secondary">Opção selecionada</Badge>
              <Badge variant="outline">+ Adicionar mais</Badge>
            </div>
            <div className="text-sm text-gray-500>
              {(properties.options || []).length} opções disponíveis
            </div>
          </div>
        )
      case 'radio':
        return (
          <RadioGroup disabled className={properties.layout === 'horizontal' ? 'flex gap-4' : 'space-y-2'}>
            {(properties.options || []).map((option: any, index: number) => (
              <div key={index} className="flex items-center space-x-2>
                <RadioGroupItem value={option.value} id={"
                <Label htmlFor={"
              </div>
            ))}
          </RadioGroup>
        )
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2>
            <Checkbox disabled id={field.id} />
            <Label htmlFor={field.id} className="text-sm>
              {properties.label || 'Concordo com os termos'}
            </Label>
          </div>
        )
      case 'date':
        return (
          <div className="relative>
            <Input
              placeholder="Enter Data (${properties.format || 'dd/MM/yyyy'})"
              disabled
              className="w-full pr-10"
            />
            <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        )
      case 'datetime':
        return (
          <div className="relative>
            <Input
              placeholder="Enter Data e Hora (${properties.format || 'dd/MM/yyyy HH:mm'})"
              disabled
              className="w-full pr-10"
            />
            <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        )
      case 'upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-gray-600>
              <span className="text-lg">"Clique para fazer upload</span> ou arraste arquivos aqui
            </div>
            <div className="text-xs text-gray-500 mt-1>
              {properties.acceptedTypes} • Máx. {properties.maxSize}MB
              {properties.multiple && ' • Múltiplos arquivos'}
            </div>
          </div>
        )
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50>
            <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center>
              <span className="text-lg">"IMG</span>
            </div>
            <div className="text-sm text-gray-600>
              Upload de imagens
            </div>
            <div className="text-xs text-gray-500 mt-1>
              {properties.acceptedTypes} • Máx. {properties.maxSize}MB
            </div>
          </div>
        )
      case 'location':
        return (
          <div className="space-y-2>
            <Input
              placeholder="Digite um endereço..."
              disabled
              className="w-full"
            />
            <div className="h-32 bg-gray-100 rounded border flex items-center justify-center>
              <div className="text-center text-gray-500>
                <MapPin className="w-8 h-8 mx-auto mb-1" />
                <span className="text-lg">"Mapa interativo</span>
              </div>
            </div>
          </div>
        )
      case 'calculated':
        return (
          <div className="relative>
            <Input
              placeholder="Valor será calculado automaticamente"
              disabled
              className="w-full pr-10 bg-gray-50"
            />
            <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <div className="text-xs text-gray-500 mt-1>
              Fórmula: {properties.formula || 'Não definida'}
            </div>
          </div>
        )
      case 'url':
        return (
          <Input
            type="url"
            placeholder={placeholder}
            disabled
            className="w-full"
          />
        )
      default:
        return (
          <div className="p-4 border border-dashed border-gray-300 rounded bg-gray-50 text-center>
            <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-500>
              Tipo de campo não reconhecido: {type}
            </span>
          </div>
        )
    }
  }
  return (
    <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-white>
      <div className="flex items-center justify-between>
        <Label className="text-sm font-medium flex items-center gap-2>
          {field.label}
          {field.properties?.required && (
            <span className="text-lg">"*</span>
          )}
        </Label>
        <Badge variant="outline" className="text-xs>
          {field.type}
        </Badge>
      </div>
      {renderField()}
      {field.properties?.description && (
        <p className="text-xs text-gray-500 mt-1>
          {field.properties.description}
        </p>
      )}
    </div>
  )
}
export const PreviewPanel: React.FC<PreviewPanelProps> = ({ fields }) => {
  const sortedFields = [...fields].sort((a, b) => a.order - b.order)
  return (
    <div className="h-full overflow-y-auto p-8 bg-gray-50>
      <Card className="max-w-4xl mx-auto>
        <CardHeader className="border-b>
          <div className="flex items-center justify-between>
            <div>
              <CardTitle className="flex items-center gap-2>
                <CheckCircle className="w-5 h-5 text-green-500" />
                Preview do Template
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1>
                Visualização de como o template aparecerá para os usuários
              </p>
            </div>
            <Badge variant="secondary>
              {fields.length} campo{fields.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6>
          {fields.length === 0 ? (
            <div className="text-center py-12>
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2>
                Nenhum campo adicionado
              </h3>
              <p className="text-gray-500>
                Arraste componentes da palette para ver o preview do template
              </p>
            </div>
          ) : (
            <div className="space-y-6>
              {sortedFields.map((field) => (
                <FieldPreview key={field.id} field={field} />
              ))}
              
              <div className="pt-6 border-t>
                <div className="flex gap-3>
                  <Button className="flex-1>
                    Salvar Template
                  </Button>
                  <Button variant="outline>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
