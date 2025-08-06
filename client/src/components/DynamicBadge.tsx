/**
 * DYNAMIC BADGE COMPONENT - Resolves PROBLEMA 2: VALORES HARD-CODED
 * Adaptive badge component that loads colors and labels dynamically per tenant
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFieldColors } from '@/hooks/useFieldColors';
import { useFieldLabels } from '@/hooks/useFieldLabels';
import { DynamicBadgeProps } from '@shared/dynamic-field-types';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Smart badge component that automatically loads colors and labels based on field configuration
 */
export function DynamicBadge({
  fieldName,
  value,
  size = 'md',
  variant = 'secondary',
  className,
  showLabel = true,
  locale = 'pt-BR',
  companyId
}: DynamicBadgeProps & { companyId?: string }) {
  const { getFieldColor, isLoading: colorsLoading } = useFieldColors({ fieldName, companyId });
  const { getFieldLabel, isLoading: labelsLoading } = useFieldLabels({ fieldName, locale, companyId });

  const isLoading = colorsLoading || labelsLoading;

  // Show skeleton while loading
  if (isLoading) {
    return <Skeleton className={cn("h-6 w-16", className)} />;
  }

  const color = getFieldColor(value);
  const label = showLabel ? getFieldLabel(value) : value;

  // Create dynamic style for color
  const dynamicStyle = color ? {
    backgroundColor: color,
    borderColor: color,
    color: getContrastColor(color)
  } : undefined;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        sizeClasses[size],
        'font-medium',
        className
      )}
      style={dynamicStyle}
    >
      {label}
    </Badge>
  );
}

/**
 * Helper function to determine text color based on background color
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Specialized badge components for common field types
 */
export function StatusBadge({ 
  value, 
  companyId,
  ...props 
}: Omit<DynamicBadgeProps, 'fieldName'> & { companyId?: string }) {
  return <DynamicBadge fieldName="status" value={value} companyId={companyId} {...props} />;
}

export function PriorityBadge({ 
  value, 
  companyId,
  ...props 
}: Omit<DynamicBadgeProps, 'fieldName'> & { companyId?: string }) {
  return <DynamicBadge fieldName="priority" value={value} companyId={companyId} {...props} />;
}

export function CategoryBadge({ 
  value, 
  companyId,
  ...props 
}: Omit<DynamicBadgeProps, 'fieldName'> & { companyId?: string }) {
  return <DynamicBadge fieldName="category" value={value} companyId={companyId} {...props} />;
}

export function ImpactBadge({ 
  value, 
  companyId,
  ...props 
}: Omit<DynamicBadgeProps, 'fieldName'> & { companyId?: string }) {
  return <DynamicBadge fieldName="impact" value={value} companyId={companyId} {...props} />;
}

export function UrgencyBadge({ 
  value, 
  companyId,
  ...props 
}: Omit<DynamicBadgeProps, 'fieldName'> & { companyId?: string }) {
  return <DynamicBadge fieldName="urgency" value={value} companyId={companyId} {...props} />;
}

/**
 * Multi-field badge component for displaying multiple related badges
 */
export function MultiBadge({
  fields,
  companyId,
  className
}: {
  fields: Array<{ fieldName: DynamicBadgeProps['fieldName'], value: string }>;
  companyId?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {fields.map(({ fieldName, value }, index) => (
        <DynamicBadge
          key={`${fieldName}-${value}-${index}`}
          fieldName={fieldName}
          value={value}
          companyId={companyId}
          size="sm"
        />
      ))}
    </div>
  );
}

/**
 * Conditional badge that only renders if value exists
 */
export function ConditionalBadge({
  value,
  ...props
}: DynamicBadgeProps & { companyId?: string }) {
  if (!value || value.trim() === '') {
    return null;
  }
  
  return <DynamicBadge value={value} {...props} />;
}