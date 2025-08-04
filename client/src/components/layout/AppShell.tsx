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
  const { timerState } = useTimer();
  const [, navigate] = useLocation();

  const handleTimerClick = () => {
    // Navigate back to the ticket page when timer aura is clicked
    // You might want to store the current ticket ID in the timer context
    // For now, we'll just show an alert
    alert('Timer is running! Click to return to the ticket where the timer was started.');
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
