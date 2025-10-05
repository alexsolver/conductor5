import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, ArrowRight, Info } from 'lucide-react';

export interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transform?: string;
}

interface FieldMappingConfigProps {
  mappings: FieldMapping[];
  onChange: (mappings: FieldMapping[]) => void;
}

const AVAILABLE_SOURCE_FIELDS = [
  { value: 'customer.name', label: 'Nome do Cliente', group: 'Cliente' },
  { value: 'customer.email', label: 'Email do Cliente', group: 'Cliente' },
  { value: 'customer.phone', label: 'Telefone do Cliente', group: 'Cliente' },
  { value: 'customer.cpf', label: 'CPF do Cliente', group: 'Cliente' },
  { value: 'customer.company', label: 'Empresa do Cliente', group: 'Cliente' },
  { value: 'conversation.subject', label: 'Assunto da Conversa', group: 'Conversa' },
  { value: 'conversation.category', label: 'Categoria Detectada', group: 'Conversa' },
  { value: 'conversation.priority', label: 'Prioridade Detectada', group: 'Conversa' },
  { value: 'conversation.urgency', label: 'Urgência Detectada', group: 'Conversa' },
  { value: 'conversation.sentiment', label: 'Sentimento Detectado', group: 'Conversa' },
  { value: 'message.content', label: 'Conteúdo da Mensagem', group: 'Mensagem' },
  { value: 'message.sender', label: 'Remetente', group: 'Mensagem' },
  { value: 'message.channel', label: 'Canal de Origem', group: 'Mensagem' },
  { value: 'extracted.product', label: 'Produto Mencionado', group: 'Extraído' },
  { value: 'extracted.location', label: 'Localização Mencionada', group: 'Extraído' },
  { value: 'extracted.date', label: 'Data Mencionada', group: 'Extraído' },
  { value: 'extracted.value', label: 'Valor Mencionado', group: 'Extraído' },
];

const AVAILABLE_TARGET_FIELDS = [
  { value: 'ticket.title', label: 'Título do Ticket', group: 'Ticket' },
  { value: 'ticket.description', label: 'Descrição do Ticket', group: 'Ticket' },
  { value: 'ticket.category', label: 'Categoria', group: 'Ticket' },
  { value: 'ticket.subcategory', label: 'Subcategoria', group: 'Ticket' },
  { value: 'ticket.priority', label: 'Prioridade', group: 'Ticket' },
  { value: 'ticket.urgency', label: 'Urgência', group: 'Ticket' },
  { value: 'ticket.impact', label: 'Impacto', group: 'Ticket' },
  { value: 'ticket.tags', label: 'Tags', group: 'Ticket' },
  { value: 'ticket.dueDate', label: 'Data de Vencimento', group: 'Ticket' },
  { value: 'ticket.location', label: 'Localização', group: 'Ticket' },
  { value: 'ticket.customField1', label: 'Campo Personalizado 1', group: 'Ticket' },
  { value: 'ticket.customField2', label: 'Campo Personalizado 2', group: 'Ticket' },
  { value: 'ticket.customField3', label: 'Campo Personalizado 3', group: 'Ticket' },
  { value: 'customer.notes', label: 'Notas do Cliente', group: 'Cliente' },
  { value: 'customer.tags', label: 'Tags do Cliente', group: 'Cliente' },
];

const TRANSFORM_OPTIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'uppercase', label: 'Maiúsculas' },
  { value: 'lowercase', label: 'Minúsculas' },
  { value: 'capitalize', label: 'Capitalizar' },
  { value: 'trim', label: 'Remover Espaços' },
  { value: 'format_phone', label: 'Formatar Telefone' },
  { value: 'format_cpf', label: 'Formatar CPF' },
  { value: 'format_date', label: 'Formatar Data' },
  { value: 'extract_numbers', label: 'Extrair Números' },
  { value: 'remove_special_chars', label: 'Remover Caracteres Especiais' },
];

export default function FieldMappingConfig({ mappings, onChange }: FieldMappingConfigProps) {
  const { toast } = useToast();

  const addMapping = () => {
    const newMapping: FieldMapping = {
      id: `mapping-${Date.now()}`,
      sourceField: '',
      targetField: '',
      transform: 'none'
    };
    onChange([...mappings, newMapping]);
  };

  const updateMapping = (id: string, field: keyof FieldMapping, value: string) => {
    const updated = mappings.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    );
    onChange(updated);
  };

  const removeMapping = (id: string) => {
    onChange(mappings.filter(m => m.id !== id));
    toast({
      title: 'Mapeamento removido',
      description: 'O mapeamento de campo foi removido com sucesso.'
    });
  };

  const groupByGroup = (fields: any[]) => {
    return fields.reduce((acc, field) => {
      if (!acc[field.group]) {
        acc[field.group] = [];
      }
      acc[field.group].push(field);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const groupedSources = groupByGroup(AVAILABLE_SOURCE_FIELDS);
  const groupedTargets = groupByGroup(AVAILABLE_TARGET_FIELDS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />
          Mapeamento de Campos
        </CardTitle>
        <CardDescription>
          Configure como os dados coletados pelo agente são mapeados para campos do ticket
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Como funciona o mapeamento?
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                O agente IA coleta informações durante a conversa. Configure aqui como essas informações 
                devem ser automaticamente preenchidas nos campos do ticket quando ele for criado.
              </p>
            </div>
          </div>
        </div>

        {/* Mappings List */}
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {mappings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <ArrowRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Nenhum mapeamento configurado</p>
                <p className="text-sm mt-1">
                  Clique em "Adicionar Mapeamento" para começar
                </p>
              </div>
            ) : (
              mappings.map((mapping, index) => (
                <div key={mapping.id} className="border rounded-lg p-4 space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Mapeamento {index + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMapping(mapping.id)}
                      data-testid={`button-remove-mapping-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Source Field */}
                    <div>
                      <Label htmlFor={`source-${mapping.id}`}>Campo de Origem</Label>
                      <Select
                        value={mapping.sourceField}
                        onValueChange={(value) => updateMapping(mapping.id, 'sourceField', value)}
                      >
                        <SelectTrigger 
                          id={`source-${mapping.id}`}
                          data-testid={`select-source-${index}`}
                        >
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupedSources).map(([group, fields]) => (
                            <div key={group}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {group}
                              </div>
                              {fields.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex items-end justify-center pb-2">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Target Field */}
                    <div>
                      <Label htmlFor={`target-${mapping.id}`}>Campo de Destino</Label>
                      <Select
                        value={mapping.targetField}
                        onValueChange={(value) => updateMapping(mapping.id, 'targetField', value)}
                      >
                        <SelectTrigger 
                          id={`target-${mapping.id}`}
                          data-testid={`select-target-${index}`}
                        >
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupedTargets).map(([group, fields]) => (
                            <div key={group}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {group}
                              </div>
                              {fields.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Transform Option */}
                  <div>
                    <Label htmlFor={`transform-${mapping.id}`}>Transformação (Opcional)</Label>
                    <Select
                      value={mapping.transform || 'none'}
                      onValueChange={(value) => updateMapping(mapping.id, 'transform', value)}
                    >
                      <SelectTrigger 
                        id={`transform-${mapping.id}`}
                        data-testid={`select-transform-${index}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSFORM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aplica uma transformação ao valor antes de salvar
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Add Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addMapping}
          className="w-full"
          data-testid="button-add-mapping"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Mapeamento
        </Button>

        {/* Summary */}
        {mappings.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">
              Resumo: {mappings.length} mapeamento(s) configurado(s)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Os dados serão automaticamente mapeados quando o agente criar um ticket
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
