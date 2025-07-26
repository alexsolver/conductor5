import { useDroppable } from "@dnd-kit/core";
import { Plus, Target } from "lucide-react";

interface DropZoneProps {
  id: string;
  children?: React.ReactNode;
  label?: string;
  className?: string;
  showIndicator?: boolean;
}

export default function DropZone({ 
  id, 
  children, 
  label = "Solte campos aqui", 
  className = "",
  showIndicator = true 
}: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'dropzone',
      accepts: ['field']
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[100px] border-2 border-dashed rounded-lg transition-all
        ${isOver 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${className}
      `}
    >
      {children ? (
        <div className="p-4">
          {children}
        </div>
      ) : (
        showIndicator && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className={`
              p-4 rounded-full mb-3 transition-colors
              ${isOver ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}
            `}>
              {isOver ? (
                <Target className="w-8 h-8" />
              ) : (
                <Plus className="w-8 h-8" />
              )}
            </div>
            <p className={`
              font-medium transition-colors
              ${isOver ? 'text-blue-600' : 'text-gray-500'}
            `}>
              {isOver ? 'Solte o campo aqui' : label}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Arraste campos da paleta para esta área
            </p>
          </div>
        )
      )}
    </div>
  );
}