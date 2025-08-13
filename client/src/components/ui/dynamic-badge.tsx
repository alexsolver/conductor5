import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DynamicBadgeProps extends React.ComponentProps<typeof Badge> {
  fieldName: string;
  value?: string | null;
  children: React.ReactNode;
}

export const DynamicBadge = React.forwardRef<
  React.ElementRef<typeof Badge>,
  DynamicBadgeProps
>(({ className, fieldName, value, children, ...props }, ref) => {
  // Define color variants based on field type and value
  const getVariant = () => {
    if (!value) return "outline";
    
    switch (fieldName) {
      case "status":
        switch (value.toLowerCase()) {
          case "open":
          case "aberto":
            return "default";
          case "in progress":
          case "em andamento":
            return "secondary";
          case "resolved":
          case "resolvido":
            return "outline";
          case "closed":
          case "fechado":
            return "destructive";
          default:
            return "outline";
        }
      case "priority":
        switch (value.toLowerCase()) {
          case "low":
          case "baixa":
            return "outline";
          case "medium":
          case "média":
            return "secondary";
          case "high":
          case "alta":
            return "default";
          case "urgent":
          case "urgente":
            return "destructive";
          default:
            return "outline";
        }
      case "category":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Badge
      ref={ref}
      variant={getVariant()}
      className={cn(className)}
      {...props}
    >
      {children}
    </Badge>
  );
});

DynamicBadge.displayName = "DynamicBadge";