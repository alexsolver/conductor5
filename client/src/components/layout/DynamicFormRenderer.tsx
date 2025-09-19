import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarIcon,
  Type,
  AlignLeft,
  ChevronDown,
  Hash,
  Mail,
  Phone,
  CheckSquare,
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
import { FieldConfiguration } from '@/hooks/useFieldLayout';

interface DynamicFormRendererProps {
  form: UseFormReturn<any>;
  fields: FieldConfiguration[];
  onFieldChange?: (fieldKey: string, value: any) => void;
  isReadOnly?: boolean;
  className?: string;
}

const getIconComponent = (iconName: string) => {
  const icons = {
    Type, AlignLeft, ChevronDown, Hash, CalendarIcon, CheckSquare, Mail, Phone,
    AlertTriangle, Circle, Tag, User, Building, MapPin, Users, Package, Truck, DollarSign
  };
  return icons[iconName as keyof typeof icons] || Type;
};

const renderFieldByType = (
  field: FieldConfiguration,
  form: UseFormReturn<any>,
  onFieldChange?: (fieldKey: string, value: any) => void,
  isReadOnly?: boolean
) => {
  const fieldKey = field.customId || field.id;
  const IconComponent = getIconComponent((field as any).icon || 'Type');

  const handleChange = (value: any) => {
    if (onFieldChange) {
      onFieldChange(fieldKey, value);
    }
  };

  switch (field.fieldType) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <FormField
          control={form.control}
          name={fieldKey}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {field.label}
                {field.isRequired && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  {...formField}
                  type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : 'text'}
                  placeholder={`Digite ${field.label.toLowerCase()}`}
                  disabled={isReadOnly}
                  onChange={(e) => {
                    formField.onChange(e);
                    handleChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case 'textarea':
      return (
        <FormField
          control={form.control}
          name={fieldKey}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {field.label}
                {field.isRequired && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...formField}
                  placeholder={`Digite ${field.label.toLowerCase()}`}
                  disabled={isReadOnly}
                  rows={4}
                  onChange={(e) => {
                    formField.onChange(e);
                    handleChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case 'number':
    case 'price':
      return (
        <FormField
          control={form.control}
          name={fieldKey}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {field.label}
                {field.isRequired && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  {...formField}
                  type="number"
                  placeholder={`Digite ${field.label.toLowerCase()}`}
                  disabled={isReadOnly}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    formField.onChange(value);
                    handleChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case 'select':
    case 'priority':
    case 'status':
    case 'category':
      const options = field.componentProps?.options || [
        { value: 'option1', label: 'Opção 1' },
        { value: 'option2', label: 'Opção 2' },
        { value: 'option3', label: 'Opção 3' }
      ];

      return (
        <FormField
          control={form.control}
          name={fieldKey}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {field.label}
                {field.isRequired && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <Select
                  value={formField.value}
                  onValueChange={(value) => {
                    formField.onChange(value);
                    handleChange(value);
                  }}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option: any) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case 'date':
      return (
        <FormField
          control={form.control}
          name={fieldKey}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {field.label}
                {field.isRequired && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isReadOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formField.value ? 
                        format(new Date(formField.value), "PPP", { locale: ptBR }) : 
                        `Selecione ${field.label.toLowerCase()}`
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formField.value ? new Date(formField.value) : undefined}
                      onSelect={(date) => {
                        formField.onChange(date);
                        handleChange(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case 'checkbox':
      return (
        <FormField
          control={form.control}
          name={fieldKey}
          render={({ field: formField }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={formField.value}
                  onCheckedChange={(checked) => {
                    formField.onChange(checked);
                    handleChange(checked);
                  }}
                  disabled={isReadOnly}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {field.label}
                  {field.isRequired && <span className="text-red-500">*</span>}
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    default:
      return (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500">
            <IconComponent className="h-4 w-4" />
            <span className="text-sm">
              Campo personalizado: {field.label} ({field.fieldType})
            </span>
          </div>
        </div>
      );
  }
};

export function DynamicFormRenderer({
  form,
  fields,
  onFieldChange,
  isReadOnly = false,
  className = ""
}: DynamicFormRendererProps) {
  // Group fields by section
  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, FieldConfiguration[]>);

  const getSectionTitle = (sectionId: string) => {
    const titles = {
      main: 'Campos Principais',
      details: 'Detalhes',
      metadata: 'Metadados',
      sidebar: 'Informações Adicionais'
    };
    return titles[sectionId as keyof typeof titles] || `Seção ${sectionId}`;
  };

  if (fields.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        <Type className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>Nenhum campo personalizado configurado</p>
        <p className="text-sm mt-1">
          Use o editor de layout para adicionar campos personalizados
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {Object.entries(groupedFields).map(([sectionId, sectionFields]) => {
        // Sort fields by position
        const sortedFields = sectionFields
          .filter(field => field.isVisible)
          .sort((a, b) => a.position - b.position);

        if (sortedFields.length === 0) return null;

        return (
          <Card key={sectionId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{getSectionTitle(sectionId)}</span>
                <Badge variant="secondary">
                  {sortedFields.length} {sortedFields.length === 1 ? 'campo' : 'campos'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedFields.map((field) => (
                  <div key={field.id}>
                    {renderFieldByType(field, form, onFieldChange, isReadOnly)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default DynamicFormRenderer;