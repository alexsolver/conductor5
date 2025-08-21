import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, FileText, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

// Actions will be translated dynamically in component

export function QuickActions() {
  const { t } = useTranslation();
  
  const quickActions = [
    {
      id: "create-ticket",
      label: t('quickActions.createTicket'), 
      icon: Plus,
    },
    {
      id: "add-customer",
      label: t('quickActions.addCustomer'),
      icon: UserPlus,
    },
    {
      id: "generate-report", 
      label: t('quickActions.generateReport'),
      icon: FileText,
    },
    {
      id: "automation",
      label: t('quickActions.automation'),
      icon: Settings,
    },
  ];

  const handleQuickAction = (actionId: string) => {
    console.log(`Quick action: ${actionId}`);
    // TODO: Implement quick action handlers
  };

  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle>{t('quickActions.title')}</CardTitle>
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
