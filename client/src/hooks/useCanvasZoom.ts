
/**
 * Hook para gerenciar zoom e pan do canvas
 */

import { useState, useCallback, useRef } from 'react'

interface PanState {
  x: number
  y: number
}

export const useCanvasZoom = (initialZoom = 1) => {
  const [zoom, setZoom] = useState(initialZoom)
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null)

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.25))
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Click
      setIsPanning(true)
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    }
  }, [])

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && lastPanPoint.current) {
      const deltaX = e.clientX - lastPanPoint.current.x
      const deltaY = e.clientY - lastPanPoint.current.y
      
      setPan(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }))
      
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
    }
  }, [isPanning, zoom])

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
    lastPanPoint.current = null
  }, [])

  // Adicionar event listeners globais para mouse up
  React.useEffect(() => {
    const handleMouseUp = () => handlePanEnd()
    
    if (isPanning) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, handlePanEnd])

  return {
    zoom,
    pan,
    isPanning,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    setPan,
    handlePanStart,
    handlePanMove,
    handlePanEnd
  }
}
