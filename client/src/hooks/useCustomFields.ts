import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CustomField } from "@/components/layout/DynamicFieldRenderer";

interface UseCustomFieldsProps {
  ticketId?: string;
  entityType?: 'ticket' | 'customer' | 'user';
  entityId?: string;
}

export function useCustomFields({ ticketId, entityType = 'ticket', entityId }: UseCustomFieldsProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate unique field ID
  const generateFieldId = useCallback(() => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Load saved custom fields
  const { data: savedFields, isLoading } = useQuery({
    queryKey: ['/api/custom-fields', entityType, entityId || ticketId],
    queryFn: async () => {
      const endpoint = entityId 
        ? `/api/custom-fields/${entityType}/${entityId}`
        : `/api/custom-fields/ticket/${ticketId}`;
      
      const response = await apiRequest("GET", endpoint);
      return response.json();
    },
    enabled: !!(entityId || ticketId)
  });

  // Update fields when data is loaded
  useEffect(() => {
    if (savedFields?.fields) {
      setFields(savedFields.fields);
    }
  }, [savedFields]);

  // Save custom fields mutation
  const saveFieldsMutation = useMutation({
    mutationFn: async (fieldsToSave: CustomField[]) => {
      const endpoint = entityId 
        ? `/api/custom-fields/${entityType}/${entityId}`
        : `/api/custom-fields/ticket/${ticketId}`;
      
      const response = await apiRequest("POST", endpoint, {
        fields: fieldsToSave
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Campos customizados salvos com sucesso"
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/custom-fields', entityType, entityId || ticketId] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar campos customizados",
        variant: "destructive"
      });
    }
  });

  // Add a new field
  const addField = useCallback((fieldType: string, label: string) => {
    const newField: CustomField = {
      id: generateFieldId(),
      type: fieldType,
      label: label || `Campo ${fieldType}`,
      required: false,
      placeholder: `Digite ${label?.toLowerCase() || fieldType}...`,
      value: fieldType === 'switch' ? false : '',
      options: ['select', 'multiselect', 'radio', 'checkbox'].includes(fieldType) 
        ? [{ label: 'Opção 1', value: 'option1' }] 
        : undefined
    };

    setFields(prev => [...prev, newField]);
    
    toast({
      title: "Campo adicionado",
      description: `Campo "${newField.label}" foi adicionado ao formulário`
    });

    return newField;
  }, [generateFieldId, toast]);

  // Update a field
  const updateField = useCallback((fieldId: string, updates: Partial<CustomField>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  }, []);

  // Remove a field
  const removeField = useCallback((fieldId: string) => {
    setFields(prev => {
      const field = prev.find(f => f.id === fieldId);
      if (field) {
        toast({
          title: "Campo removido",
          description: `Campo "${field.label}" foi removido do formulário`
        });
      }
      return prev.filter(f => f.id !== fieldId);
    });
  }, [toast]);

  // Update field value
  const updateFieldValue = useCallback((fieldId: string, value: any) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, value } : field
    ));
  }, []);

  // Save all fields
  const saveFields = useCallback(() => {
    saveFieldsMutation.mutate(fields);
  }, [fields, saveFieldsMutation]);

  // Clear all fields
  const clearFields = useCallback(() => {
    setFields([]);
    toast({
      title: "Campos limpos",
      description: "Todos os campos customizados foram removidos"
    });
  }, [toast]);

  // Get field values for form submission
  const getFieldValues = useCallback(() => {
    return fields.reduce((acc, field) => {
      acc[field.id] = field.value;
      return acc;
    }, {} as Record<string, any>);
  }, [fields]);

  // Validate required fields
  const validateFields = useCallback(() => {
    const errors: string[] = [];
    
    fields.forEach(field => {
      if (field.required && (!field.value || field.value === '')) {
        errors.push(`${field.label} é obrigatório`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: errors.join(', '),
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [fields, toast]);

  return {
    fields,
    isLoading,
    addField,
    updateField,
    removeField,
    updateFieldValue,
    saveFields,
    clearFields,
    getFieldValues,
    validateFields,
    isSaving: saveFieldsMutation.isPending
  };
}