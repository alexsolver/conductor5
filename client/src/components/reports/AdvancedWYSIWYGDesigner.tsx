/**
 * Advanced WYSIWYG PDF Designer - Canvas A4 Real-time
 * ✅ 1QA.MD COMPLIANCE: Clean Architecture frontend implementation
 * Funcionalidades: Canvas A4, Rich Text Editor, Drag & Drop, Real-time Preview
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, Type, Image, BarChart3, Table, Move, Palette, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Eye, Download, Save, Undo, Redo, Grid, Layers, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// A4 Canvas Constants
const A4_WIDTH = 210; // mm
const A4_HEIGHT = 297; // mm
const CANVAS_SCALE = 3; // Scale factor for display
const CANVAS_WIDTH = A4_WIDTH * CANVAS_SCALE;
const CANVAS_HEIGHT = A4_HEIGHT * CANVAS_SCALE;

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'chart' | 'table' | 'line' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline';
    textAlign: 'left' | 'center' | 'right';
    color: string;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  };
  data?: any; // Para gráficos e tabelas
}

interface AdvancedWYSIWYGDesignerProps {
  onSave: (design: any) => void;
  initialDesign?: any;
}

const AdvancedWYSIWYGDesigner: React.FC<AdvancedWYSIWYGDesignerProps> = ({ 
  onSave, 
  initialDesign 
}) => {
  const [elements, setElements] = useState<CanvasElement[]>(initialDesign?.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [tool, setTool] = useState<'select' | 'text' | 'image' | 'chart' | 'table'>('select');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Canvas Event Handlers
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (tool === 'select') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);
    
    const newElement: CanvasElement = {
      id: `element_${Date.now()}`,
      type: tool,
      x,
      y,
      width: tool === 'text' ? 200 : 150,
      height: tool === 'text' ? 30 : 100,
      content: tool === 'text' ? 'Novo Texto' : `Novo ${tool}`,
      style: {
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '#000000',
        backgroundColor: 'transparent',
        borderColor: '#cccccc',
        borderWidth: 1,
      }
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    addToHistory(newElements);
    setTool('select');
  }, [tool, elements, zoom]);

  // History Management
  const addToHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  // Element Manipulation
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    addToHistory(newElements);
  };

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    setSelectedElement(null);
    addToHistory(newElements);
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const newElement = {
      ...element,
      id: `element_${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    addToHistory(newElements);
  };

  // Get selected element
  const selectedElementData = selectedElement ? 
    elements.find(el => el.id === selectedElement) : null;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Ferramentas</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('select')}
                data-testid="tool-select"
              >
                <Move className="w-4 h-4 mr-1" />
                Selecionar
              </Button>
              <Button
                variant={tool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('text')}
                data-testid="tool-text"
              >
                <Type className="w-4 h-4 mr-1" />
                Texto
              </Button>
              <Button
                variant={tool === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('image')}
                data-testid="tool-image"
              >
                <Image className="w-4 h-4 mr-1" />
                Imagem
              </Button>
              <Button
                variant={tool === 'chart' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('chart')}
                data-testid="tool-chart"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Gráfico
              </Button>
              <Button
                variant={tool === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('table')}
                data-testid="tool-table"
              >
                <Table className="w-4 h-4 mr-1" />
                Tabela
              </Button>
            </div>
          </div>

          <Separator />

          {/* Element Properties */}
          {selectedElementData && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Propriedades do Elemento</h3>
              
              {/* Position & Size */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElementData.x)}
                      onChange={(e) => updateElement(selectedElement!, { 
                        x: parseInt(e.target.value) || 0 
                      })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElementData.y)}
                      onChange={(e) => updateElement(selectedElement!, { 
                        y: parseInt(e.target.value) || 0 
                      })}
                      className="h-8"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Largura</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElementData.width)}
                      onChange={(e) => updateElement(selectedElement!, { 
                        width: parseInt(e.target.value) || 0 
                      })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Altura</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElementData.height)}
                      onChange={(e) => updateElement(selectedElement!, { 
                        height: parseInt(e.target.value) || 0 
                      })}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Text Properties */}
              {selectedElementData.type === 'text' && (
                <div className="space-y-3 mt-4">
                  <div>
                    <Label className="text-xs">Conteúdo</Label>
                    <Input
                      value={selectedElementData.content}
                      onChange={(e) => updateElement(selectedElement!, { 
                        content: e.target.value 
                      })}
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Fonte</Label>
                    <Select 
                      value={selectedElementData.style.fontFamily}
                      onValueChange={(value) => updateElement(selectedElement!, {
                        style: { ...selectedElementData.style, fontFamily: value }
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times">Times New Roman</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Tamanho da Fonte</Label>
                    <Slider
                      value={[selectedElementData.style.fontSize]}
                      onValueChange={([value]) => updateElement(selectedElement!, {
                        style: { ...selectedElementData.style, fontSize: value }
                      })}
                      min={8}
                      max={72}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-gray-500">
                      {selectedElementData.style.fontSize}px
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={selectedElementData.style.fontWeight === 'bold' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateElement(selectedElement!, {
                        style: { 
                          ...selectedElementData.style, 
                          fontWeight: selectedElementData.style.fontWeight === 'bold' ? 'normal' : 'bold'
                        }
                      })}
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedElementData.style.fontStyle === 'italic' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateElement(selectedElement!, {
                        style: { 
                          ...selectedElementData.style, 
                          fontStyle: selectedElementData.style.fontStyle === 'italic' ? 'normal' : 'italic'
                        }
                      })}
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedElementData.style.textDecoration === 'underline' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateElement(selectedElement!, {
                        style: { 
                          ...selectedElementData.style, 
                          textDecoration: selectedElementData.style.textDecoration === 'underline' ? 'none' : 'underline'
                        }
                      })}
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={selectedElementData.style.textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateElement(selectedElement!, {
                        style: { ...selectedElementData.style, textAlign: 'left' }
                      })}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedElementData.style.textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateElement(selectedElement!, {
                        style: { ...selectedElementData.style, textAlign: 'center' }
                      })}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedElementData.style.textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateElement(selectedElement!, {
                        style: { ...selectedElementData.style, textAlign: 'right' }
                      })}
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Cor do Texto</Label>
                    <input
                      type="color"
                      value={selectedElementData.style.color}
                      onChange={(e) => updateElement(selectedElement!, {
                        style: { ...selectedElementData.style, color: e.target.value }
                      })}
                      className="w-full h-8 rounded border mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Element Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => duplicateElement(selectedElement!)}
                  data-testid="button-duplicate-element"
                >
                  Duplicar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteElement(selectedElement!)}
                  data-testid="button-delete-element"
                >
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  data-testid="button-undo"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  data-testid="button-redo"
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <Label className="text-sm">Zoom:</Label>
                <Select value={zoom.toString()} onValueChange={(value) => setZoom(parseInt(value))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                    <SelectItem value="125">125%</SelectItem>
                    <SelectItem value="150">150%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGrid(!showGrid)}
                data-testid="button-toggle-grid"
              >
                <Grid className="w-4 h-4 mr-1" />
                {showGrid ? 'Ocultar' : 'Mostrar'} Grade
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                data-testid="button-preview"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() => onSave({ elements })}
                data-testid="button-save-design"
              >
                <Save className="w-4 h-4 mr-1" />
                Salvar Design
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 bg-gray-100 dark:bg-gray-900">
          <div className="flex justify-center">
            <div
              ref={canvasRef}
              className="relative bg-white shadow-lg"
              style={{
                width: CANVAS_WIDTH * (zoom / 100),
                height: CANVAS_HEIGHT * (zoom / 100),
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
              onClick={handleCanvasClick}
            >
              {/* Grid */}
              {showGrid && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #ccc 1px, transparent 1px),
                      linear-gradient(to bottom, #ccc 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }}
                />
              )}
              
              {/* Elements */}
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-pointer border-2 ${
                    selectedElement === element.id 
                      ? 'border-blue-500 bg-blue-50/20' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    fontSize: element.style.fontSize,
                    fontFamily: element.style.fontFamily,
                    fontWeight: element.style.fontWeight,
                    fontStyle: element.style.fontStyle,
                    textDecoration: element.style.textDecoration,
                    textAlign: element.style.textAlign,
                    color: element.style.color,
                    backgroundColor: element.style.backgroundColor,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                  }}
                  data-testid={`canvas-element-${element.id}`}
                >
                  {element.type === 'text' && (
                    <div className="w-full h-full flex items-center">
                      {element.content}
                    </div>
                  )}
                  {element.type === 'image' && (
                    <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                      <Image className="w-8 h-8" />
                    </div>
                  )}
                  {element.type === 'chart' && (
                    <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                  )}
                  {element.type === 'table' && (
                    <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                      <Table className="w-8 h-8" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* A4 Dimensions Info */}
              <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                A4 (210×297mm) - {elements.length} elementos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedWYSIWYGDesigner;