import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Square, 
  Circle, 
  Triangle, 
  ArrowRight, 
  Type, 
  Palette,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
  Trash2,
  Copy,
  Edit3,
  Plus,
  MousePointer,
  Hand,
  Minus
} from "lucide-react";

interface DiagramElement {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  imageUrl?: string;
  rotation?: number;
}

interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  elements: DiagramElement[];
  thumbnail: string;
}

const InteractiveDiagrams = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'text' | 'pan'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<DiagramElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentColor, setCurrentColor] = useState('#3B82F6');
  const [currentBorderColor, setCurrentBorderColor] = useState('#1F2937');
  const [currentBorderWidth, setCurrentBorderWidth] = useState(2);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const { toast } = useToast();

  // Templates pré-definidos
  const templates: DiagramTemplate[] = [
    {
      id: 'flowchart_basic',
      name: 'Fluxograma Básico',
      description: 'Template para processos simples',
      thumbnail: '/api/diagrams/templates/flowchart_basic.png',
      elements: [
        {
          id: '1',
          type: 'rectangle',
          x: 50,
          y: 50,
          width: 120,
          height: 60,
          color: '#E3F2FD',
          borderColor: '#1976D2',
          borderWidth: 2,
          text: 'Início',
          fontSize: 14,
          fontColor: '#1976D2'
        },
        {
          id: '2',
          type: 'arrow',
          x: 110,
          y: 110,
          width: 0,
          height: 40,
          color: '#1976D2',
          borderColor: '#1976D2',
          borderWidth: 2
        },
        {
          id: '3',
          type: 'rectangle',
          x: 50,
          y: 150,
          width: 120,
          height: 60,
          color: '#FFF3E0',
          borderColor: '#F57C00',
          borderWidth: 2,
          text: 'Processo',
          fontSize: 14,
          fontColor: '#F57C00'
        }
      ]
    },
    {
      id: 'network_diagram',
      name: 'Diagrama de Rede',
      description: 'Template para infraestrutura de TI',
      thumbnail: '/api/diagrams/templates/network_diagram.png',
      elements: [
        {
          id: 'server1',
          type: 'rectangle',
          x: 50,
          y: 100,
          width: 80,
          height: 80,
          color: '#F3E5F5',
          borderColor: '#7B1FA2',
          borderWidth: 2,
          text: 'Server',
          fontSize: 12,
          fontColor: '#7B1FA2'
        },
        {
          id: 'switch1',
          type: 'rectangle',
          x: 200,
          y: 120,
          width: 60,
          height: 40,
          color: '#E8F5E8',
          borderColor: '#388E3C',
          borderWidth: 2,
          text: 'Switch',
          fontSize: 12,
          fontColor: '#388E3C'
        },
        {
          id: 'client1',
          type: 'circle',
          x: 350,
          y: 125,
          width: 50,
          height: 50,
          color: '#FFF3E0',
          borderColor: '#F57C00',
          borderWidth: 2,
          text: 'PC',
          fontSize: 12,
          fontColor: '#F57C00'
        }
      ]
    }
  ];

  // Salvar estado no histórico
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [elements, history, historyIndex]);

  // Undo/Redo
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

  // Renderizar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aplicar zoom e pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    // Renderizar elementos
    elements.forEach(element => {
      renderElement(ctx, element);
    });

    // Destacar elemento selecionado
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }, [elements, selectedElement, zoom, pan]);

  // Renderizar elemento individual
  const renderElement = (ctx: CanvasRenderingContext2D, element: DiagramElement) => {
    ctx.fillStyle = element.color;
    ctx.strokeStyle = element.borderColor;
    ctx.lineWidth = element.borderWidth;

    switch (element.type) {
      case 'rectangle':
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(
          element.x + element.width / 2,
          element.y + element.height / 2,
          Math.min(element.width, element.height) / 2,
          0,
          2 * Math.PI
        );
        ctx.fill();
        ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(element.x + element.width / 2, element.y);
        ctx.lineTo(element.x, element.y + element.height);
        ctx.lineTo(element.x + element.width, element.y + element.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'arrow':
        drawArrow(ctx, element.x, element.y, element.x + element.width, element.y + element.height);
        break;
      case 'text':
        ctx.fillStyle = element.fontColor || '#000000';
        ctx.font = `${element.fontSize || 14}px Arial`;
        ctx.fillText(element.text || '', element.x, element.y + (element.fontSize || 14));
        break;
    }

    // Renderizar texto se existir
    if (element.text && element.type !== 'text') {
      ctx.fillStyle = element.fontColor || '#000000';
      ctx.font = `${element.fontSize || 12}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        element.text,
        element.x + element.width / 2,
        element.y + element.height / 2
      );
    }
  };

  // Desenhar seta
  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const headlen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    setStartPos({ x, y });
    setIsDrawing(true);

    if (tool === 'select') {
      // Selecionar elemento
      const clickedElement = elements.find(el => 
        x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
      );
      setSelectedElement(clickedElement?.id || null);
    } else if (tool !== 'pan') {
      // Criar novo elemento
      const newElement: DiagramElement = {
        id: Date.now().toString(),
        type: tool as any,
        x,
        y,
        width: 0,
        height: 0,
        color: currentColor,
        borderColor: currentBorderColor,
        borderWidth: currentBorderWidth
      };

      if (tool === 'text') {
        newElement.text = 'Texto';
        newElement.fontSize = 14;
        newElement.fontColor = currentBorderColor;
        newElement.width = 100;
        newElement.height = 20;
      }

      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    if (tool === 'pan') {
      setPan({
        x: pan.x + (x - startPos.x),
        y: pan.y + (y - startPos.y)
      });
    } else if (selectedElement && tool !== 'select') {
      setElements(elements.map(el => 
        el.id === selectedElement 
          ? {
              ...el,
              width: Math.abs(x - startPos.x),
              height: Math.abs(y - startPos.y),
              x: Math.min(startPos.x, x),
              y: Math.min(startPos.y, y)
            }
          : el
      ));
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      saveToHistory();
    }
    setIsDrawing(false);
  };

  // Aplicar template
  const applyTemplate = (template: DiagramTemplate) => {
    setElements([...template.elements]);
    saveToHistory();
    setIsTemplateDialogOpen(false);
    toast({ title: "Template aplicado", description: `${template.name} foi carregado com sucesso!` });
  };

  // Deletar elemento selecionado
  const deleteSelected = () => {
    if (selectedElement) {
      setElements(elements.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
      saveToHistory();
    }
  };

  // Duplicar elemento selecionado
  const duplicateSelected = () => {
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        const newElement = {
          ...element,
          id: Date.now().toString(),
          x: element.x + 20,
          y: element.y + 20
        };
        setElements([...elements, newElement]);
        setSelectedElement(newElement.id);
        saveToHistory();
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-4 border-b bg-gray-50">
        {/* Ferramentas de desenho */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            variant={tool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('select')}
            title="Selecionar"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'pan' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pan')}
            title="Mover visualização"
          >
            <Hand className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1 border-r pr-2">
          <Button
            variant={tool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('rectangle')}
            title="Retângulo"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('circle')}
            title="Círculo"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'triangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('triangle')}
            title="Triângulo"
          >
            <Triangle className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'arrow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('arrow')}
            title="Seta"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('text')}
            title="Texto"
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>

        {/* Controles de zoom */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(zoom / 1.2, 0.1))}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </Button>
        </div>

        {/* Histórico */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Ações de elemento */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            variant="outline"
            size="sm"
            onClick={duplicateSelected}
            disabled={!selectedElement}
            title="Duplicar"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteSelected}
            disabled={!selectedElement}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Templates */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Templates
            </Button>
          </DialogTrigger>
        </Dialog>

        {/* Cores */}
        <div className="flex gap-2 items-center">
          <Label className="text-xs">Preenchimento:</Label>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded border cursor-pointer"
            title="Cor de preenchimento"
          />
          <Label className="text-xs">Borda:</Label>
          <input
            type="color"
            value={currentBorderColor}
            onChange={(e) => setCurrentBorderColor(e.target.value)}
            className="w-8 h-8 rounded border cursor-pointer"
            title="Cor da borda"
          />
          <input
            type="range"
            min="1"
            max="10"
            value={currentBorderWidth}
            onChange={(e) => setCurrentBorderWidth(Number(e.target.value))}
            className="w-16"
            title="Largura da borda"
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="cursor-crosshair absolute inset-0"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
        />
      </div>

      {/* Templates Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Templates de Diagramas</DialogTitle>
            <DialogDescription>
              Escolha um template para começar rapidamente
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => applyTemplate(template)}>
                <CardHeader className="pb-2">
                  <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center text-gray-500 text-sm">
                    Preview do {template.name}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {template.description}
                  </CardDescription>
                  <Button className="w-full mt-3" size="sm">
                    Aplicar Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Propriedades do elemento selecionado */}
      {selectedElement && (
        <div className="border-t p-4 bg-gray-50">
          <h3 className="font-medium mb-3">Propriedades do Elemento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Posição X</Label>
              <Input
                type="number"
                value={elements.find(el => el.id === selectedElement)?.x || 0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setElements(elements.map(el => 
                    el.id === selectedElement ? { ...el, x: value } : el
                  ));
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Posição Y</Label>
              <Input
                type="number"
                value={elements.find(el => el.id === selectedElement)?.y || 0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setElements(elements.map(el => 
                    el.id === selectedElement ? { ...el, y: value } : el
                  ));
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Largura</Label>
              <Input
                type="number"
                value={elements.find(el => el.id === selectedElement)?.width || 0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setElements(elements.map(el => 
                    el.id === selectedElement ? { ...el, width: value } : el
                  ));
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Altura</Label>
              <Input
                type="number"
                value={elements.find(el => el.id === selectedElement)?.height || 0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setElements(elements.map(el => 
                    el.id === selectedElement ? { ...el, height: value } : el
                  ));
                }}
                className="h-8"
              />
            </div>
            {elements.find(el => el.id === selectedElement)?.type !== 'arrow' && (
              <div className="col-span-2">
                <Label className="text-xs">Texto</Label>
                <Input
                  value={elements.find(el => el.id === selectedElement)?.text || ''}
                  onChange={(e) => {
                    setElements(elements.map(el => 
                      el.id === selectedElement ? { ...el, text: e.target.value } : el
                    ));
                  }}
                  className="h-8"
                  placeholder="Digite o texto..."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveDiagrams;