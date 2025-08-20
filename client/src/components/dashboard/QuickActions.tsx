import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, FileText, Settings } from "lucide-react";
import { useLocalization } from '@/hooks/useLocalization';

const quickActions = [
  {
    id: "create-ticket",
    label: {t('dashboard.createTicket')}, 
    icon: Plus,
  },
  {
    id: "add-customer",
    label: "Add Customer",
    icon: UserPlus,
  },
  {
    id: "generate-report", 
    label: "Generate Report",
    icon: FileText,
  },
  {
    id: "automation",
    label: "Automation",
    icon: Settings,
  },
];

export function QuickActions() {
  const { t } = useLocalization();

  const handleQuickAction = (actionId: string) => {
    console.log(`Quick action: ${actionId}`);
    // TODO: Implement quick action handlers
  };

  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="hover-gradient flex flex-col items-center p-4 h-auto text-center transition-all duration-300"
              onClick={() => handleQuickAction(action.id)}
            >
              <action.icon className="h-5 w-5 mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
