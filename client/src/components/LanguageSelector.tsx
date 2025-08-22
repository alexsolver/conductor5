/**
 * Language Selector Component
 * Multi-language interface with elegant design
 */

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supportedLanguages } from '@/i18n';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showFlag?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'default',
  showFlag = true,
  className = ''
}: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Save to localStorage for persistence
    localStorage.setItem('preferred-language', languageCode);
  };

  // Get current language from multiple sources
  const getCurrentLanguage = () => {
    const storedLang = localStorage.getItem('preferred-language') || 
                      localStorage.getItem('conductor-language') || 
                      localStorage.getItem('i18nextLng');
    
    return storedLang || i18n.language || 'pt-BR';
  };

  const currentLanguageCode = getCurrentLanguage();
  const currentLanguage = supportedLanguages.find(
    lang => lang.code === currentLanguageCode
  ) || supportedLanguages.find(lang => lang.code === 'pt-BR') || supportedLanguages[0];

  if (variant === 'icon-only') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Select value={currentLanguageCode} onValueChange={handleLanguageChange}>
              <SelectTrigger className={`w-10 h-10 border-0 bg-transparent hover:bg-muted ${className}`}>
                <Globe className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent align="end">
                {supportedLanguages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      {showFlag && <span className="text-lg">{language.flag}</span>}
                      <span>{language.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change Language</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <Select value={currentLanguageCode} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`w-16 h-8 text-xs ${className}`}>
          <SelectValue>
            {showFlag ? currentLanguage.flag : currentLanguage.code.toUpperCase()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {supportedLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                {showFlag && <span>{language.flag}</span>}
                <span className="text-xs">{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={currentLanguageCode} onValueChange={handleLanguageChange}>
      <SelectTrigger className={`w-48 ${className}`}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue>
            <div className="flex items-center gap-2">
              {showFlag && <span>{currentLanguage.flag}</span>}
              <span>{currentLanguage.name}</span>
            </div>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-2">
              {showFlag && <span className="text-lg">{language.flag}</span>}
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}