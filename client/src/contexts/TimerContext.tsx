import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  finishCurrentAction: () => Promise<string | null>;
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
      // Get current user info from localStorage
      const userString = localStorage.getItem('user');
      const currentUser = userString ? JSON.parse(userString) : null;
      const agentId = currentUser?.id || '550e8400-e29b-41d4-a716-446655440001'; // fallback to current logged user

      // Create the action first
      const actionData = {
        action_type: "investigation",
        title: "Cronômetro Ativo",
        description: "Ação em andamento - tempo sendo registrado",
        start_time: new Date(now).toISOString(),
        status: "pending",
        priority: "medium",
        agent_id: agentId
      };

      console.log('📤 [TIMER] Creating action with data:', actionData);

      const response = await apiRequest('POST', `/api/tickets/${ticketId}/actions`, actionData);
      const responseData = await response.json();

      console.log('📥 [TIMER] Action creation response:', responseData);

      if (!responseData || !responseData.success) {
        console.error('❌ [TIMER] API Error:', responseData);
        throw new Error(`Failed to create action: ${responseData?.message || 'Unknown error'}`);
      }

      const actionId = responseData.data.id;
      console.log('✅ [TIMER] Action created with ID:', actionId);

      // Start the timer with action ID
      setTimerState({
        isRunning: true,
        startTime: now,
        elapsedTime: 0,
        currentActionId: actionId,
        currentTicketId: ticketId
      });

      console.log('📊 [TIMER] Timer state set:', {
        isRunning: true,
        startTime: now,
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
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
        cause: (error as any)?.cause
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

  const finishCurrentAction = useCallback(async (): Promise<string | null> => {
    if (!timerState.currentActionId || !timerState.currentTicketId || !timerState.isRunning) {
      console.log('🚫 [TIMER] Cannot finish - missing actionId, ticketId or timer not running');
      return null;
    }

    const actionId = timerState.currentActionId;
    const ticketId = timerState.currentTicketId;

    // Prevent multiple executions by immediately setting isRunning to false
    setTimerState(prev => ({ ...prev, isRunning: false }));

    try {
      console.log('🏁 [TIMER] Finishing action:', actionId);
      const endTime = Date.now();
      const startTime = timerState.startTime || endTime;
      const elapsedMs = endTime - startTime;
      const elapsedHours = (elapsedMs / (1000 * 60 * 60)).toFixed(2);

      // Update the action with end time and duration
      const updateData = {
        end_time: new Date(endTime).toISOString(),
        estimated_hours: parseFloat(elapsedHours),
        status: "completed",
        title: `Cronômetro Finalizado - ${elapsedHours}h`,
        description: `Ação concluída. Tempo total: ${elapsedHours} horas`
      };

      console.log('📝 [TIMER] Updating action with:', updateData);

      const response = await apiRequest('PATCH', `/api/tickets/${ticketId}/actions/${actionId}`, {
        body: updateData
      });
      
      const result = await response.json();

      console.log('✅ [TIMER] Action updated successfully:', result);

      // Invalidate queries to refresh the actions list
      await queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId, 'actions'] });

      // Stop the timer
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }

      // Complete timer reset
      setTimerState({
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        currentActionId: null,
        currentTicketId: null
      });

      console.log('🎯 [TIMER] Timer finished and cache invalidated');
      
      // Navigate to ticket page with openAction parameter for automatic modal opening
      setTimeout(() => {
        console.log('🧭 [TIMER] Navigating to ticket with openAction:', actionId);
        window.location.href = `/tickets/${ticketId}?openAction=${actionId}`;
      }, 500);
      
      return actionId;
    } catch (error) {
      console.error('❌ [TIMER] Failed to finish action:', error);
      // Reset timer state even on error
      setTimerState({
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        currentActionId: null,
        currentTicketId: null
      });
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      return null;
    }
  }, [timerState.currentActionId, timerState.currentTicketId, timerState.startTime, timerState.isRunning]);

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