import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customMessage?: string;
  };
}

interface InternalForm {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
}

interface FormFillerProps {
  form: InternalForm;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function FormFiller({ form, onSubmit, onCancel, isSubmitting = false }: FormFillerProps) {
  // Build Zod schema dynamically based on form fields
  const buildZodSchema = () => {
    const schemaFields: Record<string, any> = {};

    form.fields.forEach((field) => {
      let fieldSchema: any;

      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'phone':
          fieldSchema = z.string();
          if (field.validation?.min) {
            fieldSchema = fieldSchema.min(field.validation.min, `Mínimo de ${field.validation.min} caracteres`);
          }
          if (field.validation?.max) {
            fieldSchema = fieldSchema.max(field.validation.max, `Máximo de ${field.validation.max} caracteres`);
          }
          if (field.type === 'email') {
            fieldSchema = fieldSchema.email('Email inválido');
          }
          if (field.validation?.pattern) {
            fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern), field.validation.customMessage || 'Formato inválido');
          }
          break;

        case 'number':
          fieldSchema = z.coerce.number();
          if (field.validation?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation.min, `Valor mínimo: ${field.validation.min}`);
          }
          if (field.validation?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation.max, `Valor máximo: ${field.validation.max}`);
          }
          break;

        case 'date':
          fieldSchema = z.date();
          break;

        case 'select':
        case 'radio':
          fieldSchema = z.string();
          break;

        case 'multiselect':
          fieldSchema = z.array(z.string());
          break;

        case 'checkbox':
          fieldSchema = z.boolean();
          break;

        default:
          fieldSchema = z.string();
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.id] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  const formSchema = buildZodSchema();

  // Build default values
  const defaultValues: Record<string, any> = {};
  form.fields.forEach((field) => {
    if (field.type === 'checkbox') {
      defaultValues[field.id] = false;
    } else if (field.type === 'multiselect') {
      defaultValues[field.id] = [];
    } else {
      defaultValues[field.id] = '';
    }
  });

  const reactHookForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <FormField
            key={field.id}
            control={reactHookForm.control}
            name={field.id}
            render={({ field: hookField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    {...hookField}
                    placeholder={field.placeholder}
                    type={field.type}
                    data-testid={`input-${field.id}`}
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
            key={field.id}
            control={reactHookForm.control}
            name={field.id}
            render={({ field: hookField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...hookField}
                    placeholder={field.placeholder}
                    rows={4}
                    data-testid={`textarea-${field.id}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'number':
        return (
          <FormField
            key={field.id}
            control={reactHookForm.control}
            name={field.id}
            render={({ field: hookField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    {...hookField}
                    placeholder={field.placeholder}
                    type="number"
                    data-testid={`input-number-${field.id}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'date':
        return (
          <FormField
            key={field.id}
            control={reactHookForm.control}
            name={field.id}
            render={({ field: hookField }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !hookField.value && "text-muted-foreground"
                        )}
                        data-testid={`button-date-${field.id}`}
                      >
                        {hookField.value ? (
                          format(hookField.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={hookField.value}
                      onSelect={hookField.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            key={field.id}
            control={reactHookForm.control}
            name={field.id}
            render={({ field: hookField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <Select onValueChange={hookField.onChange} defaultValue={hookField.value}>
                  <FormControl>
                    <SelectTrigger data-testid={`select-${field.id}`}>
                      <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'radio':
        return (
          <FormField
            key={field.id}
            control={reactHookForm.control}
            name={field.id}
            render={({ field: hookField }) => (
              <FormItem className="space-y-3">
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={hookField.onChange}
                    defaultValue={hookField.value}
                    className="flex flex-col space-y-1"
                  >
                    {field.options?.map((option) => (
                      <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={option.value} data-testid={`radio-${field.id}-${option.value}`} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'checkbox':
        return (
          <FormField
            key={field.id}
            control={reactHookForm.control}
            name={field.id}
            render={({ field: hookField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={hookField.value}
                    onCheckedChange={hookField.onChange}
                    data-testid={`checkbox-${field.id}`}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </FormLabel>
                  {field.placeholder && (
                    <FormDescription>{field.placeholder}</FormDescription>
                  )}
                </div>
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  const handleSubmit = (data: Record<string, any>) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{form.name}</h2>
        {form.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{form.description}</p>
        )}
      </div>

      <Form {...reactHookForm}>
        <form onSubmit={reactHookForm.handleSubmit(handleSubmit)} className="space-y-6">
          {form.fields.map((field) => renderField(field))}

          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-submit-form"
            >
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
