
import React, { useState, useRef, useEffect } from 'react';
import { 
// import { useLocalization } from '@/hooks/useLocalization';
  Layout, Type, Image, BarChart3, PieChart, LineChart, Table,
  Palette, Settings, Eye, Save, Undo, Redo, Grid, AlignLeft,
  AlignCenter, AlignRight, Bold, Italic, Underline, Plus,
  Move, Trash2, Copy, RotateCcw, Download, Share, Zap,
  MousePointer, Square, Circle, Triangle, Minus, Hash,
  Calendar, Clock, Target, Users, Building, Ticket
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Zendesk-style design components
const DESIGN_COMPONENTS = [
  {
  // Localization temporarily disabled

    id: 'text',
    name: 'Text',
    icon: Type,
    category: 'content',
    description: 'Add text content',
    defaultProps: {
      content: 'Sample Text',
      fontSize: 16,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left'
    }
  },
  {
    id: 'heading',
    name: 'Heading',
    icon: Type,
    category: 'content',
    description: 'Add heading',
    defaultProps: {
      content: 'Heading',
      level: 'h2',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    }
  },
  {
    id: 'chart',
    name: 'Chart',
    icon: BarChart3,
    category: 'data',
    description: 'Add data visualization',
    defaultProps: {
      chartType: 'bar',
      dataSource: 'tickets',
      width: 400,
      height: 300,
      showLegend: true,
      showGrid: true
    }
  },
  {
    id: 'table',
    name: 'Table',
    icon: Table,
    category: 'data',
    description: 'Add data table',
    defaultProps: {
      dataSource: 'tickets',
      columns: [],
      showHeader: true,
      rowsPerPage: 10,
      sortable: true
    }
  },
  {
    id: 'kpi',
    name: 'KPI Card',
    icon: Target,
    category: 'data',
    description: 'Add KPI metric',
    defaultProps: {
      title: '[TRANSLATION_NEEDED]',
      value: '1,234',
      trend: '+12%',
      trendDirection: 'up',
      backgroundColor: '#f8f9fa',
      textColor: '#000000'
    }
  },
  {
    id: 'image',
    name: 'Image',
    icon: Image,
    category: 'media',
    description: 'Add image',
    defaultProps: {
      src: 'https://via.placeholder.com/300x200',
      alt: 'Image',
      width: 300,
      height: 200,
      borderRadius: 0
    }
  },
  {
    id: 'divider',
    name: 'Divider',
    icon: Minus,
    category: 'layout',
    description: 'Add separator line',
    defaultProps: {
      style: 'solid',
      thickness: 1,
      color: '#e0e0e0',
      margin: 20
    }
  },
  {
    id: 'container',
    name: 'Container',
    icon: Square,
    category: 'layout',
    description: 'Add container box',
    defaultProps: {
      backgroundColor: '#ffffff',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
      shadow: false
    }
  }
];

// Zendesk-style color palette
const COLOR_PALETTE = [
  '#000000', '#4A4A4A', '#9B9B9B', '#FFFFFF',
  '#1976D2', '#1E88E5', '#2196F3', '#42A5F5',
  '#388E3C', '#43A047', '#4CAF50', '#66BB6A',
  '#F57C00', '#FB8C00', '#FF9800', '#FFB74D',
  '#D32F2F', '#E53935', '#F44336', '#EF5350',
  '#7B1FA2', '#8E24AA', '#9C27B0', '#BA68C8'
];

// Font options
const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' }
];

interface WYSIWYGDesignerProps {
  onDesignChange?: (design: any) => void;
  initialDesign?: any;
  data?: any;
  onSave: (report: { name?: string; description?: string; design?: any }) => void;
}

