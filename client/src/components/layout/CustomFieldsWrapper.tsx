import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Layout,
  Plus
} from 'lucide-react';
import FieldLayoutManager from './FieldLayoutManager';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import useFieldLayout from '@/hooks/useFieldLayout';

interface CustomFieldsWrapperProps {
  moduleType: 'customers' | 'tickets' | 'beneficiaries' | 'habilidades' | 'materials' | 'services' | 'locais';
  pageType: 'create' | 'edit' | 'details' | 'list';
  form: UseFormReturn<any>;
  hasDesignPermission: boolean;
  onFieldChange?: (fieldKey: string, value: any) => void;
  customerId?: string;
  children: React.ReactNode;
}

export function CustomFieldsWrapper({
  moduleType,
  pageType,
  form,
  hasDesignPermission,
  onFieldChange,
  customerId,
  children
}: CustomFieldsWrapperProps) {
  const { t } = useTranslation();
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(true);

  const {
    layout,
    isLoading,
    getAllFields,
  } = useFieldLayout({
    moduleType,
    pageType,
    customerId
  });

  const customFields = getAllFields();
  const hasCustomFields = customFields.length > 0;

  // Design mode toggle button
  const DesignModeToggle = () => {
    if (!hasDesignPermission) return null;

    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col gap-2">
          {/* Custom Fields Toggle */}
          {hasCustomFields && !isDesignMode && (
            <Button
              variant={showCustomFields ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCustomFields(!showCustomFields)}
              className="shadow-lg"
            >
              {showCustomFields ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showCustomFields ? t('customFields.hide') : t('customFields.show')} {t('customFields.fields')}
            </Button>
          )}

          {/* Design Mode Toggle */}
          <Button
            variant={isDesignMode ? "destructive" : "secondary"}
            size="sm"
            onClick={() => setIsDesignMode(!isDesignMode)}
            className="shadow-lg"
          >
            {isDesignMode ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                {t('customFields.exitDesign')}
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-1" />
                {t('customFields.editLayout')}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Custom fields indicator
  const CustomFieldsIndicator = () => {
    if (!hasCustomFields || isDesignMode) return null;

    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {t('customFields.activeCustomFields')}
            </span>
            <Badge variant="secondary">
              {customFields.length} {customFields.length === 1 ? t('customFields.field') : t('customFields.fields')}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomFields(!showCustomFields)}
            className="text-blue-700 hover:bg-blue-100"
          >
            {showCustomFields ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Ocultar
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Mostrar
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Empty state for no custom fields
  const EmptyCustomFieldsState = () => {
    if (hasCustomFields || !hasDesignPermission || isDesignMode) return null;

    return (
      <div className="mb-4 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <Plus className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            {t('customFields.noFieldsConfigured', { moduleType })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDesignMode(true)}
          >
            <Settings className="h-3 w-3 mr-1" />
            {t('customFields.configureFields')}
          </Button>
        </div>
      </div>
    );
  };

  // If design mode is active, show the layout manager
  if (isDesignMode) {
    return (
      <>
        <FieldLayoutManager
          moduleType={moduleType}
          pageType={pageType}
          isDesignMode={isDesignMode}
          onDesignModeChange={setIsDesignMode}
          hasDesignPermission={hasDesignPermission}
        />
        <div className="mt-6">
          {children}
        </div>
        <DesignModeToggle />
      </>
    );
  }

  // Normal mode - show original content with custom fields
  return (
    <div>
      <CustomFieldsIndicator />
      <EmptyCustomFieldsState />
      
      {/* Original Page Content */}
      {children}
      
      {/* Custom Fields Section */}
      {hasCustomFields && showCustomFields && (
        <div className="mt-6">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Layout className="h-5 w-5 text-blue-600" />
              {t('customFields.title')}
            </h3>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <DynamicFormRenderer
                form={form}
                fields={customFields}
                onFieldChange={onFieldChange}
                isReadOnly={pageType === 'details'}
              />
            )}
          </div>
        </div>
      )}

      <DesignModeToggle />
      
      {/* Always visible design mode hint for demonstration */}
      {!isDesignMode && hasDesignPermission && (
        <div className="fixed bottom-6 left-6 z-50">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-start gap-2 mb-3">
              <Settings className="h-4 w-4 text-purple-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-purple-900">🎯 Sistema Drag & Drop Ativo</p>
                <p className="text-purple-700">Clique no botão "Editar Layout" (canto inferior direito) para arrastar campos personalizados para o formulário</p>
              </div>
            </div>
            <div className="border-t border-purple-200 pt-3">
              <Button
                variant="outline" 
                size="sm"
                onClick={() => window.open('/drag-drop-demo', '_blank')}
                className="w-full text-purple-700 border-purple-300 hover:bg-purple-50"
              >
                🚀 Ver Demo Completa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomFieldsWrapper;