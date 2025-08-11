
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';

interface Workspace {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
}

export function useWorkspaceSelector() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Buscar workspaces do usuário
  const fetchUserWorkspaces = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/users/${user.email}/workspaces`);
      const data = await response.json();
      
      if (data.success) {
        setWorkspaces(data.workspaces || []);
        
        // Definir workspace atual
        const current = data.workspaces?.find((w: Workspace) => w.id === user.tenantId) || data.workspaces?.[0];
        setCurrentWorkspace(current);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar para uma workspace
  const switchWorkspace = async (workspaceId: string) => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/switch-workspace', {
        workspaceId,
        userEmail: user.email
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        // Atualizar token no localStorage
        localStorage.setItem('authToken', data.token);
        
        // Recarregar a página para aplicar a nova workspace
        window.location.reload();
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    fetchUserWorkspaces();
  }, [user?.email]);

  return {
    workspaces,
    currentWorkspace,
    isLoading,
    isOpen,
    setIsOpen,
    switchWorkspace,
    hasMultipleWorkspaces: workspaces.length > 1
  };
}
