
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Layers,
  MousePointer,
  Grid3x3,
  Wifi,
  WifiOff,
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';

interface StatusBarProps {
  selectedFieldsCount: number;
  totalFields: number;
  zoom: number;
  isGridVisible: boolean;
  isConnected: boolean;
  lastSaved?: Date;
  currentUser?: string;
  errors: number;
  warnings: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  selectedFieldsCount,
  totalFields,
  zoom,
  isGridVisible,
  isConnected,
  lastSaved,
  currentUser,
  errors,
  warnings
}) => {
  const formatLastSaved = (date?: Date) => {
    if (!date) return 'Nunca salvo';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Salvo agora';
    if (minutes < 60) return `Salvo há ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Salvo há ${hours}h`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-600">
      {/* Left Section - Selection Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <MousePointer className="h-3 w-3" />
          <span>
            {selectedFieldsCount > 0 
              ? `${selectedFieldsCount} selecionado${selectedFieldsCount > 1 ? 's' : ''}`
              : 'Nenhum selecionado'
            }
          </span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center space-x-1">
          <Layers className="h-3 w-3" />
          <span>{totalFields} campo{totalFields !== 1 ? 's' : ''}</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center space-x-1">
          <Grid3x3 className="h-3 w-3" />
          <span>
            Grade {isGridVisible ? 'visível' : 'oculta'}
          </span>
        </div>
      </div>

      {/* Center Section - Status Indicators */}
      <div className="flex items-center space-x-4">
        {errors > 0 && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {errors} erro{errors > 1 ? 's' : ''}
          </Badge>
        )}

        {warnings > 0 && (
          <Badge variant="secondary" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {warnings} aviso{warnings > 1 ? 's' : ''}
          </Badge>
        )}

        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-600" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-600" />
          )}
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Right Section - User & Save Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{formatLastSaved(lastSaved)}</span>
        </div>

        {currentUser && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{currentUser}</span>
            </div>
          </>
        )}

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center space-x-1">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
