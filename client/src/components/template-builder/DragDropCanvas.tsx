/**
 * Canvas principal para construção drag-and-drop de templates
 * Implementa funcionalidades de arrastar, soltar, zoom e pan
 */
import React, { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move,
  Grid3X3,
  Eye,
  Code
} from 'lucide-react'
import { ComponentPalette } from './ComponentPalette'
import { PreviewPanel } from './PreviewPanel'
import { PropertiesPanel } from './properties/PropertiesPanel'
import { DraggableFieldItem } from './DraggableFieldItem'
import { GridSystem } from './GridSystem'
import { useCanvasZoom } from '../../hooks/useCanvasZoom'
import { useUndoRedo } from '../../hooks/useUndoRedo'
export interface FieldComponent {
  id: string
  type: string
  label: string
  properties: Record<string, any>
  validation: Record<string, any>
  position: { x: number; y: number }
  size: { width: number; height: number }
  order: number
}
interface DragDropCanvasProps {
  templateId?: string
  initialFields?: FieldComponent[]
  onSave?: (fields: FieldComponent[]) => void
  readonly?: boolean
}
export const DragDropCanvas: React.FC<DragDropCanvasProps> = ({
  templateId,
  initialFields = [],
  onSave,
  readonly = false
}) => {
  const [fields, setFields] = useState<FieldComponent[]>(initialFields)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [draggedField, setDraggedField] = useState<FieldComponent | null>(null)
  const [viewMode, setViewMode] = useState<'design' | 'preview' | 'code'>('design')
  const [showGrid, setShowGrid] = useState(true)
  const [showPalette, setShowPalette] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Custom hooks para funcionalidades avançadas
  const { zoom, pan, zoomIn, zoomOut, resetZoom, isPanning, handlePanStart, handlePanMove } = useCanvasZoom()
  const { undo, redo, canUndo, canRedo, pushState } = useUndoRedo(fields, setFields)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const field = fields.find(f => f.id === active.id) || 
                  (active.data.current as FieldComponent)
    setDraggedField(field || null)
  }, [fields])
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Implementar lógica de hover durante drag
  }, [])
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setDraggedField(null)
      return
    }
    // Se arrastando da palette para o canvas
    if (active.data.current?.type && over.id === 'canvas') {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const newField: FieldComponent = {
          id: "
          type: active.data.current.type,
          label: active.data.current.label || "
          properties: active.data.current.defaultProperties || {},
          validation: {},
          position: { 
            x: (event.delta.x - rect.left) / zoom, 
            y: (event.delta.y - rect.top) / zoom 
          },
          size: { width: 300, height: 60 },
          order: fields.length
        }
        
        const newFields = [...fields, newField]
        pushState(fields) // Salvar estado para undo
        setFields(newFields)
      }
    }
    
    // Se reordenando campos existentes
    if (active.id !== over.id && fields.find(f => f.id === active.id)) {
      const oldIndex = fields.findIndex(f => f.id === active.id)
      const newIndex = fields.findIndex(f => f.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(fields, oldIndex, newIndex)
        pushState(fields)
        setFields(newFields)
      }
    }
    setDraggedField(null)
  }, [fields, zoom, pushState])
  const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<FieldComponent>) => {
    pushState(fields)
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }, [fields, pushState])
  const handleFieldDelete = useCallback((fieldId: string) => {
    pushState(fields)
    setFields(prev => prev.filter(field => field.id !== fieldId))
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }, [fields, selectedField, pushState])
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(fields)
    }
  }, [fields, onSave])
  const canvasStyle = {
    transform: "px)`,
    transformOrigin: '0 0'
  }
  return (
    <div className="flex h-screen bg-gray-50>
      {/* Palette de Componentes */}
      {showPalette && !readonly && (
        <div className="w-80 border-r bg-white shadow-sm>
          <ComponentPalette />
        </div>
      )}
      {/* Área Principal do Canvas */}
      <div className="flex-1 flex flex-col>
        {/* Toolbar */}
        <div className="h-16 border-b bg-white px-4 flex items-center justify-between>
          <div className="flex items-center gap-2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('design')}
              className={viewMode === 'design' ? 'bg-blue-100' : ''}
            >
              <Move className="h-4 w-4 mr-2" />
              Design
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('preview')}
              className={viewMode === 'preview' ? 'bg-blue-100' : ''}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('code')}
              className={viewMode === 'code' ? 'bg-blue-100' : ''}
            >
              <Code className="h-4 w-4 mr-2" />
              Código
            </Button>
          </div>
          <div className="flex items-center gap-2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className={showGrid ? 'bg-blue-100' : ''}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 border rounded>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm font-mono>
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
            >
              Desfazer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
            >
              Refazer
            </Button>
            {!readonly && (
              <Button onClick={handleSave} className="ml-4>
                Salvar Template
              </Button>
            )}
          </div>
        </div>
        {/* Canvas Area */}
        <div className="flex-1 flex>
          <div className="flex-1 overflow-hidden relative>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div
                ref={canvasRef}
                id="canvas"
                className="h-full w-full relative cursor-move"
                style={canvasStyle}
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
              >
                {/* Grid System */}
                {showGrid && <GridSystem zoom={zoom} />}
                {/* Canvas Content */}
                {viewMode === 'design' && (
                  <SortableContext
                    items={fields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="min-h-full min-w-full p-8>
                      {fields.map(field => (
                        <DraggableFieldItem
                          key={field.id}
                          field={field}
                          isSelected={selectedField === field.id}
                          onSelect={setSelectedField}
                          onUpdate={handleFieldUpdate}
                          onDelete={handleFieldDelete}
                          readonly={readonly}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
                {viewMode === 'preview' && (
                  <PreviewPanel fields={fields} />
                )}
                {viewMode === 'code' && (
                  <div className="p-8>
                    <Card className="p-4>
                      <pre className="text-sm>
                        {JSON.stringify(fields, null, 2)}
                      </pre>
                    </Card>
                  </div>
                )}
              </div>
              <DragOverlay>
                {draggedField && (
                  <div className="bg-white border-2 border-blue-500 rounded p-2 shadow-lg>
                    {draggedField.label}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
          {/* Properties Panel */}
          {showProperties && selectedField && !readonly && (
            <div className="w-80 border-l bg-white shadow-sm>
              <PropertiesPanel
                field={fields.find(f => f.id === selectedField)!}
                onUpdate={(updates) => handleFieldUpdate(selectedField, updates)}
                onClose={() => setSelectedField(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
