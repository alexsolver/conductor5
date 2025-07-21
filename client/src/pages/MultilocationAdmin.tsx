/**
 * Multilocation Administration Page
 * Página de administração para configurações multilocation
 * Integração com SaaS Admin hierarchy
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Globe2, MapPin, DollarSign, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Market {
  marketCode: string;
  countryCode: string;
  languageCode: string;
  currencyCode: string;
  displayConfig?: any;
  validationRules?: any;
  legalFields?: any;
  isActive: boolean;
}

interface MarketConfig {
  marketCode: string;
  config: {
    countryCode: string;
    languageCode: string;
    currencyCode: string;
    displayConfig: any;
    validationRules: any;
    legalFields: any;
  };
}

export default function MultilocationAdmin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMarket, setSelectedMarket] = useState<string>('BR');
  const [testAmount, setTestAmount] = useState<number>(100);
  const [testFromCurrency, setTestFromCurrency] = useState<string>('USD');
  const [testToCurrency, setTestToCurrency] = useState<string>('BRL');

  // Fetch available markets
  const { data: marketsData, isLoading: marketsLoading } = useQuery({
    queryKey: ['/api/multilocation/markets'],
    select: (data: any) => data as { markets: Market[], defaultMarket: string }
  });

  // Fetch market configuration
  const { data: marketConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/multilocation/config', selectedMarket],
    enabled: !!selectedMarket,
    select: (data: any) => data as MarketConfig
  });

  // Currency conversion mutation
  const currencyConversionMutation = useMutation({
    mutationFn: async (data: { amount: number, from: string, to: string }) => {
      const response = await apiRequest('POST', '/api/geolocation/convert-currency', data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Conversão realizada",
        description: `${data.originalAmount} ${data.originalCurrency} = ${data.formattedAmount}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na conversão",
        description: error.message || "Falha ao converter moeda",
        variant: "destructive"
      });
    }
  });

  const handleCurrencyTest = () => {
    currencyConversionMutation.mutate({
      amount: testAmount,
      from: testFromCurrency,
      to: testToCurrency
    });
  };

  if (marketsLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const markets = marketsData?.markets || [];
  const defaultMarket = marketsData?.defaultMarket || 'BR';

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe2 className="w-6 h-6" />
            Configurações Multilocalização
          </h1>
          <p className="text-muted-foreground">
            Gerencie configurações de mercado e moedas internacionais
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Sistema Ativo
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="markets">Mercados</TabsTrigger>
          <TabsTrigger value="currency">Conversão</TabsTrigger>
          <TabsTrigger value="validation">Validação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mercados Ativos</CardTitle>
                <Globe2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{markets.filter(m => m.isActive).length}</div>
                <p className="text-xs text-muted-foreground">
                  de {markets.length} mercados configurados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mercado Padrão</CardTitle>
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{defaultMarket}</div>
                <p className="text-xs text-muted-foreground">
                  Configuração padrão do sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moedas Suportadas</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {[...new Set(markets.map(m => m.currencyCode))].length}
                </div>
                <p className="text-xs text-muted-foreground">
                  BRL, USD, EUR disponíveis
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Mercados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {markets.map((market) => (
                  <div key={market.marketCode} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${market.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium">{market.marketCode}</p>
                        <p className="text-sm text-muted-foreground">
                          {market.languageCode} • {market.currencyCode}
                        </p>
                      </div>
                    </div>
                    <Badge variant={market.isActive ? "default" : "secondary"}>
                      {market.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Mercado</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione um mercado para visualizar suas configurações
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="market-select">Mercado</Label>
                    <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um mercado" />
                      </SelectTrigger>
                      <SelectContent>
                        {markets.map((market) => (
                          <SelectItem key={market.marketCode} value={market.marketCode}>
                            {market.marketCode} - {market.currencyCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {marketConfig && !configLoading && (
                    <div className="space-y-3">
                      <Separator />
                      <h4 className="font-medium">Informações do Mercado</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Código do País:</span>
                          <span className="font-mono">{marketConfig.config.countryCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Idioma:</span>
                          <span className="font-mono">{marketConfig.config.languageCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Moeda:</span>
                          <span className="font-mono">{marketConfig.config.currencyCode}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {marketConfig && marketConfig.config.displayConfig && (
                    <div>
                      <h4 className="font-medium mb-2">Formato de Exibição</h4>
                      <div className="space-y-2 text-sm p-3 bg-gray-50 rounded">
                        <div className="flex justify-between">
                          <span>Data:</span>
                          <span className="font-mono">{marketConfig.config.displayConfig.dateFormat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Número:</span>
                          <span className="font-mono">{marketConfig.config.displayConfig.numberFormat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Exemplo:</span>
                          <span>
                            {(1234.56).toLocaleString(marketConfig.config.displayConfig.numberFormat, {
                              style: 'currency',
                              currency: marketConfig.config.currencyCode
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Conversão de Moeda</CardTitle>
              <p className="text-sm text-muted-foreground">
                Teste a conversão de moedas em tempo real
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(Number(e.target.value))}
                      placeholder="100.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from-currency">De</Label>
                      <Select value={testFromCurrency} onValueChange={setTestFromCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="BRL">BRL</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="to-currency">Para</Label>
                      <Select value={testToCurrency} onValueChange={setTestToCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="BRL">BRL</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCurrencyTest}
                    disabled={currencyConversionMutation.isPending}
                    className="w-full"
                  >
                    {currencyConversionMutation.isPending ? "Convertendo..." : "Converter"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Resultado da Conversão</h4>
                  {currencyConversionMutation.data && (
                    <div className="p-4 border rounded-lg bg-green-50">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Valor Original:</span>
                          <span className="font-mono">
                            {currencyConversionMutation.data.originalAmount} {currencyConversionMutation.data.originalCurrency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa de Câmbio:</span>
                          <span className="font-mono">{currencyConversionMutation.data.exchangeRate}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Valor Convertido:</span>
                          <span className="text-green-600">{currencyConversionMutation.data.formattedAmount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currencyConversionMutation.isError && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Erro na conversão. Verifique se as taxas de câmbio estão disponíveis.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Validação por Mercado</CardTitle>
            </CardHeader>
            <CardContent>
              {marketConfig && marketConfig.config.validationRules && (
                <div className="space-y-4">
                  <h4 className="font-medium">Mercado: {selectedMarket}</h4>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(marketConfig.config.validationRules, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {marketConfig && marketConfig.config.legalFields && (
                <div className="space-y-4">
                  <h4 className="font-medium">Campos Legais</h4>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(marketConfig.config.legalFields, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}