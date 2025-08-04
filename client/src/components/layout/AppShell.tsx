import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useTimer } from "../../contexts/TimerContext";
import { useLocation } from "wouter";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { timerState, finishCurrentAction } = useTimer();
  const [, navigate] = useLocation();

  const handleTimerClick = async () => {
    try {
      console.log('🖱️ [APPSHELL] Timer clicked, finishing action...');
      const finishedActionId = await finishCurrentAction();
      console.log('✅ [APPSHELL] Action finished, navigating to ticket page...');
      
      // Navigate to the ticket page and let the page handle opening the action modal
      if (timerState.currentTicketId) {
        navigate(`/tickets/${timerState.currentTicketId}?openAction=${finishedActionId || timerState.currentActionId}`);
      }
    } catch (error) {
      console.error('❌ [APPSHELL] Failed to finish timer action:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          timerState={timerState} 
          onTimerClick={handleTimerClick}
        />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
