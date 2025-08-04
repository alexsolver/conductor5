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
      await finishCurrentAction();
      // Navigate to the ticket page if we have a current ticket
      if (timerState.currentTicketId) {
        navigate(`/tickets/${timerState.currentTicketId}`);
      }
    } catch (error) {
      console.error('Failed to finish timer action:', error);
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
