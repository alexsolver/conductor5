import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  AlertTriangle, 
  TrendingUp, 
  Bell, 
  Zap,
  Info,
  Frown,
  Meh,
  Smile
} from 'lucide-react';

export interface SentimentAlert {
  enabled: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  threshold: number;
  action: 'notify' | 'escalate' | 'priority_boost' | 'tag';
  actionConfig?: {
    notifyUsers?: string[];
    escalateTo?: string;
    priorityIncrease?: number;
    tagToAdd?: string;
  };
}

export interface SentimentConfig {
  enabled: boolean;
  thresholds: {
    negative: number;
    neutral: number;
    positive: number;
  };
  alerts: SentimentAlert[];
  autoEscalate: {
    enabled: boolean;
    sentimentThreshold: number;
    consecutiveMessages: number;
  };
  visualizationEnabled: boolean;
}

interface SentimentConfigProps {
  config: SentimentConfig;
  onChange: (config: SentimentConfig) => void;
}

const DEFAULT_CONFIG: SentimentConfig = {
  enabled: true,
  thresholds: {
    negative: -0.3,
    neutral: 0.3,
    positive: 0.7,
  },
  alerts: [],
  autoEscalate: {
    enabled: true,
    sentimentThreshold: -0.6,
    consecutiveMessages: 3,
  },
  visualizationEnabled: true,
};

export default function SentimentConfig({ config, onChange }: SentimentConfigProps) {
  const [localConfig, setLocalConfig] = useState<SentimentConfig>(
    config || DEFAULT_CONFIG
  );

  const updateConfig = (updates: Partial<SentimentConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const updateThreshold = (sentiment: keyof SentimentConfig['thresholds'], value: number) => {
    updateConfig({
      thresholds: {
        ...localConfig.thresholds,
        [sentiment]: value,
      },
    });
  };

  const updateAutoEscalate = (field: keyof SentimentConfig['autoEscalate'], value: any) => {
    updateConfig({
      autoEscalate: {
        ...localConfig.autoEscalate,
        [field]: value,
      },
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      case 'neutral': return 'text-gray-600 dark:text-gray-400';
      default: return '';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-4 w-4" />;
      case 'negative': return <Frown className="h-4 w-4" />;
      case 'neutral': return <Meh className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Configuração de Análise de Sentimento
        </CardTitle>
        <CardDescription>
          Configure como o sistema detecta e reage ao sentimento nas conversas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sentiment-enabled" className="font-medium">
              Análise de Sentimento
            </Label>
            <p className="text-sm text-muted-foreground">
              Detectar automaticamente o tom emocional das mensagens
            </p>
          </div>
          <Switch
            id="sentiment-enabled"
            checked={localConfig.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
            data-testid="switch-sentiment-enabled"
          />
        </div>

        {localConfig.enabled && (
          <>
            <Separator />

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Como funciona?
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    O sistema analisa cada mensagem e atribui uma pontuação de sentimento entre -1 (muito negativo) 
                    e +1 (muito positivo). Configure os limites abaixo para definir o que é considerado negativo, 
                    neutro ou positivo.
                  </p>
                </div>
              </div>
            </div>

            {/* Sentiment Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <Label className="font-medium">Limites de Classificação</Label>
              </div>

              <div className="space-y-4 pl-6">
                {/* Negative Threshold */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="threshold-negative" className="text-sm flex items-center gap-2">
                      <span className={getSentimentColor('negative')}>
                        {getSentimentIcon('negative')}
                      </span>
                      Negativo (abaixo de)
                    </Label>
                    <Badge variant="outline">{localConfig.thresholds.negative.toFixed(2)}</Badge>
                  </div>
                  <Input
                    id="threshold-negative"
                    type="range"
                    min={-1}
                    max={0}
                    step={0.05}
                    value={localConfig.thresholds.negative}
                    onChange={(e) => updateThreshold('negative', parseFloat(e.target.value))}
                    data-testid="slider-threshold-negative"
                    className="w-full"
                  />
                </div>

                {/* Neutral Range Display */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={getSentimentColor('neutral')}>
                      {getSentimentIcon('neutral')}
                    </span>
                    <span className="text-sm font-medium">Neutro (entre)</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {localConfig.thresholds.negative.toFixed(2)} até {localConfig.thresholds.positive.toFixed(2)}
                  </p>
                </div>

                {/* Positive Threshold */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="threshold-positive" className="text-sm flex items-center gap-2">
                      <span className={getSentimentColor('positive')}>
                        {getSentimentIcon('positive')}
                      </span>
                      Positivo (acima de)
                    </Label>
                    <Badge variant="outline">{localConfig.thresholds.positive.toFixed(2)}</Badge>
                  </div>
                  <Input
                    id="threshold-positive"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={localConfig.thresholds.positive}
                    onChange={(e) => updateThreshold('positive', parseFloat(e.target.value))}
                    data-testid="slider-threshold-positive"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Auto-Escalate Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-escalate" className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Escalação Automática
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Escalar automaticamente conversas com sentimento muito negativo
                  </p>
                </div>
                <Switch
                  id="auto-escalate"
                  checked={localConfig.autoEscalate.enabled}
                  onCheckedChange={(enabled) => updateAutoEscalate('enabled', enabled)}
                  data-testid="switch-auto-escalate"
                />
              </div>

              {localConfig.autoEscalate.enabled && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="escalate-threshold" className="text-sm">
                        Limite de Sentimento para Escalação
                      </Label>
                      <Badge variant="destructive">
                        {localConfig.autoEscalate.sentimentThreshold.toFixed(2)}
                      </Badge>
                    </div>
                    <Input
                      id="escalate-threshold"
                      type="range"
                      min={-1}
                      max={0}
                      step={0.05}
                      value={localConfig.autoEscalate.sentimentThreshold}
                      onChange={(e) => updateAutoEscalate('sentimentThreshold', parseFloat(e.target.value))}
                      data-testid="slider-escalate-threshold"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Mensagens com sentimento abaixo deste valor acionarão a escalação
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consecutive-messages" className="text-sm">
                      Mensagens Consecutivas Negativas
                    </Label>
                    <Input
                      id="consecutive-messages"
                      type="number"
                      min={1}
                      max={10}
                      value={localConfig.autoEscalate.consecutiveMessages}
                      onChange={(e) => updateAutoEscalate('consecutiveMessages', parseInt(e.target.value) || 1)}
                      data-testid="input-consecutive-messages"
                    />
                    <p className="text-xs text-muted-foreground">
                      Número de mensagens negativas seguidas antes de escalar
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Visualization */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="visualization" className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Visualização no Histórico
                </Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar indicadores de sentimento no histórico de mensagens
                </p>
              </div>
              <Switch
                id="visualization"
                checked={localConfig.visualizationEnabled}
                onCheckedChange={(visualizationEnabled) => updateConfig({ visualizationEnabled })}
                data-testid="switch-visualization"
              />
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Configuração Ativa</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground pl-6">
                <p>• Análise de sentimento: <strong>Ativada</strong></p>
                <p>• Negativo: abaixo de <strong>{localConfig.thresholds.negative.toFixed(2)}</strong></p>
                <p>• Neutro: de <strong>{localConfig.thresholds.negative.toFixed(2)}</strong> até <strong>{localConfig.thresholds.positive.toFixed(2)}</strong></p>
                <p>• Positivo: acima de <strong>{localConfig.thresholds.positive.toFixed(2)}</strong></p>
                {localConfig.autoEscalate.enabled && (
                  <p>• Escalação automática: <strong>Ativada</strong> (após {localConfig.autoEscalate.consecutiveMessages} mensagens negativas)</p>
                )}
                <p>• Visualização: <strong>{localConfig.visualizationEnabled ? 'Ativada' : 'Desativada'}</strong></p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
