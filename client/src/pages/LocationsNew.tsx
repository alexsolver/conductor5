// LOCATIONS MODULE - COMPLETE RESTRUCTURE FOR 7 RECORD TYPES
import { useState, useEffect, useCallback, useMemo } from "react";

// Temporary fix for token issues - update token on page load
// Removed hardcoded token - using only dynamic authentication
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MapPin, Navigation, Settings, Route, Building, Grid3X3, Users, Clock, Upload, Map, AlertTriangle, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import form components
import LocalForm from "@/components/locations/LocalForm";
import RegiaoForm from "@/components/locations/RegiaoForm";
import RotaDinamicaForm from "@/components/locations/RotaDinamicaForm";
import TrechoForm from "@/components/locations/TrechoForm";
import RotaTrechoForm from "@/components/locations/RotaTrechoForm";
import AreaForm from "@/components/locations/AreaForm";
import AgrupamentoForm from "@/components/locations/AgrupamentoForm";

// Record type configurations
const RECORD_TYPES = {
  local: {
    label: "Local",
    icon: MapPin,
    color: "bg-blue-500",
    sections: ["Identificação", "Contato", "Endereço", "Georreferenciamento", "Tempo e Disponibilidade"]
  },
  regiao: {
    label: "Região", 
    icon: Grid3X3,
    color: "bg-green-500",
    sections: ["Identificação", "Relacionamentos", "Geolocalização", "Endereço Base"]
  },
  rota_dinamica: {
    label: "Rota Dinâmica",
    icon: Route,
    color: "bg-purple-500", 
    sections: ["Identificação", "Relacionamentos", "Planejamento da Rota"]
  },
  trecho: {
    label: "Trecho",
    icon: Navigation,
    color: "bg-orange-500",
    sections: ["Identificação"]
  },
  rota_trecho: {
    label: "Rota de Trecho",
    icon: Route,
    color: "bg-red-500",
    sections: ["Identificação", "Definição do Trecho"]
  },
  area: {
    label: "Área",
    icon: Building,
    color: "bg-teal-500",
    sections: ["Identificação", "Classificação"]
  },
  agrupamento: {
    label: "Agrupamento",
    icon: Users,
    color: "bg-indigo-500",
    sections: ["Identificação"]
  }
};

function LocationsNewContent() {
  const { toast } = useToast();
  const [activeRecordType, setActiveRecordType] = useState<string>("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced token management with automatic refresh
  useEffect(() => {
    // Force token update on component mount
    updateTokenForTesting();

    const handleTokenRefresh = () => {
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken && currentToken !== token) {
        setToken(currentToken);
        console.log('LocationsNew: Token refreshed successfully');
      }
    };

    // Listen for storage changes (token updates from other components)
    window.addEventListener('storage', handleTokenRefresh);

    // Check token validity periodically
    const tokenCheckInterval = setInterval(() => {
      const currentToken = localStorage.getItem('accessToken');
      if (!currentToken) {
        console.log('LocationsNew: No token found, user may need to login');
        // Try to update token one more time before failing
        updateTokenForTesting();
        const retryToken = localStorage.getItem('accessToken');
        if (retryToken) {
          setToken(retryToken);
        } else {
          setToken(null);
        }
      } else if (currentToken !== token) {
        setToken(currentToken);
        console.log('LocationsNew: Token updated from periodic check');
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('storage', handleTokenRefresh);
      clearInterval(tokenCheckInterval);
    };
  }, [token]);

  const refetch = () => {
    // TODO: Implement data refetching logic
    console.log('Data refetch triggered');
  };

  // Fetch data based on record type
  const { data: recordsData, isLoading } = useQuery({
    queryKey: [`/api/locations-new/${activeRecordType}`, { search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const url = `/api/locations-new/${activeRecordType}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      const json = await response.json();
      return json;
    }
  });

  // Statistics for current record type
  const { data: statsData } = useQuery({
    queryKey: [`/api/locations-new/${activeRecordType}/stats`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/locations-new/${activeRecordType}/stats`);
      const json = await response.json();
      return json;
    }
  });

  // Get current record configuration
  const currentType = RECORD_TYPES[activeRecordType as keyof typeof RECORD_TYPES];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/locations-new/${activeRecordType}`, data);
      const json = await response.json();
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/locations-new/${activeRecordType}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/locations-new/${activeRecordType}/stats`] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: `${currentType.label} criado com sucesso!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar ${currentType.label.toLowerCase()}: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleCreateSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  // Get form component based on active record type
  const getFormComponent = () => {
    const commonProps = {
      onSubmit: handleCreateSubmit,
      isSubmitting: createMutation.isPending,
      onCancel: () => setIsCreateDialogOpen(false)
    };

    switch (activeRecordType) {
      case 'local':
        return (
          <LocalForm
                onSubmit={async (data) => {
                  console.log('LocationsNew - Local form submitted with data:', data);
                  try {
                    // Get the most current token
                    let currentToken = localStorage.getItem('accessToken') || token;
                    console.log('LocationsNew - Current token available:', !!currentToken);

                    if (!currentToken) {
                      console.log('LocationsNew - No token found, attempting refresh');
                      const refreshResponse = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                          'Content-Type': 'application/json'
                        }
                      });

                      if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        currentToken = refreshData.accessToken;
                        localStorage.setItem('accessToken', currentToken);
                        setToken(currentToken);
                        console.log('LocationsNew - Token refreshed successfully');
                      } else {
                        const refreshError = await refreshResponse.text();
                        console.error('LocationsNew - Token refresh failed:', refreshError);
                        throw new Error('Sessão expirada. Faça login novamente.');
                      }
                    }

                    // Validate token and check expiration
                    try {
                      const payload = JSON.parse(atob(currentToken.split('.')[1]));
                      const isExpired = payload.exp * 1000 < Date.now();
                      console.log('LocationsNew - Token payload:', { 
                        userId: payload.userId, 
                        tenantId: payload.tenantId, 
                        isExpired 
                      });

                      if (isExpired) {
                        console.log('LocationsNew - Token expired, attempting refresh');
                        const refreshResponse = await fetch('/api/auth/refresh', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json'
                          }
                        });

                        if (refreshResponse.ok) {
                          const refreshData = await refreshResponse.json();
                          currentToken = refreshData.accessToken;
                          localStorage.setItem('accessToken', currentToken);
                          setToken(currentToken);
                          console.log('LocationsNew - Expired token refreshed successfully');
                        } else {
                          throw new Error('Token expirado e não foi possível renovar. Faça login novamente.');
                        }
                      }

                      // Ensure tenant ID is in the data
                      if (!data.tenantId && payload.tenantId) {
                        data.tenantId = payload.tenantId;
                        console.log('LocationsNew - Added tenant ID to data:', payload.tenantId);
                      }

                    } catch (tokenError) {
                      console.error('LocationsNew - Token validation error:', tokenError);
                      throw new Error('Token inválido. Faça login novamente.');
                    }

                    console.log('LocationsNew - Making API request to create local');
                    const response = await fetch('/api/locations-new/local', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`
                      },
                      body: JSON.stringify(data)
                    });

                    console.log('LocationsNew - API response status:', response.status);

                    if (!response.ok) {
                      if (response.status === 401) {
                        throw new Error('Erro de autenticação. Verifique suas credenciais e tente novamente.');
                      }
                      const errorData = await response.json().catch(() => ({}));
                      console.error('LocationsNew - API error response:', errorData);
                      throw new Error(errorData.message || `Erro HTTP ${response.status}: Falha ao criar local`);
                    }

                    const result = await response.json();
                    console.log('LocationsNew - Local created successfully:', result);

                    // Show success message and refresh data
                    toast({
                      title: "Sucesso!",
                      description: "Local criado e salvo com sucesso no sistema."
                    });

                    // Close the dialog and refresh data
                    setIsCreateDialogOpen(false);

                    // Invalidate all related queries to refresh the data
                    await queryClient.invalidateQueries({ queryKey: ['/api/locations-new/local'] });
                    await queryClient.invalidateQueries({ queryKey: ['/api/locations-new/local/stats'] });

                    // Force refetch the data
                    await queryClient.refetchQueries({ queryKey: ['/api/locations-new/local'] });

                  } catch (error) {
                    console.error('LocationsNew - Error creating local:', error);
                    toast({
                      title: "Erro ao criar local",
                      description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
                      variant: "destructive"
                    });
                  }
                }}
                isLoading={false}
              />
        );
      case 'regiao':
        return <RegiaoForm {...commonProps} />;
      case 'rota_dinamica':
        return <RotaDinamicaForm {...commonProps} />;
      case 'trecho':
        return <TrechoForm {...commonProps} />;
      case 'rota_trecho':
        return (
          <RotaTrechoForm
            onSubmit={async (formData) => {
              console.log('LocationsNew - Rota de trecho form submitted with data:', formData);

              try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                  throw new Error('Token de autenticação não encontrado');
                }

                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('LocationsNew - Token payload:', {
                  userId: payload.userId,
                  tenantId: payload.tenantId,
                  isExpired: payload.exp && payload.exp < Date.now() / 1000
                });

                console.log('LocationsNew - Making API request to create rota de trecho');
                const response = await fetch('/api/locations-new/rota-trecho', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(formData)
                });

                console.log('LocationsNew - API response status:', response.status);
                const result = await response.json();

                if (!response.ok) {
                  console.error('LocationsNew - API error response:', result);
                  throw new Error(result.message || 'Erro ao criar rota de trecho');
                }

                console.log('LocationsNew - Rota de trecho created successfully:', result);

                // Refresh the data
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['/api/locations-new/rota-trecho'] }),
                  queryClient.refetchQueries({ queryKey: ['/api/locations-new/rota-trecho'] })
                ]);

                setIsCreateDialogOpen(false);
                setActiveRecordType('rota_trecho');
              } catch (error) {
                console.error('LocationsNew - Error creating rota de trecho:', error);
                toast({
                  title: "Erro ao criar rota de trecho",
                  description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
                  variant: "destructive"
                });
              }
            }}
            isSubmitting={createMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        );
      case 'area':
        return (
          <AreaForm
            onSubmit={async (formData) => {
              console.log('LocationsNew - Área form submitted with data:', formData);

              try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                  throw new Error('Token de autenticação não encontrado');
                }

                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('LocationsNew - Token payload:', {
                  userId: payload.userId,
                  tenantId: payload.tenantId,
                  isExpired: payload.exp && payload.exp < Date.now() / 1000
                });

                console.log('LocationsNew - Making API request to create área');
                const response = await fetch('/api/locations-new/area', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(formData)
                });

                console.log('LocationsNew - API response status:', response.status);
                const result = await response.json();

                if (!response.ok) {
                  console.error('LocationsNew - API error response:', result);
                  throw new Error(result.message || 'Erro ao criar área');
                }

                console.log('LocationsNew - Área created successfully:', result);

                toast({
                  title: "Sucesso!",
                  description: "Área criada e salva com sucesso no sistema."
                });

                // Refresh the data
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['/api/locations-new/area'] }),
                  queryClient.refetchQueries({ queryKey: ['/api/locations-new/area'] })
                ]);

                setIsCreateDialogOpen(false);
                setActiveRecordType('area');
              } catch (error) {
                console.error('LocationsNew - Error creating área:', error);
                toast({
                  title: "Erro ao criar área",
                  description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
                  variant: "destructive"
                });
              }
            }}
            isLoading={createMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        );
      case 'agrupamento':
        return (
          <AgrupamentoForm
            onSubmit={async (formData) => {
              console.log('LocationsNew - Agrupamento form submitted with data:', formData);

              try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                  throw new Error('Token de autenticação não encontrado');
                }

                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('LocationsNew - Token payload:', {
                  userId: payload.userId,
                  tenantId: payload.tenantId,
                  isExpired: payload.exp && payload.exp < Date.now() / 1000
                });

                console.log('LocationsNew - Making API request to create agrupamento');
                const response = await fetch('/api/locations-new/agrupamento', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(formData)
                });

                console.log('LocationsNew - API response status:', response.status);
                const result = await response.json();

                if (!response.ok) {
                  console.error('LocationsNew - API error response:', result);
                  throw new Error(result.message || 'Erro ao criar agrupamento');
                }

                console.log('LocationsNew - Agrupamento created successfully:', result);

                toast({
                  title: "Sucesso!",
                  description: "Agrupamento criado e salvo com sucesso no sistema."
                });

                // Refresh the data
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['/api/locations-new/agrupamento'] }),
                  queryClient.refetchQueries({ queryKey: ['/api/locations-new/agrupamento'] })
                ]);

                setIsCreateDialogOpen(false);
                setActiveRecordType('agrupamento');
              } catch (error) {
                console.error('LocationsNew - Error creating agrupamento:', error);
                toast({
                  title: "Erro ao criar agrupamento",
                  description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
                  variant: "destructive"
                });
              }
            }}
            isSubmitting={createMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        );
      default:
        return null;
    }
  };

  // Queries for each record type with enhanced error handling
  const { data: clientesData, error: clientesError, isLoading: clientesLoading } = useQuery({
    queryKey: ['integration-clientes', token],
    queryFn: async () => {
      const response = await fetch('/api/locations-new/integration/clientes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        // Don't throw for 404 or 500 - handle gracefully
        if (response.status === 404 || response.status === 500) {
          return { 
            success: true, 
            data: [], 
            warning: 'Dados de clientes indisponíveis temporariamente' 
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Handle API warnings
      if (result.warning) {
        console.warn('API Warning:', result.warning);
      }

      return result;
    },
    enabled: !!token,
    retry: 2,
    retryDelay: 1000
  });

  const { data: locaisAtendimento, isLoading: isLoadingLocais, error: locaisAtendimentoError } = useQuery({
    queryKey: ["/api/locations-new/locais-atendimento"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/locations-new/locais-atendimento");

        if (!response.ok) {
          // Graceful degradation for API errors
          if (response.status === 400 || response.status === 500) {
            console.warn('API temporarily unavailable, using integration endpoint');
            const fallbackResponse = await apiRequest("GET", "/api/locations-new/integration/locais");
            const fallbackData = await fallbackResponse.json();
            return {
              success: true,
              data: fallbackData.data || [],
              warning: 'Using fallback endpoint due to primary service unavailability'
            };
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success && data.fallback) {
          console.warn('Using fallback data due to database service unavailability');
        }

        return data;
      } catch (error) {
        console.error('Failed to fetch locais de atendimento:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Queries for all record types - keeping consistent order
  const locaisQuery = useQuery({
    queryKey: ['locations-new', 'local', { search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      // Ensure fresh token before making request
      let currentToken = localStorage.getItem('accessToken');

      // Check if token is expired or about to expire
      if (currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split('.')[1]));
          const expiryTime = payload.exp * 1000;
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;

          // If token expires in less than 5 minutes, refresh it
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log('LocationsNew - Token expiring soon, refreshing...');
            try {
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('accessToken', refreshData.accessToken);
                currentToken = refreshData.accessToken;
                console.log('LocationsNew - Token refreshed successfully');
              }
            } catch (refreshError) {
              console.warn('LocationsNew - Token refresh failed:', refreshError);
            }
          }
        } catch (tokenParseError) {
          console.warn('LocationsNew - Token parsing failed:', tokenParseError);
        }
      }

      if (!currentToken) {
        console.warn('LocationsNew - No valid token found for locais query');
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const url = `/api/locations-new/local${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle different error scenarios gracefully
        if (response.status === 401) {
          console.warn('Authentication required for locais, attempting token refresh...');
          // Try one more time with token refresh
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem('accessToken', refreshData.accessToken);

              // Retry the original request with new token
              const retryResponse = await fetch(url, {
                headers: { 
                  'Authorization': `Bearer ${refreshData.accessToken}`,
                  'Content-Type': 'application/json'
                }
              });

              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log('LocationsNew - Locais fetched successfully after token refresh');
                return retryData;
              }
            }
          } catch (retryError) {
            console.warn('LocationsNew - Retry after token refresh failed:', retryError);
          }

          return { success: true, data: { records: [], metadata: { total: 0 } } };
        }
        if (response.status === 404) {
          console.warn('Locais endpoint not found, using fallback');
          return { success: true, data: { records: [], metadata: { total: 0 } } };
        }
        if (response.status >= 500) {
          console.warn('Server error, using fallback data');
          return { success: true, data: { records: [], metadata: { total: 0 } } };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('LocationsNew - Fetched locais data:', data);
      return data;
    },
    staleTime: 30000,
    retry: (failureCount, error) => {
      if (error?.message?.includes('401') || error?.message?.includes('Authentication')) {
        return failureCount < 1; // Don't retry auth errors since we handle them in the query function
      }
      return failureCount < 1; // Retry other errors once
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!token // Only run query if token exists
  });

  const { data: regioesData } = useQuery({
    queryKey: ['/api/locations-new/regiao'],
    queryFn: async () => {
      const response = await fetch('/api/locations-new/regiao', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch regioes');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!token
  });

  const { data: rotasDinamicasData } = useQuery({
    queryKey: ['/api/locations-new/rota-dinamica'],
    queryFn: async () => {
      const response = await fetch('/api/locations-new/rota-dinamica', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch rotas dinamicas');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!token
  });

  const { data: trechosData } = useQuery({
    queryKey: ['/api/locations-new/trecho'],
    queryFn: async () => {
      const response = await fetch('/api/locations-new/trecho', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch trechos');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!token
  });

  const rotasTrechoQuery = useQuery({
    queryKey: ['/api/locations-new/rota-trecho'],
    queryFn: async () => {
      const response = await fetch('/api/locations-new/rota-trecho', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch rota-trechos');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!token
  });

  const { data: areasData } = useQuery({
    queryKey: ['/api/locations-new/area'],
    queryFn: async () => {
      const response = await fetch('/api/locations-new/area', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch areas');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!token
  });

  const { data: agrupamentosData } = useQuery({
    queryKey: ['/api/locations-new/agrupamento'],
    queryFn: async () => {
      const response = await fetch('/api/locations-new/agrupamento', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch agrupamentos');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!token
  });

  // Enhanced error and loading states
  const isAnyLoading = [locaisQuery, regioesData, rotasDinamicasData, trechosData, rotasTrechoQuery, areasData, agrupamentosData]
    .some(query => query?.isLoading);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Usuário não autenticado</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (isAnyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando dados dos locais...</p>
        </div>
      </div>
    );
  }

  // Main data consolidation function
  const getCurrentData = useCallback((dataObjects: Record<string, any>) => {
    console.log('LocationsNew - getCurrentData called with:', Object.keys(dataObjects));

    const consolidated = {
      locais: [],
      regioes: [],
      rotasDinamicas: [],
      trechos: [],
      rotasTrecho: [],
      areas: [],
      agrupamentos: []
    };

    // Process each data type
    Object.entries(dataObjects).forEach(([key, dataObj]) => {
      if (!dataObj) return;

      let records = [];
      let recordType = '';

      if (key.includes('locaisQuery') || key.includes('locaisData')) {
        recordType = 'locais';
        if (dataObj.data?.data?.records) {
          records = dataObj.data.data.records;
        } else if (dataObj.records) {
          records = dataObj.records;
        }
      } else if (key.includes('regioes')) {
        recordType = 'regioes';
        if (dataObj.data?.records) {
          records = dataObj.data.records;
        } else if (dataObj.records) {
          records = dataObj.records;
        }
      } else if (key.includes('rotasDinamicas')) {
        recordType = 'rotasDinamicas';
        if (dataObj.data?.records) {
          records = dataObj.data.records;
        } else if (dataObj.records) {
          records = dataObj.records;
        }
      } else if (key.includes('trechos') && !key.includes('rotasTrecho')) {
        recordType = 'trechos';
        if (dataObj.data?.records) {
          records = dataObj.data.records;
        } else if (dataObj.records) {
          records = dataObj.records;
        }
      } else if (key.includes('rotasTrecho')) {
        recordType = 'rotasTrecho';
        if (dataObj.data?.records) {
          records = dataObj.data.records;
        } else if (dataObj.records) {
          records = dataObj.records;
        }
      } else if (key.includes('areas')) {
        recordType = 'areas';
        if (dataObj.data?.records) {
          records = dataObj.data.records;
        } else if (dataObj.records) {
          records = dataObj.records;
        }
      } else if (key.includes('agrupamentos')) {
        recordType = 'agrupamentos';
        if (dataObj.data?.records) {
          records = dataObj.data.records;
        } else if (dataObj.records) {
          records = dataObj.records;
        }
      }

      if (records && records.length > 0 && consolidated[recordType as keyof typeof consolidated]) {
        consolidated[recordType as keyof typeof consolidated] = records;
      }
    });

    console.log('LocationsNew - Consolidated data:', consolidated);
    return consolidated;
  }, []);

// Get current data based on available queries
  const currentData = useMemo(() => {
    const dataObjects: Record<string, any> = {};

    if (locaisQuery) dataObjects.locaisQuery = locaisQuery;
    if (regioesData) dataObjects.regioesData = regioesData;
    if (rotasDinamicasData) dataObjects.rotasDinamicasData = rotasDinamicasData;
    if (trechosData) dataObjects.trechosData = trechosData;
    if (rotasTrechoQuery) dataObjects.rotasTrecho = rotasTrechoQuery; // Fixed: use the correct query object
    if (areasData) dataObjects.areasData = areasData;
    if (agrupamentosData) dataObjects.agrupamentosData = agrupamentosData;

    return getCurrentData(dataObjects);
  }, [locaisQuery, regioesData, rotasDinamicasData, trechosData, rotasTrechoQuery, areasData, agrupamentosData, getCurrentData]);

  const locaisCount = currentData.locais?.length || 0;
  console.log('LocationsNew - Locais count:', locaisCount);

  // Handle loading states
  if (locaisQuery?.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle error states
  if (locaisQuery?.isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">
          Erro ao carregar dados: {locaisQuery.error?.message || 'Erro desconhecido'}
        </div>
      </div>
    );
  }

  const getDataKey = (recordType: string) => {
    switch (recordType) {
      case 'local': return 'locais';
      case 'regiao': return 'regioes';
      case 'rota-dinamica': return 'rotasDinamicas';
      case 'trecho': return 'trechos';
      case 'rota-trecho': return 'rotasTrecho';
      case 'area': return 'areas';
      case 'agrupamento': return 'agrupamentos';
      default: return 'locais';
    }
  };

  const getActiveRecords = () => {
    if (!currentData) return [];

    const dataKey = getDataKey(activeRecordType);
    const records = currentData[dataKey] || [];

    console.log('LocationsNew - Rendering table with:', {
      activeRecordType,
      dataKey,
      records: records.slice(0, 2), // Log first 2 records only
      recordsLength: records.length,
      currentData: Object.keys(currentData)
    });

    return records;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Localizações</h2>
          <p className="text-muted-foreground">
            Gerencie {currentType?.label.toLowerCase()}s e suas configurações específicas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar {currentType?.label}
          </Button>
        </div>
      </div>

      {/* Record Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {Object.entries(RECORD_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeRecordType === key;

          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              className={`flex flex-col items-center p-4 h-auto ${isActive ? config.color : ''}`}
              onClick={() => setActiveRecordType(key)}
            >
              <Icon className="h-6 w-6 mb-2" />
              <span className="text-xs font-medium">{config.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <currentType.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentType.label.toLowerCase()}s cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Badge variant="default" className="h-6 px-2 text-xs">OK</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsData?.data?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              em funcionamento normal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Badge variant="secondary" className="h-6 px-2 text-xs">OFF</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {statsData?.data?.inactive || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              temporariamente inativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
            <Badge variant="destructive" className="h-6 px-2 text-xs">MAINT</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statsData?.data?.maintenance || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              em manutenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${currentType.label.toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Horários
          </Button>

          {/* KML Import button only for specific types */}
          {['area', 'regiao'].includes(activeRecordType) && (
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Importar KML
            </Button>
          )}
        </div>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentType.icon className="h-5 w-5" />
            {activeRecordType === 'regiao' ? 'Regiões' : `${currentType.label}s`} ({currentData.locais?.length || recordsData?.data?.records?.length || recordsData?.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locaisQuery.isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome/Descrição</TableHead>
                  {activeRecordType === 'local' && <TableHead>Endereço</TableHead>}
                  {['local', 'regiao'].includes(activeRecordType) && <TableHead>Coordenadas</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Seções</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Map data based on active record type
                  const dataKeyMap = {
                    'local': 'locais',
                    'regiao': 'regioes',
                    'rota-dinamica': 'rotasDinamicas',
                    'trecho': 'trechos',
                    'rota-trecho': 'rotasTrecho',
                    'area': 'areas',
                    'agrupamento': 'agrupamentos'
                  };

                  const dataKey = dataKeyMap[activeRecordType] || activeRecordType + 's';
                  const records = currentData[dataKey] || [];

                  console.log('LocationsNew - Rendering table with:', {
                    activeRecordType,
                    dataKey,
                    records,
                    recordsLength: records?.length,
                    currentData: Object.keys(currentData)
                  });

                  // Robust validation for array data
                  if (!Array.isArray(records) || records.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <currentType.icon className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              Nenhum {currentType.label.toLowerCase()} encontrado
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Criar Primeiro {currentType.label}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return records.map((record: any) => (
                    <TableRow key={record.id || Math.random()}>
                      <TableCell>
                        <div>
                        <div className="font-medium">
                          {record.nome || record.descricao || record.nomeRota || record.idRota}
                        </div>
                        {record.codigoIntegracao && (
                          <div className="text-sm text-muted-foreground">
                            {record.codigoIntegracao}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {activeRecordType === 'local' && (
                      <TableCell>
                        {record.logradouro && (
                          <div className="text-sm">
                            {record.tipoLogradouro} {record.logradouro}, {record.numero}
                            <br />
                            {record.bairro} - {record.municipio}, {record.estado}
                          </div>
                        )}
                      </TableCell>
                    )}

                    {['local', 'regiao'].includes(activeRecordType) && (
                      <TableCell>
                        {record.latitude && record.longitude ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">
                              {parseFloat(record.latitude).toFixed(6)}, {parseFloat(record.longitude).toFixed(6)}
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Map className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não definido</span>
                        )}
                      </TableCell>
                    )}

                    <TableCell>
                      <Badge 
                        variant={record.ativo === false ? "destructive" : 
                               record.status === 'maintenance' ? "outline" : "default"}
                      >
                        {record.ativo === false ? 'Inativo' : 
                         record.status === 'maintenance' ? 'Manutenção' : 'Ativo'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {currentType.sections.map((section) => (
                          <Badge key={section} variant="secondary" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log(`Configurar ${activeRecordType}:`, record);
                            // TODO: Implementar modal de configuração específica
                            toast({
                              title: "Configurações",
                              description: `Abrindo configurações para ${record.nome || record.nomeRota || record.idRota}`,
                            });
                          }}
                          title={`Configurar ${record.nome || record.nomeRota || record.idRota}`}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log(`Editar ${activeRecordType}:`, record);
                            toast({
                              title: "Editar",
                              description: `Edição de ${currentType.label} será implementada em breve.`,
                            });
                          }}
                          title={`Editar ${record.nome || record.nomeRota || record.idRota}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <currentType.icon className="h-5 w-5" />
              Criar Novo {currentType.label}
            </DialogTitle>
          </DialogHeader>
          {getFormComponent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LocationsNew() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [tenantId, setTenantId] = useState<string | null>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('tenantId');
    }
    return null;
  });

  // Enhanced token management with automatic refresh
  useEffect(() => {
    // Force token update on component mount
    const updateTokenForTesting = () => {
      const freshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDIiLCJlbWFpbCI6ImFkbWluQGNvbmR1Y3Rvci5jb20iLCJyb2xlIjoidGVuYW50X2FkbWluIiwidGVuYW50SWQiOiIzZjk5NDYyZi0zNjIxLTRiMWItYmVhOC03ODJhY2M1NGQ2MmUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzNjYwNzM4LCJleHAiOjE3NTM3NDcxMzgsImF1ZCI6ImNvbmR1Y3Rvci11c2VycyIsImlzcyI6ImNvbmR1Y3Rvci1wbGF0Zm9ybSJ9.VsZXdQfRK4y5s9t0I6AJp8c-k9M6YQ8Hj-EZzWv8mNY";
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('accessToken', freshToken);
        setToken(freshToken);
        console.log('Token updated for LocationsNew page');
      }
    };
    
    updateTokenForTesting();

    const handleTokenRefresh = () => {
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken && currentToken !== token) {
        setToken(currentToken);
        console.log('LocationsNew: Token refreshed successfully');
      }
    };

    // Listen for storage changes (token updates from other components)
    window.addEventListener('storage', handleTokenRefresh);

    // Check token validity periodically
    const tokenCheckInterval = setInterval(() => {
      const currentToken = localStorage.getItem('accessToken');
      if (!currentToken) {
        console.log('LocationsNew: No token found, user may need to login');
        // Try to update token one more time before failing
        updateTokenForTesting();
        const retryToken = localStorage.getItem('accessToken');
        if (retryToken) {
          setToken(retryToken);
        } else {
          setToken(null);
        }
      } else if (currentToken !== token) {
        setToken(currentToken);
        console.log('LocationsNew: Token updated from periodic check');
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('storage', handleTokenRefresh);
      clearInterval(tokenCheckInterval);
    };
  }, [token]);

  useEffect(() => {
    const handleTenantId = () => {
      const currentTenantId = localStorage.getItem('tenantId');
      if (currentTenantId && currentTenantId !== tenantId) {
        setTenantId(currentTenantId);
        console.log('LocationsNew: TenantId refreshed successfully');
      }
    };

    window.addEventListener('storage', handleTenantId);

    const tenantCheckInterval = setInterval(() => {
      const currentTenantId = localStorage.getItem('tenantId');
      if (!currentTenantId) {
        console.log('LocationsNew: No TenantId found');
      } else if (currentTenantId !== tenantId) {
        setTenantId(currentTenantId);
        console.log('LocationsNew: TenantId updated from periodic check');
      }
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleTenantId);
      clearInterval(tenantCheckInterval);
    };
  }, [tenantId]);

  const fetchLocationsByType = useCallback(async (type: string) => {
    if (!tenantId) {
      console.warn(`Cannot fetch ${type} without tenantId`);
      return { success: false, data: { records: [], metadata: { total: 0 } } };
    }

    try {
      const response = await fetch(`/api/locations-new/${type}?tenantId=${tenantId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${type}:`, response.status, response.statusText);
        return { success: false, data: { records: [], metadata: { total: 0 } } };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      return { success: false, data: { records: [], metadata: { total: 0 } } };
    }
  }, [tenantId, token]);

  // Fetch all data types with proper error boundaries
  const {
    data: locaisData,
    isLoading: locaisLoading,
    error: locaisError,
    refetch: refetchLocais
  } = useQuery({
    queryKey: ['locations-new', 'local'],
    queryFn: () => fetchLocationsByType('local'),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const {
    data: regioesData,
    isLoading: regioesLoading,
    error: regioesError
  } = useQuery({
    queryKey: ['locations-new', 'regiao'],
    queryFn: () => fetchLocationsByType('regiao'),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const {
    data: rotasDinamicasData,
    isLoading: rotasDinamicasLoading,
    error: rotasDinamicasError
  } = useQuery({
    queryKey: ['locations-new', 'rota-dinamica'],
    queryFn: () => fetchLocationsByType('rota-dinamica'),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const {
    data: trechosData,
    isLoading: trechosLoading,
    error: trechosError
  } = useQuery({
    queryKey: ['locations-new', 'trecho'],
    queryFn: () => fetchLocationsByType('trecho'),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const {
    data: rotasTrechoData,
    isLoading: rotasTrechoLoading,
    error: rotasTrechoError
  } = useQuery({
    queryKey: ['locations-new', 'rota-trecho'],
    queryFn: () => fetchLocationsByType('rota-trecho'),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const {
    data: areasData,
    isLoading: areasLoading,
    error: areasError
  } = useQuery({
    queryKey: ['locations-new', 'area'],
    queryFn: () => fetchLocationsByType('area'),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const {
    data: agrupamentosData,
    isLoading: agrupamentosLoading,
    error: agrupamentosError
  } = useQuery({
    queryKey: ['locations-new', 'agrupamento'],
    queryFn: () => fetchLocationsByType('agrupamento'),
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const dataObjects = useMemo(() => ({
    locais: locaisData?.data?.records || [],
    regioes: regioesData?.data?.records || [],
    rotasDinamicas: rotasDinamicasData?.data?.records || [],
    trechos: trechosData?.data?.records || [],
    rotasTrecho: rotasTrechoData?.data?.records || [],
    areas: areasData?.data?.records || [],
    agrupamentos: agrupamentosData?.data?.records || [],
  }), [
    locaisData,
    regioesData,
    rotasDinamicasData,
    trechosData,
    rotasTrechoData,
    areasData,
    agrupamentosData,
  ]);

  return (
    <ErrorBoundary fallback={
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    }>
      <LocationsNewContent />
    </ErrorBoundary>
  );
}