import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle, Download, RefreshCw } from "lucide-react";

interface ResultsViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: { name: string };
  executionResult: any;
}

export function ResultsViewer({ open, onOpenChange, report, executionResult }: ResultsViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Report Results: {report.name}
          </DialogTitle>
        </DialogHeader>
        
        {executionResult && (
          <div className="space-y-6">
            {/* Execution Metadata */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-800 dark:text-green-200">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Execution Completed Successfully</span>
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {executionResult.executedAt && new Date(executionResult.executedAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Execution ID:</span>
                  <div className="font-mono text-xs">{executionResult.executionId}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Execution Time:</span>
                  <div className="font-medium">{executionResult.results?.executionTime || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Rows:</span>
                  <div className="font-medium">{executionResult.results?.totalRows || 0}</div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            {executionResult.results?.columns && executionResult.results?.rows && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          {executionResult.results.columns.map((column: string, index: number) => (
                            <th
                              key={index}
                              className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {executionResult.results.rows.map((row: any[], rowIndex: number) => (
                          <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            {row.map((cell: any, cellIndex: number) => (
                              <td
                                key={cellIndex}
                                className="border border-gray-300 dark:border-gray-600 px-4 py-2"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-execute
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}