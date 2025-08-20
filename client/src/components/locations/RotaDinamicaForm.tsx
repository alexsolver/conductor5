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
import { useToast } from "@/hooks/use-toast";
// import { useLocalization } from '@/hooks/useLocalization';

// Multi-select components for relationships
const ClientesMultiSelect = ({
  // Localization temporarily disabled
 value = [], onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ['integration-customers'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations-new/integration/customers', {
        headers: { 'Authorization': `Bearer ${token" }
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
          placeholder='[TRANSLATION_NEEDED]'
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
        headers: { 'Authorization': `Bearer ${token" }
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
          placeholder='[TRANSLATION_NEEDED]'
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

interface RotaDinamicaFormProps {
  onSubmit: (data: NewRotaDinamica) => void;
  initialData?: Partial<NewRotaDinamica>;
  isLoading?: boolean;
  onSuccess?: () => void; // Added for success callback
  onClose?: () => void; // Added for close callback
}

export default function RotaDinamicaForm({ onSubmit, initialData, isLoading, onSuccess, onClose }: RotaDinamicaFormProps) {
  const { toast } = useToast();
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

  const { register, handleSubmit: handleHookFormSubmit, formState: { errors }, setValue, watch } = form;
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

  const handleSubmit = async (data: NewRotaDinamica) => {
    try {
      console.log('🔄 [ROTA-DINAMICA-FORM] Starting form submission...');
      console.log('📝 [ROTA-DINAMICA-FORM] Form data:', JSON.stringify(data, null, 2));

      // Validar token de acesso
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('❌ [ROTA-DINAMICA-FORM] No access token found');
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Token de acesso não encontrado. Faça login novamente.",
          variant: "destructive"
        });
        return;
      }

      // Validar dados básicos antes de enviar
      if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
        console.error('❌ [ROTA-DINAMICA-FORM] Nome field validation failed');
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "O campo 'Nome' é obrigatório e deve ser preenchido.",
          variant: "destructive"
        });
        return;
      }

      console.log('🌐 [ROTA-DINAMICA-FORM] Making API request to /api/locations-new/rota-dinamica');

      // Fazer requisição
      const response = await fetch('/api/locations-new/rota-dinamica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token",
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log('📡 [ROTA-DINAMICA-FORM] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let result: any;
      try {
        const responseText = await response.text();

        if (!responseText) {
          console.error('❌ [ROTA-DINAMICA-FORM] Empty response from server');
          toast({
            title: '[TRANSLATION_NEEDED]',
            description: "O servidor não retornou dados. Tente novamente.",
            variant: "destructive"
          });
          return;
        }

        // Verificar se é HTML (página de erro)
        if (responseText.trim().startsWith('<!DOCTYPE') ||
            responseText.trim().startsWith('<html')) {
          console.error('❌ [ROTA-DINAMICA-FORM] Received HTML instead of JSON');
          toast({
            title: '[TRANSLATION_NEEDED]',
            description: "O servidor retornou uma página de erro. Verifique a configuração.",
            variant: "destructive"
          });
          return;
        }

        result = JSON.parse(responseText);
        console.log('✅ [ROTA-DINAMICA-FORM] Successfully parsed JSON:', result);

      } catch (parseError) {
        console.error('❌ [ROTA-DINAMICA-FORM] JSON parsing error:', parseError);
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: `Não foi possível interpretar a resposta do servidor: ${parseError.message",
          variant: "destructive"
        });
        return;
      }

      // Processar resposta baseada no status HTTP
      if (response.ok && result?.success) {
        console.log('✅ [ROTA-DINAMICA-FORM] Rota dinâmica created successfully');

        toast({
          title: '[TRANSLATION_NEEDED]',
          description: result.message || "Rota dinâmica criada com sucesso!",
          variant: "default"
        });

        // Callbacks de sucesso
        if (onSuccess) {
          console.log('🔄 [ROTA-DINAMICA-FORM] Calling onSuccess callback');
          onSuccess();
        }
        if (onClose) {
          console.log('🔄 [ROTA-DINAMICA-FORM] Calling onClose callback');
          onClose();
        }

      } else {
        // Erro do servidor ou validação
        console.error('❌ [ROTA-DINAMICA-FORM] Server returned error:', {
          status: response.status,
          result: result
        });

        const errorMessage = result?.message || result?.error || '[TRANSLATION_NEEDED]';

        toast({
          title: '[TRANSLATION_NEEDED]',
          description: errorMessage,
          variant: "destructive"
        });
      }

    } catch (networkError) {
      console.error('❌ [ROTA-DINAMICA-FORM] Network or unexpected error:', networkError);

      if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Não foi possível conectar ao servidor. Verifique sua conexão de internet.",
          variant: "destructive"
        });
      } else {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: `Ocorreu um erro inesperado: ${networkError instanceof Error ? networkError.message : '[TRANSLATION_NEEDED]'",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <form onSubmit={handleHookFormSubmit(handleSubmit)} className="space-y-6">
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
              <Label htmlFor="nome">Nome da Rota *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Digite o nome da rota"
                maxLength={100}
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {watchedValues.nome?.length || 0}/100 caracteres
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
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : '[TRANSLATION_NEEDED]'}
        </Button>
      </div>
    </form>
  );
}