// LOCAL FORM - Complete form with 5 sections
import { useState } from "react";
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
import { MapPin, Phone, Home, Globe, Clock } from "lucide-react";
import { localSchema, type NewLocal } from "@/../../shared/schema-locations-new";

interface LocalFormProps {
  onSubmit: (data: NewLocal) => void;
  onCancel: () => void;
  initialData?: Partial<NewLocal>;
}

export default function LocalForm({ onSubmit, onCancel, initialData }: LocalFormProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  
  const form = useForm<NewLocal>({
    resolver: zodResolver(localSchema),
    defaultValues: {
      ativo: true,
      pais: "Brasil",
      fusoHorario: "America/Sao_Paulo",
      status: "active",
      ...initialData
    }
  });

  const handleCepLookup = async (cep: string) => {
    if (cep.length !== 9) return;
    
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('estado', data.uf);
        form.setValue('municipio', data.localidade);
        form.setValue('bairro', data.bairro);
        form.setValue('logradouro', data.logradouro);
        
        // Auto-lookup coordinates
        handleAddressLookup(`${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleAddressLookup = async (address: string) => {
    if (!address) return;
    
    setIsLoadingCoords(true);
    try {
      // In a real implementation, use Google Maps Geocoding API or similar
      // For now, this is a placeholder for the geocoding functionality
      console.log('Geocoding address:', address);
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
    } finally {
      setIsLoadingCoords(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Identificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={form.watch('ativo')}
              onCheckedChange={(checked) => form.setValue('ativo', checked)}
            />
            <Label>Local Ativo</Label>
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea 
              id="descricao"
              placeholder="Descrição detalhada do local..."
              {...form.register('descricao')}
            />
            {form.formState.errors.descricao && (
              <p className="text-sm text-red-500">{form.formState.errors.descricao.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="codigoIntegracao">Código de Integração</Label>
            <Input 
              id="codigoIntegracao"
              placeholder="Ex: LOC001"
              {...form.register('codigoIntegracao')}
            />
          </div>
          
          <div>
            <Label>Cliente ou Favorecido</Label>
            <Select onValueChange={(value) => form.setValue('clienteFavorecidoId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente/favorecido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente1">Cliente Exemplo 1</SelectItem>
                <SelectItem value="cliente2">Cliente Exemplo 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Técnico Principal</Label>
            <Select onValueChange={(value) => form.setValue('tecnicoPrincipalId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tech1">João Silva</SelectItem>
                <SelectItem value="tech2">Maria Santos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
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
              placeholder="contato@empresa.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ddd">DDD</Label>
              <Input 
                id="ddd"
                placeholder="11"
                maxLength={3}
                {...form.register('ddd')}
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input 
                id="telefone"
                placeholder="99999-9999"
                {...form.register('telefone')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input 
                id="cep"
                placeholder="00000-000"
                {...form.register('cep')}
                onBlur={(e) => handleCepLookup(e.target.value)}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleCepLookup(form.getValues('cep') || '')}
                disabled={isLoadingCep}
              >
                {isLoadingCep ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pais">País</Label>
              <Input 
                id="pais"
                {...form.register('pais')}
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input 
                id="estado"
                placeholder="SP"
                {...form.register('estado')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="municipio">Município</Label>
              <Input 
                id="municipio"
                placeholder="São Paulo"
                {...form.register('municipio')}
              />
            </div>
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input 
                id="bairro"
                placeholder="Centro"
                {...form.register('bairro')}
              />
            </div>
          </div>
          
          <div>
            <Label>Tipo de Logradouro</Label>
            <Select onValueChange={(value) => form.setValue('tipoLogradouro', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rua">Rua</SelectItem>
                <SelectItem value="avenida">Avenida</SelectItem>
                <SelectItem value="travessa">Travessa</SelectItem>
                <SelectItem value="alameda">Alameda</SelectItem>
                <SelectItem value="rodovia">Rodovia</SelectItem>
                <SelectItem value="estrada">Estrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input 
              id="logradouro"
              placeholder="Nome da rua/avenida"
              {...form.register('logradouro')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input 
                id="numero"
                placeholder="123"
                {...form.register('numero')}
              />
            </div>
            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input 
                id="complemento"
                placeholder="Apto 45"
                {...form.register('complemento')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Georreferenciamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
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
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input 
                id="longitude"
                placeholder="-46.633308"
                {...form.register('longitude')}
              />
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              const address = `${form.getValues('logradouro')}, ${form.getValues('numero')}, ${form.getValues('bairro')}, ${form.getValues('municipio')}, ${form.getValues('estado')}`;
              handleAddressLookup(address);
            }}
            disabled={isLoadingCoords}
          >
            {isLoadingCoords ? 'Buscando coordenadas...' : 'Buscar Coordenadas pelo Endereço'}
          </Button>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              As coordenadas serão automaticamente buscadas pelo endereço e exibidas no mapa para validação.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tempo e Disponibilidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo e Disponibilidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Fuso Horário</Label>
            <Select 
              value={form.watch('fusoHorario')}
              onValueChange={(value) => form.setValue('fusoHorario', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">America/São_Paulo (UTC-3)</SelectItem>
                <SelectItem value="America/Manaus">America/Manaus (UTC-4)</SelectItem>
                <SelectItem value="America/Rio_Branco">America/Rio_Branco (UTC-5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Horário de Funcionamento</Label>
            <Button type="button" variant="outline" className="w-full">
              Configurar Horários da Semana
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Intervalos de Funcionamento</Label>
            <Button type="button" variant="outline" className="w-full">
              Configurar Intervalos
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Feriados</Label>
            <Button type="button" variant="outline" className="w-full">
              Buscar Feriados Municipais/Estaduais/Federais
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Indisponibilidades</Label>
            <Button type="button" variant="outline" className="w-full">
              Gerenciar Períodos Indisponíveis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Local
        </Button>
      </div>
    </form>
  );
}