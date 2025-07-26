import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Search,
  Type,
  AlignLeft,
  ChevronDown,
  Hash,
  Calendar,
  CheckSquare,
  Mail,
  Phone,
  AlertTriangle,
  Circle,
  Tag,
  User,
  Building,
  MapPin,
  Users,
  Package,
  Truck,
  DollarSign
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DraggableFieldItem } from './DraggableFieldItem';

interface FieldsPaletteProps {
  moduleType: string;
  availableFields: Array<{
    id: string;
    type: string;
    label: string;
    icon: string;
  }>;
}

const getIconComponent = (iconName: string) => {
  const icons = {
    Type,
    AlignLeft,
    ChevronDown,
    Hash,
    Calendar,
    CheckSquare,
    Mail,
    Phone,
    AlertTriangle,
    Circle,
    Tag,
    User,
    Building,
    MapPin,
    Users,
    Package,
    Truck,
    DollarSign
  };
  
  return icons[iconName as keyof typeof icons] || Type;
};

export function FieldsPalette({ moduleType, availableFields }: FieldsPaletteProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredFields = availableFields.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group fields by category
  const commonFields = filteredFields.filter(field => 
    ['text', 'textarea', 'select', 'number', 'date', 'checkbox', 'email', 'phone'].includes(field.type)
  );
  
  const moduleSpecificFields = filteredFields.filter(field => 
    !['text', 'textarea', 'select', 'number', 'date', 'checkbox', 'email', 'phone'].includes(field.type)
  );

  return (
    <Card className="h-fit sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5 text-blue-600" />
          Paleta de Campos
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar campos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Common Fields Section */}
        {commonFields.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Campos Comuns</h4>
              <Badge variant="secondary" className="text-xs">
                {commonFields.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {commonFields.map((field) => (
                <DraggableFieldItem
                  key={field.id}
                  field={field}
                  isDragging={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Module Specific Fields */}
        {moduleSpecificFields.length > 0 && (
          <>
            {commonFields.length > 0 && <Separator />}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Campos Específicos
                </h4>
                <Badge variant="outline" className="text-xs">
                  {moduleType}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {moduleSpecificFields.map((field) => (
                  <DraggableFieldItem
                    key={field.id}
                    field={field}
                    isDragging={false}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {filteredFields.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Nenhum campo encontrado
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">
            Como usar:
          </h5>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Arraste campos para as seções do formulário</li>
            <li>• Solte na área azul para adicionar o campo</li>
            <li>• Use o botão X para remover campos</li>
            <li>• Salve o layout quando terminar</li>
          </ul>
        </div>

        {/* Field Statistics */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            Estatísticas:
          </h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="font-medium ml-1">{availableFields.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Módulo:</span>
              <span className="font-medium ml-1">{moduleType}</span>
            </div>
            <div>
              <span className="text-gray-500">Comuns:</span>
              <span className="font-medium ml-1">{commonFields.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Específicos:</span>
              <span className="font-medium ml-1">{moduleSpecificFields.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FieldsPalette;