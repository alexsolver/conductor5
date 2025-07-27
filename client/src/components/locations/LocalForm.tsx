import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Home, Globe, Clock, Search, Calendar, Plus, Trash2, Map, Users } from "lucide-react";
import { localSchema, type NewLocal } from "@/../../shared/schema-locations-new";
import { useToast } from "@/hooks/use-toast";
import { LeafletMapSelector } from "@/components/LeafletMapSelector";

interface LocalFormProps {
  onSubmit: (data: NewLocal) => void;
  initialData?: Partial<NewLocal>;
  isLoading?: boolean;
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

export default function LocalForm({ onSubmit, initialData, isLoading }: LocalFormProps) {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

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
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.77972, -47.92972]); // Brasília

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
      // Mock data - replace with actual API call
      setTeamMembers([
        { id: '1', name: 'João Silva', email: 'joao@empresa.com', role: 'Técnico Sênior' },
        { id: '2', name: 'Maria Santos', email: 'maria@empresa.com', role: 'Supervisora' },
        { id: '3', name: 'Pedro Costa', email: 'pedro@empresa.com', role: 'Técnico' }
      ]);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };



  const buscarEnderecoPorCep = async () => {
    const cep = form.getValues('cep');
    if (!cep || cep.length < 8) {
      toast({
        title: "CEP inválido",
        description: "Digite um CEP válido para buscar o endereço",
        variant: "destructive"
      });
      return;
    }

    setLoadingAddress(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const data: AddressData = await response.json();

      if (data.cep) {
        form.setValue('logradouro', data.logradouro);
        form.setValue('bairro', data.bairro);
        form.setValue('municipio', data.localidade);
        form.setValue('estado', data.uf);

        // Buscar coordenadas do endereço
        await buscarCoordenadas(data);

        toast({
          title: "Endereço encontrado",
          description: "Dados preenchidos automaticamente"
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Tente novamente mais tarde",
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
      console.error('Error fetching coordinates:', error);
    }
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

      // Call actual API endpoint
      const response = await fetch(`/api/locations/holidays?municipio=${encodeURIComponent(municipio)}&estado=${encodeURIComponent(estado)}&ano=${currentYear}`);

      if (!response.ok) {
        throw new Error('Falha ao buscar feriados');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setHolidays(result.data);
        setSelectedHolidays(result.data); // Initialize selected holidays
        setShowHolidaysDialog(true);
      } else {
        throw new Error(result.message || 'Dados de feriados não encontrados');
      }

    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast({
        title: "Erro ao buscar feriados",
        description: "Tente novamente mais tarde",
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

  const handleSubmit = (data: any) => {
    // Get user data from localStorage or auth context
    const userDataStr = localStorage.getItem('user');
    let tenantId = null;

    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        tenantId = userData.tenantId;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    if (!tenantId) {
      console.error('No tenant ID found');
      return;
    }

    const formDataWithTenant = {
      ...data,
      tenantId
    };

    console.log('Form data being submitted:', formDataWithTenant);
    try {
      onSubmit(formDataWithTenant);
    } catch (error) {
      console.error('Error submitting form:', error);
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
                  placeholder="00000-000"
                  {...form.register('cep')}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={buscarEnderecoPorCep}
                  disabled={loadingAddress}
                  className="mb-0"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loadingAddress ? 'Buscando...' : 'Buscar'}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="-23.550520"
                  {...form.register('latitude')}
                  className="mt-1"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="-46.633308"
                  {...form.register('longitude')}
                  className="mt-1"
                  readOnly
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMapDialog(true)}
              className="w-full"
            >
              <Map className="h-4 w-4 mr-2" />
              Visualizar no Mapa
            </Button>

            {form.watch('geoCoordenadas') && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  ✓ Coordenadas validadas automaticamente pelo endereço
                </p>
              </div>
            )}
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
            {isLoading ? 'Salvando...' : 'Salvar Local'}
          </Button>
        </div>
      </form>

      {/* Dialog de Feriados */}
      <Dialog open={showHolidaysDialog} onOpenChange={setShowHolidaysDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="feriados-dialog-description">
          <div id="feriados-dialog-description" className="sr-only">
            Seleção de feriados municipais, estaduais e federais para configuração do local
          </div>
          <DialogHeader>
            <DialogTitle>Selecionar Feriados</DialogTitle>
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
              Cancelar
            </Button>
            <Button onClick={salvarFeriados}>
              Salvar Feriados
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Indisponibilidades */}
      <Dialog open={showIndisponibilidadesDialog} onOpenChange={setShowIndisponibilidadesDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="indisponibilidades-dialog-description">
          <div id="indisponibilidades-dialog-description" className="sr-only">
            Gerenciamento de períodos de indisponibilidade do local com data de início, fim e observações
          </div>
          <DialogHeader>
            <DialogTitle>Gerenciar Indisponibilidades</DialogTitle>
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
              Cancelar
            </Button>
            <Button onClick={salvarIndisponibilidades}>
              Salvar Indisponibilidades
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog do Mapa */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh]" aria-describedby="mapa-dialog-description">
          <div id="mapa-dialog-description" className="sr-only">
            Mapa interativo para seleção e validação de coordenadas geográficas do local
          </div>
          <DialogHeader>
            <DialogTitle>Validação de Coordenadas</DialogTitle>
          </DialogHeader>
          <div className="h-96">
            <LeafletMapSelector
              initialLat={parseFloat(form.watch('latitude')) || mapCenter[0]}
              initialLng={parseFloat(form.watch('longitude')) || mapCenter[1]}
              addressData={{
                address: form.watch('logradouro'),
                number: form.watch('numero'),
                neighborhood: form.watch('bairro'),
                city: form.watch('municipio'),
                state: form.watch('estado'),
                zipCode: form.watch('cep'),
                country: form.watch('pais')
              }}
              onLocationSelect={(lat, lng) => {
                form.setValue('latitude', lat.toString());
                form.setValue('longitude', lng.toString());
                setMapCenter([lat, lng]);
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowMapDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Salvar as coordenadas selecionadas
              const lat = parseFloat(form.watch('latitude')) || mapCenter[0];
              const lng = parseFloat(form.watch('longitude')) || mapCenter[1];

              form.setValue('geoCoordenadas', {
                latitude: lat,
                longitude: lng,
                endereco: `${form.watch('logradouro') || ''}, ${form.watch('numero') || ''}, ${form.watch('bairro') || ''}, ${form.watch('municipio') || ''}, ${form.watch('estado') || ''}`.replace(/^,+|,+$/g, '').replace(/,+/g, ', '),
                validado: true,
                fonte: 'manual'
              });

              setShowMapDialog(false);

              toast({
                title: "Localização confirmada",
                description: `Coordenadas salvas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
              });
            }}>
              Confirmar e Salvar Localização
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}