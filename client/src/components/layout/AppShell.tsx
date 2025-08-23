import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useSidebar } from "@/contexts/SidebarContext";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed, toggleSidebar, sidebarHidden } = useSidebar();
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  // Monitor for fullscreen map state changes
  useEffect(() => {
    const checkFullscreenMap = () => {
      const isFullscreen = document.body.classList.contains('fullscreen-map-active');
      setIsMapFullscreen(isFullscreen);
    };

    // Check initially
    checkFullscreenMap();

    // Set up mutation observer to detect class changes
    const observer = new MutationObserver(checkFullscreenMap);
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {!sidebarHidden && (
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebar} 
        />
      )}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className={`flex-1 relative overflow-y-auto focus:outline-none ${
          isMapFullscreen ? 'm-0 p-0' : 'ml-[10px] mr-[10px]'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}
