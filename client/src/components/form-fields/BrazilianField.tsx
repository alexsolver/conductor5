/**
 * Brazilian Field Components
 * 
 * Componentes de campo com validação brasileira em tempo real
 * CPF, CNPJ, CEP, Telefone
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrazilianValidation, ValidationType } from '@/hooks/useBrazilianValidation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect } from 'react';

interface BrazilianFieldProps {
  type: ValidationType;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  testId?: string;
  onChange?: (value: string, rawValue: string, isValid: boolean) => void;
  initialValue?: string;
}

export function BrazilianField({
  type,
  label,
  placeholder,
  required = false,
  disabled = false,
  testId,
  onChange,
  initialValue = ''
}: BrazilianFieldProps) {
  const { value, setValue, error, isValid, rawValue } = useBrazilianValidation(type);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue, setValue]);

  useEffect(() => {
    if (onChange) {
      onChange(value, rawValue, isValid);
    }
  }, [value, rawValue, isValid, onChange]);

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (type) {
      case 'cpf': return '000.000.000-00';
      case 'cnpj': return '00.000.000/0000-00';
      case 'cep': return '00000-000';
      case 'phone': return '(00) 00000-0000';
      default: return '';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={disabled}
          data-testid={testId}
          className={`pr-10 ${error ? 'border-red-500 focus-visible:ring-red-500' : isValid && value ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
        />
        
        {value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" data-testid={`${testId}-valid-icon`} />
            ) : error ? (
              <XCircle className="h-5 w-5 text-red-500" data-testid={`${testId}-error-icon`} />
            ) : null}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500" data-testid={`${testId}-error-message`}>
          {error}
        </p>
      )}
    </div>
  );
}

// Componentes específicos para cada tipo

interface CPFFieldProps extends Omit<BrazilianFieldProps, 'type'> {}

export function CPFField(props: CPFFieldProps) {
  return <BrazilianField {...props} type="cpf" label={props.label || 'CPF'} />;
}

interface CNPJFieldProps extends Omit<BrazilianFieldProps, 'type'> {}

export function CNPJField(props: CNPJFieldProps) {
  return <BrazilianField {...props} type="cnpj" label={props.label || 'CNPJ'} />;
}

interface CEPFieldProps extends Omit<BrazilianFieldProps, 'type'> {}

export function CEPField(props: CEPFieldProps) {
  return <BrazilianField {...props} type="cep" label={props.label || 'CEP'} />;
}

interface PhoneFieldProps extends Omit<BrazilianFieldProps, 'type'> {}

export function PhoneField(props: PhoneFieldProps) {
  return <BrazilianField {...props} type="phone" label={props.label || 'Telefone'} />;
}
