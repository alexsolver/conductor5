import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Check } from 'lucide-react';

interface ActionCardProps {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  category: string;
  enabled: boolean;
  config?: Record<string, any>;
  status?: 'configured' | 'partial' | 'unconfigured';
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
}

export function ActionCard({
  id,
  type,
  name,
  description,
  icon: Icon,
  color,
  category,
  enabled,
  config = {},
  status = 'unconfigured',
  onToggle,
  onConfigure
}: ActionCardProps) {
  // Determinar o preview da configuração
  const getConfigPreview = () => {
    const configEntries = Object.entries(config).filter(([_, value]) => value);
    if (configEntries.length === 0) return null;
    
    if (configEntries.length === 1) {
      const [key, value] = configEntries[0];
      return `${key}: ${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}`;
    }
    
    return `${configEntries.length} configurações`;
  };

  const configPreview = getConfigPreview();

  // Determinar badge de status
  const getStatusBadge = () => {
    if (!enabled) return null;
    
    switch (status) {
      case 'configured':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 gap-1">
            <Check className="h-3 w-3" />
            Configurado
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
            Parcial
          </Badge>
        );
      case 'unconfigured':
        return (
          <Badge variant="outline">
            Não configurado
          </Badge>
        );
    }
  };

  return (
    <Card 
      className={`relative transition-all hover:shadow-md ${
        enabled ? 'ring-2 ring-blue-200 dark:ring-blue-800' : 'opacity-60'
      }`}
      data-testid={`action-card-${type}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            id={`action-${id}`}
            checked={enabled}
            onCheckedChange={onToggle}
            className="mt-1"
            data-testid={`checkbox-${type}`}
          />

          {/* Ícone colorido */}
          <div className={`flex-shrink-0 p-2 ${color} rounded-lg text-white`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <label 
                  htmlFor={`action-${id}`}
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  {name}
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {description}
                </p>
              </div>
              
              {getStatusBadge()}
            </div>

            {/* Preview da configuração */}
            {configPreview && enabled && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 truncate">
                {configPreview}
              </div>
            )}

            {/* Botão configurar */}
            {enabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onConfigure}
                className="mt-2 w-full justify-center gap-2"
                data-testid={`configure-${type}`}
              >
                <Settings className="h-3 w-3" />
                {status === 'configured' ? 'Editar configuração' : 'Configurar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
