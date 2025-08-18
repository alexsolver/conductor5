
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Share2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description?: string;
  dataSource: string;
  category: string;
  chartType: string;
  status: string;
}

interface ExecutionResult {
  success: boolean;
  message: string;
  data?: {
    results?: any[];
    summary?: any;
    executedAt?: string;
  };
}

interface ResultsViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
  executionResult: ExecutionResult | null;
}

export function ResultsViewer({ 
  open, 
  onOpenChange, 
  report, 
  executionResult 
}: ResultsViewerProps) {
  console.log('✅ [RESULTS-VIEWER] Rendering following 1qa.md patterns:', { report, executionResult });

  const handleExport = () => {
    console.log('✅ [RESULTS-VIEWER] Exporting results for report:', report.id);
    // TODO: Implement export functionality
  };

  const handleShare = () => {
    console.log('✅ [RESULTS-VIEWER] Sharing results for report:', report.id);
    // TODO: Implement share functionality
  };

  if (!executionResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              {report.name} - Results
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Results Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Execute this report to see results here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              {report.name} - Execution Results
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={executionResult.success ? "default" : "destructive"}>
                {executionResult.success ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Success
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Failed
                  </>
                )}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Execution Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Execution Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="font-medium">{executionResult.message}</span>
              </div>
              {executionResult.data?.executedAt && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">Executed at:</span>
                  <span className="font-medium">
                    {new Date(executionResult.data.executedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {executionResult.data?.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(executionResult.data.summary).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Data */}
          {executionResult.data?.results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Results Data</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(executionResult.data.results) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {executionResult.data.results[0] && 
                            Object.keys(executionResult.data.results[0]).map((key) => (
                              <th key={key} className="text-left p-2 capitalize">
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))
                          }
                        </tr>
                      </thead>
                      <tbody>
                        {executionResult.data.results.map((row, index) => (
                          <tr key={index} className="border-b">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="p-2">
                                {typeof value === 'number' ? value.toLocaleString() : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(executionResult.data.results, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Details */}
          {!executionResult.success && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-600">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {executionResult.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
