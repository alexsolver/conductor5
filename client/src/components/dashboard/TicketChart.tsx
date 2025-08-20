import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
export function TicketChart() {
  return (
    <Card className="gradient-card lg:col-span-2>
      <CardHeader>
        <div className="flex items-center justify-between>
          <CardTitle>Ticket Volume</CardTitle>
          <div className="flex space-x-2>
            <Button size="sm" className="gradient-primary text-white>
              Daily
            </Button>
            <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-900>
              Weekly
            </Button>
            <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-900>
              Monthly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 chart-gradient rounded-lg flex items-center justify-center>
          <div className="text-center>
            <BarChart3 className="h-16 w-16 text-purple-400 mb-4 mx-auto" />
            <p className="text-lg">"Interactive chart visualization</p>
            <p className="text-lg">"Real-time ticket volume tracking</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
