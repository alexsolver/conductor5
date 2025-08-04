import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  currentActionId: string | null;
  currentTicketId: string | null;
}

interface TimerContextValue {
  timerState: TimerState;
  startTimer: (ticketId: string) => Promise<string>;
  stopTimer: () => void;
  resetTimer: () => void;
  finishCurrentAction: () => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    currentActionId: null,
    currentTicketId: null
  });

  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(async (ticketId: string): Promise<string> => {
    console.log('🚀 [TIMER] Starting timer for ticket:', ticketId);
    const now = Date.now();
    
    try {
      // Create the action first
      const actionData = {
        action_type: "investigation", // Changed to supported type
        agent_id: "auto", // Will be set by backend
        title: "Cronômetro Ativo",
        description: "Ação em andamento - tempo sendo registrado",
        start_time: new Date(now).toISOString(),
        status: "pending",
        priority: "medium"
      };

      console.log('📤 [TIMER] Creating action with data:', actionData);

      const response = await apiRequest(`/api/tickets/${ticketId}/actions`, {
        method: 'POST',
        body: JSON.stringify(actionData),
      });

      console.log('📥 [TIMER] Action creation response:', response);

      if (!response || !response.success) {
        console.error('❌ [TIMER] API Error:', response);
        throw new Error(`Failed to create action: ${response?.message || 'Unknown error'}`);
      }

      const actionId = response.data.id;
      console.log('✅ [TIMER] Action created with ID:', actionId);

      // Start the timer with action ID
      setTimerState({
        isRunning: true,
        startTime: now,
        elapsedTime: 0,
        currentActionId: actionId,
        currentTicketId: ticketId
      });

      timerInterval.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          elapsedTime: Date.now() - (prev.startTime || now)
        }));
      }, 1000);

      console.log('⏱️ [TIMER] Timer started successfully');
      return actionId;
    } catch (error) {
      console.error('❌ [TIMER] Failed to start timer:', error);
      console.error('❌ [TIMER] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause
      });
      throw error;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    setTimerState(prev => ({
      ...prev,
      isRunning: false
    }));
  }, []);

  const finishCurrentAction = useCallback(async () => {
    if (!timerState.currentActionId || !timerState.currentTicketId) {
      return;
    }

    try {
      const endTime = Date.now();
      const startTime = timerState.startTime || endTime;
      const elapsedMs = endTime - startTime;
      const elapsedHours = (elapsedMs / (1000 * 60 * 60)).toFixed(2);

      // Update the action with end time and duration
      const updateData = {
        end_time: new Date(endTime).toISOString(),
        estimated_hours: elapsedHours,
        status: "completed",
        title: `Cronômetro Finalizado - ${elapsedHours}h`,
        description: `Ação concluída. Tempo total: ${elapsedHours} horas`
      };

      await apiRequest(`/api/tickets/${timerState.currentTicketId}/actions/${timerState.currentActionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      // Stop the timer
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }

      setTimerState({
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        currentActionId: null,
        currentTicketId: null
      });
    } catch (error) {
      console.error('Failed to finish action:', error);
    }
  }, [timerState.currentActionId, timerState.currentTicketId, timerState.startTime]);

  const resetTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    setTimerState({
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      currentActionId: null,
      currentTicketId: null
    });
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return (
    <TimerContext.Provider value={{ timerState, startTimer, stopTimer, resetTimer, finishCurrentAction }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}