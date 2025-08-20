/**
 * Sistema de grid para auxiliar no posicionamento dos elementos no canvas
 */
import React from 'react'
interface GridSystemProps {
  zoom: number
  visible?: boolean
  gridSize?: number
  opacity?: number
}
export const GridSystem: React.FC<GridSystemProps> = ({
  zoom,
  visible = true,
  gridSize = 20,
  opacity = 0.1
}) => {
  if (!visible) return null
  const adjustedGridSize = gridSize * zoom
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden>
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ opacity }}
      >
        <defs>
          <pattern
            id="grid-pattern"
            width={adjustedGridSize}
            height={adjustedGridSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Linhas verticais */}
            <path
              d={"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-400"
            />
            
            {/* Pontos de grade */}
            <circle
              cx={adjustedGridSize}
              cy={adjustedGridSize}
              r="1"
              fill="currentColor"
              className="text-gray-300"
            />
          </pattern>
          
          {/* Pattern para linhas maiores (a cada 5 células) */}
          <pattern
            id="grid-pattern-major"
            width={adjustedGridSize * 5}
            height={adjustedGridSize * 5}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-500"
              opacity="0.3"
            />
          </pattern>
        </defs>
        
        {/* Grid menor */}
        <rect
          width="100%"
          height="100%"
          fill="url(#grid-pattern)"
        />
        
        {/* Grid maior */}
        <rect
          width="100%"
          height="100%"
          fill="url(#grid-pattern-major)"
        />
      </svg>
    </div>
  )
}
