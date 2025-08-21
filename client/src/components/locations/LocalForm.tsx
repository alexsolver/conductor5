import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Home, Globe, Clock, Search, Calendar, Plus, Trash2, Map, Users } from "lucide-react";
import { localSchema, type NewLocal } from "@/../../shared/schema-locations-new";
import { useToast } from "@/hooks/use-toast";
import LeafletMapSelector from "@/components/LeafletMapSelector";
import MapSelector from '@/components/MapSelector';


interface LocalFormProps {
  onSubmit: (data: NewLocal) => void;
  initialData?: Partial<NewLocal>;
  isLoading?: boolean;
  onSuccess?: () => void; // Added for success callback
  onClose?: () => void; // Added for close callback
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}



interface Holiday {
  data: string;
  nome: string;
  incluir: boolean;
}

interface HolidaysByType {
  municipais: Holiday[];
  estaduais: Holiday[];
  federais: Holiday[];
}

interface Indisponibilidade {
  dataInicio: string;
  dataFim: string;
  observacao: string;
}

interface AddressData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

const TIPOS_LOGRADOURO = [
  'Rua', 'Avenida', 'Travessa', 'Alameda', 'Rodovia', 'Estrada', 'Praça', 'Largo'
];

const FUSOS_HORARIO = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Rio_Branco',
  'America/Boa_Vista',
  'America/Noronha'
];

