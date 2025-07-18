import { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: ReactNode;
  gradientClass: string;
}

export function MetricCard({ title, value, change, icon, gradientClass }: MetricCardProps) {
  return (
    <Card className="metric-card cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${gradientClass} rounded-lg flex items-center justify-center`}>
              {icon}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
              {change && (
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change.type === "increase" ? "text-green-600" : "text-red-600"
                }`}>
                  {change.type === "increase" ? (
                    <ArrowUp className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(change.value)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
