import React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalization } from '@/hooks/useLocalization';

interface FormValidationFeedbackProps {
  isValidating?: boolean;
  isValid?: boolean;
  isInvalid?: boolean;
  validationMessage?: string;
  className?: string;
  fieldName?: string;
}

export const FormValidationFeedback: React.FC<FormValidationFeedbackProps> = ({
  const { t } = useLocalization();

  isValidating = false,
  isValid = false,
  isInvalid = false,
  validationMessage,
  className = "",
  fieldName = "campo"
}) => {
  if (isValidating) {
    return (
      <div 
        className={cn("flex items-center gap-2 text-blue-600 text-sm mt-1", className)}
        role="status"
        aria-label={`Validando ${fieldName}...`}
        aria-live="polite"
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        <span>Validando...</span>
      </div>
    );
  }

  if (isValid && !isInvalid) {
    return (
      <div 
        className={cn("flex items-center gap-2 text-green-600 text-sm mt-1", className)}
        role="status"
        aria-label={`${fieldName} válido`}
        aria-live="polite"
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        <span>Válido</span>
      </div>
    );
  }

  if (isInvalid && validationMessage) {
    return (
      <div 
        className={cn("flex items-center gap-2 text-red-600 text-sm mt-1", className)}
        role="alert"
        aria-label={{t('FormValidationFeedback.tsx.erroEmFieldnameValidationmessage')}}
        aria-live="assertive"
      >
        <AlertCircle className="h-3 w-3" aria-hidden="true" />
        <span>{validationMessage}</span>
      </div>
    );
  }

  return null;
};

// Enhanced form field wrapper with accessibility
export const AccessibleFormField: React.FC<{
  children: React.ReactNode;
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
}> = ({ children, label, required = false, error, description, className = "" }) => {
  const fieldId = React.useId();
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className={cn("space-y-2", className)}>
      <label 
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="obrigatório">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-gray-600"
        >
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [
            description ? descriptionId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required
        })}
      </div>
      
      {error && (
        <FormValidationFeedback
          isInvalid={true}
          validationMessage={error}
          fieldName={label}
          className="mt-1"
        />
      )}
    </div>
  );
};