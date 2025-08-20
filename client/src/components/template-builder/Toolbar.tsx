import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Undo2, 
  Redo2, 
  Save, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Grid3x3, 
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Settings,
  Play,
  Palette
} from 'lucide-react';
interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreview: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleGrid: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onSettings: () => void;
  onTest: () => void;
  onTheme: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  hasSelection: boolean;
  isDirty: boolean;
}
export const Toolbar: React.FC<ToolbarProps> = ({
  onUndo,
  onRedo,
  onSave,
  onPreview,
  onZoomIn,
  onZoomOut,
  onToggleGrid,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onSettings,
  onTest,
  onTheme,
  canUndo,
  canRedo,
  zoom,
  hasSelection,
  isDirty
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm>
      {/* Left Section - File Operations */}
      <div className="flex items-center space-x-2>
        <div className="flex items-center space-x-1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className=""
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar
            {isDirty && <Badge variant="secondary" className="text-lg">"•</Badge>}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreview}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTest}
          >
            <Play className="h-4 w-4 mr-1" />
            Testar
          </Button>
        </div>
        <Separator orientation="vertical" className="h-6" />
        {/* Undo/Redo */}
        <div className="flex items-center space-x-1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <Separator orientation="vertical" className="h-6" />
        {/* Clipboard Operations */}
        <div className="flex items-center space-x-1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            disabled={!hasSelection}
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCut}
            disabled={!hasSelection}
          >
            <Scissors className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onPaste}
          >
            <Clipboard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={!hasSelection}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Center Section - Alignment */}
      <div className="flex items-center space-x-1>
        <div className="flex items-center space-x-1 bg-gray-50 rounded-md p-1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAlignLeft}
            disabled={!hasSelection}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onAlignCenter}
            disabled={!hasSelection}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onAlignRight}
            disabled={!hasSelection}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Right Section - View & Settings */}
      <div className="flex items-center space-x-2>
        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-gray-50 rounded-md p-1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium px-2 min-w-[60px] text-center>
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <Separator orientation="vertical" className="h-6" />
        {/* View Options */}
        <div className="flex items-center space-x-1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleGrid}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTheme}
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
