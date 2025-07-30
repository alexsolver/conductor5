

import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trechoSchema } from '../../../../shared/schema-locations-new';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Route, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Local selector component
const LocalSelector = ({ value, onChange, label, placeholder }) => {
  const { data: locais = [] } = useQuery({
    queryKey: ['/api/locations-new/local'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations-new/local', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      return result.data?.records || result.data || [];
    }
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {locais.map((local) => (
            <SelectItem key={local.id} value={local.id}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{local.nome}</div>
                  {local.municipio && local.estado && (
                    <div className="text-sm text-gray-500">
                      {local.municipio}, {local.estado}
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
          {locais.length === 0 && (
            <SelectItem value="select-local" disabled>
              Nenhum local disponível
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default function TrechoForm({ onSubmit, isSubmitting, onCancel }) {
  const form = useForm({
    resolver: zodResolver(trechoSchema),
    defaultValues: {
      ativo: true,
      codigoIntegracao: '',
      localAId: '',
      localBId: ''
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const watchedValues = useWatch({ control: form.control });

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

      console.log('TrechoForm - Submitting data:', formData);
      await onSubmit(formData);
    } catch (error) {
      console.error('TrechoForm - Error submitting:', error);
      throw error;
    }
  };

  // Validation to prevent selecting the same local for A and B
  const validateLocalSelection = (localBId) => {
    if (localBId && watchedValues.localAId && localBId === watchedValues.localAId) {
      return false;
    }
    return true;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Identificação do Trecho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ativo">Status</Label>
              <div className="text-sm text-muted-foreground">
                Trecho ativo no sistema
              </div>
            </div>
            <Switch
              id="ativo"
              checked={watchedValues.ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
          </div>

          <div>
            <Label htmlFor="codigoIntegracao">Código de Integração</Label>
            <Input
              id="codigoIntegracao"
              {...register('codigoIntegracao')}
              placeholder="Digite o código de integração (opcional)"
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">
              {watchedValues.codigoIntegracao?.length || 0}/100 caracteres
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LocalSelector
                value={watchedValues.localAId}
                onChange={(value) => setValue('localAId', value)}
                label="Local A *"
                placeholder="Selecione o local de origem"
              />
              {errors.localAId && (
                <p className="text-sm text-red-500 mt-1">{errors.localAId.message}</p>
              )}
            </div>

            <div>
              <LocalSelector
                value={watchedValues.localBId}
                onChange={(value) => {
                  if (validateLocalSelection(value)) {
                    setValue('localBId', value);
                  }
                }}
                label="Local B *"
                placeholder="Selecione o local de destino"
              />
              {errors.localBId && (
                <p className="text-sm text-red-500 mt-1">{errors.localBId.message}</p>
              )}
              {watchedValues.localAId && watchedValues.localBId === watchedValues.localAId && (
                <p className="text-sm text-yellow-600 mt-1">
                  Local B deve ser diferente do Local A
                </p>
              )}
            </div>
          </div>

          {/* Resumo da seleção */}
          {watchedValues.localAId && watchedValues.localBId && watchedValues.localAId !== watchedValues.localBId && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">
                Resumo do Trecho
              </div>
              <div className="text-sm text-blue-700 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local A → Local B
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Trecho configurado com sucesso
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !watchedValues.localAId || !watchedValues.localBId || watchedValues.localAId === watchedValues.localBId}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Trecho'}
        </Button>
      </div>
    </form>
  );
}

