import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  MessageSquare, 
  Sparkles, 
  Eye, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { EntityCatalog, EntityDefinition, FieldDefinition, getEntityDefinition } from '@/lib/entity-field-catalog';

interface FieldMapping {
  id: string;
  entityId: string;
  fieldId: string;
  fieldDefinition: FieldDefinition;
  required: boolean;
  aiQuestion: string;
  extractionHint: string;
  order: number;
}

interface ConversationalFormBuilderProps {
  entityId: string;
  initialFields?: FieldMapping[];
  onChange: (fields: FieldMapping[]) => void;
  onPreview?: () => void;
}

export function ConversationalFormBuilder({ 
  entityId, 
  initialFields = [], 
  onChange,
  onPreview 
}: ConversationalFormBuilderProps) {
  const [fields, setFields] = useState<FieldMapping[]>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  
  const entity = getEntityDefinition(entityId);

  if (!entity) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <AlertCircle className="w-5 h-5 mr-2" />
        Entidade não encontrada
      </div>
    );
  }

  // Get available fields (not yet added)
  const availableFields = entity.fields.filter(
    field => !fields.some(f => f.fieldId === field.id)
  );

  const requiredFieldIds = entity.requiredFields;

  const addField = (fieldId: string) => {
    const fieldDef = entity.fields.find(f => f.id === fieldId);
    if (!fieldDef) return;

    const isRequired = requiredFieldIds.includes(fieldId);
    
    const newField: FieldMapping = {
      id: `field-${Date.now()}`,
      entityId: entity.id,
      fieldId: fieldDef.id,
      fieldDefinition: fieldDef,
      required: isRequired,
      aiQuestion: generateDefaultQuestion(fieldDef),
      extractionHint: fieldDef.aiExtractionHints?.context || `Extrair ${fieldDef.label.toLowerCase()} da conversa`,
      order: fields.length
    };

    const updated = [...fields, newField];
    setFields(updated);
    onChange(updated);
    setSelectedFieldId('');
  };

  const removeField = (fieldId: string) => {
    const updated = fields.filter(f => f.id !== fieldId);
    setFields(updated);
    onChange(updated);
  };

  const updateField = (fieldId: string, updates: Partial<FieldMapping>) => {
    const updated = fields.map(f => 
      f.id === fieldId ? { ...f, ...updates } : f
    );
    setFields(updated);
    onChange(updated);
  };

  const generateDefaultQuestion = (field: FieldDefinition): string => {
    const examples = field.aiExtractionHints?.examples || [];
    const questionTemplates: Record<string, string> = {
      'text': `Qual é ${field.label.toLowerCase()}?`,
      'textarea': `Pode me fornecer ${field.label.toLowerCase()}?`,
      'email': `Qual é o e-mail?`,
      'phone': `Qual é o telefone de contato?`,
      'select': `Qual é ${field.label.toLowerCase()}?`,
      'date': `Qual é a data?`,
      'number': `Qual é o valor?`
    };

    return questionTemplates[field.type] || `Me informe ${field.label.toLowerCase()}`;
  };

  const getCompletionStats = () => {
    const requiredCount = fields.filter(f => f.required).length;
    const requiredTotal = requiredFieldIds.length;
    const optionalCount = fields.filter(f => !f.required).length;
    
    return {
      requiredCount,
      requiredTotal,
      optionalCount,
      isComplete: requiredCount === requiredTotal
    };
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                Formulário Conversacional - {entity.label}
              </CardTitle>
              <CardDescription className="mt-1">
                Configure quais campos a IA deve coletar durante a conversa
              </CardDescription>
            </div>
            {onPreview && (
              <Button onClick={onPreview} variant="outline" size="sm" data-testid="button-preview-conversation">
                <Eye className="w-4 h-4 mr-2" />
                Visualizar Conversa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {stats.isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {stats.requiredCount} de {stats.requiredTotal} campos obrigatórios
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.optionalCount} campos opcionais adicionados
                </p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">IA Configurada</p>
                <p className="text-xs text-muted-foreground">
                  {fields.length} campos com extração inteligente
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Add Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Campos
            </CardTitle>
            <CardDescription>
              Selecione os campos que você deseja coletar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field-select">Selecionar Campo</Label>
                <Select
                  value={selectedFieldId}
                  onValueChange={setSelectedFieldId}
                  data-testid="select-field-to-add"
                >
                  <SelectTrigger id="field-select">
                    <SelectValue placeholder="Escolha um campo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Campos Obrigatórios</p>
                      {availableFields
                        .filter(f => requiredFieldIds.includes(f.id))
                        .map(field => (
                          <SelectItem key={field.id} value={field.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                              {field.label}
                            </div>
                          </SelectItem>
                        ))}
                      <Separator className="my-2" />
                      <p className="text-xs font-medium text-muted-foreground mb-2">Campos Opcionais</p>
                      {availableFields
                        .filter(f => !requiredFieldIds.includes(f.id))
                        .map(field => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.label}
                          </SelectItem>
                        ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {selectedFieldId && (
                <Button 
                  onClick={() => addField(selectedFieldId)} 
                  className="w-full"
                  data-testid="button-add-field"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Campo
                </Button>
              )}

              {availableFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">Todos os campos foram adicionados!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Configure Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Campos do Formulário ({fields.length})
            </CardTitle>
            <CardDescription>
              Configure como a IA vai perguntar e extrair cada campo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Plus className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum campo adicionado ainda</p>
                  <p className="text-xs mt-1">Selecione campos à esquerda para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-2">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <GripVertical className="w-5 h-5 text-muted-foreground mt-1" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{field.fieldDefinition.label}</p>
                                  {field.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      Obrigatório
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {field.fieldDefinition.type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {field.fieldDefinition.description}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeField(field.id)}
                              disabled={field.required}
                              data-testid={`button-remove-field-${field.fieldId}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <Separator />

                          {/* AI Configuration */}
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`question-${field.id}`} className="text-xs">
                                <MessageSquare className="w-3 h-3 inline mr-1" />
                                Como a IA deve perguntar?
                              </Label>
                              <Input
                                id={`question-${field.id}`}
                                value={field.aiQuestion}
                                onChange={(e) => updateField(field.id, { aiQuestion: e.target.value })}
                                placeholder="Exemplo: Qual é o título do chamado?"
                                data-testid={`input-ai-question-${field.fieldId}`}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`hint-${field.id}`} className="text-xs">
                                <Sparkles className="w-3 h-3 inline mr-1" />
                                Dica de Extração para IA
                              </Label>
                              <Textarea
                                id={`hint-${field.id}`}
                                value={field.extractionHint}
                                onChange={(e) => updateField(field.id, { extractionHint: e.target.value })}
                                placeholder="Como a IA deve extrair esse campo da conversa..."
                                rows={2}
                                data-testid={`textarea-extraction-hint-${field.fieldId}`}
                              />
                            </div>

                            {/* AI Hints from catalog */}
                            {field.fieldDefinition.aiExtractionHints && (
                              <div className="bg-muted/50 p-3 rounded-md space-y-2">
                                <p className="text-xs font-medium">💡 Dicas do Sistema:</p>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p><strong>Palavras-chave:</strong> {field.fieldDefinition.aiExtractionHints.keywords.join(', ')}</p>
                                  {field.fieldDefinition.aiExtractionHints.examples.length > 0 && (
                                    <p><strong>Exemplos:</strong> "{field.fieldDefinition.aiExtractionHints.examples[0]}"</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
