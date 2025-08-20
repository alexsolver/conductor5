import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, MapPin, Users, Building, Search, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SimpleMapWithButtons from "@/components/SimpleMapWithButtons";
// import { useLocalization } from '@/hooks/useLocalization';

const regiaoSchema = z.object({
  // Localization temporarily disabled

  ativo: z.boolean().default(true),
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().optional(),
  codigoIntegracao: z.string().optional(),
  clientesVinculados: z.array(z.string().uuid()).optional(),
  tecnicoPrincipalId: z.string().uuid().optional(),
  gruposVinculados: z.array(z.string().uuid()).optional(),
  locaisAtendimento: z.array(z.string().uuid()).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  cepsAbrangidos: z.array(z.string()).optional(),
  cep: z.string().optional(),
  pais: z.string().default("Brasil"),
  estado: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
  tipoLogradouro: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
});

type RegiaoFormData = z.infer<typeof regiaoSchema>;

interface RegiaoFormProps {
  onSubmit: (data: RegiaoFormData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

const TIPO_LOGRADOURO_OPTIONS = [
  'Rua', 'Avenida', 'Travessa', 'Alameda', 'Rodovia', 'Estrada', 'Praça', 'Largo'
];

// Componentes de seleção
function ClientesMultiSelect({ value, onChange }: { value: string[], onChange: (value: string[]) => void }) {
  const { refreshToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getValidToken = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      await refreshToken();
      return localStorage.getItem('accessToken');
    }
    return token;
  };

  const { data: clientes = [] } = useQuery({
    queryKey: ['/api/locations-new/integration/customers'],
    queryFn: async () => {
      const validToken = await getValidToken();
      const response = await fetch('/api/locations-new/integration/customers', {
        headers: { 'Authorization': "
      });
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
      return [];
    }
  });

  const toggleCliente = (clienteId: string) => {
    const newValue = value.includes(clienteId)
      ? value.filter(id => id !== clienteId)
      : [...value, clienteId];
    onChange(newValue);
  };

  const selectedClientes = clientes.filter((c: any) => value.includes(c.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          {selectedClientes.length > 0 
            ? " cliente(s) selecionado(s)`
            : "Selecionar clientes"
          }
          <ChevronDown className="h-4 w-4" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {clientes.map((cliente: any) => (
              <div
                key={cliente.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleCliente(cliente.id)}
              >
                <Checkbox checked={value.includes(cliente.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{cliente.name}</p>
                  <p className="text-xs text-gray-500">{cliente.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedClientes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedClientes.map((cliente: any) => (
            <Badge key={cliente.id} variant="secondary" className="flex items-center gap-1">
              {cliente.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleCliente(cliente.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function TecnicoSelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const { refreshToken } = useAuth();

  const getValidToken = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      await refreshToken();
      return localStorage.getItem('accessToken');
    }
    return token;
  };

  const { data: tecnicos = [] } = useQuery({
    queryKey: ['/api/locations-new/integration/tecnicos'],
    queryFn: async () => {
      const validToken = await getValidToken();
      const response = await fetch('/api/locations-new/integration/tecnicos', {
        headers: { 'Authorization': "
      });
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
      return [];
    }
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecionar técnico principal" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Nenhum</SelectItem>
        {tecnicos.map((tecnico: any) => (
          <SelectItem key={tecnico.id} value={tecnico.id}>
            <div>
              <p className="font-medium">{tecnico.name}</p>
              <p className="text-sm text-gray-500">{tecnico.email} - {tecnico.role}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function GruposMultiSelect({ value, onChange }: { value: string[], onChange: (value: string[]) => void }) {
  const { refreshToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getValidToken = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      await refreshToken();
      return localStorage.getItem('accessToken');
    }
    return token;
  };

  const { data: grupos = [] } = useQuery({
    queryKey: ['/api/locations-new/integration/grupos'],
    queryFn: async () => {
      const validToken = await getValidToken();
      const response = await fetch('/api/locations-new/integration/grupos', {
        headers: { 'Authorization': "
      });
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
      return [];
    }
  });

  const toggleGrupo = (grupoId: string) => {
    const newValue = value.includes(grupoId)
      ? value.filter(id => id !== grupoId)
      : [...value, grupoId];
    onChange(newValue);
  };

  const selectedGrupos = grupos.filter((g: any) => value.includes(g.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          {selectedGrupos.length > 0 
            ? " grupo(s) selecionado(s)`
            : "Selecionar grupos"
          }
          <ChevronDown className="h-4 w-4" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {grupos.map((grupo: any) => (
              <div
                key={grupo.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleGrupo(grupo.id)}
              >
                <Checkbox checked={value.includes(grupo.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{grupo.name}</p>
                  <p className="text-xs text-gray-500">
                    {grupo.description} ({grupo.memberCount} membro(s))
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedGrupos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedGrupos.map((grupo: any) => (
            <Badge key={grupo.id} variant="secondary" className="flex items-center gap-1">
              {grupo.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleGrupo(grupo.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function LocaisMultiSelect({ value, onChange }: { value: string[], onChange: (value: string[]) => void }) {
  const { refreshToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getValidToken = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      await refreshToken();
      return localStorage.getItem('accessToken');
    }
    return token;
  };

  const { data: locais = [] } = useQuery({
    queryKey: ['/api/locations-new/integration/locais'],
    queryFn: async () => {
      const validToken = await getValidToken();
      const response = await fetch('/api/locations-new/integration/locais', {
        headers: { 'Authorization': "
      });
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
      return [];
    }
  });

  const toggleLocal = (localId: string) => {
    const newValue = value.includes(localId)
      ? value.filter(id => id !== localId)
      : [...value, localId];
    onChange(newValue);
  };

  const selectedLocais = locais.filter((l: any) => value.includes(l.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          {selectedLocais.length > 0 
            ? " local(is) selecionado(s)`
            : "Selecionar locais de atendimento"
          }
          <ChevronDown className="h-4 w-4" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {locais.map((local: any) => (
              <div
                key={local.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleLocal(local.id)}
              >
                <Checkbox checked={value.includes(local.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{local.name}</p>
                  <p className="text-xs text-gray-500">{local.displayName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLocais.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLocais.map((local: any) => (
            <Badge key={local.id} variant="secondary" className="flex items-center gap-1">
              {local.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleLocal(local.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegiaoForm({ onSubmit, isSubmitting = false, onCancel }: RegiaoFormProps) {
  const { toast } = useToast();
  const { refreshToken } = useAuth();
  const [showMap, setShowMap] = useState(false);
  const [newCep, setNewCep] = useState("");

  const form = useForm<RegiaoFormData>({
    resolver: zodResolver(regiaoSchema),
    defaultValues: {
      ativo: true,
      nome: "",
      descricao: "",
      codigoIntegracao: "",
      clientesVinculados: [],
      gruposVinculados: [],
      locaisAtendimento: [],
      cepsAbrangidos: [],
      pais: "Brasil",
      latitude: "",
      longitude: "",
      tecnicoPrincipalId: "none",
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const watchedValues = watch();

  const getValidToken = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      await refreshToken();
      return localStorage.getItem('accessToken');
    }
    return token;
  };

  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.length < 8) return;

    try {
      const validToken = await getValidToken();
      const response = await fetch("
        headers: {
          'Authorization': "
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setValue('estado', data.data.uf);
          setValue('municipio', data.data.localidade);
          setValue('bairro', data.data.bairro);
          setValue('logradouro', data.data.logradouro);
          toast({
            title: "CEP encontrado",
            description: "Dados do endereço preenchidos automaticamente",
          });
        }
      } else if (response.status === 401) {
        await refreshToken();
        // Retry with fresh token
        const freshToken = localStorage.getItem('accessToken');
        const retryResponse = await fetch("
          headers: {
            'Authorization': "
            'Content-Type': 'application/json',
          },
        });

        if (retryResponse.ok) {
          const data = await retryResponse.json();
          if (data.success) {
            setValue('estado', data.data.uf);
            setValue('municipio', data.data.localidade);
            setValue('bairro', data.data.bairro);
            setValue('logradouro', data.data.logradouro);
            toast({
              title: "CEP encontrado",
              description: "Dados do endereço preenchidos automaticamente",
            });
          }
        }
      }
    } catch (error) {
      console.error('[TRANSLATION_NEEDED]', error);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    }
  };

  const handleMapCoordinateSelect = (lat: number, lng: number) => {
    setValue('latitude', lat.toString());
    setValue('longitude', lng.toString());
    setShowMap(false);
    toast({
      title: "Coordenadas selecionadas",
      description: "
    });
  };

  const addCepAbrangido = () => {
    if (newCep.trim()) {
      const currentCeps = watchedValues.cepsAbrangidos || [];
      setValue('cepsAbrangidos', [...currentCeps, newCep.trim()]);
      setNewCep("");
    }
  };

  const removeCepAbrangido = (index: number) => {
    const currentCeps = watchedValues.cepsAbrangidos || [];
    setValue('cepsAbrangidos', currentCeps.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: RegiaoFormData) => {
    try {
      const validToken = await getValidToken();

      const processedData = {
          ...data,
          tecnicoPrincipalId: data.tecnicoPrincipalId === "none" ? undefined : data.tecnicoPrincipalId
      };

      // Add the token to the data or pass it to onSubmit
      const response = await fetch('/api/locations-new/regiao', {
        method: 'POST',
        headers: {
          'Authorization': "
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Região criada com sucesso!",
        });
        onSubmit(data);
      } else if (response.status === 401) {
        // Token expired, refresh and retry
        await refreshToken();
        const freshToken = localStorage.getItem('accessToken');

        const retryResponse = await fetch('/api/locations-new/regiao', {
          method: 'POST',
          headers: {
            'Authorization': "
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(processedData),
        });

        if (retryResponse.ok) {
          const result = await retryResponse.json();
          toast({
            title: '[TRANSLATION_NEEDED]',
            description: "Região criada com sucesso!",
          });
          onSubmit(data);
        } else {
          const error = await retryResponse.json();
          toast({
            title: '[TRANSLATION_NEEDED]',
            description: error.message || '[TRANSLATION_NEEDED]',
            variant: "destructive",
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: error.message || '[TRANSLATION_NEEDED]',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[TRANSLATION_NEEDED]', error);
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: '[TRANSLATION_NEEDED]',
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Identificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={watchedValues.ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
            <Label>Ativo</Label>
          </div>

          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Nome da região"
              className={errors.nome ? "border-red-500" : ""
            />
            {errors.nome && (
              <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descrição da região"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="codigoIntegracao">Código de Integração</Label>
            <Input
              id="codigoIntegracao"
              {...register('codigoIntegracao')}
              placeholder="Código para integração com sistemas externos"
            />
          </div>
        </CardContent>
      </Card>

      {/* Relacionamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Relacionamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Clientes Vinculados (Multi-seleção)</Label>
            <ClientesMultiSelect
              value={watchedValues.clientesVinculados || []}
              onChange={(clientes) => setValue('clientesVinculados', clientes)}
            />
          </div>

          <div>
            <Label>Técnico Principal</Label>
            <TecnicoSelect
              value={watchedValues.tecnicoPrincipalId || "none"
              onChange={(tecnicoId) => setValue('tecnicoPrincipalId', tecnicoId)}
            />
          </div>

          <div>
            <Label>Grupos Vinculados (Multi-seleção)</Label>
            <GruposMultiSelect
              value={watchedValues.gruposVinculados || []}
              onChange={(grupos) => setValue('gruposVinculados', grupos)}
            />
          </div>

          <div>
            <Label>Locais de Atendimento Vinculados (Multi-seleção)</Label>
            <LocaisMultiSelect
              value={watchedValues.locaisAtendimento || []}
              onChange={(locais) => setValue('locaisAtendimento', locais)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Geolocalização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geolocalização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                {...register('latitude')}
                placeholder="-23.550520"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                {...register('longitude')}
                placeholder="-46.633308"
                readOnly
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMap(true)}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Selecionar no Mapa
            </Button>
            {watchedValues.latitude && watchedValues.longitude && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setValue('latitude', '');
                  setValue('longitude', '');
                }}
              >
                Limpar Coordenadas
              </Button>
            )}
          </div>

          {showMap && (
            <div className="border rounded-lg p-4">
              <SimpleMapWithButtons
                onCoordinateSelect={handleMapCoordinateSelect}
                onCancel={() => setShowMap(false)}
                initialLat={watchedValues.latitude ? parseFloat(watchedValues.latitude) : 0}
                initialLng={watchedValues.longitude ? parseFloat(watchedValues.longitude) : 0}
              />
            </div>
          )}

          <Separator />

          <div>
            <Label>CEPs Abrangidos ou Próximos</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newCep}
                onChange={(e) => setNewCep(e.target.value)}
                placeholder="Digite um CEP (ex: 01234-567)"
                className="flex-1"
              />
              <Button type="button" onClick={addCepAbrangido} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {watchedValues.cepsAbrangidos && watchedValues.cepsAbrangidos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {watchedValues.cepsAbrangidos.map((cep, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {cep}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeCepAbrangido(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Endereço Base */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                {...register('cep')}
                placeholder="12345-678"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCepLookup(watchedValues.cep || '')}
                disabled={!watchedValues.cep}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                {...register('pais')}
                placeholder="Brasil"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                {...register('estado')}
                placeholder="São Paulo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="municipio">Município</Label>
              <Input
                id="municipio"
                {...register('municipio')}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                {...register('bairro')}
                placeholder="Centro"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tipoLogradouro">Tipo de Logradouro</Label>
            <Select onValueChange={(value) => setValue('tipoLogradouro', value)}>
              <SelectTrigger>
                <SelectValue placeholder='[TRANSLATION_NEEDED]' />
              </SelectTrigger>
              <SelectContent>
                {TIPO_LOGRADOURO_OPTIONS.map((tipo) => (
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
              {...register('logradouro')}
              placeholder="Nome da rua, avenida, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                {...register('numero')}
                placeholder="123"
              />
            </div>
            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                {...register('complemento')}
                placeholder="Sala 456"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : '[TRANSLATION_NEEDED]'}
        </Button>
      </div>
    </form>
  );
}