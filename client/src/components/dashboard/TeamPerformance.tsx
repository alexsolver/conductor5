import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";

// Mock team data - in real app this would come from API
const teamMembers = [
  {
    id: "1",
    name: "Sarah Adams",
    role: "Senior Agent",
    resolved: 24,
    performance: 85,
    initials: "SA",
    gradientClass: "gradient-primary",
  },
  {
    id: "2", 
    name: "Mike Johnson",
    role: "Agent",
    resolved: 18,
    performance: 72,
    initials: "MJ",
    gradientClass: "gradient-success",
  },
  {
    id: "3",
    name: "Emma Martinez", 
    role: "Agent",
    resolved: 21,
    performance: 78,
    initials: "EM",
    gradientClass: "gradient-secondary",
  },
  {
    id: "4",
    name: "David Lee",
    role: "Junior Agent", 
    resolved: 15,
    performance: 65,
    initials: "DL",
    gradientClass: "gradient-warning",
  },
];

export function TeamPerformance() {
  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${member.gradientClass} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-xs font-medium">
                    {member.initials}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.role}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {member.resolved} resolved
                </p>
                <div className="flex items-center space-x-1">
                  <Progress 
                    value={member.performance} 
                    className="w-16 h-2"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {member.performance}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm font-medium gradient-text hover:underline flex items-center">
            View detailed reports
            <ArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
