/**
 * Localization Settings Component
 * Comprehensive settings for language, timezone, and currency
 */

import { useTranslation } from 'react-i18next';
import { Globe, Clock, DollarSign, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLocalization } from '@/hooks/useLocalization';

interface LocalizationSettingsProps {
  variant?: 'full' | 'compact';
  showHeader?: boolean;
  className?: string;
}

export function LocalizationSettings({ 
  variant = 'full', 
  showHeader = true,
  className = '' 
}: LocalizationSettingsProps) {
  const { t, i18n } = useTranslation();
  const {
    currentLanguage,
    currentTimezone,
    currentCurrency,
    languages,
    timezones,
    currencies,
    changeLanguage,
    changeTimezone,
    changeCurrency,
    detectLocale,
    formatDate,
    formatCurrency,
    isLoadingPreferences,
    isDetectingLocale
  } = useLocalization();

  const sampleDate = new Date();
  const sampleAmount = 1234.56;

  if (variant === 'compact') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.language')}
            </Label>
            <Select 
              value={currentLanguage?.code} 
              onValueChange={changeLanguage}
              disabled={isLoadingPreferences}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>{currentLanguage?.flag}</span>
                    <span>{currentLanguage?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span>{language.flag}</span>
                      <span>{language.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('settings.timezone')}
            </Label>
            <Select 
              value={currentTimezone?.code} 
              onValueChange={changeTimezone}
              disabled={isLoadingPreferences}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {currentTimezone?.offset}
                    </span>
                    <span className="truncate">{currentTimezone?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.entries(timezones).map(([region, regionTimezones]) => (
                  <div key={region}>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      {region}
                    </div>
                    {regionTimezones.map((timezone) => (
                      <SelectItem key={timezone.code} value={timezone.code}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {timezone.offset}
                          </Badge>
                          <span>{timezone.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('settings.currency')}
            </Label>
            <Select 
              value={currentCurrency?.code} 
              onValueChange={changeCurrency}
              disabled={isLoadingPreferences}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {currentCurrency?.symbol}
                    </span>
                    <span>{currentCurrency?.code}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm w-6">
                        {currency.symbol}
                      </span>
                      <span>{currency.code}</span>
                      <span className="text-sm text-muted-foreground">
                        {currency.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Auto-detect Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={detectLocale}
            disabled={isDetectingLocale}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            {isDetectingLocale ? 'Detecting...' : 'Auto-detect Location'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('settings.title')} - Localization
          </CardTitle>
          <CardDescription>
            Configure your language, timezone, and regional preferences
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {/* Language Settings */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="language-select" className="text-base font-medium">
              Idioma / Language
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Escolha seu idioma preferido / Choose your preferred language
            </p>
            <Select
              value={i18n.language || 'pt-BR'}
              onValueChange={(value) => {
                console.log('Changing language to:', value);
                changeLanguage(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentLanguage?.flag || '🇧🇷'}</span>
                    <span>{currentLanguage?.name || 'Portuguese (Brazil)'}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{language.flag}</span>
                      <div>
                        <div className="font-medium">{language.name}</div>
                        <div className="text-sm text-muted-foreground">{language.nativeName}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Idioma atual: {currentLanguage?.nativeName || 'Português (Brasil)'}
            </p>
          </div>

          <Separator />

          {/* Timezone Settings */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('settings.timezone')}
            </h4>
            <Select 
              value={currentTimezone?.code} 
              onValueChange={changeTimezone}
              disabled={isLoadingPreferences}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{currentTimezone?.offset}</Badge>
                    <div>
                      <div className="font-medium">{currentTimezone?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Current time: {formatDate(sampleDate, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.entries(timezones).map(([region, regionTimezones]) => (
                  <div key={region}>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50">
                      {region}
                    </div>
                    {regionTimezones.map((timezone) => (
                      <SelectItem key={timezone.code} value={timezone.code}>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            {timezone.offset}
                          </Badge>
                          <div>
                            <div className="font-medium">{timezone.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {timezone.code}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Currency Settings */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('settings.currency')}
            </h4>
            <Select 
              value={currentCurrency?.code} 
              onValueChange={changeCurrency}
              disabled={isLoadingPreferences}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-mono text-sm">
                      {currentCurrency?.symbol}
                    </div>
                    <div>
                      <div className="font-medium">{currentCurrency?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Example: {formatCurrency(sampleAmount)}
                      </div>
                    </div>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-mono text-sm">
                        {currency.symbol}
                      </div>
                      <div>
                        <div className="font-medium">{currency.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {currency.code} • {currency.region}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Preview & Auto-detect */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Preview</h4>
              <div className="p-3 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current time:</span>
                  <span className="font-mono">{formatDate(sampleDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sample amount:</span>
                  <span className="font-mono">{formatCurrency(sampleAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Interface:</span>
                  <span>{currentLanguage?.name}</span>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={detectLocale}
              disabled={isDetectingLocale}
              className="w-full flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              {isDetectingLocale ? 'Detecting Location...' : 'Auto-detect My Location'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}