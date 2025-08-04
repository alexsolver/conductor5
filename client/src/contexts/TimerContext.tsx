import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
}

interface TimerContextValue {
  timerState: TimerState;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0
  });

  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    const now = Date.now();
    setTimerState({
      isRunning: true,
      startTime: now,
      elapsedTime: 0
    });

    timerInterval.current = setInterval(() => {
      setTimerState(prev => ({
        ...prev,
        elapsedTime: Date.now() - (prev.startTime || now)
      }));
    }, 1000);
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

  const resetTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    setTimerState({
      isRunning: false,
      startTime: null,
      elapsedTime: 0
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
    <TimerContext.Provider value={{ timerState, startTimer, stopTimer, resetTimer }}>
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