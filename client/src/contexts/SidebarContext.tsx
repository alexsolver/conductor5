import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  sidebarHidden: boolean;
  setSidebarHidden: (hidden: boolean) => void;
  headerHidden: boolean;
  setHeaderHidden: (hidden: boolean) => void;
  toggleHeader: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleHeader = () => {
    setHeaderHidden(!headerHidden);
  };

  return (
    <SidebarContext.Provider value={{ 
      sidebarCollapsed, 
      setSidebarCollapsed, 
      toggleSidebar,
      sidebarHidden,
      setSidebarHidden,
      headerHidden,
      setHeaderHidden,
      toggleHeader
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}