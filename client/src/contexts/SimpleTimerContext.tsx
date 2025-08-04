import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface RunningAction {
  actionId: string;
  ticketId: string;
  startTime: string;
}

interface SimpleTimerContextValue {
  runningAction: RunningAction | null;
  startAction: (ticketId: string, actionId: string) => void;
  finishAction: (actionId: string) => Promise<void>;
  hasRunningAction: boolean;
}

const SimpleTimerContext = createContext<SimpleTimerContextValue | undefined>(undefined);

export function SimpleTimerProvider({ children }: { children: React.ReactNode }) {
  const [runningAction, setRunningAction] = useState<RunningAction | null>(null);

  // Carregar ação em andamento do localStorage na inicialização
  useEffect(() => {
    const savedAction = localStorage.getItem('runningAction');
    if (savedAction) {
      try {
        setRunningAction(JSON.parse(savedAction));
      } catch (error) {
        console.error('Erro ao carregar ação em andamento:', error);
        localStorage.removeItem('runningAction');
      }
    }
  }, []);

  const startAction = useCallback((ticketId: string, actionId: string) => {
    console.log('🚀 [SIMPLE-TIMER] Starting action:', { ticketId, actionId });
    
    const newRunningAction = {
      actionId,
      ticketId,
      startTime: new Date().toISOString()
    };
    
    setRunningAction(newRunningAction);
    localStorage.setItem('runningAction', JSON.stringify(newRunningAction));
    
    console.log('✅ [SIMPLE-TIMER] Action started and saved');
  }, []);

  const finishAction = useCallback(async (actionId: string) => {
    console.log('🏁 [SIMPLE-TIMER] Finishing action:', actionId);
    
    if (!runningAction || runningAction.actionId !== actionId) {
      console.warn('⚠️ [SIMPLE-TIMER] No matching running action found');
      return;
    }

    // Limpar ação imediatamente para evitar múltiplas chamadas
    setRunningAction(null);
    localStorage.removeItem('runningAction');

    try {
      // Atualizar a ação com hora final
      const endTime = new Date().toISOString();
      const updateData = {
        end_time: endTime,
        status: "completed"
      };

      console.log('📝 [SIMPLE-TIMER] Updating action with:', updateData);

      const response = await fetch(`/api/tickets/${runningAction.ticketId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      console.log('✅ [SIMPLE-TIMER] Action updated successfully:', result);

      console.log('🎯 [SIMPLE-TIMER] Action finished and timer cleared');
      
      // Recarregar a página após pequeno delay para atualizar dados
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [SIMPLE-TIMER] Failed to finish action:', error);
    }
  }, [runningAction]);

  const hasRunningAction = runningAction !== null;

  return (
    <SimpleTimerContext.Provider value={{
      runningAction,
      startAction,
      finishAction,
      hasRunningAction
    }}>
      {children}
    </SimpleTimerContext.Provider>
  );
}

export function useSimpleTimer() {
  const context = useContext(SimpleTimerContext);
  if (!context) {
    throw new Error('useSimpleTimer must be used within a SimpleTimerProvider');
  }
  return context;
}