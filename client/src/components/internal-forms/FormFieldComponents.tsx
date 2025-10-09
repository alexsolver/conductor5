/**
 * Form Field Components for Internal Forms
 * 
 * Componentes reutilizáveis para cada tipo de campo de formulário
 * @version 2.0.0
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  Star,
  Phone,
  DollarSign,
  Link as LinkIcon,
  Calendar,
  Clock,
  Palette,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormField } from "@shared/schema-internal-forms";
import GeolocationField from "./fields/GeolocationField";

interface FormFieldComponentProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  readOnly?: boolean;
}

// ========================================
// TEXT FIELD
// ========================================
export function TextField({ field, value, onChange, error, readOnly }: FormFieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        disabled={readOnly}
        data-testid={`input-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// TEXTAREA FIELD
// ========================================
export function TextAreaField({ field, value, onChange, error }: FormFieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={field.id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        rows={4}
        data-testid={`textarea-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// NUMBER FIELD
// ========================================
export function NumberField({ field, value, onChange, error }: FormFieldComponentProps) {
  const numberField = field.type === 'number' ? field : null;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={field.placeholder}
        required={field.required}
        min={numberField?.min}
        max={numberField?.max}
        step={numberField?.step}
        data-testid={`input-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// EMAIL FIELD
// ========================================
export function EmailField({ field, value, onChange, error }: FormFieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="email"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || "email@exemplo.com"}
        required={field.required}
        data-testid={`input-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// PHONE FIELD
// ========================================
export function PhoneField({ field, value, onChange, error }: FormFieldComponentProps) {
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        <Phone className="inline h-4 w-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="tel"
        value={value || ""}
        onChange={(e) => onChange(formatPhone(e.target.value))}
        placeholder={field.placeholder || "(11) 99999-9999"}
        required={field.required}
        maxLength={15}
        data-testid={`input-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// URL FIELD
// ========================================
export function URLField({ field, value, onChange, error }: FormFieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        <LinkIcon className="inline h-4 w-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="url"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || "https://exemplo.com"}
        required={field.required}
        data-testid={`input-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// DATE FIELD
// ========================================
export function DateField({ field, value, onChange, error }: FormFieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        <Calendar className="inline h-4 w-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        data-testid={`input-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// DATETIME FIELD
// ========================================
export function DateTimeField({ field, value, onChange, error }: FormFieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        <Clock className="inline h-4 w-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="datetime-local"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        data-testid={`input-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// SELECT FIELD
// ========================================
export function SelectField({ field, value, onChange, error }: FormFieldComponentProps) {
  const selectField = field.type === 'select' ? field : null;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger data-testid={`select-${field.name}`}>
          <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
        </SelectTrigger>
        <SelectContent>
          {selectField?.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// MULTISELECT FIELD
// ========================================
export function MultiSelectField({ field, value, onChange, error }: FormFieldComponentProps) {
  const selectField = field.type === 'multiselect' ? field : null;
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleValue = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues);
  };

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="border rounded-md p-4 space-y-2" data-testid={`multiselect-${field.name}`}>
        {selectField?.options?.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <div
              key={option.value}
              className={cn(
                "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent",
                isSelected && "bg-accent"
              )}
              onClick={() => toggleValue(option.value)}
            >
              <Checkbox checked={isSelected} />
              <span>{option.label}</span>
            </div>
          );
        })}
      </div>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map((val) => {
            const option = selectField?.options?.find((o) => o.value === val);
            return (
              <Badge key={val} variant="secondary">
                {option?.label}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => toggleValue(val)}
                />
              </Badge>
            );
          })}
        </div>
      )}
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// RADIO FIELD
// ========================================
export function RadioField({ field, value, onChange, error }: FormFieldComponentProps) {
  const radioField = field.type === 'radio' ? field : null;
  
  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <RadioGroup value={value || ""} onValueChange={onChange} data-testid={`radio-${field.name}`}>
        {radioField?.options?.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
            <Label htmlFor={`${field.id}-${option.value}`} className="font-normal cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// CHECKBOX FIELD
// ========================================
export function CheckboxField({ field, value, onChange, error }: FormFieldComponentProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={field.id}
          checked={value || false}
          onCheckedChange={onChange}
          data-testid={`checkbox-${field.name}`}
        />
        <Label htmlFor={field.id} className="cursor-pointer">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>
      {field.helpText && (
        <p className="text-sm text-muted-foreground ml-6">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500 ml-6">{error}</p>}
    </div>
  );
}

// ========================================
// FILE FIELD
// ========================================
export function FileField({ field, value, onChange, error }: FormFieldComponentProps) {
  const fileField = field.type === 'file' ? field : null;
  const files = Array.isArray(value) ? value : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    onChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        <Upload className="inline h-4 w-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="border-2 border-dashed rounded-md p-4">
        <Input
          id={field.id}
          type="file"
          onChange={handleFileChange}
          accept={fileField?.acceptedFileTypes?.join(",")}
          multiple={fileField?.maxFiles ? fileField.maxFiles > 1 : true}
          className="cursor-pointer"
          data-testid={`input-${field.name}`}
        />
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file: File, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-accent rounded"
              >
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// CURRENCY FIELD
// ========================================
export function CurrencyField({ field, value, onChange, error }: FormFieldComponentProps) {
  const currencyField = field.type === 'currency' ? field : null;
  
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = Number(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyField?.currency || 'BRL',
    }).format(amount);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        <DollarSign className="inline h-4 w-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="text"
        value={value ? formatCurrency(String(value)) : ""}
        onChange={(e) => {
          const numbers = e.target.value.replace(/\D/g, "");
          onChange(numbers);
        }}
        placeholder={field.placeholder || "R$ 0,00"}
        required={field.required}
        data-testid={`input-${field.name}`}
      />
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// COLOR FIELD
// ========================================
export function ColorField({ field, value, onChange, error }: FormFieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        <Palette className="inline h-4 w-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          id={field.id}
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 h-10"
          data-testid={`input-${field.name}`}
        />
        <Input
          type="text"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// RATING FIELD
// ========================================
export function RatingField({ field, value, onChange, error }: FormFieldComponentProps) {
  const ratingField = field.type === 'rating' ? field : null;
  const maxRating = ratingField?.maxRating || 5;
  const currentRating = value || 0;

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex gap-1" data-testid={`rating-${field.name}`}>
        {Array.from({ length: maxRating }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-6 w-6 cursor-pointer transition-colors",
              index < currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
            onClick={() => onChange(index + 1)}
          />
        ))}
      </div>
      {currentRating > 0 && (
        <p className="text-sm text-muted-foreground">
          {currentRating} de {maxRating}
        </p>
      )}
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// SIGNATURE FIELD
// ========================================
export function SignatureField({ field, value, onChange, error }: FormFieldComponentProps) {
  const [isSigned, setIsSigned] = useState(!!value);

  const handleSign = () => {
    const signature = `Assinado em ${new Date().toLocaleString('pt-BR')}`;
    onChange(signature);
    setIsSigned(true);
  };

  const handleClear = () => {
    onChange(null);
    setIsSigned(false);
  };

  return (
    <div className="space-y-2">
      <Label>
        <PenTool className="inline h-4 w-4 mr-2" />
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="border-2 border-dashed rounded-md p-4" data-testid={`signature-${field.name}`}>
        {isSigned ? (
          <div className="space-y-2">
            <div className="bg-accent p-4 rounded text-center">
              <PenTool className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Assinado</p>
              <p className="text-xs text-muted-foreground">{value}</p>
            </div>
            <Button type="button" variant="outline" onClick={handleClear} className="w-full">
              Limpar Assinatura
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={handleSign} className="w-full">
            <PenTool className="h-4 w-4 mr-2" />
            Assinar
          </Button>
        )}
      </div>
      {field.helpText && (
        <p className="text-sm text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ========================================
// DYNAMIC FIELD RENDERER
// ========================================
export function DynamicFormField(props: FormFieldComponentProps) {
  const { field } = props;

  switch (field.type) {
    case 'text':
      return <TextField {...props} />;
    case 'textarea':
      return <TextAreaField {...props} />;
    case 'number':
      return <NumberField {...props} />;
    case 'email':
      return <EmailField {...props} />;
    case 'phone':
      return <PhoneField {...props} />;
    case 'url':
      return <URLField {...props} />;
    case 'date':
      return <DateField {...props} />;
    case 'datetime':
      return <DateTimeField {...props} />;
    case 'select':
      return <SelectField {...props} />;
    case 'multiselect':
      return <MultiSelectField {...props} />;
    case 'radio':
      return <RadioField {...props} />;
    case 'checkbox':
      return <CheckboxField {...props} />;
    case 'file':
      return <FileField {...props} />;
    case 'currency':
      return <CurrencyField {...props} />;
    case 'color':
      return <ColorField {...props} />;
    case 'rating':
      return <RatingField {...props} />;
    case 'signature':
      return <SignatureField {...props} />;
    case 'geolocation':
      const geoField = field.type === 'geolocation' ? field : null;
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <GeolocationField
            value={props.value}
            onChange={props.onChange}
            required={field.required}
            allowManualEntry={geoField?.allowManualEntry}
            autoDetect={geoField?.autoDetect}
            showMap={geoField?.showMap}
            mapZoom={geoField?.mapZoom}
            allowMarkerDrag={geoField?.allowMarkerDrag}
          />
          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
          {props.error && <p className="text-sm text-red-500">{props.error}</p>}
        </div>
      );
    default:
      return <TextField {...props} />;
  }
}