export default function AdvancedWYSIWYGDesigner({ onDesignChange, initialDesign, data, onSave }: WYSIWYGDesignerProps) {
  const defaultDesign = {
    components: [],
    layout: {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      padding: 20
    },
    settings: {
      title: 'Untitled Report',
      description: '',
      showHeader: true,
      showFooter: false
    }
  };
  
  const [design, setDesign] = useState(initialDesign || defaultDesign);

  const [selectedComponent, setSelectedComponent] = useState(null);
  const [activeTab, setActiveTab] = useState('components');
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (initialDesign) {
      setDesign({
        ...initialDesign,
        components: initialDesign.components || [],
        layout: initialDesign.layout || { width: 800, height: 600, backgroundColor: '#ffffff', padding: 20 },
        settings: initialDesign.settings || { title: 'Untitled Report', description: '', showHeader: true, showFooter: false }
      });
    }
  }, [initialDesign]);

  useEffect(() => {
    onDesignChange?.(design);
  }, [design, onDesignChange]);

  const addComponent = (componentType, position = null) => {
    const componentTemplate = DESIGN_COMPONENTS.find(c => c.id === componentType);
    if (!componentTemplate) return;

    const newComponent = {
      id: "
      type: componentType,
      position: position || { x: 50, y: 50 },
      size: { width: 200, height: 100 },
      props: { ...componentTemplate.defaultProps },
      zIndex: design?.components?.length || 0
    };

    setDesign(prev => ({
      ...prev,
      components: [...(prev.components || []), newComponent]
    }));

    setSelectedComponent(newComponent.id);
  };

  const updateComponent = (componentId, updates) => {
    setDesign(prev => ({
      ...prev,
      components: (prev.components || []).map(comp =>
        comp.id === componentId ? { ...comp, ...updates } : comp
      )
    }));
  };

  const deleteComponent = (componentId) => {
    setDesign(prev => ({
      ...prev,
      components: (prev.components || []).filter(comp => comp.id !== componentId)
    }));
    
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
  };

  const duplicateComponent = (componentId) => {
    const component = design?.components?.find(c => c.id === componentId);
    if (!component) return;

    const newComponent = {
      ...component,
      id: "
      position: {
        x: component.position.x + 20,
        y: component.position.y + 20
      }
    };

    setDesign(prev => ({
      ...prev,
      components: [...(prev.components || []), newComponent]
    }));
  };

  const handleDragStart = (e, componentType) => {
    setDraggedComponent(componentType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedComponent) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addComponent(draggedComponent, { x, y });
    setDraggedComponent(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSave = () => {
    onSave({
      name: design.settings.title,
      description: design.settings.description,
      design: design
    });
  };

  const selectedComponentData = design?.components?.find(c => c.id === selectedComponent);

  return (
    <TooltipProvider>
      <div className="h-screen flex bg-gray-50">
        {/* Left Sidebar - Component Library */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Design Studio</h3>
            <p className="text-sm text-gray-600">Drag components to build your report</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="styles">Styles</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>

            <TabsContent value="components" className="flex-1 p-4 space-y-4">
              {/* Component Categories */}
              {['content', 'data', 'media', 'layout'].map((category) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {DESIGN_COMPONENTS
                      .filter(comp => comp.category === category)
                      .map((component) => {
                        const Icon = component.icon;
                        return (
                          <Tooltip key={component.id}>
                            <TooltipTrigger asChild>
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, component.id)}
                                className="p-3 border border-gray-200 rounded-lg cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              >
                                <Icon className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                                <p className="text-xs text-center text-gray-700">
                                  {component.name}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{component.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="styles" className="flex-1 p-4">
              {selectedComponentData ? (
                <ComponentStyleEditor 
                  component={selectedComponentData}
                  onUpdate={(updates) => updateComponent(selectedComponent, updates)}
                />
              ) : (
                <div className="text-center py-8">
                  <Palette className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Select a component to edit styles</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="flex-1 p-4">
              {selectedComponentData && ['chart', 'table', 'kpi'].includes(selectedComponentData.type) ? (
                <ComponentDataEditor 
                  component={selectedComponentData}
                  onUpdate={(updates) => updateComponent(selectedComponent, updates)}
                  availableData={data}
                />
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Select a data component to configure</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (historyIndex > 0) {
                      setHistoryIndex(prev => prev - 1);
                      setDesign(history[historyIndex - 1]);
                    }
                  }}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (historyIndex < history.length - 1) {
                      setHistoryIndex(prev => prev + 1);
                      setDesign(history[historyIndex + 1]);
                    }
                  }}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={previewMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMode ? '[TRANSLATION_NEEDED]' : 'Preview'}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8">
            <div
              ref={canvasRef}
              className="mx-auto bg-white shadow-lg relative"
              style={{
                width: "px`,
                height: "px`,
                backgroundColor: design?.layout?.backgroundColor || '#ffffff',
                padding: "px`
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Grid overlay for alignment */}
              {!previewMode && (
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />
              )}

              {/* Render Components */}
              {design?.components?.map((component) => (
                <DesignComponent
                  key={component.id}
                  component={component}
                  isSelected={selectedComponent === component.id}
                  isPreview={previewMode}
                  onClick={() => !previewMode && setSelectedComponent(component.id)}
                  onUpdate={(updates) => updateComponent(component.id, updates)}
                  onDelete={() => deleteComponent(component.id)}
                  onDuplicate={() => duplicateComponent(component.id)}
                />
              ))}

              {/* Empty state */}
              {(!design?.components || design.components.length === 0) && !previewMode && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Layout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start Building Your Report
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag components from the sidebar to get started
                    </p>
                    <Button onClick={() => addComponent('text')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Text
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {selectedComponentData && !previewMode && (
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateComponent(selectedComponent)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteComponent(selectedComponent)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ComponentProperties
              component={selectedComponentData}
              onUpdate={(updates) => updateComponent(selectedComponent, updates)}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Component Renderer
function DesignComponent({ component, isSelected, isPreview, onClick, onUpdate, onDelete, onDuplicate }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    if (isPreview) return;
    e.stopPropagation();
    
    const startX = e.clientX - component.position.x;
    const startY = e.clientY - component.position.y;

    const handleMouseMove = (e) => {
      setIsDragging(true);
      onUpdate({
        position: {
          x: e.clientX - startX,
          y: e.clientY - startY
        }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderComponentContent = () => {
    switch (component.type) {
      case 'text':
      case 'heading':
        return (
          <div
            style={{
              fontSize: "px`,
              fontWeight: component.props.fontWeight,
              color: component.props.color,
              textAlign: component.props.align,
              fontFamily: component.props.fontFamily || 'Arial'
            }}
          >
            {component.props.content}
          </div>
        );

      case 'chart':
        return (
          <div className="w-full h-full border border-gray-300 rounded flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {component.props.chartType} Chart
              </p>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="w-full h-full border border-gray-300 rounded">
            <div className="bg-gray-50 p-2 border-b">
              <Table className="h-4 w-4 text-gray-600" />
            </div>
            <div className="p-2">
              <p className="text-sm text-gray-600">Data Table</p>
            </div>
          </div>
        );

      case 'kpi':
        return (
          <div 
            className="w-full h-full rounded p-4 text-center"
            style={{ 
              backgroundColor: component.props.backgroundColor,
              color: component.props.textColor
            }}
          >
            <div className="text-2xl font-bold">{component.props.value}</div>
            <div className="text-sm">{component.props.title}</div>
            {component.props.trend && (
              <div className="text-xs mt-1">{component.props.trend}</div>
            )}
          </div>
        );

      case 'image':
        return (
          <img
            src={component.props.src}
            alt={component.props.alt}
            className="w-full h-full object-cover"
            style={{ borderRadius: "px` }}
          />
        );

      case 'divider':
        return (
          <div
            style={{
              width: '100%',
              height: "px`,
              backgroundColor: component.props.color,
              margin: "px 0`
            }}
          />
        );

      case 'container':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: component.props.backgroundColor,
              border: "
              borderRadius: "px`,
              padding: "px`,
              boxShadow: component.props.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <p className="text-sm text-gray-600">Container</p>
          </div>
        );

      default:
        return <div>Unknown component</div>;
    }
  };

  return (
    <div
      className="absolute cursor-pointer ${isSelected && !isPreview ? 'ring-2 ring-blue-500' : ''} ""
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height,
        zIndex: component.zIndex
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      {renderComponentContent()}
      
      {/* Selection controls */}
      {isSelected && !isPreview && (
        <>
          {/* Resize handles */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize" />
        </>
      )}
    </div>
  );
}

// Component Style Editor
function ComponentStyleEditor({ component, onUpdate }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Position</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            type="number"
            placeholder="X"
            value={component.position.x}
            onChange={(e) => onUpdate({
              position: { ...component.position, x: parseInt(e.target.value) || 0 }
            })}
          />
          <Input
            type="number"
            placeholder="Y"
            value={component.position.y}
            onChange={(e) => onUpdate({
              position: { ...component.position, y: parseInt(e.target.value) || 0 }
            })}
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Size</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            type="number"
            placeholder="Width"
            value={component.size.width}
            onChange={(e) => onUpdate({
              size: { ...component.size, width: parseInt(e.target.value) || 0 }
            })}
          />
          <Input
            type="number"
            placeholder="Height"
            value={component.size.height}
            onChange={(e) => onUpdate({
              size: { ...component.size, height: parseInt(e.target.value) || 0 }
            })}
          />
        </div>
      </div>

      {(component.type === 'text' || component.type === 'heading') && (
        <>
          <div>
            <Label className="text-sm font-medium">Font Size</Label>
            <Slider
              value={[component.props.fontSize]}
              onValueChange={([value]) => onUpdate({
                props: { ...component.props, fontSize: value }
              })}
              min={8}
              max={72}
              step={1}
              className="mt-2"
            />
            <span className="text-xs text-gray-500">{component.props.fontSize}px</span>
          </div>

          <div>
            <Label className="text-sm font-medium">Color</Label>
            <div className="grid grid-cols-6 gap-1 mt-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdate({
                    props: { ...component.props, color }
                  })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Font Weight</Label>
            <Select
              value={component.props.fontWeight}
              onValueChange={(value) => onUpdate({
                props: { ...component.props, fontWeight: value }
              })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="lighter">Lighter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}

// Component Data Editor
function ComponentDataEditor({ component, onUpdate, availableData }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Data Source</Label>
        <Select
          value={component.props.dataSource}
          onValueChange={(value) => onUpdate({
            props: { ...component.props, dataSource: value }
          })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tickets">Tickets</SelectItem>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="organizations">Organizations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {component.type === 'chart' && (
        <div>
          <Label className="text-sm font-medium">Chart Type</Label>
          <Select
            value={component.props.chartType}
            onValueChange={(value) => onUpdate({
              props: { ...component.props, chartType: value }
            })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// Component Properties Editor
function ComponentProperties({ component, onUpdate }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Component Type</Label>
        <Badge variant="outline" className="mt-1">{component.type}</Badge>
      </div>

      {(component.type === 'text' || component.type === 'heading') && (
        <div>
          <Label className="text-sm font-medium">Content</Label>
          <Input
            value={component.props.content}
            onChange={(e) => onUpdate({
              props: { ...component.props, content: e.target.value }
            })}
            className="mt-1"
          />
        </div>
      )}

      {component.type === 'kpi' && (
        <>
          <div>
            <Label className="text-sm font-medium">Title</Label>
            <Input
              value={component.props.title}
              onChange={(e) => onUpdate({
                props: { ...component.props, title: e.target.value }
              })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Value</Label>
            <Input
              value={component.props.value}
              onChange={(e) => onUpdate({
                props: { ...component.props, value: e.target.value }
              })}
              className="mt-1"
            />
          </div>
        </>
      )}
    </div>
  );
}
