import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Type,
  AlignLeft,
  ChevronDown,
  Hash,
  Calendar,
  CheckSquare,
  Mail,
  Phone,
  AlertTriangle,
  Circle,
  Tag,
  User,
  Building,
  MapPin,
  Users,
  Package,
  Truck,
  DollarSign,
  GripVertical,
  X
} from 'lucide-react';

interface DraggableFieldItemProps {
  field: {
    id: string;
    type: string;
    label: string;
    icon: string;
  };
  isDragging: boolean;
  isDropped?: boolean;
  onRemove?: () => void;
}

const getIconComponent = (iconName: string) => {
  const icons = {
    Type,
    AlignLeft,
    ChevronDown,
    Hash,
    Calendar,
    CheckSquare,
    Mail,
    Phone,
    AlertTriangle,
    Circle,
    Tag,
    User,
    Building,
    MapPin,
    Users,
    Package,
    Truck,
    DollarSign
  };
  
  return icons[iconName as keyof typeof icons] || Type;
};

const getFieldTypeColor = (type: string) => {
  const colors = {
    text: 'bg-blue-50 text-blue-700 border-blue-200',
    textarea: 'bg-blue-50 text-blue-700 border-blue-200',
    select: 'bg-green-50 text-green-700 border-green-200',
    number: 'bg-purple-50 text-purple-700 border-purple-200',
    date: 'bg-orange-50 text-orange-700 border-orange-200',
    checkbox: 'bg-gray-50 text-gray-700 border-gray-200',
    email: 'bg-red-50 text-red-700 border-red-200',
    phone: 'bg-red-50 text-red-700 border-red-200',
    priority: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    status: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    category: 'bg-pink-50 text-pink-700 border-pink-200',
    assignee: 'bg-teal-50 text-teal-700 border-teal-200',
    company: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    address: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    contact: 'bg-violet-50 text-violet-700 border-violet-200',
    inventory: 'bg-amber-50 text-amber-700 border-amber-200',
    supplier: 'bg-slate-50 text-slate-700 border-slate-200',
    price: 'bg-lime-50 text-lime-700 border-lime-200'
  };
  
  return colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export function DraggableFieldItem({ field, isDragging, isDropped = false, onRemove }: DraggableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDraggedOver
  } = useDraggable({
    id: field.id,
    disabled: isDropped
  });

  const IconComponent = getIconComponent(field.icon);
  const colorClass = getFieldTypeColor(field.type);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const baseCardClass = `
    relative cursor-pointer border transition-all duration-200
    ${colorClass}
    ${isDragging ? 'shadow-lg scale-105 rotate-2 z-50' : 'hover:shadow-md'}
    ${isDraggedOver ? 'ring-2 ring-blue-500' : ''}
    ${isDropped ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
  `;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={baseCardClass}
      {...(isDropped ? {} : listeners)}
      {...attributes}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {!isDropped && (
              <GripVertical className="h-4 w-4 text-gray-400" />
            )}
            <IconComponent className="h-4 w-4" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {field.label}
              </p>
              <p className="text-xs opacity-75">
                {field.type}
              </p>
            </div>
          </div>
          
          {isDropped && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Field Type Badge */}
        <div className="mt-2">
          <Badge 
            variant="outline" 
            className="text-xs"
          >
            {field.type}
          </Badge>
        </div>
      </div>

      {/* Drag Indicator */}
      {!isDropped && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-current rounded-full"></div>
        </div>
      )}
    </Card>
  );
}

export default DraggableFieldItem;