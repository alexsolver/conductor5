// ===========================================================================================
// DRAG & DROP MANAGER - Tickets to Agents Assignment with Visual Feedback
// ===========================================================================================

import React, { useState, useRef, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Clock, User, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ===========================================================================================
// Types
// ===========================================================================================

export interface DragItem {
  type: 'ticket' | 'agent';
  id: string;
  data: any;
}

export interface AssignmentPreview {
  ticketId: string;
  agentId: string;
  estimatedETA: number;
  distanceKm: number;
  slaRisk: boolean;
}

interface TicketDragItemProps {
  ticket: {
    id: string;
    subject: string;
    priority: string;
    location: string;
    slaDeadline: string;
    estimatedTime: number;
  };
  onDragStart?: (ticket: any) => void;
  onDragEnd?: () => void;
}

interface AgentDropZoneProps {
  agent: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: string;
    currentLoad: number;
  };
  onTicketAssign: (ticketId: string, agentId: string) => Promise<void>;
  isDragOver?: boolean;
  assignmentPreview?: AssignmentPreview;
}

// ===========================================================================================
// Draggable Ticket Component
// ===========================================================================================

export const DraggableTicket: React.FC<TicketDragItemProps> = ({
  ticket,
  onDragStart,
  onDragEnd
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ticket',
    item: { type: 'ticket', id: ticket.id, data: ticket },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    begin: () => onDragStart?.(ticket),
    end: () => onDragEnd?.(),
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card 
      ref={drag}
      className={`cursor-move transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      }`}
      data-testid={`draggable-ticket-${ticket.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="font-medium text-sm">{ticket.subject}</span>
          </div>
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            <span>{ticket.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>SLA: {new Date(ticket.slaDeadline).toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="text-xs">
            Tempo estimado: {ticket.estimatedTime}min
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ===========================================================================================
// Agent Drop Zone Component  
// ===========================================================================================

export const AgentDropZone: React.FC<AgentDropZoneProps> = ({
  agent,
  onTicketAssign,
  isDragOver,
  assignmentPreview
}) => {
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState(false);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ticket',
    drop: async (item: DragItem) => {
      if (item.type === 'ticket') {
        setIsAssigning(true);
        try {
          await onTicketAssign(item.id, agent.id);
          toast({
            title: "Ticket Atribuído",
            description: `Ticket ${item.id} atribuído para ${agent.name}`,
          });
        } catch (error) {
          toast({
            title: "Erro na Atribuição",
            description: "Falha ao atribuir o ticket. Tente novamente.",
            variant: "destructive",
          });
        } finally {
          setIsAssigning(false);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300';
      case 'in_transit': return 'bg-blue-100 border-blue-300';
      case 'in_service': return 'bg-yellow-100 border-yellow-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const canAcceptTicket = agent.status === 'available' && agent.currentLoad < 3;

  return (
    <div
      ref={drop}
      className={`
        relative p-3 rounded-lg border-2 transition-all duration-200
        ${canAcceptTicket ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
        ${isOver && canDrop ? 'border-blue-500 bg-blue-50 scale-105' : getStatusColor(agent.status)}
        ${isAssigning ? 'animate-pulse' : ''}
      `}
      data-testid={`agent-dropzone-${agent.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="font-medium text-sm">{agent.name}</span>
        </div>
        {canAcceptTicket && <CheckCircle className="w-4 h-4 text-green-500" />}
      </div>

      <div className="text-xs text-muted-foreground">
        <div>Status: {agent.status}</div>
        <div>Carga: {agent.currentLoad}/3 tickets</div>
        <div>Localização: {agent.lat.toFixed(4)}, {agent.lng.toFixed(4)}</div>
      </div>

      {/* Assignment Preview */}
      {isOver && canDrop && assignmentPreview && (
        <div className="absolute inset-0 bg-blue-500/10 border border-blue-500 rounded-lg p-2 backdrop-blur-sm">
          <div className="text-xs font-medium text-blue-800">
            Prévia da Atribuição:
          </div>
          <div className="text-xs text-blue-700 mt-1">
            <div>ETA: {assignmentPreview.estimatedETA}min</div>
            <div>Distância: {assignmentPreview.distanceKm.toFixed(1)}km</div>
            {assignmentPreview.slaRisk && (
              <div className="text-red-600 font-medium">⚠️ Risco de SLA</div>
            )}
          </div>
        </div>
      )}

      {!canAcceptTicket && (
        <div className="absolute inset-0 bg-gray-500/20 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-600 font-medium">
            {agent.status !== 'available' ? 'Indisponível' : 'Capacidade máxima'}
          </span>
        </div>
      )}
    </div>
  );
};

// ===========================================================================================
// Drag & Drop Context Provider
// ===========================================================================================

export const MapDragDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
};

// ===========================================================================================
// Drag & Drop Manager Hook
// ===========================================================================================

export const useDragDropManager = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [assignmentPreview, setAssignmentPreview] = useState<AssignmentPreview | null>(null);

  const handleDragStart = useCallback((item: DragItem) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setAssignmentPreview(null);
  }, []);

  const calculateAssignmentPreview = useCallback(
    (ticketData: any, agentData: any): AssignmentPreview => {
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        ticketData.lat || 0,
        ticketData.lng || 0,
        agentData.lat,
        agentData.lng
      );

      // Estimate ETA based on distance and traffic
      const avgSpeed = 30; // km/h average speed in city
      const estimatedETA = Math.round((distance / avgSpeed) * 60); // minutes

      // Check SLA risk
      const slaDeadline = new Date(ticketData.slaDeadline);
      const now = new Date();
      const timeToSLA = (slaDeadline.getTime() - now.getTime()) / (1000 * 60); // minutes
      const slaRisk = estimatedETA > timeToSLA;

      return {
        ticketId: ticketData.id,
        agentId: agentData.id,
        estimatedETA,
        distanceKm: distance,
        slaRisk
      };
    },
    []
  );

  return {
    draggedItem,
    assignmentPreview,
    handleDragStart,
    handleDragEnd,
    calculateAssignmentPreview,
    setAssignmentPreview
  };
};

// ===========================================================================================
// Helper Functions
// ===========================================================================================

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}