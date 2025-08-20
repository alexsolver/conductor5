
/**
 * Hook para gerenciar undo/redo de estados
 */

import { useState, useCallback, useRef } from 'react'

export const useUndoRedo = <T>(
  initialState: T,
  setState: (state: T) => void,
  maxHistorySize = 50
) => {
  const [history, setHistory] = useState<T[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  const isUndoRedo = useRef(false)

  const pushState = useCallback((state: T) => {
    if (isUndoRedo.current) return

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1)
      newHistory.push(state)
      
      // Limitar tamanho do histórico
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        return newHistory
      }
      
      return newHistory
    })
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1))
  }, [currentIndex, maxHistorySize])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedo.current = true
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setState(history[newIndex])
      setTimeout(() => { isUndoRedo.current = false }, 0)
    }
  }, [currentIndex, history, setState])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedo.current = true
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setState(history[newIndex])
      setTimeout(() => { isUndoRedo.current = false }, 0)
    }
  }, [currentIndex, history, setState])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    historySize: history.length,
    currentIndex
  }
}
