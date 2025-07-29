
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rotaDinamicaSchema } from '../../../../shared/schema-locations-new';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Users, Calendar, Route } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Multi-select components for relationships
const ClientesMultiSelect = ({ value = [], onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: clientes = [] } = useQuery({
    queryKey: ['integration-customers'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations-new/integration/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      return result.data || [];
    }
  });

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (clienteId) => {
    const newValue = value.includes(clienteId)
      ? value.filter(id => id !== clienteId)
      : [...value, clienteId];
    onChange(newValue);
  };

  const removeCliente = (clienteId) => {
    onChange(value.filter(id => id !== clienteId));
  };

  const getClienteNome = (id) => {
    const cliente = clientes.find(c => c.id === id);
    return cliente?.nome || 'Cliente não encontrado';
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredClientes.map((cliente) => (
              <div
                key={cliente.id}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleToggle(cliente.id)}
              >
                <Checkbox
                  checked={value.includes(cliente.id)}
                  readOnly
                  className="mr-2"
                />
                <div className="flex-1">
                  <div className="font-medium">{cliente.nome}</div>
                  <div className="text-sm text-gray-500">{cliente.email}</div>
                </div>
              </div>
            ))}
            {filteredClientes.length === 0 && (
              <div className="p-2 text-gray-500 text-center">
                Nenhum cliente encontrado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected clientes */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((clienteId) => (
            <Badge key={clienteId} variant="secondary" className="flex items-center gap-1">
              {getClienteNome(clienteId)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeCliente(clienteId)}
              />
            </Badge>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500">
        {value.length} cliente(s) selecionado(s)
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-5" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

const RegioesMultiSelect = ({ value = [], onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: regioes = [] } = useQuery({
    queryKey: ['/api/locations-new/regiao'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations-new/regiao', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      return result.data || [];
    }
  });

  // Ensure regioes is always an array
  const regioesArray = Array.isArray(regioes) ? regioes : [];
  const filteredRegioes = regioesArray.filter(regiao =>
    regiao.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (regiaoId) => {
    const newValue = value.includes(regiaoId)
      ? value.filter(id => id !== regiaoId)
      : [...value, regiaoId];
    onChange(newValue);
  };

  const removeRegiao = (regiaoId) => {
    onChange(value.filter(id => id !== regiaoId));
  };

  const getRegiaoNome = (id) => {
    const regiao = regioesArray.find(r => r.id === id);
    return regiao?.nome || 'Região não encontrada';
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Buscar regiões..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredRegioes.map((regiao) => (
              <div
                key={regiao.id}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleToggle(regiao.id)}
              >
                <Checkbox
                  checked={value.includes(regiao.id)}
                  readOnly
                  className="mr-2"
                />
                <div className="flex-1">
                  <div className="font-medium">{regiao.nome}</div>
                  {regiao.descricao && (
                    <div className="text-sm text-gray-500">{regiao.descricao}</div>
                  )}
                </div>
              </div>
            ))}
            {filteredRegioes.length === 0 && (
              <div className="p-2 text-gray-500 text-center">
                Nenhuma região encontrada
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected regioes */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((regiaoId) => (
            <Badge key={regiaoId} variant="secondary" className="flex items-center gap-1">
              {getRegiaoNome(regiaoId)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeRegiao(regiaoId)}
              />
            </Badge>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500">
        {value.length} região(ões) selecionada(s)
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-5" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default function RotaDinamicaForm({ onSubmit, isSubmitting, onCancel }) {
  const form = useForm({
    resolver: zodResolver(rotaDinamicaSchema),
    defaultValues: {
      ativo: true,
      nomeRota: '',
      idRota: '',
      clientesVinculados: [],
      regioesAtendidas: [],
      diasSemana: [],
      previsaoDias: 1
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const watchedValues = useWatch({ control: form.control });

  // Dias da semana options
  const diasSemanaOptions = [
    { value: 'domingo', label: 'Dom', fullName: 'Domingo' },
    { value: 'segunda', label: 'Seg', fullName: 'Segunda-feira' },
    { value: 'terca', label: 'Ter', fullName: 'Terça-feira' },
    { value: 'quarta', label: 'Qua', fullName: 'Quarta-feira' },
    { value: 'quinta', label: 'Qui', fullName: 'Quinta-feira' },
    { value: 'sexta', label: 'Sex', fullName: 'Sexta-feira' },
    { value: 'sabado', label: 'Sáb', fullName: 'Sábado' }
  ];

  const handleDiaSemanaToggle = (dia) => {
    const currentDias = watchedValues.diasSemana || [];
    const newDias = currentDias.includes(dia)
      ? currentDias.filter(d => d !== dia)
      : [...currentDias, dia];
    setValue('diasSemana', newDias);
  };

  const handleFormSubmit = async (data) => {
    try {
      // Get current token and validate
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Parse token to get tenant ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tenantId = payload.tenantId;

      if (!tenantId) {
        throw new Error('Tenant ID não encontrado no token');
      }

      // Prepare form data with tenant
      const formData = {
        ...data,
        tenantId
      };

      console.log('RotaDinamicaForm - Submitting data:', formData);
      await onSubmit(formData);
    } catch (error) {
      console.error('RotaDinamicaForm - Error submitting:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Identificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ativo">Status</Label>
              <div className="text-sm text-muted-foreground">
                Rota dinâmica ativa no sistema
              </div>
            </div>
            <Switch
              id="ativo"
              checked={watchedValues.ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeRota">Nome da Rota *</Label>
              <Input
                id="nomeRota"
                {...register('nomeRota')}
                placeholder="Digite o nome da rota"
                maxLength={100}
                className={errors.nomeRota ? 'border-red-500' : ''}
              />
              {errors.nomeRota && (
                <p className="text-sm text-red-500 mt-1">{errors.nomeRota.message}</p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {watchedValues.nomeRota?.length || 0}/100 caracteres
              </div>
            </div>

            <div>
              <Label htmlFor="idRota">ID da Rota *</Label>
              <Input
                id="idRota"
                {...register('idRota')}
                placeholder="Digite o ID da rota"
                maxLength={100}
                className={errors.idRota ? 'border-red-500' : ''}
              />
              {errors.idRota && (
                <p className="text-sm text-red-500 mt-1">{errors.idRota.message}</p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {watchedValues.idRota?.length || 0}/100 caracteres
              </div>
            </div>
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
            <div className="text-sm text-muted-foreground mb-2">
              Selecione os clientes que serão atendidos por esta rota
            </div>
            <ClientesMultiSelect
              value={watchedValues.clientesVinculados || []}
              onChange={(clientes) => setValue('clientesVinculados', clientes)}
            />
          </div>

          <div>
            <Label>Regiões Atendidas (Multi-seleção)</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Selecione as regiões que serão cobertas por esta rota
            </div>
            <RegioesMultiSelect
              value={watchedValues.regioesAtendidas || []}
              onChange={(regioes) => setValue('regioesAtendidas', regioes)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Planejamento da Rota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planejamento da Rota
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Dias da Semana da Rota (Seleção Múltipla)</Label>
            <div className="text-sm text-muted-foreground mb-3">
              Selecione os dias da semana em que esta rota será executada
            </div>
            <div className="grid grid-cols-7 gap-2">
              {diasSemanaOptions.map((dia) => (
                <div key={dia.value} className="text-center">
                  <Button
                    type="button"
                    variant={watchedValues.diasSemana?.includes(dia.value) ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleDiaSemanaToggle(dia.value)}
                  >
                    {dia.label}
                  </Button>
                  <div className="text-xs text-gray-500 mt-1">
                    {dia.fullName}
                  </div>
                </div>
              ))}
            </div>
            {watchedValues.diasSemana?.length > 0 && (
              <div className="mt-2 text-sm text-green-600">
                {watchedValues.diasSemana.length} dia(s) selecionado(s)
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="previsaoDias">Previsão de Dias da Rota Dinâmica *</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Número de dias para execução da rota (1 a 30 dias)
            </div>
            <Input
              id="previsaoDias"
              type="number"
              min="1"
              max="30"
              {...register('previsaoDias', { valueAsNumber: true })}
              className={errors.previsaoDias ? 'border-red-500' : ''}
            />
            {errors.previsaoDias && (
              <p className="text-sm text-red-500 mt-1">{errors.previsaoDias.message}</p>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Valor atual: {watchedValues.previsaoDias || 1} dia(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Rota Dinâmica'}
        </Button>
      </div>
    </form>
  );
}
