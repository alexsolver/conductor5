import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CustomFieldMetadata, ModuleType, FieldType } from '../../../shared/schema-custom-fields';

// ===========================
// COMPONENT PROPS
// ===========================

interface DynamicCustomFieldsProps {
  moduleType: ModuleType;
  entityId?: string; // Para edição
  values?: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  errors?: Record<string, string>;
  readOnly?: boolean;
  showLabels?: boolean;
  className?: string;
}

// ===========================
// FIELD TYPE RENDERERS
// ===========================

interface FieldRendererProps {
  field: CustomFieldMetadata;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  readOnly?: boolean;
}

const TextFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => (
  <div className="space-y-1">
    <Input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.fieldLabel}
      disabled={readOnly}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const NumberFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => (
  <div className="space-y-1">
    <Input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      placeholder={field.fieldLabel}
      disabled={readOnly}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const TextareaFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => (
  <div className="space-y-1">
    <Textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.fieldLabel}
      disabled={readOnly}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const EmailFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => (
  <div className="space-y-1">
    <Input
      type="email"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.fieldLabel}
      disabled={readOnly}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const PhoneFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => (
  <div className="space-y-1">
    <Input
      type="tel"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.fieldLabel}
      disabled={readOnly}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const BooleanFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => (
  <div className="flex items-center space-x-2">
    <Switch
      checked={!!value}
      onCheckedChange={onChange}
      disabled={readOnly}
    />
    <span className="text-sm">{field.fieldLabel}</span>
    {error && <p className="text-sm text-red-500 ml-2">{error}</p>}
  </div>
);

const DateFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => (
  <div className="space-y-1">
    <DatePicker
      value={value ? new Date(value) : undefined}
      onChange={(date) => onChange(date?.toISOString())}
      disabled={readOnly}
      placeholder={field.fieldLabel}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const SelectFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => {
  const options = Array.isArray(field.fieldOptions) ? field.fieldOptions : [];
  
  return (
    <div className="space-y-1">
      <Select 
        value={value || ''} 
        onValueChange={onChange}
        disabled={readOnly}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={`Selecione ${field.fieldLabel}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option: any) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.color && (
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

const MultiSelectFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => {
  const options = Array.isArray(field.fieldOptions) ? field.fieldOptions : [];
  const selectedValues = Array.isArray(value) ? value : [];
  
  const handleOptionToggle = (optionValue: string) => {
    if (readOnly) return;
    
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];
    
    onChange(newValues);
  };
  
  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {options.map((option: any) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${field.fieldName}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => handleOptionToggle(option.value)}
              disabled={readOnly}
            />
            <label 
              htmlFor={`${field.fieldName}-${option.value}`}
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              {option.color && (
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedValues.map((val: string) => {
            const option = options.find((opt: any) => opt.value === val);
            return option ? (
              <Badge key={val} variant="secondary" className="text-xs">
                {option.label}
                {!readOnly && (
                  <button
                    onClick={() => handleOptionToggle(val)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ) : null;
          })}
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

const FileFieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, value, onChange, error, readOnly 
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload the file to a server
      // For now, we'll just store the file name
      onChange(file.name);
    }
  };
  
  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="flex items-center gap-2">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id={`file-${field.fieldName}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`file-${field.fieldName}`)?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Selecionar Arquivo
          </Button>
        </div>
      )}
      {value && (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

// ===========================
// FIELD RENDERER MAP
// ===========================

const FIELD_RENDERERS: Record<FieldType, React.FC<FieldRendererProps>> = {
  text: TextFieldRenderer,
  number: NumberFieldRenderer,
  textarea: TextareaFieldRenderer,
  email: EmailFieldRenderer,
  phone: PhoneFieldRenderer,
  boolean: BooleanFieldRenderer,
  date: DateFieldRenderer,
  select: SelectFieldRenderer,
  multiselect: MultiSelectFieldRenderer,
  file: FileFieldRenderer
};

// ===========================
// MAIN COMPONENT
// ===========================

const DynamicCustomFields: React.FC<DynamicCustomFieldsProps> = ({
  moduleType,
  entityId,
  values = {},
  onChange,
  errors = {},
  readOnly = false,
  showLabels = true,
  className = ''
}) => {
  const { toast } = useToast();

  // ===========================
  // DATA QUERIES
  // ===========================

  const { data: fields = [], isLoading, error } = useQuery({
    queryKey: ['/api/custom-fields/fields', moduleType],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/custom-fields/fields/${moduleType}`);
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  const { data: entityValues = {}, isLoading: valuesLoading } = useQuery({
    queryKey: ['/api/custom-fields/values', moduleType, entityId],
    queryFn: async () => {
      if (!entityId) return {};
      const response = await apiRequest('GET', `/api/custom-fields/values/${moduleType}/${entityId}`);
      const result = await response.json();
      return result.success ? result.data : {};
    },
    enabled: !!entityId
  });

  // ===========================
  // EFFECTS
  // ===========================

  // Merge entity values with passed values
  useEffect(() => {
    if (entityId && entityValues) {
      Object.entries(entityValues).forEach(([fieldName, value]) => {
        if (!values.hasOwnProperty(fieldName)) {
          onChange(fieldName, value);
        }
      });
    }
  }, [entityValues, entityId, onChange, values]);

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderField = (field: CustomFieldMetadata) => {
    const FieldRenderer = FIELD_RENDERERS[field.fieldType as FieldType];
    const fieldValue = values[field.fieldName];
    const fieldError = errors[field.fieldName];

    if (!FieldRenderer) {
      console.warn(`No renderer found for field type: ${field.fieldType}`);
      return null;
    }

    const fieldContent = (
      <FieldRenderer
        field={field}
        value={fieldValue}
        onChange={(value) => onChange(field.fieldName, value)}
        error={fieldError}
        readOnly={readOnly}
      />
    );

    if (!showLabels || field.fieldType === 'boolean') {
      return fieldContent;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            {field.fieldLabel}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        {fieldContent}
      </div>
    );
  };

  // ===========================
  // LOADING AND ERROR STATES
  // ===========================

  if (isLoading || valuesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Carregando campos customizados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-sm text-red-600">
            Erro ao carregar campos customizados. Tente novamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (fields.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600 text-center">
            Nenhum campo customizado configurado para este módulo.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className={`space-y-4 ${className}`}>
      {fields.map((field: CustomFieldMetadata) => (
        <div key={field.id} className="space-y-1">
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};

export default DynamicCustomFields;