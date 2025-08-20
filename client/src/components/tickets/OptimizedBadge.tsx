import React, { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useFieldColors } from "@/hooks/useFieldColors";
import { cn } from "@/lib/utils";
// import { useLocalization } from '@/hooks/useLocalization';

interface OptimizedBadgeProps {
  fieldName: string;
  value: string;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  showLoading?: boolean;
  "aria-label"?: string;
}

// Memoized badge component with optimized rendering
export const OptimizedBadge = memo<OptimizedBadgeProps>(({
  // Localization temporarily disabled
 
  fieldName, 
  value, 
  className = "", 
  variant = "default",
  showLoading = true,
  "aria-label": ariaLabel
}) => {
  const { getFieldColor, getFieldLabel, isLoading, isReady } = useFieldColors();

  // Memoize color and label computation
  const { color, label, displayValue } = useMemo(() => {
    if (!value || !isReady) {
      return { color: undefined, label: value, displayValue: value };
    }

    const computedColor = getFieldColor(fieldName, value);
    const computedLabel = getFieldLabel(fieldName, value);
    
    return {
      color: computedColor,
      label: computedLabel || value,
      displayValue: computedLabel || value
    };
  }, [fieldName, value, getFieldColor, getFieldLabel, isReady]);

  // Show loading state while colors are being fetched
  if (isLoading && showLoading) {
    return (
      <Badge 
        variant="outline" 
        className={cn("inline-flex items-center gap-1", className)}
        aria-label={ariaLabel || '[TRANSLATION_NEEDED]'}
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        <span className="sr-only">Carregando...</span>
        <span>{value}</span>
      </Badge>
    );
  }

  // Main badge with computed styles
  const badgeStyle = useMemo(() => {
    if (!color || color === '#6b7280') return {};
    
    return {
      backgroundColor: color,
      borderColor: color,
      color: getContrastColor(color),
    };
  }, [color]);

  return (
    <Badge
      variant={color ? "default" : variant}
      className={cn("transition-all duration-200", className)}
      style={badgeStyle}
      aria-label={ariaLabel || "
      title={displayValue}
    >
      {displayValue}
    </Badge>
  );
});

OptimizedBadge.displayName = "OptimizedBadge";

// Helper function to determine text color based on background
function getContrastColor(hexColor: string): string {
  if (!hexColor) return '#000000';
  
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, black for light colors
  return luminance > 0.6 ? '#000000' : '#ffffff';
}

// Batch badge component for multiple badges
export const BatchBadges = memo<{
  badges: Array<{ fieldName: string; value: string; className?: string; ariaLabel?: string }>;
  className?: string;
}>(({ badges, className = "" }) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label="Tags do ticket>
      {badges.map(({ fieldName, value, className: badgeClassName, ariaLabel }, index) => (
        <OptimizedBadge
          key={"
          fieldName={fieldName}
          value={value}
          className={badgeClassName}
          aria-label={ariaLabel}
        />
      ))}
    </div>
  );
});

BatchBadges.displayName = "BatchBadges";