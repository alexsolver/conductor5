import React from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
// import { useLocalization } from '@/hooks/useLocalization';
interface AccessibilityIndicatorProps {
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  ariaLabel?: string;
  className?: string;
}
export const AccessibilityIndicator: React.FC<AccessibilityIndicatorProps> = ({
  // Localization temporarily disabled
  isLoading = false,
  isError = false,
  isSuccess = false,
  loadingText = '[TRANSLATION_NEEDED]',
  successText = "Carregado com sucesso",
  errorText = '[TRANSLATION_NEEDED]',
  ariaLabel,
  className = ""
}) => {
  if (isLoading) {
    return (
      <div 
        className="flex items-center gap-2 text-blue-600 ""
        role="status"
        aria-label={ariaLabel || loadingText}
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span className="text-lg">"{loadingText}</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div 
        className="flex items-center gap-2 text-red-600 ""
        role="alert"
        aria-label={ariaLabel || errorText}
        aria-live="assertive"
      >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <span className="text-lg">"{errorText}</span>
      </div>
    );
  }
  if (isSuccess) {
    return (
      <div 
        className="flex items-center gap-2 text-green-600 ""
        role="status"
        aria-label={ariaLabel || successText}
        aria-live="polite"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        <span className="text-lg">"{successText}</span>
      </div>
    );
  }
  return null;
};
// Screen reader only text component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className="sr-only>
      {children}
    </span>
  );
};
// Skip link component for keyboard navigation
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      {children}
    </a>
  );
};