import React, { createContext, useContext, useState, useCallback } from "react";
import { Skeleton } from '@/components/ui/skeleton';
interface LoadingStateContextType {
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, isLoading: boolean) => void;
  isAnyLoading: () => boolean;
  getLoadingKeys: () => string[];
}
const LoadingStateContext = createContext<LoadingStateContextType | undefined>(undefined);
export const LoadingStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);
  const getLoadingKeys = useCallback(() => {
    return Object.keys(loadingStates).filter(key => loadingStates[key]);
  }, [loadingStates]);
  return (
    <LoadingStateContext.Provider value={{
      loadingStates,
      setLoading,
      isAnyLoading,
      getLoadingKeys
    }}>
      {children}
    </LoadingStateContext.Provider>
  );
};
export const useLoadingState = () => {
  const context = useContext(LoadingStateContext);
  if (!context) {
    throw new Error('useLoadingState must be used within LoadingStateProvider');
  }
  return context;
};
// Hook for specific loading state
export const useComponentLoading = (componentKey: string) => {
  const { loadingStates, setLoading } = useLoadingState();
  const isLoading = loadingStates[componentKey] || false;
  const setComponentLoading = useCallback((loading: boolean) => {
    setLoading(componentKey, loading);
  }, [componentKey, setLoading]);
  return { isLoading, setComponentLoading };
};
interface LoadingStateManagerProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rows?: number;
}
export const LoadingStateManager: React.FC<LoadingStateManagerProps> = ({ 
  isLoading, 
  children,
  fallback,
  rows = 5
}) => {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="space-y-4 p-4>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center space-x-4>
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }
  return <>{children}</>;
};