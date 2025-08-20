import React from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ticket Details
            <Badge variant="outline">#{id}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Ticket Information</h3>
              <p className="text-muted-foreground">
                Viewing details for ticket {id}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge className="ml-2">Open</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Badge variant="secondary" className="ml-2">Medium</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Assigned To</label>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <div className="mt-2 p-4 bg-muted rounded-lg">
                <p className="text-sm">Loading ticket details...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetails;