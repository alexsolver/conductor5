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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seleção e Visualização de Mercado */}
            <Card>
              <CardHeader>
                <CardTitle>Mercado Selecionado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Selecione um mercado para visualizar e editar suas configurações
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium">Informações Básicas</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">País:</span>
                          <p className="font-mono">{marketConfig.config.countryCode}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Idioma:</span>
                          <p className="font-mono">{marketConfig.config.languageCode}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Moeda:</span>
                          <p className="font-mono">{marketConfig.config.currencyCode}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={markets.find(m => m.marketCode === selectedMarket)?.isActive ? "default" : "secondary"}>
                            {markets.find(m => m.marketCode === selectedMarket)?.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Formulário de Configuração */}
            <Card>
              <CardHeader>
                <CardTitle>Configurar Mercado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure as opções do mercado selecionado
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketConfig && !configLoading ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country-code">Código do País</Label>
                        <Input 
                          id="country-code" 
                          value={marketConfig.config.countryCode} 
                          placeholder="BR, US, GB..."
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="language-code">Código do Idioma</Label>
                        <Input 
                          id="language-code" 
                          value={marketConfig.config.languageCode} 
                          placeholder="pt-BR, en-US..."
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="currency-code">Código da Moeda</Label>
                      <Select value={marketConfig.config.currencyCode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                          <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - Libra Esterlina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="market-status">Status do Mercado</Label>
                      <Select value={markets.find(m => m.marketCode === selectedMarket)?.isActive ? "active" : "inactive"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Formato de Data</h4>
                      <Select value={marketConfig.config.displayConfig?.dateFormat || "dd/MM/yyyy"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/MM/yyyy">DD/MM/AAAA (Brasileiro)</SelectItem>
                          <SelectItem value="MM/dd/yyyy">MM/DD/AAAA (Americano)</SelectItem>
                          <SelectItem value="yyyy-MM-dd">AAAA-MM-DD (ISO)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Formato de Número</h4>
                      <Select value={marketConfig.config.displayConfig?.numberFormat || "pt-BR"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">1.234,56 (Brasileiro)</SelectItem>
                          <SelectItem value="en-US">1,234.56 (Americano)</SelectItem>
                          <SelectItem value="en-GB">1,234.56 (Britânico)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1">
                        Salvar Configurações
                      </Button>
                      <Button variant="outline">
                        Restaurar Padrão
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecione um mercado para configurar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Criar Novo Mercado */}
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Mercado</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure um novo mercado internacional
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="new-market-code">Código do Mercado</Label>
                  <Input id="new-market-code" placeholder="CA, AU, JP..." maxLength={2} />
                </div>
                <div>
                  <Label htmlFor="new-country-code">País</Label>
                  <Input id="new-country-code" placeholder="CA, AU, JP..." maxLength={2} />
                </div>
                <div>
                  <Label htmlFor="new-language-code">Idioma</Label>
                  <Input id="new-language-code" placeholder="en-CA, en-AU, ja-JP..." />
                </div>
                <div>
                  <Label htmlFor="new-currency-code">Moeda</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD - Dólar Canadense</SelectItem>
                      <SelectItem value="AUD">AUD - Dólar Australiano</SelectItem>
                      <SelectItem value="JPY">JPY - Iene Japonês</SelectItem>
                      <SelectItem value="CHF">CHF - Franco Suíço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button>
                  Criar Mercado
                </Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuração de Campos Legais */}
            <Card>
              <CardHeader>
                <CardTitle>Campos Legais por Mercado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure campos específicos para compliance legal
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mercado: {selectedMarket}</Label>
                </div>

                {selectedMarket === 'BR' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cpf-validation">Validação CPF</Label>
                      <Select defaultValue="required">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Obrigatório</SelectItem>
                          <SelectItem value="optional">Opcional</SelectItem>
                          <SelectItem value="disabled">Desabilitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cnpj-validation">Validação CNPJ</Label>
                      <Select defaultValue="required">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Obrigatório</SelectItem>
                          <SelectItem value="optional">Opcional</SelectItem>
                          <SelectItem value="disabled">Desabilitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="rg-validation">Validação RG</Label>
                      <Select defaultValue="optional">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Obrigatório</SelectItem>
                          <SelectItem value="optional">Opcional</SelectItem>
                          <SelectItem value="disabled">Desabilitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedMarket === 'US' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ssn-validation">Validação SSN</Label>
                      <Select defaultValue="required">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Obrigatório</SelectItem>
                          <SelectItem value="optional">Opcional</SelectItem>
                          <SelectItem value="disabled">Desabilitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ein-validation">Validação EIN</Label>
                      <Select defaultValue="optional">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Obrigatório</SelectItem>
                          <SelectItem value="optional">Opcional</SelectItem>
                          <SelectItem value="disabled">Desabilitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedMarket === 'EU' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="vat-validation">Validação VAT</Label>
                      <Select defaultValue="required">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Obrigatório</SelectItem>
                          <SelectItem value="optional">Opcional</SelectItem>
                          <SelectItem value="disabled">Desabilitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="nif-validation">Validação NIF</Label>
                      <Select defaultValue="optional">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Obrigatório</SelectItem>
                          <SelectItem value="optional">Opcional</SelectItem>
                          <SelectItem value="disabled">Desabilitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    Salvar Validações
                  </Button>
                  <Button variant="outline">
                    Testar Regras
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configuração de Aliases de Campos */}
            <Card>
              <CardHeader>
                <CardTitle>Aliases de Campos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure mapeamentos de campos entre mercados
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Mapeamentos para {selectedMarket}</Label>
                  
                  {selectedMarket === 'BR' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-sm">CPF →</span>
                        <Input defaultValue="tax_id" placeholder="Campo internacional" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-sm">CNPJ →</span>
                        <Input defaultValue="business_tax_id" placeholder="Campo internacional" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-sm">RG →</span>
                        <Input defaultValue="national_id" placeholder="Campo internacional" />
                      </div>
                    </div>
                  )}

                  {selectedMarket === 'US' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-sm">SSN →</span>
                        <Input defaultValue="tax_id" placeholder="Campo internacional" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-sm">EIN →</span>
                        <Input defaultValue="business_tax_id" placeholder="Campo internacional" />
                      </div>
                    </div>
                  )}

                  {selectedMarket === 'EU' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-sm">VAT →</span>
                        <Input defaultValue="tax_id" placeholder="Campo internacional" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-sm">NIF →</span>
                        <Input defaultValue="national_id" placeholder="Campo internacional" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    Salvar Aliases
                  </Button>
                  <Button variant="outline">
                    Adicionar Campo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teste de Validação */}
          <Card>
            <CardHeader>
              <CardTitle>Teste de Validação</CardTitle>
              <p className="text-sm text-muted-foreground">
                Teste as regras de validação configuradas
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="test-field">Campo para Teste</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um campo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMarket === 'BR' && (
                        <>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="rg">RG</SelectItem>
                        </>
                      )}
                      {selectedMarket === 'US' && (
                        <>
                          <SelectItem value="ssn">SSN</SelectItem>
                          <SelectItem value="ein">EIN</SelectItem>
                        </>
                      )}
                      {selectedMarket === 'EU' && (
                        <>
                          <SelectItem value="vat">VAT</SelectItem>
                          <SelectItem value="nif">NIF</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="test-value">Valor para Teste</Label>
                  <Input 
                    id="test-value" 
                    placeholder={
                      selectedMarket === 'BR' ? "000.000.000-00" :
                      selectedMarket === 'US' ? "123-45-6789" :
                      "GB123456789"
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button className="w-full">
                    Validar
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-4 border rounded-lg bg-green-50 hidden" id="validation-result">
                <p className="text-sm text-green-600">
                  ✓ Validação passou para o campo selecionado
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}