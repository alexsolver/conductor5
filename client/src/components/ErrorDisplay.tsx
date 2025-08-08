
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onNavigateHome?: () => void;
  onNavigateSettings?: () => void;
}

export function ErrorDisplay({ error, onRetry, onNavigateHome, onNavigateSettings }: ErrorDisplayProps) {
  const errorType = error?.code || 'UNKNOWN_ERROR';
  const isSchemaError = ['TABLE_NOT_FOUND', 'MISSING_COLUMNS', 'MISSING_COLUMN'].includes(errorType);
  const isPermissionError = errorType === 'PERMISSION_DENIED';
  
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className={`mb-4 ${isPermissionError ? 'text-orange-500' : 'text-red-500'}`}>
          <h4 className="text-lg font-medium mb-2">
            {isSchemaError ? '🗄️ Problema de Esquema de Banco' :
             isPermissionError ? '🔒 Problema de Permissão' :
             '❌ Erro ao carregar dados'}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            {error?.message || 'Não foi possível carregar os dados.'}
          </p>
        </div>
        
        <div className="flex gap-2 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              🔄 Tentar novamente
            </Button>
          )}
          {isSchemaError && onNavigateSettings && (
            <Button onClick={onNavigateSettings} variant="secondary">
              ⚙️ Verificar configurações
            </Button>
          )}
          {onNavigateHome && (
            <Button onClick={onNavigateHome} variant="ghost">
              🏠 Voltar ao Dashboard
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
