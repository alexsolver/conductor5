
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rotaTrechoComSegmentosSchema } from '../../../../shared/schema-locations-new';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Route, MapPin, Plus, Trash2, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
// import { useLocalization } from '@/hooks/useLocalization';

// Local selector component
const LocalSelector = ({
  // Localization temporarily disabled
 value, onChange, label, placeholder, disabled = false }) => {
  const { data: locais = [] } = useQuery({
    queryKey: ['/api/locations-new/local'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations-new/local', {
        headers: { 'Authorization': "
      });
      const result = await response.json();
      return result.data?.records || result.data || [];
    }
  });

  return (
    <div className="space-y-2>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {locais.map((local) => (
            <SelectItem key={local.id} value={local.id}>
              <div className="flex items-center gap-2>
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{local.nome}</div>
                  {local.municipio && local.estado && (
                    <div className="text-sm text-gray-500>
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

// Segment editing modal/form
const SegmentForm = ({ segment, onSave, onCancel, availableLocals = [], isFirst = false, isLast = false, previousDestination = null }) => {
  const [localOrigem, setLocalOrigem] = useState(segment?.localOrigemId || '');
  const [localDestino, setLocalDestino] = useState(segment?.localDestinoId || '');
  const [nomeTrecho, setNomeTrecho] = useState(segment?.nomeTrecho || '');

  const handleSave = () => {
    if (!localOrigem || !localDestino) return;
    
    onSave({
      localOrigemId: localOrigem,
      localDestinoId: localDestino,
      nomeTrecho: nomeTrecho || '',
      ordem: segment?.ordem || 1
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4>
        <div>
          <Label>DE (Local de Origem) *</Label>
          <Select 
            value={localOrigem} 
            onValueChange={setLocalOrigem}
            disabled={isFirst && previousDestination}
          >
            <SelectTrigger>
              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
            </SelectTrigger>
            <SelectContent>
              {availableLocals.map((local) => (
                <SelectItem key={local.id} value={local.id}>
                  {local.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>TRECHO (Nome/Código)</Label>
          <Input
            value={nomeTrecho}
            onChange={(e) => setNomeTrecho(e.target.value)}
            placeholder="Nome ou código do trecho"
            maxLength={200}
          />
        </div>

        <div>
          <Label>PARA (Local de Destino) *</Label>
          <Select value={localDestino} onValueChange={setLocalDestino}>
            <SelectTrigger>
              <SelectValue placeholder='[TRANSLATION_NEEDED]' />
            </SelectTrigger>
            <SelectContent>
              {availableLocals.map((local) => (
                <SelectItem key={local.id} value={local.id}>
                  {local.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="button" 
          onClick={handleSave}
          disabled={!localOrigem || !localDestino}
        >
          Salvar Trecho
        </Button>
      </div>
    </div>
  );
};

export default function RotaTrechoForm({ onSubmit, isSubmitting, onCancel }) {
  const [trechos, setTrechos] = useState([]);
  const [editingSegment, setEditingSegment] = useState(null);
  const [addingSegment, setAddingSegment] = useState(false);

  const form = useForm({
    resolver: zodResolver(rotaTrechoComSegmentosSchema),
    defaultValues: {
      ativo: true,
      idRota: '',
      localAId: '',
      localBId: '',
      trechos: []
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const watchedValues = useWatch({ control: form.control });

  const { data: locais = [] } = useQuery({
    queryKey: ['/api/locations-new/local'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/locations-new/local', {
        headers: { 'Authorization': "
      });
      const result = await response.json();
      return result.data?.records || result.data || [];
    }
  });

  const getLocalName = (localId) => {
    const local = locais.find(l => l.id === localId);
    return local ? local.nome : 'Local não encontrado';
  };

  const addSegment = (segmentData) => {
    const newSegment = {
      ...segmentData,
      ordem: trechos.length + 1
    };
    const updatedTrechos = [...trechos, newSegment];
    setTrechos(updatedTrechos);
    setValue('trechos', updatedTrechos);
    setAddingSegment(false);
  };

  const editSegment = (index, segmentData) => {
    const updatedTrechos = [...trechos];
    updatedTrechos[index] = { ...segmentData, ordem: index + 1 };
    setTrechos(updatedTrechos);
    setValue('trechos', updatedTrechos);
    setEditingSegment(null);
  };

  const removeSegment = (index) => {
    const updatedTrechos = trechos.filter((_, i) => i !== index).map((t, i) => ({ ...t, ordem: i + 1 }));
    setTrechos(updatedTrechos);
    setValue('trechos', updatedTrechos);
  };

  const handleFormSubmit = async (data) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const tenantId = payload.tenantId;

      if (!tenantId) {
        throw new Error('Tenant ID não encontrado no token');
      }

      const formData = {
        ...data,
        tenantId,
        trechos: trechos
      };

      console.log('RotaTrechoForm - Submitting data:', formData);
      await onSubmit(formData);
    } catch (error) {
      console.error('RotaTrechoForm - Error submitting:', error);
      throw error;
    }
  };

  const isValidRoute = () => {
    if (!watchedValues.localAId || !watchedValues.localBId || trechos.length === 0) {
      return false;
    }

    // Check if first segment starts from Local A
    if (trechos[0]?.localOrigemId !== watchedValues.localAId) {
      return false;
    }

    // Check if last segment ends at Local B
    const lastTrecho = trechos[trechos.length - 1];
    if (lastTrecho?.localDestinoId !== watchedValues.localBId) {
      return false;
    }

    // Check segment connectivity
    for (let i = 0; i < trechos.length - 1; i++) {
      if (trechos[i].localDestinoId !== trechos[i + 1].localOrigemId) {
        return false;
      }
    }

    return true;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6>
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2>
            <Route className="h-5 w-5" />
            Identificação da Rota de Trecho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4>
          <div className="flex items-center justify-between>
            <div className="space-y-0.5>
              <Label htmlFor="ativo">Status</Label>
              <div className="text-sm text-muted-foreground>
                Rota ativa no sistema
              </div>
            </div>
            <Switch
              id="ativo"
              checked={watchedValues.ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
          </div>

          <div>
            <Label htmlFor="idRota">ID da Rota *</Label>
            <Input
              id="idRota"
              {...register('idRota')}
              placeholder="Digite o ID da rota"
              maxLength={100}
            />
            {errors.idRota && (
              <p className="text-sm text-red-500 mt-1">{errors.idRota.message}</p>
            )}
            <div className="text-xs text-gray-500 mt-1>
              {watchedValues.idRota?.length || 0}/100 caracteres
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Definição do Trecho */}
      <Card>
        <CardHeader>
          <CardTitle>Definição do Trecho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4>
            <div>
              <LocalSelector
                value={watchedValues.localAId}
                onChange={(value) => setValue('localAId', value)}
                label="Local A - Origem *"
                placeholder='[TRANSLATION_NEEDED]'
              />
              {errors.localAId && (
                <p className="text-sm text-red-500 mt-1">{errors.localAId.message}</p>
              )}
            </div>

            <div>
              <LocalSelector
                value={watchedValues.localBId}
                onChange={(value) => setValue('localBId', value)}
                label="Local B - Destino *"
                placeholder='[TRANSLATION_NEEDED]'
              />
              {errors.localBId && (
                <p className="text-sm text-red-500 mt-1">{errors.localBId.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Múltiplos Trechos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between>
            Definição de Múltiplos Trechos
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddingSegment(true)}
              disabled={!watchedValues.localAId || !watchedValues.localBId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Trecho
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4>
          {addingSegment && (
            <SegmentForm
              onSave={addSegment}
              onCancel={() => setAddingSegment(false)}
              availableLocals={locais}
              isFirst={trechos.length === 0}
              previousDestination={trechos.length > 0 ? trechos[trechos.length - 1].localDestinoId : watchedValues.localAId}
            />
          )}

          {editingSegment !== null && (
            <SegmentForm
              segment={trechos[editingSegment]}
              onSave={(data) => editSegment(editingSegment, data)}
              onCancel={() => setEditingSegment(null)}
              availableLocals={locais}
              isFirst={editingSegment === 0}
              isLast={editingSegment === trechos.length - 1}
              previousDestination={editingSegment > 0 ? trechos[editingSegment - 1].localDestinoId : watchedValues.localAId}
            />
          )}

          {trechos.length > 0 && (
            <div className="border rounded-lg>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>DE</TableHead>
                    <TableHead>TRECHO</TableHead>
                    <TableHead>PARA</TableHead>
                    <TableHead>AÇÃO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trechos.map((trecho, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2>
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {getLocalName(trecho.localOrigemId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {trecho.nomeTrecho || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2>
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {getLocalName(trecho.localDestinoId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSegment(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSegment(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {trechos.length === 0 && (
            <div className="text-center py-8 text-gray-500>
              <Route className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum trecho adicionado</p>
              <p className="text-sm">Clique em "Adicionar Trecho" para começar</p>
            </div>
          )}

          {/* Validations Display */}
          {trechos.length > 0 && (
            <div className="space-y-2>
              {!isValidRoute() && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg>
                  <strong>Validações necessárias:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1>
                    {trechos[0]?.localOrigemId !== watchedValues.localAId && (
                      <li>O primeiro trecho deve iniciar no Local A</li>
                    )}
                    {trechos[trechos.length - 1]?.localDestinoId !== watchedValues.localBId && (
                      <li>O último trecho deve terminar no Local B</li>
                    )}
                    {trechos.some((t, i) => i < trechos.length - 1 && t.localDestinoId !== trechos[i + 1].localOrigemId) && (
                      <li>Os trechos devem estar conectados sequencialmente</li>
                    )}
                  </ul>
                </div>
              )}
              {isValidRoute() && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg>
                  ✓ Rota válida com {trechos.length} trecho(s) sequencial(is)
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !isValidRoute()}
        >
          {isSubmitting ? 'Salvando...' : '[TRANSLATION_NEEDED]'}
        </Button>
      </div>
    </form>
  );
}
