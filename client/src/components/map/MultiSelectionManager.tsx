// ===========================================================================================
// MULTI-SELECTION MANAGER - Rectangle/Lasso Selection for Multiple Agents
// ===========================================================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Square, 
  Lasso, 
  MessageSquare, 
  MapPin, 
  X,
  Send,
  UserCheck,
  UserX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

// ===========================================================================================
// Types
// ===========================================================================================

export interface SelectionBounds {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface SelectedAgent {
  id: string;
  name: string;
  team: string;
  status: string;
  lat: number;
  lng: number;
  position: { x: number; y: number }; // Screen coordinates
}

export interface SelectionMode {
  type: 'rectangle' | 'lasso' | 'none';
  isActive: boolean;
}

interface MultiSelectionManagerProps {
  agents: SelectedAgent[];
  onSelectionChange: (selectedAgents: SelectedAgent[]) => void;
  onBulkAction: (action: string, agentIds: string[], data?: any) => Promise<void>;
  mapRef: React.RefObject<HTMLDivElement>;
}

// ===========================================================================================
// Multi-Selection Manager Component
// ===========================================================================================

export const MultiSelectionManager: React.FC<MultiSelectionManagerProps> = ({
  agents,
  onSelectionChange,
  onBulkAction,
  mapRef
}) => {
  const { toast } = useToast();
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>({ type: 'none', isActive: false });
  const [selectedAgents, setSelectedAgents] = useState<SelectedAgent[]>([]);
  const [selectionBounds, setSelectionBounds] = useState<SelectionBounds | null>(null);
  const [lassoPath, setLassoPath] = useState<{ x: number; y: number }[]>([]);
  
  // UI state
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Refs
  const selectionOverlayRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);

  // ===========================================================================================
  // Selection Event Handlers
  // ===========================================================================================

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (selectionMode.type === 'none' || !selectionMode.isActive) return;
    
