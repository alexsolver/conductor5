import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Types for field layout management
export interface FieldConfiguration {
  id: string;
  moduleType: string;
  pageType: string;
  fieldType: string;
  label: string;
  section: string;
  position: number;
  isRequired: boolean;
  isVisible: boolean;
  validationRules?: Record<string, any>;
  componentProps?: Record<string, any>;
  customId?: string;
}

export interface LayoutSection {
  id: string;
  name: string;
  description: string;
  position: number;
  fields: FieldConfiguration[];
}

export interface FieldLayout {
  id: string;
  moduleType: string;
  pageType: string;
  customerId?: string;
  sections: LayoutSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseFieldLayoutProps {
  moduleType: string;
  pageType: string;
  customerId?: string;
}

export function useFieldLayout({ moduleType, pageType, customerId }: UseFieldLayoutProps) {
  const queryClient = useQueryClient();
  
  // Fetch current layout configuration
  const { data: layout, isLoading, error } = useQuery({
    queryKey: ['field-layout', moduleType, pageType, customerId],
    queryFn: async () => {
      const endpoint = customerId 
        ? `/api/field-layouts/${moduleType}/${pageType}/customer/${customerId}`
        : `/api/field-layouts/${moduleType}/${pageType}`;
      
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      return data.layout as FieldLayout;
    },
  });

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layoutData: Partial<FieldLayout>) => {
      const endpoint = customerId 
        ? `/api/field-layouts/${moduleType}/${pageType}/customer/${customerId}`
        : `/api/field-layouts/${moduleType}/${pageType}`;
      
      const response = await apiRequest('POST', endpoint, layoutData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['field-layout', moduleType, pageType, customerId] 
      });
    }
  });

  // Field manipulation functions
  const addField = useCallback((field: Omit<FieldConfiguration, 'id' | 'position'>, sectionId: string) => {
    if (!layout) return;

    const section = layout.sections.find(s => s.id === sectionId);
    if (!section) return;

    const newField: FieldConfiguration = {
      ...field,
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: section.fields.length,
    };

    const updatedLayout = {
      ...layout,
      sections: layout.sections.map(s => 
        s.id === sectionId 
          ? { ...s, fields: [...s.fields, newField] }
          : s
      )
    };

    return saveLayoutMutation.mutate(updatedLayout);
  }, [layout, saveLayoutMutation]);

  const removeField = useCallback((fieldId: string) => {
    if (!layout) return;

    const updatedLayout = {
      ...layout,
      sections: layout.sections.map(section => ({
        ...section,
        fields: section.fields
          .filter(f => f.id !== fieldId)
          .map((field, index) => ({ ...field, position: index }))
      }))
    };

    return saveLayoutMutation.mutate(updatedLayout);
  }, [layout, saveLayoutMutation]);

  const updateField = useCallback((fieldId: string, updates: Partial<FieldConfiguration>) => {
    if (!layout) return;

    const updatedLayout = {
      ...layout,
      sections: layout.sections.map(section => ({
        ...section,
        fields: section.fields.map(field => 
          field.id === fieldId ? { ...field, ...updates } : field
        )
      }))
    };

    return saveLayoutMutation.mutate(updatedLayout);
  }, [layout, saveLayoutMutation]);

  const moveField = useCallback((fieldId: string, fromSectionId: string, toSectionId: string, newPosition: number) => {
    if (!layout) return;

    // Find the field to move
    const fromSection = layout.sections.find(s => s.id === fromSectionId);
    const fieldToMove = fromSection?.fields.find(f => f.id === fieldId);
    
    if (!fieldToMove) return;

    const updatedLayout = {
      ...layout,
      sections: layout.sections.map(section => {
        if (section.id === fromSectionId) {
          // Remove field from source section
          return {
            ...section,
            fields: section.fields
              .filter(f => f.id !== fieldId)
              .map((field, index) => ({ ...field, position: index }))
          };
        }
        
        if (section.id === toSectionId) {
          // Add field to target section
          const updatedFields = [...section.fields];
          updatedFields.splice(newPosition, 0, { ...fieldToMove, position: newPosition });
          
          return {
            ...section,
            fields: updatedFields.map((field, index) => ({ ...field, position: index }))
          };
        }
        
        return section;
      })
    };

    return saveLayoutMutation.mutate(updatedLayout);
  }, [layout, saveLayoutMutation]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    const defaultLayout: Partial<FieldLayout> = {
      moduleType,
      pageType,
      customerId,
      sections: [
        {
          id: 'main',
          name: 'Seção Principal',
          description: 'Campos principais do formulário',
          position: 0,
          fields: []
        },
        {
          id: 'details',
          name: 'Detalhes',
          description: 'Informações detalhadas',
          position: 1,
          fields: []
        },
        {
          id: 'metadata',
          name: 'Metadados',
          description: 'Informações adicionais',
          position: 2,
          fields: []
        },
        {
          id: 'sidebar',
          name: 'Barra Lateral',
          description: 'Informações de apoio',
          position: 3,
          fields: []
        }
      ],
      isActive: true
    };

    return saveLayoutMutation.mutate(defaultLayout);
  }, [moduleType, pageType, customerId, saveLayoutMutation]);

  // Get fields by section
  const getFieldsBySection = useCallback((sectionId: string): FieldConfiguration[] => {
    if (!layout) return [];
    
    const section = layout.sections.find(s => s.id === sectionId);
    return section?.fields.sort((a, b) => a.position - b.position) || [];
  }, [layout]);

  // Get all fields flattened
  const getAllFields = useCallback((): FieldConfiguration[] => {
    if (!layout) return [];
    
    return layout.sections.flatMap(section => section.fields);
  }, [layout]);

  return {
    // Data
    layout,
    isLoading,
    error,
    
    // Mutations
    isSaving: saveLayoutMutation.isPending,
    saveError: saveLayoutMutation.error,
    
    // Field manipulation
    addField,
    removeField,
    updateField,
    moveField,
    resetLayout,
    
    // Queries
    getFieldsBySection,
    getAllFields,
    
    // Direct save
    saveLayout: saveLayoutMutation.mutate
  };
}

export default useFieldLayout;