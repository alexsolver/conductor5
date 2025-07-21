// GLOBAL GEOLOCATION MANAGEMENT COMPONENT
// Automatic IP-based location detection and market configuration
// International currency conversion and display formatting

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe2, 
  MapPin, 
  DollarSign, 
  Clock, 
  Calendar,
  Languages,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DetectedLocation {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  timezone?: string;
  currency?: string;
  marketCode?: string;
  confidence: number;
}

interface MarketConfiguration {
  marketCode: string;
  countryCode: string;
  languageCode: string;
  currencyCode: string;
  displayConfig: {
    dateFormat: string;
    timeFormat: string;
    numberFormat: string;
    addressFormat: string;
    nameOrder: string;
  };
  validationRules: Record<string, any>;
  legalFields: Record<string, any>;
}

interface CurrencyConversion {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  formattedAmount: string;
}

export function GlobalGeolocation() {
  const [currentLocation, setCurrentLocation] = useState<DetectedLocation | null>(null);
  const [marketConfig, setMarketConfig] = useState<MarketConfiguration | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current location detection
  const { data: locationData, isLoading: locationLoading } = useQuery({
    queryKey: ['/api/geolocation/detect'],
    enabled: false // Manual trigger only
  });

  // Fetch market configuration
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['/api/geolocation/config'],
    enabled: !!currentLocation?.marketCode
  });

  // Currency conversion test
  const { data: conversionData, isLoading: conversionLoading } = useQuery({
    queryKey: ['/api/geolocation/convert-currency'],
    enabled: false // Manual trigger only
  });

  // Detection mutation
  const detectLocationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/geolocation/detect');
      return response;
    },
    onSuccess: (data) => {
      setCurrentLocation(data.location);
      setMarketConfig(data.marketConfig);
      queryClient.invalidateQueries({ queryKey: ['/api/geolocation/config'] });
    }
  });

  // Currency conversion mutation  
  const convertCurrencyMutation = useMutation({
    mutationFn: async (params: { amount: number; from: string; to: string }) => {
      const response = await apiRequest('POST', '/api/geolocation/convert-currency', params);
      return response;
    }
  });

  // Auto-initialize market mutation
  const initializeMarketMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/geolocation/initialize-market');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/multilocation'] });
    }
  });

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      await detectLocationMutation.mutateAsync();
    } finally {
      setIsDetecting(false);
    }
  };

  const handleTestConversion = async () => {
    if (!currentLocation?.currency) return;
    
    await convertCurrencyMutation.mutateAsync({
      amount: 100,
      from: 'USD',
      to: currentLocation.currency
    });
  };

  const handleInitializeMarket = async () => {
    if (!currentLocation) return;
    await initializeMarketMutation.mutateAsync();
  };

  const formatConfidence = (confidence: number) => {
    if (confidence >= 0.8) return { text: 'High', color: 'bg-green-500' };
    if (confidence >= 0.5) return { text: 'Medium', color: 'bg-yellow-500' };
    return { text: 'Low', color: 'bg-red-500' };
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Globe2 className="w-6 h-6" />
            Global Geolocation Management
          </h1>
          <p className="text-muted-foreground">
            Automatic location detection and international market configuration
          </p>
        </div>
        
        <Button 
          onClick={handleDetectLocation} 
          disabled={isDetecting || detectLocationMutation.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
          Detect Location
        </Button>
      </div>

      <Tabs defaultValue="detection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detection">Location Detection</TabsTrigger>
          <TabsTrigger value="market">Market Configuration</TabsTrigger>
          <TabsTrigger value="currency">Currency Conversion</TabsTrigger>
          <TabsTrigger value="formatting">Display Formatting</TabsTrigger>
        </TabsList>

        {/* Location Detection Tab */}
        <TabsContent value="detection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Detected Location
              </CardTitle>
              <CardDescription>
                IP-based geographic detection with confidence scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentLocation ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Country:</span>
                      <span>{currentLocation.country}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Code:</span>
                      <Badge variant="outline">{currentLocation.countryCode}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Market:</span>
                      <Badge variant="secondary">{currentLocation.marketCode}</Badge>
                    </div>
                    {currentLocation.region && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Region:</span>
                        <span>{currentLocation.region}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {currentLocation.city && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">City:</span>
                        <span>{currentLocation.city}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Currency:</span>
                      <Badge variant="outline">{currentLocation.currency}</Badge>
                    </div>
                    {currentLocation.timezone && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Timezone:</span>
                        <span className="text-sm">{currentLocation.timezone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Confidence:</span>
                      <Badge className={formatConfidence(currentLocation.confidence).color}>
                        {formatConfidence(currentLocation.confidence).text}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    No location detected. Click "Detect Location" to identify your geographic position.
                  </AlertDescription>
                </Alert>
              )}

              {detectLocationMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Failed to detect location. Please check your internet connection.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Configuration Tab */}
        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Market Configuration
              </CardTitle>
              <CardDescription>
                Localized validation rules and legal field requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Market Code:</span>
                        <Badge variant="secondary">{marketConfig.marketCode}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Language:</span>
                        <span>{marketConfig.languageCode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Currency:</span>
                        <Badge variant="outline">{marketConfig.currencyCode}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Date Format:</span>
                        <span className="text-sm">{marketConfig.displayConfig.dateFormat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Time Format:</span>
                        <span className="text-sm">{marketConfig.displayConfig.timeFormat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Number Format:</span>
                        <span className="text-sm">{marketConfig.displayConfig.numberFormat}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Legal Fields
                    </h4>
                    <div className="grid gap-2">
                      {Object.entries(marketConfig.legalFields).map(([key, field]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="space-y-1">
                            <span className="font-medium text-sm">{key.toUpperCase()}</span>
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                          </div>
                          <Badge variant={field.required ? "default" : "outline"}>
                            {field.required ? "Required" : "Optional"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleInitializeMarket}
                      disabled={initializeMarketMutation.isPending}
                      className="flex-1"
                    >
                      Initialize Market Config
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    No market configuration available. Detect location first to load market settings.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currency Conversion Tab */}
        <TabsContent value="currency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Currency Conversion
              </CardTitle>
              <CardDescription>
                Real-time exchange rates and automatic currency formatting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestConversion}
                  disabled={!currentLocation?.currency || convertCurrencyMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Test Conversion (USD $100)
                </Button>
              </div>

              {convertCurrencyMutation.data && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Original Amount:</span>
                    <span>${convertCurrencyMutation.data.originalAmount} {convertCurrencyMutation.data.originalCurrency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Converted Amount:</span>
                    <span className="font-semibold">{convertCurrencyMutation.data.formattedAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Exchange Rate:</span>
                    <span className="text-sm">{convertCurrencyMutation.data.exchangeRate}</span>
                  </div>
                </div>
              )}

              {convertCurrencyMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Currency conversion failed. Exchange rate service may be unavailable.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Formatting Tab */}
        <TabsContent value="formatting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Display Formatting
              </CardTitle>
              <CardDescription>
                Regional format examples based on detected location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketConfig && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date & Time
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Date Format:</span>
                          <span className="font-mono">{marketConfig.displayConfig.dateFormat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time Format:</span>
                          <span className="font-mono">{marketConfig.displayConfig.timeFormat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Example Date:</span>
                          <span>{new Date().toLocaleDateString(marketConfig.displayConfig.numberFormat)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Example Time:</span>
                          <span>{new Date().toLocaleTimeString(marketConfig.displayConfig.numberFormat)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Numbers & Currency
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Number Format:</span>
                          <span className="font-mono">{marketConfig.displayConfig.numberFormat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Currency:</span>
                          <span>{marketConfig.currencyCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Example Number:</span>
                          <span>{(1234.56).toLocaleString(marketConfig.displayConfig.numberFormat)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Example Currency:</span>
                          <span>
                            {(1234.56).toLocaleString(marketConfig.displayConfig.numberFormat, {
                              style: 'currency',
                              currency: marketConfig.currencyCode
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    No formatting configuration available. Detect location first to view format examples.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className={`w-3 h-3 rounded-full mx-auto ${currentLocation ? 'bg-green-500' : 'bg-gray-400'}`} />
              <p className="text-sm font-medium">Location Detection</p>
              <p className="text-xs text-muted-foreground">
                {currentLocation ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="space-y-2">
              <div className={`w-3 h-3 rounded-full mx-auto ${marketConfig ? 'bg-green-500' : 'bg-gray-400'}`} />
              <p className="text-sm font-medium">Market Configuration</p>
              <p className="text-xs text-muted-foreground">
                {marketConfig ? 'Configured' : 'Not Set'}
              </p>
            </div>
            <div className="space-y-2">
              <div className={`w-3 h-3 rounded-full mx-auto ${convertCurrencyMutation.data ? 'bg-green-500' : 'bg-gray-400'}`} />
              <p className="text-sm font-medium">Currency Service</p>
              <p className="text-xs text-muted-foreground">
                {convertCurrencyMutation.data ? 'Available' : 'Untested'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}