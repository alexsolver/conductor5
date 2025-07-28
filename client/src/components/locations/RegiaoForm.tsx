
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Plus, MapPin, Users, Building, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SimpleMapWithButtons from "@/components/SimpleMapWithButtons";

const regiaoSchema = z.object({
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

export default function RegiaoForm({ onSubmit, isSubmitting = false, onCancel }: RegiaoFormProps) {
  const { toast } = useToast();
  const { token, refreshToken } = useAuth();
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
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const watchedValues = watch();

  const getValidToken = async () => {
    if (!token) {
      await refreshToken();
      return localStorage.getItem('access_token');
    }
    return token;
  };

  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.length < 8) return;

    try {
      const validToken = await getValidToken();
      const response = await fetch(`/api/locations-new/services/cep/${cep.replace('-', '')}`, {
        headers: {
          'Authorization': `Bearer ${validToken}`,
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
        const freshToken = localStorage.getItem('access_token');
        const retryResponse = await fetch(`/api/locations-new/services/cep/${cep.replace('-', '')}`, {
          headers: {
            'Authorization': `Bearer ${freshToken}`,
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
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar CEP. Tente novamente.",
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
      description: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`,
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
      
      // Add the token to the data or pass it to onSubmit
      const response = await fetch('/api/locations-new/regiao', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Sucesso",
          description: "Região criada com sucesso!",
        });
        onSubmit(data);
      } else if (response.status === 401) {
        // Token expired, refresh and retry
        await refreshToken();
        const freshToken = localStorage.getItem('access_token');
        
        const retryResponse = await fetch('/api/locations-new/regiao', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${freshToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (retryResponse.ok) {
          const result = await retryResponse.json();
          toast({
            title: "Sucesso",
            description: "Região criada com sucesso!",
          });
          onSubmit(data);
        } else {
          const error = await retryResponse.json();
          toast({
            title: "Erro",
            description: error.message || "Erro ao criar região",
            variant: "destructive",
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar região",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao salvar região:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
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
              className={errors.nome ? "border-red-500" : ""}
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
            <div className="mt-2 p-3 border rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">
                Integração FK com módulo de clientes - implementação pendente
              </p>
            </div>
          </div>

          <div>
            <Label>Técnico Principal</Label>
            <div className="mt-2 p-3 border rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">
                Integração FK com membros da equipe - implementação pendente
              </p>
            </div>
          </div>

          <div>
            <Label>Grupos Vinculados (Multi-seleção)</Label>
            <div className="mt-2 p-3 border rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">
                Integração FK com grupos de usuários em gestão de equipe - implementação pendente
              </p>
            </div>
          </div>

          <div>
            <Label>Locais de Atendimento Vinculados (Multi-seleção)</Label>
            <div className="mt-2 p-3 border rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">
                Integração com módulo de locais - implementação pendente
              </p>
            </div>
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
                initialLat={watchedValues.latitude ? parseFloat(watchedValues.latitude) : undefined}
                initialLng={watchedValues.longitude ? parseFloat(watchedValues.longitude) : undefined}
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
                <SelectValue placeholder="Selecione o tipo" />
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
          {isSubmitting ? "Salvando..." : "Salvar Região"}
        </Button>
      </div>
    </form>
  );
}