export default function LocalForm({ onSubmit, initialData, isLoading, onSuccess, onClose }: LocalFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));

  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [holidays, setHolidays] = useState<HolidaysByType>({
    municipais: [],
    estaduais: [],
    federais: []
  });
  const [selectedHolidays, setSelectedHolidays] = useState<HolidaysByType>({
    municipais: [],
    estaduais: [],
    federais: []
  });
  const [indisponibilidades, setIndisponibilidades] = useState<Indisponibilidade[]>([]);
  const [showHolidaysDialog, setShowHolidaysDialog] = useState(false);
  const [showIndisponibilidadesDialog, setShowIndisponibilidadesDialog] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7942, -47.8822]); // Default to Brasília


  const form = useForm<NewLocal>({
    resolver: zodResolver(localSchema),
    defaultValues: {
      ativo: true,
      pais: 'Brasil',
      fusoHorario: 'America/Sao_Paulo',
      ...initialData
    }
  });

  // Load team members on mount
  useEffect(() => {
    loadTeamMembers();
    if (initialData?.feriadosIncluidos) {
      setSelectedHolidays(initialData.feriadosIncluidos as HolidaysByType);
    }
    if (initialData?.indisponibilidades) {
      setIndisponibilidades(initialData.indisponibilidades as Indisponibilidade[]);
    }
  }, [initialData]);

  const loadTeamMembers = async () => {
    try {
      const validToken = await validateAndRefreshToken();

      if (!validToken) {
        console.error('No valid token for team members fetch');
        setTeamMembers([]);
        return;
      }

      const response = await fetch('/api/team-management/members', {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const members = await response.json();
        console.log('LocalForm: Raw team members response:', members);

        if (Array.isArray(members)) {
          const formattedMembers = members
            .filter(member => member.id && (member.name || member.firstName || member.lastName))
            .map((member: any) => ({
              id: member.id,
              name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Sem nome',
              email: member.email || 'Sem email',
              role: member.position || member.role || 'Membro da Equipe'
            }));

          console.log('LocalForm: Formatted team members:', formattedMembers);
          setTeamMembers(formattedMembers);
        } else {
          console.warn('LocalForm: Invalid members data format:', members);
          setTeamMembers([]);
        }
      } else {
        const errorText = await response.text();
        console.error('LocalForm: Failed to fetch team members:', response.status, errorText);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('LocalForm: Error loading team members:', error);
      setTeamMembers([]);
    }
  };

    // Token validation and refresh
    const validateAndRefreshToken = async () => {
      const currentToken = localStorage.getItem('accessToken');

      if (!currentToken) {
        console.log('No token found, attempting refresh');
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            setToken(data.accessToken);
            return data.accessToken;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
        return null;
      }

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(currentToken.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) {
          console.log('Token expired, refreshing');
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            setToken(data.accessToken);
            return data.accessToken;
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }

      return currentToken;
    };

    useEffect(() => {
      validateAndRefreshToken();
    }, []);

  const buscarCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (!cleanCep || cleanCep.length !== 8) {
      toast({
        title: "CEP Inválido",
        description: "Digite um CEP válido com 8 dígitos",
        variant: "destructive"
      });
      return;
    }

    setLoadingAddress(true);
    try {
      console.log('🔍 [CEP-LOOKUP] Searching for CEP:', cleanCep);

      // Get valid token
      const validToken = await validateAndRefreshToken();
      if (!validToken) {
        toast({
          title: "Erro de Autenticação",
          description: "Não foi possível autenticar. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Try internal API endpoint first
      const response = await fetch(`/api/locations-new/services/cep/${cleanCep}`, {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [CEP-LOOKUP] Internal API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [CEP-LOOKUP] Internal API success:', result);

        if (result.success && result.data) {
          const data = result.data;
          
          // Update form fields
          form.setValue('logradouro', data.logradouro || '');
          form.setValue('bairro', data.bairro || '');
          form.setValue('municipio', data.localidade || '');
          form.setValue('estado', data.uf || '');

          // Get coordinates for the address
          await buscarCoordenadas(data);

          toast({
            title: "CEP encontrado",
            description: `Endereço preenchido: ${data.logradouro}, ${data.bairro}`,
          });
          return;
        }
      }

      // Fallback to ViaCEP direct API
      console.log('🔄 [CEP-LOOKUP] Trying ViaCEP fallback');
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!viaCepResponse.ok) {
        throw new Error('ViaCEP service unavailable');
      }

      const viaCepData = await viaCepResponse.json();
      console.log('📡 [CEP-LOOKUP] ViaCEP response:', viaCepData);

      if (viaCepData && !viaCepData.erro) {
        console.log('✅ [CEP-LOOKUP] ViaCEP success');

        // Update form fields
        form.setValue('logradouro', viaCepData.logradouro || '');
        form.setValue('bairro', viaCepData.bairro || '');
        form.setValue('municipio', viaCepData.localidade || '');
        form.setValue('estado', viaCepData.uf || '');

        // Get coordinates for the address
        await buscarCoordenadas({
          cep: viaCepData.cep,
          logradouro: viaCepData.logradouro || '',
          bairro: viaCepData.bairro || '',
          localidade: viaCepData.localidade || '',
          uf: viaCepData.uf || ''
        });

        toast({
          title: "CEP encontrado",
          description: `Endereço preenchido: ${viaCepData.logradouro}, ${viaCepData.bairro}`,
        });
      } else {
        console.error('❌ [CEP-LOOKUP] CEP not found in ViaCEP');
        toast({
          title: "CEP não encontrado",
          description: "Verifique se o CEP está correto",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ [CEP-LOOKUP] Error:', error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Serviço temporariamente indisponível. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingAddress(false);
    }
  };

  const buscarCoordenadas = async (addressData: AddressData) => {
    const endereco = `${addressData.logradouro}, ${addressData.bairro}, ${addressData.localidade}, ${addressData.uf}, Brasil`;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`
      );
      const data = await response.json();

      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        form.setValue('latitude', lat.toString());
        form.setValue('longitude', lon.toString());
        setMapCenter([lat, lon]);

        form.setValue('geoCoordenadas', {
          latitude: lat,
          longitude: lon,
          endereco,
          validado: true,
          fonte: 'nominatim'
        });
      }
    } catch (error) {
      console.error('❌ [GEOCODING] Error:', error);
      toast({
        title: "Erro ao buscar coordenadas",
        description: "Não foi possível obter as coordenadas do endereço",
        variant: "destructive"
      });
    }
  };

  const handleMapCoordinateSelect = (lat: number, lng: number) => {
    console.log('🗺️ [MAP-SELECT] Coordinates selected:', { lat, lng });
    form.setValue('latitude', lat.toString());
    form.setValue('longitude', lng.toString());
    setMapCenter([lat, lng]);
    setShowMapModal(false);
    toast({
      title: "Coordenadas selecionadas",
      description: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`,
    });
  };

  const openMapSelector = () => {
    console.log('🗺️ [MAP-MODAL] Opening map selector');
    
    // Get current coordinates or use defaults
    const currentLat = form.getValues('latitude');
    const currentLng = form.getValues('longitude');
    
    if (currentLat && currentLng) {
      const lat = parseFloat(currentLat);
      const lng = parseFloat(currentLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        console.log('🗺️ [MAP-MODAL] Using form coordinates:', { lat, lng });
      }
    } else {
      // Try to geocode current address if available
      const municipio = form.getValues('municipio');
      const estado = form.getValues('estado');
      
      if (municipio && estado) {
        console.log('🗺️ [MAP-MODAL] Will geocode address on map open');
        // The map will handle this when opened
      }
    }
    
    setShowMapModal(true);
  };

  const buscarFeriados = async () => {
    const municipio = form.getValues('municipio');
    const estado = form.getValues('estado');

    if (!municipio || !estado) {
      toast({
        title: "Dados incompletos",
        description: "Preencha município e estado primeiro",
        variant: "destructive"
      });
      return;
    }

    setLoadingHolidays(true);
    try {
      const currentYear = new Date().getFullYear();

      console.log('🔍 [HOLIDAYS-FETCH] Starting holidays fetch:', { municipio, estado, currentYear });

      // Get valid token
      const validToken = await validateAndRefreshToken();
      if (!validToken) {
        toast({
          title: "Erro de Autenticação",
          description: "Não foi possível autenticar. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Call holidays API endpoint
      const response = await fetch(`/api/locations-new/holidays?municipio=${encodeURIComponent(municipio)}&estado=${encodeURIComponent(estado)}&ano=${currentYear}`, {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 [HOLIDAYS-FETCH] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [HOLIDAYS-FETCH] API error:', response.status, errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [HOLIDAYS-FETCH] API result:', result);

      if (result.success && result.data) {
        // Ensure the data structure matches what the UI expects
        const formattedData = {
          federais: result.data.federais || [],
          estaduais: result.data.estaduais || [],
          municipais: result.data.municipais || []
        };

        console.log('✅ [HOLIDAYS-FETCH] Formatted data:', formattedData);

        setHolidays(formattedData);
        setSelectedHolidays(formattedData); // Initialize selected holidays
        setShowHolidaysDialog(true);

        toast({
          title: "Feriados encontrados",
          description: `${result.total || 0} feriados carregados para ${municipio}, ${estado}`,
        });
      } else {
        console.error('❌ [HOLIDAYS-FETCH] Invalid API response:', result);
        throw new Error(result.message || 'Dados de feriados não encontrados');
      }

    } catch (error) {
      console.error('❌ [HOLIDAYS-FETCH] Error:', error);
      toast({
        title: "Erro ao buscar feriados",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setLoadingHolidays(false);
    }
  };

  const toggleHoliday = (type: keyof HolidaysByType, index: number) => {
    setSelectedHolidays(prev => ({
      ...prev,
      [type]: prev[type].map((holiday, i) => 
        i === index ? { ...holiday, incluir: !holiday.incluir } : holiday
      )
    }));
  };

  const salvarFeriados = () => {
    form.setValue('feriadosIncluidos', selectedHolidays);
    setShowHolidaysDialog(false);
    toast({
      title: "Feriados salvos",
      description: "Configuração de feriados atualizada"
    });
  };

  const adicionarIndisponibilidade = () => {
    const novaIndisponibilidade: Indisponibilidade = {
      dataInicio: '',
      dataFim: '',
      observacao: ''
    };
    setIndisponibilidades([...indisponibilidades, novaIndisponibilidade]);
  };

  const removerIndisponibilidade = (index: number) => {
    setIndisponibilidades(indisponibilidades.filter((_, i) => i !== index));
  };

  const salvarIndisponibilidades = () => {
    form.setValue('indisponibilidades', indisponibilidades);
    setShowIndisponibilidadesDialog(false);
    toast({
      title: "Indisponibilidades salvas",
      description: "Períodos de indisponibilidade atualizados"
    });
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log('🔄 [LOCAL-FORM] Starting form submission...');
      console.log('📝 [LOCAL-FORM] Form data:', JSON.stringify(data, null, 2));

      // Validar token de acesso
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('❌ [LOCAL-FORM] No access token found');
        toast({
          title: "Erro de Autenticação",
          description: "Token de acesso não encontrado. Faça login novamente.",
          variant: "destructive"
        });
        return;
      }

      // Validar dados básicos antes de enviar
      if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
        console.error('❌ [LOCAL-FORM] Nome field validation failed');
        toast({
          title: "Erro de Validação",
          description: "O campo 'Nome' é obrigatório e deve ser preenchido.",
          variant: "destructive"
        });
        return;
      }

      console.log('🌐 [LOCAL-FORM] Making API request to /api/locations-new/local');

      // Fazer requisição
      const response = await fetch('/api/locations-new/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log('📡 [LOCAL-FORM] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Verificar content-type da resposta
      const contentType = response.headers.get('content-type');
      console.log('📋 [LOCAL-FORM] Content-Type:', contentType);

      let result: any;

      // Tentar ler resposta como JSON
      try {
        const responseText = await response.text();
        console.log('📄 [LOCAL-FORM] Raw response text:', responseText.substring(0, 500));

        if (!responseText) {
          console.error('❌ [LOCAL-FORM] Empty response from server');
          toast({
            title: "Erro de Comunicação",
            description: "O servidor não retornou dados. Tente novamente.",
            variant: "destructive"
          });
          return;
        }

        // Verificar se é HTML (página de erro)
        if (responseText.trim().startsWith('<!DOCTYPE') || 
            responseText.trim().startsWith('<html') ||
            responseText.includes('<title>') ||
            responseText.includes('<body>')) {
          console.error('❌ [LOCAL-FORM] Received HTML instead of JSON');
          console.error('🔍 [LOCAL-FORM] HTML content preview:', responseText.substring(0, 1000));
          console.error('🔍 [LOCAL-FORM] Response status:', response.status);
          console.error('🔍 [LOCAL-FORM] Response headers:', Object.fromEntries(response.headers.entries()));

          // Tentar extrair informação de erro do HTML se possível
          const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
          const errorTitle = titleMatch ? titleMatch[1] : 'Erro do Servidor';

          let errorMessage = "O servidor retornou uma página de erro em vez de dados JSON.";

          // Verificar se é erro 500, 404, etc.
          if (response.status >= 500) {
            errorMessage = "Erro interno do servidor. Pode ser um problema de configuração do banco de dados ou schema.";
          } else if (response.status === 404) {
            errorMessage = "Endpoint não encontrado. Verifique se a API está configurada corretamente.";
          } else if (response.status >= 400) {
            errorMessage = "Erro de requisição. Verifique os dados enviados.";
          }

          toast({
            title: `${errorTitle} (${response.status})`,
            description: errorMessage,
            variant: "destructive"
          });
          return;
        }

        // Verificar se parece com JSON antes de parsear
        const trimmed = responseText.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          console.error('❌ [LOCAL-FORM] Response is not JSON format:', trimmed);
          toast({
            title: "Formato de Resposta Inválido",
            description: "O servidor retornou dados em formato inválido.",
            variant: "destructive"
          });
          return;
        }

        // Tentar parsear JSON
        result = JSON.parse(responseText);
        console.log('✅ [LOCAL-FORM] Successfully parsed JSON:', result);

      } catch (parseError) {
        console.error('❌ [LOCAL-FORM] JSON parsing error:', parseError);
        console.error('❌ [LOCAL-FORM] Parse error details:', {
          name: parseError.name,
          message: parseError.message
        });

        toast({
          title: "Erro de Parsing",
          description: `Não foi possível interpretar a resposta do servidor: ${parseError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Processar resposta baseada no status HTTP
      if (response.ok && result?.success) {
        console.log('✅ [LOCAL-FORM] Local created successfully');

        toast({
          title: "Sucesso!",
          description: result.message || "Local criado com sucesso!",
          variant: "default"
        });

        // Callbacks de sucesso
        if (onSuccess) {
          console.log('🔄 [LOCAL-FORM] Calling onSuccess callback');
          onSuccess();
        }
        if (onClose) {
          console.log('🔄 [LOCAL-FORM] Calling onClose callback');  
          onClose();
        }

      } else {
        // Erro do servidor ou validação
        console.error('❌ [LOCAL-FORM] Server returned error:', {
          status: response.status,
          result: result
        });

        const errorMessage = result?.message || result?.error || 'Erro desconhecido do servidor';
        const errorDetails = result?.details ? 
          result.details.map((d: any) => `${d.field}: ${d.message}`).join('\n') : '';

        toast({
          title: "Erro ao Criar Local",
          description: errorDetails ? 
            `${errorMessage}\n\nDetalhes:\n${errorDetails}` : 
            errorMessage,
          variant: "destructive"
        });
      }

    } catch (networkError) {
      console.error('❌ [LOCAL-FORM] Network or unexpected error:', networkError);

      if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível conectar ao servidor. Verifique sua conexão de internet.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro Inesperado",
          description: `Ocorreu um erro inesperado: ${networkError instanceof Error ? networkError.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Seção 1: Identificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={form.watch('ativo')}
                onCheckedChange={(checked) => form.setValue('ativo', checked)}
              />
              <Label>Ativo</Label>
            </div>

            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome do local"
                {...form.register('nome')}
                className="mt-1"
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.nome.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição do local (opcional)"
                {...form.register('descricao')}
                className="mt-1"
              />
              {form.formState.errors.descricao && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.descricao.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="codigoIntegracao">Código de Integração</Label>
              <Input
                id="codigoIntegracao"
                placeholder="Código para integração"
                {...form.register('codigoIntegracao')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tipoClienteFavorecido">Cliente ou Favorecido</Label>
              <Select 
                value={form.watch('tipoClienteFavorecido') || ''} 
                onValueChange={(value) => form.setValue('tipoClienteFavorecido', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Cliente</Badge>
                      Cliente
                    </div>
                  </SelectItem>
                  <SelectItem value="favorecido">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Favorecido</Badge>
                      Favorecido
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tecnicoPrincipalId">Técnico Principal</Label>
              <Select 
                value={form.watch('tecnicoPrincipalId') || ''} 
                onValueChange={(value) => form.setValue('tecnicoPrincipalId', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o técnico principal" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex flex-col">
                        <span>{member.name}</span>
                        <span className="text-sm text-gray-500">{member.role} - {member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...form.register('email')}
                className="mt-1"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ddd">DDD</Label>
                <Input
                  id="ddd"
                  placeholder="11 (opcional)"
                  maxLength={3}
                  {...form.register('ddd')}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="99999-9999 (opcional)"
                  {...form.register('telefone')}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  {...form.register('cep')}
                  placeholder="00000-000"
                  maxLength={9}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value.length > 5 ? 
                      value.replace(/^(\d{5})(\d{0,3})$/, '$1-$2') : 
                      value;
                    e.target.value = formatted;
                    
                    // Update form value
                    form.setValue('cep', formatted);
                  }}
                  className={form.formState.errors.cep ? 'border-red-500' : ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const cepValue = form.getValues('cep');
                      if (cepValue && cepValue.replace(/\D/g, '').length === 8) {
                        buscarCep(cepValue);
                      }
                    }
                  }}
                />
                {form.formState.errors.cep && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.cep.message}</p>
                )}
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const cepValue = form.getValues('cep');
                    console.log('🔍 [CEP-BUTTON] CEP value:', cepValue);
                    const cleanCep = cepValue?.replace(/\D/g, '');
                    
                    if (cleanCep && cleanCep.length === 8) {
                      buscarCep(cepValue);
                    } else {
                      toast({
                        title: "CEP Incompleto",
                        description: "Digite todos os 8 dígitos do CEP",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={loadingAddress}
                  className="mb-0 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {loadingAddress ? 'Buscando...' : 'Buscar CEP'}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                {...form.register('pais')}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="SP"
                  {...form.register('estado')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  placeholder="São Paulo"
                  {...form.register('municipio')}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                placeholder="Centro"
                {...form.register('bairro')}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoLogradouro">Tipo de Logradouro</Label>
                <Select 
                  value={form.watch('tipoLogradouro') || ''} 
                  onValueChange={(value) => form.setValue('tipoLogradouro', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_LOGRADOURO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  placeholder="Nome da rua"
                  {...form.register('logradouro')}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  placeholder="123"
                  {...form.register('numero')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  placeholder="Apto 45, Bloco B"
                  {...form.register('complemento')}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 4: Georreferenciamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Georreferenciamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    {...form.register('latitude')}
                    placeholder="-15.7942"
                    type="number"
                    step="any"
                    className={form.formState.errors.latitude ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.latitude && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.latitude.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    {...form.register('longitude')}
                    placeholder="-47.8822"
                    type="number"
                    step="any"
                    className={form.formState.errors.longitude ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.longitude && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.longitude.message}</p>
                  )}
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={openMapSelector}
                    disabled={showMapModal}
                  >
                    <Map className="h-4 w-4" />
                    {showMapModal ? 'Mapa Aberto' : 'Abrir Mapa Interativo'}
                  </Button>
                </div>
              </div>

            <div className="space-y-2">
              {(form.watch('latitude') && form.watch('longitude')) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Coordenadas: {parseFloat(form.watch('latitude')).toFixed(6)}, {parseFloat(form.watch('longitude')).toFixed(6)}
                  </p>
                </div>
              )}
              
              {form.watch('geoCoordenadas') && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    ✓ Coordenadas validadas automaticamente pelo endereço
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção 5: Tempo e Disponibilidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tempo e Disponibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fusoHorario">Fuso Horário</Label>
              <Select 
                value={form.watch('fusoHorario') || 'America/Sao_Paulo'} 
                onValueChange={(value) => form.setValue('fusoHorario', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUSOS_HORARIO.map((fuso) => (
                    <SelectItem key={fuso} value={fuso}>
                      {fuso.replace('America/', '').replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={buscarFeriados}
                disabled={loadingHolidays}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {loadingHolidays ? 'Buscando...' : 'Buscar Feriados'}
              </Button>

              {Object.values(selectedHolidays).some(arr => arr.some(h => h.incluir)) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    {Object.values(selectedHolidays).flat().filter(h => h.incluir).length} feriados selecionados
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowIndisponibilidadesDialog(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar Indisponibilidades
              </Button>

              {indisponibilidades.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-700">
                    {indisponibilidades.length} período(s) de indisponibilidade configurado(s)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? t('common.saving') : t('locations.saveLocation')}
          </Button>
        </div>
      </form>

      {/* Dialog de Feriados */}
      <Dialog open={showHolidaysDialog} onOpenChange={setShowHolidaysDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Feriados</DialogTitle>
            <DialogDescription>
              Selecione os feriados municipais, estaduais e federais que devem ser considerados para este local
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(holidays).map(([type, holidayList]) => (
              <div key={type}>
                <h3 className="font-semibold mb-3 capitalize">
                  Feriados {type}
                </h3>
                <div className="space-y-2">
                  {holidayList.map((holiday, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedHolidays[type as keyof HolidaysByType]?.[index]?.incluir || false}
                        onCheckedChange={() => toggleHoliday(type as keyof HolidaysByType, index)}
                      />
                      <span className="text-sm">{holiday.nome}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(holiday.data).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowHolidaysDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={salvarFeriados}>
              Salvar Feriados
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Indisponibilidades */}
      <Dialog open={showIndisponibilidadesDialog} onOpenChange={setShowIndisponibilidadesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Indisponibilidades</DialogTitle>
            <DialogDescription>
              Configure períodos de indisponibilidade do local com data de início, fim e observações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {indisponibilidades.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Período {index + 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removerIndisponibilidade(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={item.dataInicio}
                      onChange={(e) => {
                        const updated = [...indisponibilidades];
                        updated[index].dataInicio = e.target.value;
                        setIndisponibilidades(updated);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={item.dataFim}
                      onChange={(e) => {
                        const updated = [...indisponibilidades];
                        updated[index].dataFim = e.target.value;
                        setIndisponibilidades(updated);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Observação</Label>
                  <Textarea
                    value={item.observacao}
                    onChange={(e) => {
                      const updated = [...indisponibilidades];
                      updated[index].observacao = e.target.value;
                      setIndisponibilidades(updated);
                    }}
                    placeholder="Motivo da indisponibilidade..."
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={adicionarIndisponibilidade}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Período
            </Button>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowIndisponibilidadesDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={salvarIndisponibilidades}>
              Salvar Indisponibilidades
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog do Mapa */}
      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Selecionar Coordenadas no Mapa</DialogTitle>
            <DialogDescription>
              Clique no mapa para definir a localização exata do local
            </DialogDescription>
          </DialogHeader>
          <div className="h-[60vh]">
            <MapSelector
              initialLat={mapCenter[0]}
              initialLng={mapCenter[1]}
              onLocationSelect={handleMapCoordinateSelect}
              addressData={{
                logradouro: form.getValues('logradouro') || '',
                bairro: form.getValues('bairro') || '',
                localidade: form.getValues('municipio') || '',
                uf: form.getValues('estado') || ''
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}