    e.preventDefault();
    isDrawing.current = true;
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    if (selectionMode.type === 'rectangle') {
      setSelectionBounds({ startX, startY, endX: startX, endY: startY });
    } else if (selectionMode.type === 'lasso') {
      setLassoPath([{ x: startX, y: startY }]);
    }
  }, [selectionMode, mapRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing.current || selectionMode.type === 'none') return;
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (selectionMode.type === 'rectangle' && selectionBounds) {
      setSelectionBounds(prev => prev ? {
        ...prev,
        endX: currentX,
        endY: currentY
      } : null);
    } else if (selectionMode.type === 'lasso') {
      setLassoPath(prev => [...prev, { x: currentX, y: currentY }]);
    }
  }, [selectionMode, selectionBounds]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return;
    
    isDrawing.current = false;
    
    // Perform selection based on bounds or lasso path
    if (selectionMode.type === 'rectangle' && selectionBounds) {
      const selected = getAgentsInRectangle(agents, selectionBounds);
      setSelectedAgents(selected);
      onSelectionChange(selected);
    } else if (selectionMode.type === 'lasso' && lassoPath.length > 2) {
      const selected = getAgentsInLasso(agents, lassoPath);
      setSelectedAgents(selected);
      onSelectionChange(selected);
    }
    
    // Show selection panel if agents were selected
    if (selectedAgents.length > 0) {
      setShowSelectionPanel(true);
    }
    
    // Reset selection mode
    setSelectionMode({ type: 'none', isActive: false });
  }, [selectionMode, selectionBounds, lassoPath, agents, onSelectionChange, selectedAgents]);

  // ===========================================================================================
  // Selection Utility Functions
  // ===========================================================================================

  const getAgentsInRectangle = useCallback((agentList: SelectedAgent[], bounds: SelectionBounds): SelectedAgent[] => {
    const minX = Math.min(bounds.startX, bounds.endX);
    const maxX = Math.max(bounds.startX, bounds.endX);
    const minY = Math.min(bounds.startY, bounds.endY);
    const maxY = Math.max(bounds.startY, bounds.endY);
    
    return agentList.filter(agent => 
      agent.position.x >= minX && 
      agent.position.x <= maxX &&
      agent.position.y >= minY && 
      agent.position.y <= maxY
    );
  }, []);

  const getAgentsInLasso = useCallback((agentList: SelectedAgent[], path: { x: number; y: number }[]): SelectedAgent[] => {
    return agentList.filter(agent => 
      isPointInPolygon(agent.position, path)
    );
  }, []);

  const isPointInPolygon = (point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // ===========================================================================================
  // Bulk Actions
  // ===========================================================================================

  const handleBulkMessage = async () => {
    if (!bulkMessage.trim() || selectedAgents.length === 0) return;
    
    setIsPerformingAction(true);
    try {
      await onBulkAction('send_message', selectedAgents.map(a => a.id), { message: bulkMessage });
      toast({
        title: "Mensagem Enviada",
        description: `Mensagem enviada para ${selectedAgents.length} agente(s)`,
      });
      setBulkMessage('');
    } catch (error) {
      toast({
        title: "Erro ao Enviar Mensagem",
        description: "Falha ao enviar mensagem para os agentes",
        variant: "destructive",
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleBulkReassign = async () => {
    setIsPerformingAction(true);
    try {
      await onBulkAction('reassign_tickets', selectedAgents.map(a => a.id));
      toast({
        title: "Tickets Redistribuídos",
        description: `Tickets redistribuídos para ${selectedAgents.length} agente(s)`,
      });
    } catch (error) {
      toast({
        title: "Erro na Redistribuição",
        description: "Falha ao redistribuir tickets",
        variant: "destructive",
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleSetStatus = async (status: string) => {
    setIsPerformingAction(true);
    try {
      await onBulkAction('set_status', selectedAgents.map(a => a.id), { status });
      toast({
        title: "Status Atualizado",
        description: `Status alterado para ${selectedAgents.length} agente(s)`,
      });
    } catch (error) {
      toast({
        title: "Erro ao Atualizar Status",
        description: "Falha ao alterar status dos agentes",
        variant: "destructive",
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const clearSelection = () => {
    setSelectedAgents([]);
    setShowSelectionPanel(false);
    setSelectionBounds(null);
    setLassoPath([]);
    onSelectionChange([]);
  };

  // ===========================================================================================
  // Event Listeners Setup
  // ===========================================================================================

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    if (selectionMode.isActive) {
      mapElement.addEventListener('mousedown', handleMouseDown);
      mapElement.addEventListener('mousemove', handleMouseMove);
      mapElement.addEventListener('mouseup', handleMouseUp);
      
      // Change cursor
      mapElement.style.cursor = selectionMode.type === 'rectangle' ? 'crosshair' : 'grab';
    } else {
      mapElement.style.cursor = 'default';
    }

    return () => {
      mapElement.removeEventListener('mousedown', handleMouseDown);
      mapElement.removeEventListener('mousemove', handleMouseMove);
      mapElement.removeEventListener('mouseup', handleMouseUp);
      mapElement.style.cursor = 'default';
    };
  }, [selectionMode, handleMouseDown, handleMouseMove, handleMouseUp, mapRef]);

  // ===========================================================================================
  // Render
  // ===========================================================================================

  return (
    <>
      {/* Selection Tools */}
      <Card className="absolute top-4 left-4 z-[1000] w-48">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Seleção Múltipla
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant={selectionMode.type === 'rectangle' && selectionMode.isActive ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-start"
            onClick={() => setSelectionMode({ type: 'rectangle', isActive: !selectionMode.isActive })}
            data-testid="rectangle-selection-btn"
          >
            <Square className="w-4 h-4 mr-2" />
            Retângulo
          </Button>
          
          <Button
            variant={selectionMode.type === 'lasso' && selectionMode.isActive ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-start"
            onClick={() => setSelectionMode({ type: 'lasso', isActive: !selectionMode.isActive })}
            data-testid="lasso-selection-btn"
          >
            <Lasso className="w-4 h-4 mr-2" />
            Laço
          </Button>

          {selectedAgents.length > 0 && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground">
                {selectedAgents.length} agente(s) selecionado(s)
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowSelectionPanel(true)}
                data-testid="show-selection-panel-btn"
              >
                Ver Selecionados
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selection Overlay */}
      {selectionMode.isActive && (
        <div 
          ref={selectionOverlayRef}
          className="absolute inset-0 z-[999] pointer-events-none"
        >
          {/* Rectangle Selection */}
          {selectionMode.type === 'rectangle' && selectionBounds && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/10"
              style={{
                left: Math.min(selectionBounds.startX, selectionBounds.endX),
                top: Math.min(selectionBounds.startY, selectionBounds.endY),
                width: Math.abs(selectionBounds.endX - selectionBounds.startX),
                height: Math.abs(selectionBounds.endY - selectionBounds.startY),
              }}
            />
          )}

          {/* Lasso Selection */}
          {selectionMode.type === 'lasso' && lassoPath.length > 1 && (
            <svg className="absolute inset-0 w-full h-full">
              <path
                d={`M ${lassoPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="rgba(59, 130, 246, 0.1)"
                strokeDasharray="5,5"
              />
            </svg>
          )}
        </div>
      )}

      {/* Selection Panel */}
      {showSelectionPanel && selectedAgents.length > 0 && (
        <Card className="absolute top-4 right-4 z-[1000] w-80 max-h-96 overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Agentes Selecionados ({selectedAgents.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                data-testid="clear-selection-btn"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Agents List */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedAgents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.team}</div>
                  </div>
                  <Badge variant="outline">{agent.status}</Badge>
                </div>
              ))}
            </div>

            <Separator />

            {/* Bulk Actions */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Ações em Lote:</div>
              
              {/* Message */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Digite uma mensagem para os agentes..."
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  className="min-h-[60px]"
                  data-testid="bulk-message-textarea"
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleBulkMessage}
                  disabled={!bulkMessage.trim() || isPerformingAction}
                  data-testid="send-bulk-message-btn"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSetStatus('available')}
                  disabled={isPerformingAction}
                  data-testid="set-available-btn"
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Disponível
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSetStatus('unavailable')}
                  disabled={isPerformingAction}
                  data-testid="set-unavailable-btn"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Indisponível
                </Button>
              </div>

              {/* Reassign */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleBulkReassign}
                disabled={isPerformingAction}
                data-testid="bulk-reassign-btn"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Redistribuir Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};