/**
 * Localization Hook
 * Comprehensive i18n and localization management
 */

import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatRelativeTime, formatCurrency, formatNumber } from '@/utils/dateFormatter';

interface UserPreferences {
  userId: string;
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  createdAt: string;
  updatedAt: string;
}

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  rtl: boolean;
}

interface TimezoneOption {
  code: string;
  name: string;
  offset: string;
  region: string;
}

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  region: string;
}

export function useLocalization() {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch supported languages
  const { data: languages = [], isLoading: isLoadingLanguages } = useQuery<LanguageOption[]>({
    queryKey: ['/api/localization/languages'],
    select: (data: any) => data.languages || [],
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch supported timezones
  const { data: timezones = {} } = useQuery<Record<string, TimezoneOption[]>>({
    queryKey: ['/api/localization/timezones'],
    select: (data: any) => data.timezones || {}
  });

  // Fetch supported currencies
  const { data: currencies = [] } = useQuery<CurrencyOption[]>({
    queryKey: ['/api/localization/currencies'],
    select: (data: any) => data.currencies || []
  });

  // Fetch user preferences
  const { data: userPreferences } = useQuery<UserPreferences>({
    queryKey: ['/api/localization/user-preferences'],
    select: (data: any) => data.preferences,
    retry: false
  });

  // Save user preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await fetch('/api/localization/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/localization/user-preferences'] });
      toast({
        title: t('success.saved'),
        description: 'Localization preferences updated successfully',
      });

      // Update i18n language if changed
      if (data.preferences?.language) {
        i18n.changeLanguage(data.preferences.language);
      }
    },
    onError: (error) => {
      toast({
        title: t('errors.generic'),
        description: 'Failed to save localization preferences',
        variant: 'destructive',
      });
      // Error saving preferences handled by UI
    },
  });

  // Auto-detect locale mutation
  const detectLocaleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/localization/detect', {
        headers: {
          'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to detect locale');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.detected) {
        // Auto-apply detected settings if user hasn't set preferences
        if (!userPreferences) {
          const detectedPrefs = {
            language: data.detected.language,
            timezone: data.detected.timezone,
            currency: data.detected.currency,
            dateFormat: 'short'
          };

          savePreferencesMutation.mutate(detectedPrefs);
        }
      }
    },
  });

  // Change language function
  const changeLanguage = async (languageCode: string) => {
    try {
      console.log('Changing language to:', languageCode);

      // Update localStorage first
      localStorage.setItem('preferred-language', languageCode);
      localStorage.setItem('conductor-language', languageCode);
      localStorage.setItem('i18nextLng', languageCode);

      // Change the language in i18n
      await i18n.changeLanguage(languageCode);

      // Show success message
      toast({
        title: languageCode === 'pt-BR' ? 'Sucesso' : 'Success',
        description: languageCode === 'pt-BR' ? 'Idioma alterado com sucesso!' : 'Language changed successfully!',
      });

      // Force a page reload to ensure all components update with the new language
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: languageCode === 'pt-BR' ? 'Erro' : 'Error',
        description: languageCode === 'pt-BR' ? 'Erro ao alterar idioma. Tente novamente.' : 'Failed to change language. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const changeTimezone = (timezone: string) => {
    savePreferencesMutation.mutate({ timezone });
  };

  const changeCurrency = (currency: string) => {
    savePreferencesMutation.mutate({ currency });
  };

  const formatDateLocalized = (
    date: string | Date,
    format?: string
  ): string => {
    return formatDate(date, {
      timezone: userPreferences?.timezone || 'UTC',
      locale: userPreferences?.language || i18n.language,
      format: format || 'MMM dd, yyyy HH:mm'
    });
  };

  const formatRelativeTimeLocalized = (date: string | Date): string => {
    return formatRelativeTime(date, {
      locale: userPreferences?.language || i18n.language,
      timezone: userPreferences?.timezone || 'UTC'
    });
  };

  const formatCurrencyLocalized = (amount: number, currency?: string): string => {
    const currencyCode = currency || userPreferences?.currency || 'USD';
    const locale = userPreferences?.language || i18n.language;

    // Map language codes to locale codes for currency formatting
    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'pt': 'pt-BR',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };

    return formatCurrency(amount, currencyCode, localeMap[locale] || 'en-US');
  };

  const formatNumberLocalized = (
    number: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    const locale = userPreferences?.language || i18n.language;

    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'pt': 'pt-BR',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };

    return formatNumber(number, localeMap[locale] || 'en-US', options);
  };

  // Get current locale info
  const currentLanguage = languages.find(lang => lang.code === i18n.language);
  const currentTimezone = Object.values(timezones)
    .flat()
    .find(tz => tz.code === (userPreferences?.timezone || 'UTC'));
  const currentCurrency = currencies.find(
    curr => curr.code === (userPreferences?.currency || 'USD')
  );

  return {
    // Translation function
    t,

    // Current state
    currentLanguage: currentLanguage || languages[0],
    currentTimezone: currentTimezone || { code: 'UTC', name: 'UTC', offset: '+00:00', region: 'Global' },
    currentCurrency: currentCurrency || { code: 'USD', name: 'US Dollar', symbol: '$', region: 'North America' },

    // Available options
    languages,
    timezones,
    currencies,

    // User preferences
    userPreferences,

    // Actions
    changeLanguage,
    changeTimezone,
    changeCurrency,
    detectLocale: () => detectLocaleMutation.mutate(),

    // Formatting helpers
    formatDate: formatDateLocalized,
    formatRelativeTime: formatRelativeTimeLocalized,
    formatCurrency: formatCurrencyLocalized,
    formatNumber: formatNumberLocalized,

    // Loading states
    isLoadingPreferences: savePreferencesMutation.isPending,
    isDetectingLocale: detectLocaleMutation.isPending,
  };
}