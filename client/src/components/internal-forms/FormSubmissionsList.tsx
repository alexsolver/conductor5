import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
// Temporarily removed date-fns imports to fix bundler issue

interface FormSubmissionsListProps {
  formId?: string;
}

export function FormSubmissionsList({ formId }: FormSubmissionsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/internal-forms/submissions${formId ? `?formId=${formId}` : ''}`);
      return response.json();
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_approval':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Enviado';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'in_approval':
        return 'Em Aprovação';
      default:
        return status;
    }
  };

  const filteredSubmissions = submissions.filter((submission: any) => {
    const matchesSearch = !searchTerm || 
      submission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando submissões...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Submissões do Formulário</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por ID ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="submitted">Enviado</SelectItem>
                <SelectItem value="in_approval">Em Aprovação</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {submissions.length === 0 ? (
                <>
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhuma submissão encontrada
                  </h3>
                  <p className="text-gray-500">
                    Este formulário ainda não recebeu nenhuma submissão.
                  </p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-gray-500">
                    Tente ajustar os filtros de busca.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado por</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission: any) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-mono text-sm">
                    {submission.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(submission.status)}
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusLabel(submission.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{submission.submittedBy}</TableCell>
                  <TableCell>
                    {new Date(submission.submittedAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setIsViewDialogOpen(true);
                      }}
                      data-testid={`button-view-${submission.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Submissão</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">ID da Submissão</p>
                  <p className="font-mono text-sm">{selectedSubmission.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(selectedSubmission.status)}
                    <Badge className={getStatusColor(selectedSubmission.status)}>
                      {getStatusLabel(selectedSubmission.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enviado por</p>
                  <p className="font-medium">{selectedSubmission.submittedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Envio</p>
                  <p className="font-medium">
                    {new Date(selectedSubmission.submittedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Respostas do Formulário</h3>
                <div className="space-y-4">
                  {selectedSubmission.formData && Object.entries(selectedSubmission.formData).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">{key}</p>
                      <p className="text-gray-900">{value || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}