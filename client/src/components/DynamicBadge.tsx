/**
 * DynamicBadge - Dynamic badge component with configurable colors
 * Uses style configurations from backend for consistent theming
 */

import { Badge } from "@/components/ui/badge";
import { useTicketMetadataSimple } from "@/hooks/useTicketMetadata.simple";
import { cn } from "@/lib/utils";

interface DynamicBadgeProps {
  fieldName: string;
  value: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function DynamicBadge({ 
  fieldName, 
  value, 
  children, 
  className,
  variant = "secondary"
}: DynamicBadgeProps) {
  const { getFieldOption } = useTicketMetadataSimple();
  
  const option = getFieldOption(fieldName, value);
  const dynamicStyles = option ? `${option.bgColor} ${option.textColor}` : "";
  
  return (
    <Badge 
      variant={variant}
      className={cn(
        dynamicStyles,
        "font-medium px-2 py-1",
        className
      )}
    >
      {children}
    </Badge>
  );
}