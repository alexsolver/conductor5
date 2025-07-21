import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, XCircle, Database, RefreshCw, PlayCircle, Shield } from 'lucide-react';

interface SchemaIssue {
  issue: string;
  description: string;
  impact: string;
  resolution: string;
}

interface SchemaStatus {
  dryRun: boolean;
  timestamp: string;
  schemasAnalyzed: number;
  results: Array<{
    schemaName: string;
    currentlyValid: boolean;
    plannedChanges: string[];
    currentReport: any;
  }>;
}

interface ConsolidationResult {
  success: boolean;
  message: string;
  data: any;
}

export default function SchemaConsolidation() {
  const [isConsolidating, setIsConsolidating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schema issues
  const { data: issues, isLoading: issuesLoading } = useQuery<{ data: { identifiedInconsistencies: SchemaIssue[]; totalIssues: number; severityBreakdown: any } }>({
    queryKey: ['/api/schema-consolidation/issues'],
  });

  // Fetch current schema status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{ data: SchemaStatus }>({
    queryKey: ['/api/schema-consolidation/status'],
  });

  // Run consolidation for all tenants
  const consolidationMutation = useMutation({
    mutationFn: () => apiRequest('/api/schema-consolidation/run', { method: 'POST' }),
    onSuccess: (data: ConsolidationResult) => {
      toast({
        title: "Schema Consolidation Completed",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schema-consolidation/status'] });
      setIsConsolidating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Schema Consolidation Failed",
        description: error.message || "An error occurred during consolidation",
        variant: "destructive",
      });
      setIsConsolidating(false);
    },
  });

  // Create backup
  const backupMutation = useMutation({
    mutationFn: () => apiRequest('/api/schema-consolidation/backup-schemas', { method: 'POST' }),
    onSuccess: (data: ConsolidationResult) => {
      toast({
        title: "Schema Backup Created",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to create schema backup",
        variant: "destructive",
      });
    },
  });

  const handleConsolidation = async () => {
    setIsConsolidating(true);
    
    // First create backup
    try {
      await backupMutation.mutateAsync();
      // Then run consolidation
      await consolidationMutation.mutateAsync();
    } catch (error) {
      setIsConsolidating(false);
    }
  };

  const getSeverityBadge = (impact: string) => {
    if (impact.includes('High')) {
      return <Badge variant="destructive">High Impact</Badge>;
    } else if (impact.includes('Medium')) {
      return <Badge variant="secondary">Medium Impact</Badge>;
    }
    return <Badge variant="outline">Low Impact</Badge>;
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  if (issuesLoading || statusLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schema Consolidation</h1>
          <p className="text-muted-foreground">
            Resolve database schema inconsistencies and fragmentation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium">Admin Only</span>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Schema Health Overview
          </CardTitle>
          <CardDescription>
            Current status of database schema consistency across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {issues?.data?.totalIssues || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">
                {issues?.data?.severityBreakdown?.high || 0}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {status?.data?.schemasAnalyzed || 0}
              </div>
              <div className="text-sm text-muted-foreground">Tenant Schemas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Schema Consolidation Actions</CardTitle>
          <CardDescription>
            Execute schema consolidation to resolve all identified inconsistencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Schema consolidation will modify database structure. A backup will be created automatically before proceeding.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button
              onClick={() => refetchStatus()}
              variant="outline"
              disabled={statusLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            
            <Button
              onClick={handleConsolidation}
              disabled={isConsolidating || consolidationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlayCircle className={`h-4 w-4 mr-2 ${isConsolidating ? 'animate-spin' : ''}`} />
              {isConsolidating ? 'Consolidating...' : 'Run Schema Consolidation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schema Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Identified Schema Inconsistencies</CardTitle>
          <CardDescription>
            Issues that will be resolved by the consolidation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues?.data?.identifiedInconsistencies?.map((issue, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{issue.issue}</h4>
                  {getSeverityBadge(issue.impact)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {issue.description}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Impact:</span> {issue.impact}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Resolution:</span> {issue.resolution}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Schema Status */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Schema Status</CardTitle>
          <CardDescription>
            Current validation status for each tenant schema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status?.data?.results?.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getValidationIcon(result.currentlyValid)}
                  <div>
                    <div className="font-medium">{result.schemaName}</div>
                    <div className="text-sm text-muted-foreground">
                      {result.plannedChanges.length} planned changes
                    </div>
                  </div>
                </div>
                <Badge variant={result.currentlyValid ? "secondary" : "destructive"}>
                  {result.currentlyValid ? "Valid" : "Needs Consolidation"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Consolidation Details</CardTitle>
          <CardDescription>
            What the consolidation process will accomplish
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Standardize tenant_id columns to UUID type</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Consolidate customers/solicitantes table conflict</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Standardize favorecidos table structure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Update tickets table foreign key references</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Standardize all foreign key constraints</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Add missing performance indexes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Convert TEXT fields to JSONB where appropriate</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}