/**
 * Global Multilocation Settings Component
 * Dynamic localization system for international markets
 * Automatic field adaptation based on geographic location
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe2, Settings, Check, AlertCircle, Plus, Edit3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Market {
  market_code: string;
  country_code: string;
  language_code: string;
  currency_code: string;
  is_active: boolean;
}

interface MarketConfig {
  marketCode: string;
  countryCode: string;
  languageCode: string;
  currencyCode: string;
  legalFields: Record<string, any>;
  validationRules: Record<string, any>;
  displayConfig: Record<string, any>;
}

interface FormConfig {
  formId: string;
  marketCode: string;
  languageCode: string;
  fields: Record<string, FieldLocalization>;
  validationRules: Record<string, any>;
  displayConfig: Record<string, any>;
}

interface FieldLocalization {
  originalField: string;
  localizedLabel: string;
  placeholder: string;
  helpText: string;
  validationPattern?: string;
  required: boolean;
  alias?: string;
}

const AVAILABLE_MARKETS = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', language: 'pt-BR', currency: 'BRL' },
  { code: 'US', name: 'United States', flag: '🇺🇸', language: 'en-US', currency: 'USD' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺', language: 'en-EU', currency: 'EUR' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', language: 'en-GB', currency: 'GBP' },
];

export function MultilocationSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMarket, setSelectedMarket] = useState<string>('BR');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch configured markets
  const { data: markets = [], isLoading: isLoadingMarkets } = useQuery<Market[]>({
    queryKey: ['/api/multilocation/markets'],
    select: (data: any) => data.markets || []
  });

  // Fetch market configuration
  const { data: marketConfig, isLoading: isLoadingConfig } = useQuery<MarketConfig>({
    queryKey: ['/api/multilocation/config', selectedMarket],
    enabled: !!selectedMarket,
    select: (data: any) => data.config
  });

  // Fetch form configuration for favorecidos
  const { data: formConfig, isLoading: isLoadingForm } = useQuery<FormConfig>({
    queryKey: ['/api/multilocation/form-config/favorecidos_form'],
    queryFn: () => fetch(`/api/multilocation/form-config/favorecidos_form?marketCode=${selectedMarket}&languageCode=pt-BR`).then(res => res.json()).then(data => data.formConfig)
  });

  // Initialize market configuration
  const initializeMarketMutation = useMutation({
    mutationFn: async (marketCode: string) => {
      const response = await fetch('/api/multilocation/initialize-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketCode })
      });
      if (!response.ok) throw new Error('Failed to initialize market');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/multilocation/markets'] });
      toast({
        title: t('success'),
        description: 'Market configuration initialized successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleInitializeMarket = (marketCode: string) => {
    initializeMarketMutation.mutate(marketCode);
  };

  const getMarketInfo = (code: string) => {
    return AVAILABLE_MARKETS.find(m => m.code === code);
  };

  const configuredMarketCodes = markets.map(m => m.market_code);
  const availableMarkets = AVAILABLE_MARKETS.filter(m => !configuredMarketCodes.includes(m.code));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe2 className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Multilocation Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Estratégia híbrida: Nomenclatura brasileira + Aliases internacionais
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Estratégia de Localização</AlertTitle>
        <AlertDescription>
          O sistema mantém a nomenclatura brasileira (CPF, CNPJ, RG) para compliance legal, 
          adicionando aliases internacionais (tax_id, business_tax_id, national_id) para mercados globais.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="forms">Form Config</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5" />
                  Configured Markets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingMarkets ? (
                  <div className="text-sm text-muted-foreground">Loading markets...</div>
                ) : markets.length > 0 ? (
                  markets.map((market) => {
                    const marketInfo = getMarketInfo(market.market_code);
                    return (
                      <div key={market.market_code} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{marketInfo?.flag}</span>
                          <div>
                            <div className="font-medium">{marketInfo?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {market.language_code} • {market.currency_code}
                            </div>
                          </div>
                        </div>
                        <Badge variant={market.is_active ? "default" : "secondary"}>
                          {market.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">No markets configured</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Market
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableMarkets.length > 0 ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Available markets to configure:
                    </div>
                    <div className="space-y-2">
                      {availableMarkets.map((market) => (
                        <div key={market.code} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <span>{market.flag}</span>
                            <span className="text-sm font-medium">{market.name}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleInitializeMarket(market.code)}
                            disabled={initializeMarketMutation.isPending}
                          >
                            Initialize
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    All available markets have been configured
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="markets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Configuration</CardTitle>
              <CardDescription>
                Configure market-specific settings and legal field mappings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Label>Select Market:</Label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {markets.map((market) => {
                      const marketInfo = getMarketInfo(market.market_code);
                      return (
                        <SelectItem key={market.market_code} value={market.market_code}>
                          <div className="flex items-center gap-2">
                            <span>{marketInfo?.flag}</span>
                            <span>{marketInfo?.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {marketConfig && (
                <div className="space-y-4">
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Country Code</Label>
                      <Input value={marketConfig.countryCode} readOnly />
                    </div>
                    <div>
                      <Label>Language Code</Label>
                      <Input value={marketConfig.languageCode} readOnly />
                    </div>
                    <div>
                      <Label>Currency Code</Label>
                      <Input value={marketConfig.currencyCode} readOnly />
                    </div>
                  </div>

                  {marketConfig.legalFields && Object.keys(marketConfig.legalFields).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">Legal Field Mappings</h4>
                        <div className="space-y-2">
                          {Object.entries(marketConfig.legalFields).map(([field, config]: [string, any]) => (
                            <div key={field} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{field.toUpperCase()}</div>
                                  <div className="text-sm text-muted-foreground">{config.description}</div>
                                </div>
                                <Badge variant="outline">{config.alias}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Configuration - Favorecidos</CardTitle>
              <CardDescription>
                Configuração de campos para o formulário de favorecidos por mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formConfig && formConfig.fields ? (
                <div className="space-y-4">
                  {Object.entries(formConfig.fields).map(([fieldKey, field]: [string, FieldLocalization]) => (
                    <div key={fieldKey} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Field Name</Label>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.originalField}</span>
                            {field.alias && (
                              <Badge variant="outline">
                                alias: {field.alias}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label>Label</Label>
                          <div className="font-medium">{field.localizedLabel}</div>
                        </div>
                        <div>
                          <Label>Placeholder</Label>
                          <div className="text-sm text-muted-foreground">{field.placeholder}</div>
                        </div>
                        <div>
                          <Label>Required</Label>
                          <Badge variant={field.required ? "default" : "secondary"}>
                            {field.required ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {field.helpText && (
                          <div className="md:col-span-2">
                            <Label>Help Text</Label>
                            <div className="text-sm text-muted-foreground">{field.helpText}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {isLoadingForm ? 'Loading form configuration...' : 'No form configuration found'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>
                Regras de validação específicas por mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marketConfig?.validationRules ? (
                <div className="space-y-4">
                  {Object.entries(marketConfig.validationRules).map(([field, rules]: [string, any]) => (
                    <div key={field} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{field.toUpperCase()}</h4>
                      {rules.pattern && (
                        <div className="mb-2">
                          <Label>Pattern</Label>
                          <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            {typeof rules.pattern === 'object' ? JSON.stringify(rules.pattern, null, 2) : rules.pattern}
                          </div>
                        </div>
                      )}
                      {rules.required_for && rules.required_for.length > 0 && (
                        <div className="mb-2">
                          <Label>Required for Markets</Label>
                          <div className="flex gap-1">
                            {rules.required_for.map((market: string) => (
                              <Badge key={market} variant="default">{market}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {rules.forbidden_for && rules.forbidden_for.length > 0 && (
                        <div>
                          <Label>Forbidden for Markets</Label>
                          <div className="flex gap-1">
                            {rules.forbidden_for.map((market: string) => (
                              <Badge key={market} variant="destructive">{market}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No validation rules configured</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MultilocationSettings;